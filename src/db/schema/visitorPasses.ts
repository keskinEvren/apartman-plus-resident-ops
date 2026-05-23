import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { units } from "./units";
import { users } from "./users";

export const visitorPasses = pgTable("visitor_passes", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  unitId: uuid("unit_id")
    .references(() => units.id)
    .notNull(),
  visitorName: text("visitor_name").notNull(),
  status: text("status").default("EXPECTED").notNull(), // 'EXPECTED', 'CHECKED_IN', 'CANCELLED'
  visitDate: text("visit_date").notNull(), // format YYYY-MM-DD
  expectedTime: text("expected_time"), // format HH:MM
  checkedInAt: timestamp("checked_in_at"),
  createdById: uuid("created_by_id")
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VisitorPass = typeof visitorPasses.$inferSelect;
export type NewVisitorPass = typeof visitorPasses.$inferInsert;
