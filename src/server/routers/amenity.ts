import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { amenities } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const amenityRouter = router({
  createAmenity: protectedProcedure
    .input(
      z.object({ name: z.string().min(1), description: z.string().optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }
      const [newAmenity] = await ctx.db
        .insert(amenities)
        .values({
          siteId: ctx.activeMembership.siteId,
          name: input.name,
          description: input.description,
        })
        .returning();
      return newAmenity;
    }),

  listAmenities: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active membership",
      });
    }
    return ctx.db
      .select()
      .from(amenities)
      .where(
        and(
          eq(amenities.siteId, ctx.activeMembership.siteId),
          eq(amenities.isActive, true),
        ),
      )
      .orderBy(desc(amenities.createdAt));
  }),
});
