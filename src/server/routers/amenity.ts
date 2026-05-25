import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { amenities, amenityReservations, amenitySessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const amenityRouter = router({
  createAmenity: protectedProcedure
    .input(
      z.object({ name: z.string().min(1), description: z.string().optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }
      const [newAmenity] = await ctx.db
        .insert(amenities)
        .values({
          siteId: ctx.activeMembership.siteId,
          name: input.name,
          description: input.description,
        })
        .returning();
      return newAmenity;
    }),

  listAmenities: protectedProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }
      const filters = [eq(amenities.siteId, ctx.activeMembership.siteId)];
      if (!input?.includeInactive) {
        filters.push(eq(amenities.isActive, true));
      }
      return ctx.db
        .select()
        .from(amenities)
        .where(and(...filters))
        .orderBy(desc(amenities.createdAt));
    }),

  toggleAmenityActive: protectedProcedure
    .input(z.object({ amenityId: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }

      const hasPerm =
        ctx.activeMembership.roleName === "SUPER_ADMIN" ||
        ctx.activeMembership.roleName === "SITE_ADMIN";

      if (!hasPerm) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const [updated] = await ctx.db
        .update(amenities)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(
          and(
            eq(amenities.id, input.amenityId),
            eq(amenities.siteId, ctx.activeMembership.siteId),
          ),
        )
        .returning();

      return updated;
    }),

  listMyReservations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership)
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active membership",
      });
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
        amenity: { name: amenities.name },
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
      if (!ctx.activeMembership)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      const [reservation] = await ctx.db
        .select()
        .from(amenityReservations)
        .where(
          and(
            eq(amenityReservations.id, input.reservationId),
            eq(amenityReservations.userId, ctx.user.userId),
          ),
        );
      if (!reservation)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });

      const [updated] = await ctx.db
        .update(amenityReservations)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(eq(amenityReservations.id, input.reservationId))
        .returning();
      return updated;
    }),
});
