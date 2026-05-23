import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { amenitySessions } from "./amenitySessions";
import { users } from "./users";

export const amenityReservations = pgTable("amenity_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  sessionId: uuid("session_id")
    .references(() => amenitySessions.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  reservationDate: text("reservation_date").notNull(), // format YYYY-MM-DD
  status: text("status").default("CONFIRMED").notNull(), // 'CONFIRMED', 'CANCELLED'

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AmenityReservation = typeof amenityReservations.$inferSelect;
export type NewAmenityReservation = typeof amenityReservations.$inferInsert;
