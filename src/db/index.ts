import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { newDb } from "pg-mem";
import * as schema from "./schema";

// Create database connection based on environment
const getDb = () => {
  if (process.env.NODE_ENV === "test") {
    const mem = newDb();
    // Setup the memory database if needed (e.g. extensions)
    const pool = mem.adapters.createPg().Pool;
    return drizzle(new pool() as any, { schema });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return drizzle(pool, { schema });
};

export const db = getDb();

// Export types
export type DbClient = typeof db;
export * from "./schema";
