import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  announcements,
  announcementReadReceipts,
  notifications,
  memberships,
  users,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const announcementRouter = router({
  createAnnouncement: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string().min(1, "Content is required"),
        priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).default("NORMAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }
      const hasPerm =
        ctx.activeMembership.roleName === "SUPER_ADMIN" ||
        ctx.activeMembership.roleName === "SITE_ADMIN" ||
        ctx.activeMembership.permissions.includes("CREATE_ANNOUNCEMENT");
      if (!hasPerm) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to create announcements",
        });
      }

      const [newAnnouncement] = await ctx.db
        .insert(announcements)
        .values({
          siteId: ctx.activeMembership.siteId,
          title: input.title,
          content: input.content,
          priority: input.priority,
          authorId: ctx.user.userId,
        })
        .returning();

      const activeMembers = await ctx.db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.siteId, ctx.activeMembership.siteId),
            eq(memberships.isActive, true),
          ),
        );

      const notificationsToInsert = activeMembers
        .filter((member) => member.userId !== ctx.user.userId)
        .map((member) => ({
          siteId: ctx.activeMembership!.siteId,
          recipientUserId: member.userId,
          type: "ANNOUNCEMENT",
          title: `${input.priority === "URGENT" ? "🚨 " : ""}${input.title}`,
          message:
            input.content.substring(0, 100) +
            (input.content.length > 100 ? "..." : ""),
          relatedEntityId: newAnnouncement.id,
          relatedEntityType: "ANNOUNCEMENT",
        }));

      if (notificationsToInsert.length > 0) {
        await ctx.db.insert(notifications).values(notificationsToInsert);
      }
      return newAnnouncement;
    }),

  listAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active site membership selected",
      });
    }
    return ctx.db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        priority: announcements.priority,
        createdAt: announcements.createdAt,
        author: { id: users.id, name: users.name },
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.id))
      .where(eq(announcements.siteId, ctx.activeMembership.siteId))
      .orderBy(desc(announcements.createdAt));
  }),

  getAnnouncementDetail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }
      const [record] = await ctx.db
        .select({
          id: announcements.id,
          title: announcements.title,
          content: announcements.content,
          priority: announcements.priority,
          createdAt: announcements.createdAt,
          author: { id: users.id, name: users.name },
        })
        .from(announcements)
        .leftJoin(users, eq(announcements.authorId, users.id))
        .where(
          and(
            eq(announcements.id, input.id),
            eq(announcements.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Announcement not found",
        });
      }

      const [existingReceipt] = await ctx.db
        .select()
        .from(announcementReadReceipts)
        .where(
          and(
            eq(announcementReadReceipts.announcementId, record.id),
            eq(announcementReadReceipts.userId, ctx.user.userId),
            eq(announcementReadReceipts.siteId, ctx.activeMembership.siteId),
          ),
        );

      if (!existingReceipt) {
        await ctx.db.insert(announcementReadReceipts).values({
          siteId: ctx.activeMembership.siteId,
          announcementId: record.id,
          userId: ctx.user.userId,
        });
      }
      return record;
    }),

  getReadReceipts: protectedProcedure
    .input(z.object({ announcementId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.activeMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active site membership selected",
        });
      }
      const hasPerm =
        ctx.activeMembership.roleName === "SUPER_ADMIN" ||
        ctx.activeMembership.roleName === "SITE_ADMIN" ||
        ctx.activeMembership.permissions.includes("VIEW_READ_RECEIPTS");
      if (!hasPerm) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to view read receipts",
        });
      }
      return ctx.db
        .select({
          id: announcementReadReceipts.id,
          readAt: announcementReadReceipts.readAt,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(announcementReadReceipts)
        .leftJoin(users, eq(announcementReadReceipts.userId, users.id))
        .where(
          and(
            eq(announcementReadReceipts.announcementId, input.announcementId),
            eq(announcementReadReceipts.siteId, ctx.activeMembership.siteId),
          ),
        );
    }),
});
