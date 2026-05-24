import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { tickets, ticketActivities, units, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const ticketRouter = router({
  createTicket: protectedProcedure
    .input(
      z.object({
        category: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        unitId: z.string().uuid().optional(),
        blockId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }
      let resolvedUnitId = input.unitId || ctx.activeMembership.unitId || null;
      let resolvedBlockId = input.blockId || null;

      if (resolvedUnitId && !resolvedBlockId) {
        const [unitRecord] = await ctx.db
          .select()
          .from(units)
          .where(eq(units.id, resolvedUnitId));
        if (unitRecord) resolvedBlockId = unitRecord.blockId;
      }

      const [newTicket] = await ctx.db
        .insert(tickets)
        .values({
          siteId: ctx.activeMembership.siteId,
          unitId: resolvedUnitId,
          blockId: resolvedBlockId,
          reporterUserId: ctx.user.userId,
          category: input.category,
          title: input.title,
          description: input.description,
          status: "OPEN",
        })
        .returning();

      await ctx.db.insert(ticketActivities).values({
        siteId: ctx.activeMembership.siteId,
        ticketId: newTicket.id,
        actorUserId: ctx.user.userId,
        activityType: "STATUS_CHANGE",
        content: "Talep oluşturuldu. Durum: AÇIK (OPEN)",
      });
      return newTicket;
    }),

  listMyTickets: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected",
      });
    }
    return ctx.db
      .select({
        id: tickets.id,
        category: tickets.category,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        blockId: tickets.blockId,
        unitId: tickets.unitId,
        createdAt: tickets.createdAt,
        assignedStaffUserId: tickets.assignedStaffUserId,
        reporter: { id: users.id, name: users.name },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.reporterUserId, users.id))
      .where(
        and(
          eq(tickets.siteId, ctx.activeMembership.siteId),
          eq(tickets.reporterUserId, ctx.user.userId),
        ),
      )
      .orderBy(desc(tickets.createdAt));
  }),

  listStaffTickets: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected",
      });
    }
    const filters = [eq(tickets.siteId, ctx.activeMembership.siteId)];
    if (ctx.activeMembership.blockId) {
      filters.push(eq(tickets.blockId, ctx.activeMembership.blockId));
    }

    return ctx.db
      .select({
        id: tickets.id,
        category: tickets.category,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        blockId: tickets.blockId,
        unitId: tickets.unitId,
        createdAt: tickets.createdAt,
        assignedStaffUserId: tickets.assignedStaffUserId,
        reporter: { id: users.id, name: users.name },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.reporterUserId, users.id))
      .where(and(...filters))
      .orderBy(desc(tickets.createdAt));
  }),

  assignTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        assignedStaffUserId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }
      const [ticket] = await ctx.db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.id, input.ticketId),
            eq(tickets.siteId, ctx.activeMembership.siteId),
          ),
        );
      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const [updated] = await ctx.db
        .update(tickets)
        .set({
          assignedStaffUserId: input.assignedStaffUserId,
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, input.ticketId))
        .returning();

      await ctx.db.insert(ticketActivities).values({
        siteId: ctx.activeMembership.siteId,
        ticketId: ticket.id,
        actorUserId: ctx.user.userId,
        activityType: "ASSIGNMENT",
        content: "Talep personele atandı. Durum: İŞLEMDE (IN_PROGRESS)",
      });
      return updated;
    }),

  updateTicketStatus: protectedProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }
      const [ticket] = await ctx.db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.id, input.ticketId),
            eq(tickets.siteId, ctx.activeMembership.siteId),
          ),
        );
      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const [updated] = await ctx.db
        .update(tickets)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(tickets.id, input.ticketId))
        .returning();

      await ctx.db.insert(ticketActivities).values({
        siteId: ctx.activeMembership.siteId,
        ticketId: ticket.id,
        actorUserId: ctx.user.userId,
        activityType: "STATUS_CHANGE",
        content: `Talep durumu güncellendi: ${input.status}`,
      });
      return updated;
    }),
});
