import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { announcements } from "./announcements";
import { users } from "./users";

export const announcementReadReceipts = pgTable("announcement_read_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  announcementId: uuid("announcement_id")
    .references(() => announcements.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

export type AnnouncementReadReceipt =
  typeof announcementReadReceipts.$inferSelect;
export type NewAnnouncementReadReceipt =
  typeof announcementReadReceipts.$inferInsert;
