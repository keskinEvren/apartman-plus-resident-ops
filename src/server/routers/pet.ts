import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { userPets } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const petRouter = router({
  listMyPets: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active membership",
      });
    }

    return ctx.db
      .select()
      .from(userPets)
      .where(
        and(
          eq(userPets.userId, ctx.user.userId),
          eq(userPets.siteId, ctx.activeMembership.siteId),
        ),
      )
      .orderBy(desc(userPets.createdAt));
  }),

  createPet: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        species: z.string().min(1),
        breed: z.string().optional().nullable(),
        vaccineStatus: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }

      const [newPet] = await ctx.db
        .insert(userPets)
        .values({
          userId: ctx.user.userId,
          siteId: ctx.activeMembership.siteId,
          name: input.name,
          species: input.species,
          breed: input.breed,
          vaccineStatus: input.vaccineStatus,
          notes: input.notes,
        })
        .returning();

      return newPet;
    }),

  updatePet: protectedProcedure
    .input(
      z.object({
        petId: z.string().uuid(),
        name: z.string().min(1),
        species: z.string().min(1),
        breed: z.string().optional().nullable(),
        vaccineStatus: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }

      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(userPets)
        .where(
          and(
            eq(userPets.id, input.petId),
            eq(userPets.userId, ctx.user.userId),
            eq(userPets.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pet record not found",
        });
      }

      const [updated] = await ctx.db
        .update(userPets)
        .set({
          name: input.name,
          species: input.species,
          breed: input.breed,
          vaccineStatus: input.vaccineStatus,
          notes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(userPets.id, input.petId))
        .returning();

      return updated;
    }),

  deletePet: protectedProcedure
    .input(z.object({ petId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active membership",
        });
      }

      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(userPets)
        .where(
          and(
            eq(userPets.id, input.petId),
            eq(userPets.userId, ctx.user.userId),
            eq(userPets.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pet record not found",
        });
      }

      await ctx.db.delete(userPets).where(eq(userPets.id, input.petId));
      return { success: true };
    }),
});
