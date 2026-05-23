import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

/**
 * Example Router Template
 *
 * Copy this file and modify for your module.
 * Remember to register in _app.ts
 */
export const exampleRouter = router({
  // Public: Anyone can access
  getAll: publicProcedure.query(async ({ ctx }) => {
    // return ctx.db.select().from(examples);
    return [];
  }),

  // Public: Get by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // return ctx.db.select().from(examples).where(eq(examples.id, input.id));
      return null;
    }),

  // Protected: Requires authentication
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // return ctx.db.insert(examples).values(input).returning();
      return { id: "new-id", ...input };
    }),

  // Protected: Update
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // return ctx.db.update(examples).set(input).where(eq(examples.id, input.id));
      return input;
    }),

  // Protected: Delete
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // return ctx.db.delete(examples).where(eq(examples.id, input.id));
      return { success: true };
    }),
});
