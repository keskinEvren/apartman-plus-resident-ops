import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { userNotificationPreferences } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const preferenceRouter = router({
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active membership",
      });
    }

    // Fetch existing preferences
    const [existing] = await ctx.db
      .select()
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.userId, ctx.user.userId),
          eq(userNotificationPreferences.siteId, ctx.activeMembership.siteId),
        ),
      );

    if (existing) {
      return existing;
    }

    // If none exists, create default preference entry
    const [defaults] = await ctx.db
      .insert(userNotificationPreferences)
      .values({
        userId: ctx.user.userId,
        siteId: ctx.activeMembership.siteId,
      })
      .returning();

    return defaults;
  }),

  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        announcementsEmail: z.boolean(),
        announcementsSms: z.boolean(),
        announcementsPush: z.boolean(),
        announcementsInApp: z.boolean(),
        packagesEmail: z.boolean(),
        packagesSms: z.boolean(),
        packagesPush: z.boolean(),
        packagesInApp: z.boolean(),
        visitorsEmail: z.boolean(),
        visitorsSms: z.boolean(),
        visitorsPush: z.boolean(),
        visitorsInApp: z.boolean(),
        bookingsEmail: z.boolean(),
        bookingsSms: z.boolean(),
        bookingsPush: z.boolean(),
        bookingsInApp: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }

      // Check if preference entry exists
      const [existing] = await ctx.db
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, ctx.user.userId),
            eq(userNotificationPreferences.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (existing) {
        const [updated] = await ctx.db
          .update(userNotificationPreferences)
          .set({
            announcementsEmail: input.announcementsEmail,
            announcementsSms: input.announcementsSms,
            announcementsPush: input.announcementsPush,
            announcementsInApp: input.announcementsInApp,
            packagesEmail: input.packagesEmail,
            packagesSms: input.packagesSms,
            packagesPush: input.packagesPush,
            packagesInApp: input.packagesInApp,
            visitorsEmail: input.visitorsEmail,
            visitorsSms: input.visitorsSms,
            visitorsPush: input.visitorsPush,
            visitorsInApp: input.visitorsInApp,
            bookingsEmail: input.bookingsEmail,
            bookingsSms: input.bookingsSms,
            bookingsPush: input.bookingsPush,
            bookingsInApp: input.bookingsInApp,
          })
          .where(eq(userNotificationPreferences.id, existing.id))
          .returning();

        return updated;
      } else {
        const [newPref] = await ctx.db
          .insert(userNotificationPreferences)
          .values({
            userId: ctx.user.userId,
            siteId: ctx.activeMembership.siteId,
            announcementsEmail: input.announcementsEmail,
            announcementsSms: input.announcementsSms,
            announcementsPush: input.announcementsPush,
            announcementsInApp: input.announcementsInApp,
            packagesEmail: input.packagesEmail,
            packagesSms: input.packagesSms,
            packagesPush: input.packagesPush,
            packagesInApp: input.packagesInApp,
            visitorsEmail: input.visitorsEmail,
            visitorsSms: input.visitorsSms,
            visitorsPush: input.visitorsPush,
            visitorsInApp: input.visitorsInApp,
            bookingsEmail: input.bookingsEmail,
            bookingsSms: input.bookingsSms,
            bookingsPush: input.bookingsPush,
            bookingsInApp: input.bookingsInApp,
          })
          .returning();

        return newPref;
      }
    }),
});
