import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { blocks } from "./blocks";

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockId: uuid("block_id")
    .references(() => blocks.id)
    .notNull(),
  unitNumber: text("unit_number").notNull(),
});
