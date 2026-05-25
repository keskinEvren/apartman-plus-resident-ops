import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id));
      return user;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(users);
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phoneNumber: users.phoneNumber,
        emergencyContactName: users.emergencyContactName,
        emergencyContactPhone: users.emergencyContactPhone,
      })
      .from(users)
      .where(eq(users.id, ctx.user.userId));
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phoneNumber: z.string().optional().nullable(),
        emergencyContactName: z.string().optional().nullable(),
        emergencyContactPhone: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          name: input.name,
          phoneNumber: input.phoneNumber,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNumber: users.phoneNumber,
          emergencyContactName: users.emergencyContactName,
          emergencyContactPhone: users.emergencyContactPhone,
        });
      return updated;
    }),
});
