import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { users, memberships, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, signToken } from "@/lib/auth";
import { TRPCError } from "@trpc/server";

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

      // Sign JWT token
      const token = signToken({
        userId: userRecord.id,
        email: userRecord.email,
        role: userRecord.role || "user",
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
