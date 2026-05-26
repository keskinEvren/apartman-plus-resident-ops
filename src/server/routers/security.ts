import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { users, userSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  comparePassword,
  hashPassword,
  validatePasswordStrength,
} from "@/lib/auth";

export const securityRouter = router({
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Mevcut şifre zorunludur"),
        newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch user
      const [userRecord] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId))
        .limit(1);

      if (!userRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });
      }

      // 2. Verify current password
      const isMatch = await comparePassword(
        input.currentPassword,
        userRecord.password,
      );
      if (!isMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mevcut şifreniz hatalı",
        });
      }

      // 3. Validate new password strength
      const strength = validatePasswordStrength(input.newPassword);
      if (!strength.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Yeni şifre güvenlik kriterlerini karşılamıyor: ${strength.errors.join(", ")}`,
        });
      }

      // 4. Hash new password and save
      const hashed = await hashPassword(input.newPassword);
      await ctx.db
        .update(users)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.userId));

      return { success: true };
    }),

  listActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, ctx.user.userId),
          eq(userSessions.isActive, true),
        ),
      )
      .orderBy(desc(userSessions.lastActiveAt));

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent || "Bilinmeyen Tarayıcı",
      ipAddress: s.ipAddress || "Bilinmeyen IP",
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.id === ctx.user.sessionId,
    }));
  }),

  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Update session status to revoked
      await ctx.db
        .update(userSessions)
        .set({
          isActive: false,
          revokedAt: new Date(),
        })
        .where(
          and(
            eq(userSessions.id, input.sessionId),
            eq(userSessions.userId, ctx.user.userId),
          ),
        );

      return { success: true };
    }),
});
