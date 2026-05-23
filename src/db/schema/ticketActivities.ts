import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { tickets } from "./tickets";
import { users } from "./users";

export const ticketActivities = pgTable("ticket_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  ticketId: uuid("ticket_id")
    .references(() => tickets.id)
    .notNull(),
  actorUserId: uuid("actor_user_id")
    .references(() => users.id)
    .notNull(),
  activityType: text("activity_type").notNull(), // 'STATUS_CHANGE', 'COMMENT', 'ASSIGNMENT'
  content: text("content").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TicketActivity = typeof ticketActivities.$inferSelect;
export type NewTicketActivity = typeof ticketActivities.$inferInsert;
