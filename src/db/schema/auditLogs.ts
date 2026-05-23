import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { users } from "./users";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  actorId: uuid("actor_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
