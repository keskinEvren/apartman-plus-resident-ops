import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { users, userPets, userNotificationPreferences } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phoneNumber: users.phoneNumber,
        emergencyContactName: users.emergencyContactName,
        emergencyContactPhone: users.emergencyContactPhone,
      })
      .from(users)
      .where(eq(users.id, ctx.user.userId));
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phoneNumber: z.string().optional().nullable(),
        emergencyContactName: z.string().optional().nullable(),
        emergencyContactPhone: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          name: input.name,
          phoneNumber: input.phoneNumber,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNumber: users.phoneNumber,
          emergencyContactName: users.emergencyContactName,
          emergencyContactPhone: users.emergencyContactPhone,
        });
      return updated;
    }),

  getResidentProfileForAdmin: protectedProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        residentUserId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }

      const isAdmin =
        ctx.activeMembership.roleName === "SUPER_ADMIN" ||
        (ctx.activeMembership.roleName === "SITE_ADMIN" &&
          ctx.activeMembership.siteId === input.siteId);

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Yönetici yetkisi gerekli",
        });
      }

      const [resident] = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNumber: users.phoneNumber,
          emergencyContactName: users.emergencyContactName,
          emergencyContactPhone: users.emergencyContactPhone,
        })
        .from(users)
        .where(eq(users.id, input.residentUserId));

      if (!resident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sakin bulunamadı",
        });
      }

      const pets = await ctx.db
        .select()
        .from(userPets)
        .where(
          and(
            eq(userPets.userId, input.residentUserId),
            eq(userPets.siteId, input.siteId),
          ),
        );

      const [preferences] = await ctx.db
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, input.residentUserId),
            eq(userNotificationPreferences.siteId, input.siteId),
          ),
        );

      return {
        profile: resident,
        pets,
        preferences: preferences || null,
      };
    }),
});
