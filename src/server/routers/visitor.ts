import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { visitorPasses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const visitorRouter = router({
  createVisitorPass: protectedProcedure
    .input(
      z.object({
        visitorName: z.string().min(1, "Visitor name is required"),
        visitDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
        expectedTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "Format must be HH:MM")
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }

      if (!ctx.activeMembership.unitId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only residents associated with a unit can create visitor passes",
        });
      }

      const [newPass] = await ctx.db
        .insert(visitorPasses)
        .values({
          siteId: ctx.activeMembership.siteId,
          unitId: ctx.activeMembership.unitId,
          visitorName: input.visitorName,
          status: "EXPECTED",
          visitDate: input.visitDate,
          expectedTime: input.expectedTime,
          createdById: ctx.user.userId,
        })
        .returning();

      return newPass;
    }),

  listMyVisitorPasses: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected",
      });
    }

    if (!ctx.activeMembership.unitId) {
      return []; // Return empty if user has no unit (e.g., site-level staff)
    }

    return ctx.db
      .select()
      .from(visitorPasses)
      .where(
        and(
          eq(visitorPasses.siteId, ctx.activeMembership.siteId),
          eq(visitorPasses.unitId, ctx.activeMembership.unitId),
        ),
      )
      .orderBy(desc(visitorPasses.createdAt));
  }),

  listExpectedVisitors: protectedProcedure
    .input(
      z
        .object({
          visitDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }

      const dateStr =
        input?.visitDate || new Date().toISOString().split("T")[0];

      return ctx.db
        .select()
        .from(visitorPasses)
        .where(
          and(
            eq(visitorPasses.siteId, ctx.activeMembership.siteId),
            eq(visitorPasses.visitDate, dateStr),
            eq(visitorPasses.status, "EXPECTED"),
          ),
        )
        .orderBy(desc(visitorPasses.createdAt));
    }),

  checkInVisitor: protectedProcedure
    .input(z.object({ passId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }

      const [pass] = await ctx.db
        .select()
        .from(visitorPasses)
        .where(
          and(
            eq(visitorPasses.id, input.passId),
            eq(visitorPasses.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (!pass) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Visitor pass not found",
        });
      }

      const [updated] = await ctx.db
        .update(visitorPasses)
        .set({
          status: "CHECKED_IN",
          checkedInAt: new Date(),
        })
        .where(eq(visitorPasses.id, input.passId))
        .returning();

      return updated;
    }),
});
