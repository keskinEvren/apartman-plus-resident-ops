import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

/**
 * Example Table Template
 *
 * Copy this file and modify for your entity.
 * Remember to export from index.ts
 */
export const examples = pgTable("examples", {
  // Primary key - always use UUID
  id: uuid("id").primaryKey().defaultRandom(),

  // Core fields
  name: text("name").notNull(),
  description: text("description"),

  // Status/flags
  isActive: boolean("is_active").default(true),

  // Soft delete
  deletedAt: timestamp("deleted_at"),

  // Timestamps - always include these
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type inference helpers
export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
