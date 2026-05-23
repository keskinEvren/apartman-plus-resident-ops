import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  recipientUserId: uuid("recipient_user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull(), // 'ANNOUNCEMENT', 'TICKET_UPDATE', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  relatedEntityId: uuid("related_entity_id"),
  relatedEntityType: text("related_entity_type"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
