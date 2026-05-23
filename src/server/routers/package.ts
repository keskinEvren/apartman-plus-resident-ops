import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { packageDeliveries, notifications, memberships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const packageRouter = router({
  receivePackage: protectedProcedure
    .input(
      z.object({
        unitId: z.string().uuid(),
        carrierName: z.string().min(1, "Carrier name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }

      // Generate a random 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const [newPackage] = await ctx.db
        .insert(packageDeliveries)
        .values({
          siteId: ctx.activeMembership.siteId,
          unitId: input.unitId,
          carrierName: input.carrierName,
          otpCode: otpCode,
          status: "RECEIVED",
        })
        .returning();

      // Find all active members associated with this unit inside this site
      const unitMembers = await ctx.db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.siteId, ctx.activeMembership.siteId),
            eq(memberships.unitId, input.unitId),
            eq(memberships.isActive, true),
          ),
        );

      // Alert notifications
      const notificationsToInsert = unitMembers.map((member) => ({
        siteId: ctx.activeMembership!.siteId,
        recipientUserId: member.userId,
        type: "PACKAGE_DELIVERY",
        title: "📦 Yeni Paketiniz Ulaştı!",
        message: `${input.carrierName} aracılığıyla gelen kargonuz teslim alınmıştır. Teslimat OTP Kodunuz: ${otpCode}`,
        relatedEntityId: newPackage.id,
        relatedEntityType: "PACKAGE",
      }));

      if (notificationsToInsert.length > 0) {
        await ctx.db.insert(notifications).values(notificationsToInsert);
      }

      return newPackage;
    }),

  listMyPackages: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected",
      });
    }

    if (!ctx.activeMembership.unitId) {
      return []; // Return empty if user is staff and has no unit
    }

    return ctx.db
      .select()
      .from(packageDeliveries)
      .where(
        and(
          eq(packageDeliveries.siteId, ctx.activeMembership.siteId),
          eq(packageDeliveries.unitId, ctx.activeMembership.unitId),
        ),
      )
      .orderBy(desc(packageDeliveries.receivedAt));
  }),

  verifyOtpAndDeliver: protectedProcedure
    .input(
      z.object({
        packageId: z.string().uuid(),
        otpCode: z.string().length(6, "OTP must be 6 digits"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }

      const [pack] = await ctx.db
        .select()
        .from(packageDeliveries)
        .where(
          and(
            eq(packageDeliveries.id, input.packageId),
            eq(packageDeliveries.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (!pack) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      if (pack.status === "DELIVERED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Package is already delivered",
        });
      }

      if (pack.otpCode !== input.otpCode) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Geçersiz OTP kodu! Teslimat onaylanamadı.",
        });
      }

      const [updated] = await ctx.db
        .update(packageDeliveries)
        .set({
          status: "DELIVERED",
          deliveredAt: new Date(),
        })
        .where(eq(packageDeliveries.id, input.packageId))
        .returning();

      return updated;
    }),
});
