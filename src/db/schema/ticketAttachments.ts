import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { tickets } from "./tickets";

export const ticketAttachments = pgTable("ticket_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  ticketId: uuid("ticket_id")
    .references(() => tickets.id)
    .notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type NewTicketAttachment = typeof ticketAttachments.$inferInsert;
