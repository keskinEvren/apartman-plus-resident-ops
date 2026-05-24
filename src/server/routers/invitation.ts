import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  invitationTokens,
  memberships,
  units,
  blocks,
  roles,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const invitationRouter = router({
  checkInvitation: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [invitation] = await ctx.db
        .select()
        .from(invitationTokens)
        .where(eq(invitationTokens.token, input.token.trim().toUpperCase()))
        .leftJoin(units, eq(invitationTokens.unitId, units.id))
        .leftJoin(blocks, eq(units.blockId, blocks.id))
        .leftJoin(roles, eq(invitationTokens.roleId, roles.id))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Geçersiz veya süresi dolmuş aktivasyon kodu!",
        });
      }

      if (invitation.invitation_tokens.isUsed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bu aktivasyon kodu daha önce kullanılmış!",
        });
      }

      if (new Date() > new Date(invitation.invitation_tokens.expiresAt)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aktivasyon kodunun süresi dolmuş!",
        });
      }

      return {
        id: invitation.invitation_tokens.id,
        siteId: invitation.invitation_tokens.siteId,
        roleId: invitation.invitation_tokens.roleId,
        unitId: invitation.invitation_tokens.unitId,
        token: invitation.invitation_tokens.token,
        email: invitation.invitation_tokens.email,
        unit: invitation.units
          ? {
              unitNumber: invitation.units.unitNumber,
              blockName: invitation.blocks?.name || "",
            }
          : null,
        role: invitation.roles
          ? {
              name: invitation.roles.name,
            }
          : null,
      };
    }),

  createInvitation: protectedProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        unitId: z.string().uuid().nullable().optional(),
        roleId: z.string().uuid(),
        email: z.string().email().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.activeMembership?.roleName !== "SUPER_ADMIN" &&
        ctx.activeMembership?.siteId !== input.siteId
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Generate unique token (8-digit short code: AP-XXXX-YYYY)
      const token = `AP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Expiration: 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [inv] = await ctx.db
        .insert(invitationTokens)
        .values({
          siteId: input.siteId,
          unitId: input.unitId || null,
          roleId: input.roleId,
          token,
          email: input.email || null,
          expiresAt,
        })
        .returning();

      return inv;
    }),

  listInvitations: protectedProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (
        ctx.activeMembership?.roleName !== "SUPER_ADMIN" &&
        ctx.activeMembership?.siteId !== input.siteId
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      const records = await ctx.db
        .select()
        .from(invitationTokens)
        .where(eq(invitationTokens.siteId, input.siteId))
        .leftJoin(units, eq(invitationTokens.unitId, units.id))
        .leftJoin(blocks, eq(units.blockId, blocks.id))
        .leftJoin(roles, eq(invitationTokens.roleId, roles.id));

      return records.map((record) => ({
        id: record.invitation_tokens.id,
        token: record.invitation_tokens.token,
        email: record.invitation_tokens.email,
        isUsed: record.invitation_tokens.isUsed,
        expiresAt: record.invitation_tokens.expiresAt,
        unit: record.units
          ? {
              unitNumber: record.units.unitNumber,
              blockName: record.blocks?.name || "",
            }
          : null,
        role: record.roles
          ? {
              name: record.roles.name,
            }
          : null,
      }));
    }),

  claimInvitation: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [invitation] = await ctx.db
        .select()
        .from(invitationTokens)
        .where(eq(invitationTokens.token, input.token.trim().toUpperCase()));

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Geçersiz aktivasyon kodu!",
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

      const [existing] = await ctx.db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, ctx.user.userId),
            eq(memberships.siteId, invitation.siteId),
            eq(memberships.isActive, true),
          ),
        );

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Zaten bu sitenin aktif bir üyesisiniz!",
        });
      }

      const [membership] = await ctx.db
        .insert(memberships)
        .values({
          userId: ctx.user.userId,
          siteId: invitation.siteId,
          unitId: invitation.unitId || null,
          roleId: invitation.roleId,
          isActive: true,
        })
        .returning();

      await ctx.db
        .update(invitationTokens)
        .set({
          isUsed: true,
          usedByUserId: ctx.user.userId,
        })
        .where(eq(invitationTokens.id, invitation.id));

      return {
        membershipId: membership.id,
        siteId: membership.siteId,
      };
    }),
});
