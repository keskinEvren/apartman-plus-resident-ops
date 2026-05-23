import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { amenities } from "./amenities";

export const amenitySessions = pgTable("amenity_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  amenityId: uuid("amenity_id")
    .references(() => amenities.id)
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday to Saturday)
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  capacity: integer("capacity").notNull(), // max concurrent users
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AmenitySession = typeof amenitySessions.$inferSelect;
export type NewAmenitySession = typeof amenitySessions.$inferInsert;
