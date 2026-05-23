import { boolean, pgTable, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { sites } from "./sites";
import { units } from "./units";
import { roles } from "./roles";
import { blocks } from "./blocks";

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  unitId: uuid("unit_id").references(() => units.id),
  blockId: uuid("block_id").references(() => blocks.id),
  roleId: uuid("role_id")
    .references(() => roles.id)
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});
