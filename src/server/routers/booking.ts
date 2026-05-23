import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  amenities,
  amenitySessions,
  amenityReservations,
  notifications,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const bookingRouter = router({
  createSession: protectedProcedure
    .input(
      z.object({
        amenityId: z.string().uuid(),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        capacity: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }
      const [newSession] = await ctx.db
        .insert(amenitySessions)
        .values({
          siteId: ctx.activeMembership.siteId,
          amenityId: input.amenityId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          capacity: input.capacity,
        })
        .returning();
      return newSession;
    }),

  listSessions: protectedProcedure
    .input(
      z.object({
        amenityId: z.string().uuid(),
        dayOfWeek: z.number().min(0).max(6).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }
      const filters = [
        eq(amenitySessions.siteId, ctx.activeMembership.siteId),
        eq(amenitySessions.amenityId, input.amenityId),
        eq(amenitySessions.isActive, true),
      ];
      if (input.dayOfWeek !== undefined) {
        filters.push(eq(amenitySessions.dayOfWeek, input.dayOfWeek));
      }
      return ctx.db
        .select()
        .from(amenitySessions)
        .where(and(...filters));
    }),

  bookSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }

      return ctx.db.transaction(async (tx) => {
        const [session] = await tx
          .select()
          .from(amenitySessions)
          .where(eq(amenitySessions.id, input.sessionId))
          .for("update");

        if (!session || !session.isActive) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Active session not found",
          });
        }

        const [amenity] = await tx
          .select()
          .from(amenities)
          .where(eq(amenities.id, session.amenityId));

        const [existingCount] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(amenityReservations)
          .where(
            and(
              eq(amenityReservations.sessionId, input.sessionId),
              eq(amenityReservations.reservationDate, input.reservationDate),
              eq(amenityReservations.status, "CONFIRMED"),
            ),
          );

        if (Number(existingCount?.count || 0) >= session.capacity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Kapasite dolu! Seçilen seans için tüm kontenjan dolmuştur.",
          });
        }

        const [reservation] = await tx
          .insert(amenityReservations)
          .values({
            siteId: ctx.activeMembership!.siteId,
            sessionId: input.sessionId,
            userId: ctx.user.userId,
            reservationDate: input.reservationDate,
            status: "CONFIRMED",
          })
          .returning();

        await tx.insert(notifications).values({
          siteId: ctx.activeMembership!.siteId,
          recipientUserId: ctx.user.userId,
          type: "RESERVATION_CONFIRMATION",
          title: "📅 Rezervasyon Onaylandı!",
          message: `${amenity?.name || "Tesis"} için ${input.reservationDate} (${session.startTime}-${session.endTime}) tarihindeki rezervasyonunuz onaylanmıştır.`,
          relatedEntityId: reservation.id,
          relatedEntityType: "AMENITY_RESERVATION",
        });

        return reservation;
      });
    }),

  listMyReservations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active membership",
      });
    }
    return ctx.db
      .select({
        id: amenityReservations.id,
        reservationDate: amenityReservations.reservationDate,
        status: amenityReservations.status,
        createdAt: amenityReservations.createdAt,
        session: {
          startTime: amenitySessions.startTime,
          endTime: amenitySessions.endTime,
        },
        amenity: {
          name: amenities.name,
        },
      })
      .from(amenityReservations)
      .leftJoin(
        amenitySessions,
        eq(amenityReservations.sessionId, amenitySessions.id),
      )
      .leftJoin(amenities, eq(amenitySessions.amenityId, amenities.id))
      .where(
        and(
          eq(amenityReservations.siteId, ctx.activeMembership.siteId),
          eq(amenityReservations.userId, ctx.user.userId),
        ),
      )
      .orderBy(desc(amenityReservations.createdAt));
  }),

  cancelReservation: protectedProcedure
    .input(z.object({ reservationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }
      const [reservation] = await ctx.db
        .select()
        .from(amenityReservations)
        .where(
          and(
            eq(amenityReservations.id, input.reservationId),
            eq(amenityReservations.userId, ctx.user.userId),
          ),
        );
      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      const [updated] = await ctx.db
        .update(amenityReservations)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(eq(amenityReservations.id, input.reservationId))
        .returning();

      return updated;
    }),
});
