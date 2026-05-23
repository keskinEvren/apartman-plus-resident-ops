import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { users } from "./users";

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").default("NORMAL").notNull(), // 'NORMAL', 'IMPORTANT', 'URGENT'
  authorId: uuid("author_id")
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
