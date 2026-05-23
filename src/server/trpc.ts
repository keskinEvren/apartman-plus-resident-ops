import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { db } from "@/db";

/**
 * Create context for tRPC requests
 * This runs for every request and provides context to all procedures
 */
export const createContext = async (opts: { req?: Request }) => {
  let user = null;
  const authHeader = opts.req?.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      // Decode token using the helper from auth.ts
      // We need to import it at the top
      const { verifyToken } = await import("@/lib/auth");
      user = verifyToken(token);
    } catch {
      // invalid token, user remains null
    }
  }

  let activeMembership = null;
  const siteId = opts.req?.headers.get("x-site-id");

  if (user && siteId && siteId !== "undefined" && siteId !== "null") {
    try {
      const { memberships, roles } = await import("@/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const [membershipRecord] = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, user.userId),
            eq(memberships.siteId, siteId),
            eq(memberships.isActive, true),
          ),
        )
        .leftJoin(roles, eq(memberships.roleId, roles.id));

      if (membershipRecord) {
        activeMembership = {
          id: membershipRecord.memberships.id,
          siteId: membershipRecord.memberships.siteId,
          unitId: membershipRecord.memberships.unitId,
          roleId: membershipRecord.memberships.roleId,
          roleName: membershipRecord.roles?.name || "User",
          permissions: membershipRecord.roles?.permissions || [],
        };
      }
    } catch (e) {
      // error fetching membership, activeMembership remains null
    }
  }

  return {
    db,
    user,
    activeMembership,
    req: opts.req,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Initialize tRPC with context and superjson transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 * Checks for valid session/JWT token
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Dynamic RBAC check - requires a specific permission in the active site membership
 */
export const hasPermission = (permission: string) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected or membership is inactive",
      });
    }

    const isSuperAdmin = ctx.activeMembership.roleName === "SUPER_ADMIN";
    const hasPerm = ctx.activeMembership.permissions.includes(permission);

    if (!hasPerm && !isSuperAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions: missing ${permission}`,
      });
    }

    return next({ ctx });
  });
};
