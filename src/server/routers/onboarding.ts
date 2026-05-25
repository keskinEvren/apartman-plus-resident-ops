import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { users, memberships, roles, invitationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { comparePassword, signToken, hashPassword } from "@/lib/auth";
import { TRPCError } from "@trpc/server";

// Helper function to validate invitation tokens
async function getValidInvitation(db: any, token: string) {
  const [invitation] = await db
    .select()
    .from(invitationTokens)
    .where(eq(invitationTokens.token, token.trim().toUpperCase()))
    .limit(1);

  if (!invitation) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Geçersiz veya süresi dolmuş aktivasyon kodu!",
    });
  }
  if (invitation.isUsed) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Bu aktivasyon kodu daha önce kullanılmış!",
    });
  }
  if (new Date() > new Date(invitation.expiresAt)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Aktivasyon kodunun süresi dolmuş!",
    });
  }
  return invitation;
}

export const onboardingRouter = router({
  registerWithInvitation: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
        email: z.string().email("Geçersiz e-posta formatı"),
        password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
        token: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await getValidInvitation(ctx.db, input.token);

      // Check if email already exists
      const [existingUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email.trim().toLowerCase()))
        .limit(1);

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten mevcut!",
        });
      }

      const hashedPassword = await hashPassword(input.password);
      const [newUser] = await ctx.db
        .insert(users)
        .values({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          password: hashedPassword,
          role: "user",
        })
        .returning();

      const [membership] = await ctx.db
        .insert(memberships)
        .values({
          userId: newUser.id,
          siteId: invitation.siteId,
          unitId: invitation.unitId || null,
          roleId: invitation.roleId,
          isActive: true,
        })
        .returning();

      await ctx.db
        .update(invitationTokens)
        .set({ isUsed: true, usedByUserId: newUser.id })
        .where(eq(invitationTokens.id, invitation.id));

      const token = signToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      const [roleRecord] = await ctx.db
        .select()
        .from(roles)
        .where(eq(roles.id, invitation.roleId))
        .limit(1);

      return {
        token,
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        memberships: [
          {
            membershipId: membership.id,
            siteId: membership.siteId,
            roleId: membership.roleId,
            unitId: membership.unitId,
            blockId: membership.blockId,
            roleName: roleRecord?.name || "User",
          },
        ],
      };
    }),

  loginWithInvitation: publicProcedure
    .input(
      z.object({
        email: z.string().email("Geçersiz e-posta formatı"),
        password: z.string().min(1, "Şifre zorunludur"),
        token: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [userRecord] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email.trim().toLowerCase()))
        .limit(1);

      if (
        !userRecord ||
        !(await comparePassword(input.password, userRecord.password))
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Kullanıcı bulunamadı veya şifre hatalı",
        });
      }

      const invitation = await getValidInvitation(ctx.db, input.token);

      const { isNull } = await import("drizzle-orm");
      const [existingMembership] = await ctx.db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userRecord.id),
            eq(memberships.siteId, invitation.siteId),
            invitation.unitId
              ? eq(memberships.unitId, invitation.unitId)
              : isNull(memberships.unitId),
            eq(memberships.isActive, true),
          ),
        )
        .limit(1);

      if (!existingMembership) {
        await ctx.db.insert(memberships).values({
          userId: userRecord.id,
          siteId: invitation.siteId,
          unitId: invitation.unitId || null,
          roleId: invitation.roleId,
          isActive: true,
        });
      }

      await ctx.db
        .update(invitationTokens)
        .set({ isUsed: true, usedByUserId: userRecord.id })
        .where(eq(invitationTokens.id, invitation.id));

      const token = signToken({
        userId: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
      });

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
