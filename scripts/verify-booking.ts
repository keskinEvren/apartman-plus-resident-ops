import { db } from "../src/db";
import {
  users,
  sites,
  roles,
  memberships,
  amenities,
  amenitySessions,
  amenityReservations,
  notifications,
} from "../src/db/schema";
import { eq } from "drizzle-orm";
import { appRouter } from "../src/server/routers/_app";

async function runTest() {
  console.log("🚀 Starting Phase 4 E2E Booking Concurrency Test...\n");

  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@example.com"));
  const [residentUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "user@example.com"));
  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "demo@example.com"));

  if (!adminUser || !residentUser || !demoUser) {
    console.error("❌ Seeded users not found. Please run npm run seed first.");
    process.exit(1);
  }

  // Create site
  const [testSite] = await db
    .insert(sites)
    .values({ name: "Phase 4 Sports Club", address: "Olympic park" })
    .returning();

  // Create roles
  const [adminRole] = await db
    .insert(roles)
    .values({
      siteId: testSite.id,
      name: "SITE_ADMIN",
      permissions: ["MANAGE_AMENITIES"],
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

  const [demoMembership] = await db
    .insert(memberships)
    .values({
      userId: demoUser.id,
      siteId: testSite.id,
      roleId: residentRole.id,
      isActive: true,
    })
    .returning();

  console.log("✅ Memberships and site context configured");

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

  const resident1Ctx = {
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

  const resident2Ctx = {
    db,
    user: { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
    activeMembership: {
      id: demoMembership.id,
      siteId: testSite.id,
      unitId: null,
      roleId: residentRole.id,
      roleName: "RESIDENT",
      permissions: [],
    },
  };

  const adminCaller = appRouter.createCaller(adminCtx as any);
  const resident1Caller = appRouter.createCaller(resident1Ctx as any);
  const resident2Caller = appRouter.createCaller(resident2Ctx as any);

  // 1. Create Amenity
  console.log("\n🏋️ Admin creating Gym amenity...");
  const gym = await adminCaller.amenity.createAmenity({
    name: "Luxury Fitness Gym",
    description: "Premium fitness center with private trainers.",
  });
  console.log(`✅ Amenity Created: "${gym.name}"`);

  // 2. Create Monday Session with capacity = 1
  console.log(
    "\n📅 Admin creating Monday session (Capacity = 1 slot available)...",
  );
  const session = await adminCaller.booking.createSession({
    amenityId: gym.id,
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "10:00",
    capacity: 1, // single slot available
  });
  console.log(
    `✅ Session Scheduled: ${session.startTime}-${session.endTime} on Monday`,
  );

  // 3. Launch parallel booking requests (concurrency race-condition check)
  console.log("\n⚡ SIMULATING CONCURRENT BOOKING RACE-CONDITION...");
  console.log("   Launching 2 bookings in parallel for Monday slot...");

  const results = await Promise.allSettled([
    resident1Caller.booking.bookSession({
      sessionId: session.id,
      reservationDate: "2026-05-25", // A Monday
    }),
    resident2Caller.booking.bookSession({
      sessionId: session.id,
      reservationDate: "2026-05-25",
    }),
  ]);

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  console.log(`\n📊 Concurrency result:`);
  console.log(`   Succeeded: ${fulfilled.length}`);
  console.log(`   Failed: ${rejected.length}`);

  // Assertions: exactly 1 succeeds, exactly 1 fails
  expect(fulfilled.length).toBe(1);
  expect(rejected.length).toBe(1);
  console.log(
    "🔒 Concurrency Lock verified: Row-level lock serialized requests successfully!",
  );

  // Verify full-capacity error message
  const failureReason = (rejected[0] as PromiseRejectedResult).reason;
  expect(failureReason.message).toContain("Kapasite dolu");
  console.log(`✅ Correct capacity error returned: "${failureReason.message}"`);

  // Verify successful resident got a reservation alert notification
  const successfulRes = (fulfilled[0] as PromiseFulfilledResult<any>).value;
  const winnerUserId = successfulRes.userId;
  const successfulCaller =
    winnerUserId === residentUser.id ? resident1Caller : resident2Caller;

  const winnerNotifs =
    await successfulCaller.notification.listMyNotifications();
  const reservationAlert = winnerNotifs.find(
    (n) => n.type === "RESERVATION_CONFIRMATION",
  );
  expect(reservationAlert).toBeDefined();
  console.log(
    `🔔 Resident alert notification confirmed: "${reservationAlert?.title}"`,
  );

  // Test Cancellation
  console.log("\n🧹 Testing Reservation cancellation...");
  const cancelledRes = await successfulCaller.amenity.cancelReservation({
    reservationId: successfulRes.id,
  });
  expect(cancelledRes.status).toBe("CANCELLED");
  console.log("✅ Reservation status updated to CANCELLED!");

  // ----------------------------------------------------
  // CLEANUP TEST RECORDS
  // ----------------------------------------------------
  console.log("\n🗑️  Cleaning up test records...");
  await db
    .delete(amenityReservations)
    .where(eq(amenityReservations.siteId, testSite.id));
  await db.delete(notifications).where(eq(notifications.siteId, testSite.id));
  await db
    .delete(amenitySessions)
    .where(eq(amenitySessions.siteId, testSite.id));
  await db.delete(amenities).where(eq(amenities.siteId, testSite.id));
  await db.delete(memberships).where(eq(memberships.siteId, testSite.id));
  await db.delete(roles).where(eq(roles.siteId, testSite.id));
  await db.delete(sites).where(eq(sites.id, testSite.id));
  console.log("✅ Cleanup complete!");

  console.log(
    "\n🎉 ALL PHASE 4 BOOKING CONCURRENCY TESTS PASSED TRIUMPHANTLY! 🏆",
  );
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(
          `Assertion failed! Expected ${expected}, but got ${actual}`,
        );
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Assertion failed! Expected value to be defined.`);
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
