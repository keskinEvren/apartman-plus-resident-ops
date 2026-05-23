import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const notificationRouter = router({
  // List all notifications for the active user within the active site context
  listMyNotifications: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected",
      });
    }

    const myNotifications = await ctx.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientUserId, ctx.user.userId),
          eq(notifications.siteId, ctx.activeMembership.siteId),
        ),
      )
      .orderBy(desc(notifications.createdAt));

    return myNotifications;
  }),

  // Mark a specific notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }

      // Check if notification exists and belongs to the user and site
      const [notification] = await ctx.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.recipientUserId, ctx.user.userId),
            eq(notifications.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      const [updated] = await ctx.db
        .update(notifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(notifications.id, input.id))
        .returning();

      return updated;
    }),

  // Mark all notifications for the current active site as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected",
      });
    }

    const updated = await ctx.db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.recipientUserId, ctx.user.userId),
          eq(notifications.siteId, ctx.activeMembership.siteId),
          eq(notifications.isRead, false),
        ),
      )
      .returning();

    return { count: updated.length };
  }),
});
