#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * Creates initial data for development/testing.
 * Run with: npm run seed
 */

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create test users
    const testPassword = await hashPassword(
      process.env.SEED_USER_PASSWORD || "change-me-user-password",
    );

    const testUsers = [
      {
        email: "admin@example.com",
        name: "Admin User",
        password: await hashPassword(
          process.env.SEED_ADMIN_PASSWORD || "change-me-admin-password",
        ),
        role: "admin",
      },
      {
        email: "user@example.com",
        name: "Test User",
        password: testPassword,
        role: "user",
      },
      {
        email: "demo@example.com",
        name: "Demo User",
        password: testPassword,
        role: "user",
      },
    ];

    for (const user of testUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
      console.log(`✅ Created user: ${user.email}`);
    }

    console.log("");
    console.log("✅ Seed completed successfully!");
    console.log("");
    console.log("📝 Test Credentials:");
    console.log("   Admin: admin@example.com / <SEED_ADMIN_PASSWORD>");
    console.log("   User:  user@example.com / <SEED_USER_PASSWORD>");
    console.log("   Demo:  demo@example.com / <SEED_USER_PASSWORD>");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
