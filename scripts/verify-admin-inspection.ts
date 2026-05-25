import { db } from "../src/db";
import {
  users,
  sites,
  roles,
  memberships,
  userPets,
  userNotificationPreferences,
} from "../src/db/schema";
import { eq } from "drizzle-orm";
import { appRouter } from "../src/server/routers/_app";

async function runTest() {
  console.log(
    "🚀 Starting E2E Administrative Resident Profile Inspection Test...\n",
  );

  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@example.com"));
  const [residentUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "user@example.com"));

  if (!adminUser || !residentUser) {
    console.error("❌ Seeded users not found. Please run npm run seed first.");
    process.exit(1);
  }

  // Create temporary site
  const [testSite] = await db
    .insert(sites)
    .values({ name: "Admin Test Club", address: "Olympic Park" })
    .returning();

  // Create roles
  const [adminRole] = await db
    .insert(roles)
    .values({
      siteId: testSite.id,
      name: "SITE_ADMIN",
      permissions: ["MANAGE_MEMBERS"],
    })
    .returning();

  const [residentRole] = await db
    .insert(roles)
    .values({
      siteId: testSite.id,
      name: "RESIDENT",
      permissions: [],
    })
    .returning();

  // Create memberships
  const [adminMembership] = await db
    .insert(memberships)
    .values({
      userId: adminUser.id,
      siteId: testSite.id,
      roleId: adminRole.id,
      isActive: true,
    })
    .returning();

  const [residentMembership] = await db
    .insert(memberships)
    .values({
      userId: residentUser.id,
      siteId: testSite.id,
      roleId: residentRole.id,
      isActive: true,
    })
    .returning();

  console.log("✅ Configured temporary site, roles, and memberships context");

  // Callers
  const adminCtx = {
    db,
    user: {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    },
    activeMembership: {
      id: adminMembership.id,
      siteId: testSite.id,
      unitId: null,
      roleId: adminRole.id,
      roleName: "SITE_ADMIN",
      permissions: adminRole.permissions,
    },
  };

  const residentCtx = {
    db,
    user: {
      userId: residentUser.id,
      email: residentUser.email,
      role: residentUser.role,
    },
    activeMembership: {
      id: residentMembership.id,
      siteId: testSite.id,
      unitId: null,
      roleId: residentRole.id,
      roleName: "RESIDENT",
      permissions: [],
    },
  };

  const adminCaller = appRouter.createCaller(adminCtx as any);
  const residentCaller = appRouter.createCaller(residentCtx as any);

  // 1. Seed a test pet and notification preference for resident user
  const [testPet] = await db
    .insert(userPets)
    .values({
      userId: residentUser.id,
      siteId: testSite.id,
      name: "Gofret",
      species: "Köpek",
      breed: "Golden",
      vaccineStatus: "Aşıları Tam",
    })
    .returning();

  const [testPrefs] = await db
    .insert(userNotificationPreferences)
    .values({
      userId: residentUser.id,
      siteId: testSite.id,
      announcementsEmail: false,
      announcementsSms: true,
    })
    .returning();

  console.log("✅ Seeded test pet and preferences for resident");

  // 2. Test Authorization: Resident should be denied access to inspect profiles
  console.log(
    "\n🔒 Testing Authorization (Access Denied for regular residents)...",
  );
  try {
    await residentCaller.user.getResidentProfileForAdmin({
      siteId: testSite.id,
      residentUserId: residentUser.id,
    });
    throw new Error(
      "Resident was allowed to call getResidentProfileForAdmin! Security breach! ❌",
    );
  } catch (err: any) {
    expect(err.message).toContain("Yönetici yetkisi gerekli");
    console.log("✅ Access Denied verified correctly for regular resident");
  }

  // 3. Test Retrieval: Admin should successfully fetch resident's data relations
  console.log(
    "\n🔑 Testing Inspection Retrieval (Successful fetch for admins)...",
  );
  const data = await adminCaller.user.getResidentProfileForAdmin({
    siteId: testSite.id,
    residentUserId: residentUser.id,
  });

  expect(data.profile.name).toBe(residentUser.name);
  expect(data.profile.email).toBe(residentUser.email);
  expect(data.pets.length).toBe(1);
  expect(data.pets[0].name).toBe("Gofret");
  expect(data.preferences?.announcementsEmail).toBe(false);
  expect(data.preferences?.announcementsSms).toBe(true);

  console.log(
    "✅ Successfully retrieved profile, emergency contacts, pets registry, and preferences matrix!",
  );

  // ----------------------------------------------------
  // CLEANUP TEST RECORDS
  // ----------------------------------------------------
  console.log("\n🗑️  Cleaning up test records...");
  await db.delete(userPets).where(eq(userPets.siteId, testSite.id));
  await db
    .delete(userNotificationPreferences)
    .where(eq(userNotificationPreferences.siteId, testSite.id));
  await db.delete(memberships).where(eq(memberships.siteId, testSite.id));
  await db.delete(roles).where(eq(roles.siteId, testSite.id));
  await db.delete(sites).where(eq(sites.id, testSite.id));
  console.log("✅ Cleanup complete!");

  console.log(
    "\n🎉 ALL ADMIN PROFILE INSPECTION TESTS PASSED TRIUMPHANTLY! 🏆",
  );
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(
          `Assertion failed! Expected "${expected}", but got "${actual}"`,
        );
      }
    },
    toContain(str: string) {
      if (typeof actual !== "string" || !actual.includes(str)) {
        throw new Error(
          `Assertion failed! Expected "${actual}" to contain "${str}"`,
        );
      }
    },
  };
}

runTest().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
