import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const blocks = pgTable("blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  name: text("name").notNull(),
});
