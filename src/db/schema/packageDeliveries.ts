import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { units } from "./units";

export const packageDeliveries = pgTable("package_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id)
    .notNull(),
  unitId: uuid("unit_id")
    .references(() => units.id)
    .notNull(),
  carrierName: text("carrier_name").notNull(),
  otpCode: text("otp_code").notNull(), // 6-digit random code
  status: text("status").default("RECEIVED").notNull(), // 'RECEIVED', 'DELIVERED'

  receivedAt: timestamp("received_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});

export type PackageDelivery = typeof packageDeliveries.$inferSelect;
export type NewPackageDelivery = typeof packageDeliveries.$inferInsert;
