import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { units } from "./units";
import { roles } from "./roles";
import { users } from "./users";

export const invitationTokens = pgTable("invitation_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  unitId: uuid("unit_id").references(() => units.id),
  roleId: uuid("role_id")
    .references(() => roles.id)
    .notNull(),
  token: text("token").notNull().unique(),
  email: text("email"),
  isUsed: boolean("is_used").default(false).notNull(),
  usedByUserId: uuid("used_by_user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
