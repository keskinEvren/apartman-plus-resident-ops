import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id").references(() => sites.id),
  name: text("name").notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
});
