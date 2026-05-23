import { z } from "zod";
import {
  router,
  protectedProcedure,
  publicProcedure,
  hasPermission,
} from "../trpc";
import { sites, blocks, units, roles, memberships, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const siteRouter = router({
  createSite: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Site name is required"),
        address: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newSite] = await ctx.db
        .insert(sites)
        .values({
          name: input.name,
          address: input.address,
        })
        .returning();
      return newSite;
    }),

  createBlock: protectedProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        name: z.string().min(1, "Block name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newBlock] = await ctx.db
        .insert(blocks)
        .values({
          siteId: input.siteId,
          name: input.name,
        })
        .returning();
      return newBlock;
    }),

  createUnit: protectedProcedure
    .input(
      z.object({
        blockId: z.string().uuid(),
        unitNumber: z.string().min(1, "Unit number is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newUnit] = await ctx.db
        .insert(units)
        .values({
          blockId: input.blockId,
          unitNumber: input.unitNumber,
        })
        .returning();
      return newUnit;
    }),

  createRole: protectedProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        name: z.string().min(1, "Role name is required"),
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
          message: "You can only manage roles for your active site",
        });
      }

      const [newRole] = await ctx.db
        .insert(roles)
        .values({
          siteId: input.siteId,
          name: input.name,
          permissions: input.permissions,
        })
        .returning();
      return newRole;
    }),

  listMemberships: protectedProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (
        ctx.activeMembership?.roleName !== "SUPER_ADMIN" &&
        ctx.activeMembership?.siteId !== input.siteId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to site membership list",
        });
      }

      const records = await ctx.db
        .select()
        .from(memberships)
        .where(eq(memberships.siteId, input.siteId))
        .leftJoin(users, eq(memberships.userId, users.id))
        .leftJoin(roles, eq(memberships.roleId, roles.id));

      return records.map((record) => ({
        membershipId: record.memberships.id,
        isActive: record.memberships.isActive,
        user: record.users
          ? {
              id: record.users.id,
              email: record.users.email,
              fullName: record.users.name,
            }
          : null,
        role: record.roles
          ? {
              id: record.roles.id,
              name: record.roles.name,
              permissions: record.roles.permissions,
            }
          : null,
      }));
    }),

  // Update dynamic user role or active status in membership (requires MANAGE_MEMBERSHIPS or SUPER_ADMIN)
  updateMembership: protectedProcedure
    .input(
      z.object({
        membershipId: z.string().uuid(),
        roleId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [targetMembership] = await ctx.db
        .select()
        .from(memberships)
        .where(eq(memberships.id, input.membershipId));

      if (!targetMembership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membership record not found",
        });
      }

      if (
        ctx.activeMembership?.roleName !== "SUPER_ADMIN" &&
        ctx.activeMembership?.siteId !== targetMembership.siteId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update memberships for your active site",
        });
      }

      const updateValues: { roleId?: string; isActive?: boolean } = {};
      if (input.roleId !== undefined) updateValues.roleId = input.roleId;
      if (input.isActive !== undefined) updateValues.isActive = input.isActive;

      const [updated] = await ctx.db
        .update(memberships)
        .set(updateValues)
        .where(eq(memberships.id, input.membershipId))
        .returning();

      return updated;
    }),

  // Get all active site memberships for the current user
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
      .leftJoin(roles, eq(memberships.roleId, roles.id));

    return userMemberships.map((record) => ({
      membershipId: record.memberships.id,
      site: record.sites
        ? {
            id: record.sites.id,
            name: record.sites.name,
            address: record.sites.address,
          }
        : null,
      role: record.roles
        ? {
            id: record.roles.id,
            name: record.roles.name,
            permissions: record.roles.permissions,
          }
        : null,
    }));
  }),
});
