import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { users, memberships, roles, userSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, signToken, verifyToken } from "@/lib/auth";
import { TRPCError } from "@trpc/server";
import { verifyTOTP } from "@/lib/totp";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Geçersiz e-posta formatı"),
        password: z.string().min(1, "Şifre zorunludur"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find user
      const [userRecord] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!userRecord) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Kullanıcı bulunamadı veya şifre hatalı",
        });
      }

      // Check password
      const isMatch = await comparePassword(
        input.password,
        userRecord.password,
      );
      if (!isMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Kullanıcı bulunamadı veya şifre hatalı",
        });
      }

      // If user has 2FA enabled, return a temporary token for MFA verification step
      if (userRecord.twoFactorEnabled) {
        const tempToken = signToken({
          userId: userRecord.id,
          email: userRecord.email,
          role: userRecord.role || "user",
          requireMfa: true,
        });

        return {
          requireMfa: true,
          tempToken,
          user: {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
          },
        };
      }

      // Get user memberships inside this site (if any)
      const userMemberships = await ctx.db
        .select({
          membershipId: memberships.id,
          siteId: memberships.siteId,
          roleId: memberships.roleId,
          unitId: memberships.unitId,
          blockId: memberships.blockId,
          roleName: roles.name,
        })
        .from(memberships)
        .leftJoin(roles, eq(memberships.roleId, roles.id))
        .where(eq(memberships.userId, userRecord.id));

      // Capture session metadata
      const userAgent =
        ctx.req?.headers.get("user-agent") || "Bilinmeyen Cihaz";
      const ipAddress =
        ctx.req?.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      // Register session in database
      const [session] = await ctx.db
        .insert(userSessions)
        .values({
          userId: userRecord.id,
          userAgent,
          ipAddress,
        })
        .returning();

      // Sign JWT token with sessionId
      const token = signToken({
        userId: userRecord.id,
        email: userRecord.email,
        role: userRecord.role || "user",
        sessionId: session.id,
      });

      return {
        token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
        },
        memberships: userMemberships,
        requireMfa: false,
      };
    }),

  verifyMfa: publicProcedure
    .input(
      z.object({
        tempToken: z.string(),
        code: z.string().length(6, "Doğrulama kodu 6 haneli olmalıdır"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let decoded;
      try {
        decoded = verifyToken(input.tempToken);
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Oturum süresi doldu, lütfen tekrar giriş yapın",
        });
      }

      if (!decoded.requireMfa) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Geçersiz işlem isteği",
        });
      }

      // Fetch user 2FA secret
      const [userRecord] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (
        !userRecord ||
        !userRecord.twoFactorEnabled ||
        !userRecord.twoFactorSecret
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Kullanıcı için iki aşamalı doğrulama aktif değil",
        });
      }

      // Verify TOTP code
      const isMfaValid = verifyTOTP(input.code, userRecord.twoFactorSecret);
      if (!isMfaValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Girdiğiniz doğrulama kodu hatalı",
        });
      }

      // Get user memberships
      const userMemberships = await ctx.db
        .select({
          membershipId: memberships.id,
          siteId: memberships.siteId,
          roleId: memberships.roleId,
          unitId: memberships.unitId,
          blockId: memberships.blockId,
          roleName: roles.name,
        })
        .from(memberships)
        .leftJoin(roles, eq(memberships.roleId, roles.id))
        .where(eq(memberships.userId, userRecord.id));

      // Register session in database
      const userAgent =
        ctx.req?.headers.get("user-agent") || "Bilinmeyen Cihaz";
      const ipAddress =
        ctx.req?.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      const [session] = await ctx.db
        .insert(userSessions)
        .values({
          userId: userRecord.id,
          userAgent,
          ipAddress,
        })
        .returning();

      // Sign final JWT token with sessionId
      const token = signToken({
        userId: userRecord.id,
        email: userRecord.email,
        role: userRecord.role || "user",
        sessionId: session.id,
      });

      return {
        token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
        },
        memberships: userMemberships,
      };
    }),
});
