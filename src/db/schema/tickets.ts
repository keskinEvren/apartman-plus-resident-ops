import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { units } from "./units";
import { blocks } from "./blocks";
import { users } from "./users";

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  unitId: uuid("unit_id").references(() => units.id),
  blockId: uuid("block_id").references(() => blocks.id),
  reporterUserId: uuid("reporter_user_id")
    .references(() => users.id)
    .notNull(),
  category: text("category").notNull(), // 'TECHNICAL', 'CLEANING', 'SECURITY', 'OTHER'
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").default("OPEN").notNull(), // 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'
  assignedStaffUserId: uuid("assigned_staff_user_id").references(
    () => users.id,
  ),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
