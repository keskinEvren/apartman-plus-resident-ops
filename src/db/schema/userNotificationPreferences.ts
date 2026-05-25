import { pgTable, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { sites } from "./sites";

export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),

    // Duyurular
    announcementsEmail: boolean("announcements_email").default(true).notNull(),
    announcementsSms: boolean("announcements_sms").default(false).notNull(),
    announcementsPush: boolean("announcements_push").default(true).notNull(),
    announcementsInApp: boolean("announcements_in_app").default(true).notNull(),

    // Kargolar
    packagesEmail: boolean("packages_email").default(true).notNull(),
    packagesSms: boolean("packages_sms").default(true).notNull(),
    packagesPush: boolean("packages_push").default(true).notNull(),
    packagesInApp: boolean("packages_in_app").default(true).notNull(),

    // Ziyaretçiler
    visitorsEmail: boolean("visitors_email").default(false).notNull(),
    visitorsSms: boolean("visitors_sms").default(true).notNull(),
    visitorsPush: boolean("visitors_push").default(true).notNull(),
    visitorsInApp: boolean("visitors_in_app").default(true).notNull(),

    // Rezervasyonlar
    bookingsEmail: boolean("bookings_email").default(true).notNull(),
    bookingsSms: boolean("bookings_sms").default(false).notNull(),
    bookingsPush: boolean("bookings_push").default(true).notNull(),
    bookingsInApp: boolean("bookings_in_app").default(true).notNull(),
  },
);

export type UserNotificationPreferences =
  typeof userNotificationPreferences.$inferSelect;
export type NewUserNotificationPreferences =
  typeof userNotificationPreferences.$inferInsert;
