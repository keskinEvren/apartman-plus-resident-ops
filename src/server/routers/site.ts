import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  sites,
  blocks,
  units,
  roles,
  memberships,
  users,
  invitationTokens,
} from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const siteRouter = router({
  createSite: protectedProcedure
    .input(
      z.object({ name: z.string().min(1), address: z.string().optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const [s] = await ctx.db
        .insert(sites)
        .values({ name: input.name, address: input.address })
        .returning();
      return s;
    }),

  createBlock: protectedProcedure
    .input(z.object({ siteId: z.string().uuid(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [b] = await ctx.db
        .insert(blocks)
        .values({ siteId: input.siteId, name: input.name })
        .returning();
      return b;
    }),

  createUnit: protectedProcedure
    .input(
      z.object({ blockId: z.string().uuid(), unitNumber: z.string().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      const [u] = await ctx.db
        .insert(units)
        .values({ blockId: input.blockId, unitNumber: input.unitNumber })
        .returning();
      return u;
    }),

  createRole: protectedProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        name: z.string().min(1),
        permissions: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.activeMembership?.roleName !== "SUPER_ADMIN" &&
        ctx.activeMembership?.siteId !== input.siteId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Site admin mismatch",
        });
      }
      const [r] = await ctx.db
        .insert(roles)
        .values({
          siteId: input.siteId,
          name: input.name,
          permissions: input.permissions,
        })
        .returning();
      return r;
    }),

  listMemberships: protectedProcedure
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
        .from(memberships)
        .where(eq(memberships.siteId, input.siteId))
        .leftJoin(users, eq(memberships.userId, users.id))
        .leftJoin(roles, eq(memberships.roleId, roles.id));

      return records.map(({ memberships: m, users: u, roles: r }) => ({
        membershipId: m.id,
        isActive: m.isActive,
        user: u ? { id: u.id, email: u.email, fullName: u.name } : null,
        role: r ? { id: r.id, name: r.name, permissions: r.permissions } : null,
      }));
    }),

  updateMembership: protectedProcedure
    .input(
      z.object({
        membershipId: z.string().uuid(),
        roleId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select()
        .from(memberships)
        .where(eq(memberships.id, input.membershipId));
      if (!target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membership not found",
        });
      if (
        ctx.activeMembership?.roleName !== "SUPER_ADMIN" &&
        ctx.activeMembership?.siteId !== target.siteId
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      const values: { roleId?: string; isActive?: boolean } = {};
      if (input.roleId !== undefined) values.roleId = input.roleId;
      if (input.isActive !== undefined) values.isActive = input.isActive;
      const [u] = await ctx.db
        .update(memberships)
        .set(values)
        .where(eq(memberships.id, input.membershipId))
        .returning();
      return u;
    }),

  getMySites: protectedProcedure.query(async ({ ctx }) => {
    const userMemberships = await ctx.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, ctx.user.userId),
          eq(memberships.isActive, true),
        ),
      )
      .leftJoin(sites, eq(memberships.siteId, sites.id))
      .leftJoin(roles, eq(memberships.roleId, roles.id))
      .leftJoin(units, eq(memberships.unitId, units.id))
      .leftJoin(blocks, eq(memberships.blockId, blocks.id));

    return userMemberships.map(
      ({ memberships: m, units: u, blocks: b, sites: s, roles: r }) => ({
        membershipId: m.id,
        unitId: m.unitId,
        blockId: m.blockId,
        unit: u
          ? { id: u.id, unitNumber: u.unitNumber, blockName: b?.name || "" }
          : null,
        site: s ? { id: s.id, name: s.name, address: s.address } : null,
        role: r ? { id: r.id, name: r.name, permissions: r.permissions } : null,
      }),
    );
  }),

  listRoles: protectedProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (
        ctx.activeMembership?.roleName !== "SUPER_ADMIN" &&
        ctx.activeMembership?.siteId !== input.siteId
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      return ctx.db.select().from(roles).where(eq(roles.siteId, input.siteId));
    }),

  listBlocks: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership)
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    return ctx.db
      .select()
      .from(blocks)
      .where(eq(blocks.siteId, ctx.activeMembership.siteId));
  }),

  listUnits: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership)
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    return ctx.db
      .select({
        id: units.id,
        unitNumber: units.unitNumber,
        blockName: blocks.name,
      })
      .from(units)
      .leftJoin(blocks, eq(units.blockId, blocks.id))
      .where(eq(blocks.siteId, ctx.activeMembership.siteId))
      .orderBy(blocks.name, units.unitNumber);
  }),
});
