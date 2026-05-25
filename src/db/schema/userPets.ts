import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { sites } from "./sites";

export const userPets = pgTable("user_pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(), // Kedi, Köpek, Kuş, Diğer
  breed: text("breed"),
  vaccineStatus: text("vaccine_status"), // Aşıları tam, Eksik aşılar var, Aşı takibi yapılmıyor
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserPet = typeof userPets.$inferSelect;
export type NewUserPet = typeof userPets.$inferInsert;
