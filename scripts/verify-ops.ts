import { db } from "../src/db";
import {
  users,
  sites,
  blocks,
  units,
  roles,
  memberships,
  tickets,
  ticketActivities,
  visitorPasses,
  packageDeliveries,
  notifications,
} from "../src/db/schema";
import { eq } from "drizzle-orm";
import { appRouter } from "../src/server/routers/_app";

async function runTest() {
  console.log("🚀 Starting Phase 3 E2E Integration Test...\n");

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
  console.log(`✅ Users Located:`);
  console.log(`   Admin User: ${adminUser.name}`);
  console.log(`   Resident User: ${residentUser.name}`);
  console.log(`   Staff/Demo User: ${demoUser.name}`);

  // Create site, block, unit
  const [testSite] = await db
    .insert(sites)
    .values({
      name: "Phase 3 test luxury apartments",
      address: "Tech district",
    })
    .returning();

  const [blockA] = await db
    .insert(blocks)
    .values({ siteId: testSite.id, name: "Block A" })
    .returning();
  const [blockB] = await db
    .insert(blocks)
    .values({ siteId: testSite.id, name: "Block B" })
    .returning();

  const [unitA1] = await db
    .insert(units)
    .values({ blockId: blockA.id, unitNumber: "Unit A-1" })
    .returning();
  console.log(`✅ Created test Site, Blocks (A & B) and Unit A-1`);

  // Create roles
  const [adminRole] = await db
    .insert(roles)
    .values({
      siteId: testSite.id,
      name: "SITE_ADMIN",
      permissions: ["MANAGE_TICKETS", "MANAGE_VISITORS", "MANAGE_PACKAGES"],
    })
    .returning();

  const [staffRole] = await db
    .insert(roles)
    .values({
      siteId: testSite.id,
      name: "STAFF",
      permissions: [],
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
      unitId: unitA1.id,
      blockId: blockA.id,
      isActive: true,
    })
    .returning();

  // Demo user is assigned to Block A
  const [staffMembershipBlockA] = await db
    .insert(memberships)
    .values({
      userId: demoUser.id,
      siteId: testSite.id,
      roleId: staffRole.id,
      blockId: blockA.id,
      isActive: true,
    })
    .returning();

  console.log(
    `✅ Active memberships established (Demo user assigned to Block A)`,
  );

  // Simulating tRPC Callers
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
      unitId: unitA1.id,
      blockId: blockA.id,
      roleId: residentRole.id,
      roleName: "RESIDENT",
      permissions: [],
    },
  };

  const staffBlockACtx = {
    db,
    user: { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
    activeMembership: {
      id: staffMembershipBlockA.id,
      siteId: testSite.id,
      unitId: null,
      blockId: blockA.id,
      roleId: staffRole.id,
      roleName: "STAFF",
      permissions: [],
    },
  };

  const staffBlockBCtx = {
    db,
    user: { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
    activeMembership: {
      id: staffMembershipBlockA.id,
      siteId: testSite.id,
      unitId: null,
      blockId: blockB.id, // assigned to Block B instead
      roleId: staffRole.id,
      roleName: "STAFF",
      permissions: [],
    },
  };

  const residentCaller = appRouter.createCaller(residentCtx as any);
  const staffBlockACaller = appRouter.createCaller(staffBlockACtx as any);
  const staffBlockBCaller = appRouter.createCaller(staffBlockBCtx as any);

  // ----------------------------------------------------
  // TEST CASE 1: Ticket creation and SLA block assignment
  // ----------------------------------------------------
  console.log("\n🛠️ Test Case 1: Tickets & SLA Block Filtering");
  const newTicket = await residentCaller.ticket.createTicket({
    category: "TECHNICAL",
    title: "Leaking pipe in kitchen",
    description: "Water is dripping slowly from under the sink.",
  });
  console.log(`✅ Resident submitted ticket: "${newTicket.title}"`);

  // Staff assigned to Block A should see the ticket
  const blockATickets = await staffBlockACaller.ticket.listStaffTickets();
  expect(blockATickets.length).toBe(1);
  expect(blockATickets[0].title).toBe("Leaking pipe in kitchen");
  console.log(
    "✅ Staff assigned to Block A queried and successfully verified ticket presence",
  );

  // Staff assigned to Block B should NOT see the ticket (SLA boundary check)
  const blockBTickets = await staffBlockBCaller.ticket.listStaffTickets();
  expect(blockBTickets.length).toBe(0);
  console.log(
    "🔒 SLA verification passed: Staff assigned to Block B cannot view tickets from Block A!",
  );

  // Staff updates ticket status
  const updatedTicket = await staffBlockACaller.ticket.updateTicketStatus({
    ticketId: newTicket.id,
    status: "IN_PROGRESS",
  });
  expect(updatedTicket.status).toBe("IN_PROGRESS");
  console.log("✅ Staff updated ticket status to: IN_PROGRESS");

  // Check activity logs
  const activities = await db
    .select()
    .from(ticketActivities)
    .where(eq(ticketActivities.ticketId, newTicket.id));
  expect(activities.length).toBe(2); // Creation log + status change log
  console.log("✅ Ticket activities audited perfectly!");

  // ----------------------------------------------------
  // TEST CASE 2: Visitor pass pre-registration & security check-in
  // ----------------------------------------------------
  console.log("\n🚪 Test Case 2: Visitor Passes & Reception Panel");
  const todayStr = new Date().toISOString().split("T")[0];
  const newPass = await residentCaller.visitor.createVisitorPass({
    visitorName: "Alice Smith",
    visitDate: todayStr,
    expectedTime: "14:30",
  });
  console.log(`✅ Resident scheduled visitor: "${newPass.visitorName}"`);

  // Security lists expected visitors for today
  const expectedList = await staffBlockACaller.visitor.listExpectedVisitors({
    visitDate: todayStr,
  });
  expect(expectedList.length).toBe(1);
  expect(expectedList[0].visitorName).toBe("Alice Smith");
  console.log(
    "✅ Security receptionist queried expected visitors for today successfully",
  );

  // Security checks in visitor
  const checkedInPass = await staffBlockACaller.visitor.checkInVisitor({
    passId: newPass.id,
  });
  expect(checkedInPass.status).toBe("CHECKED_IN");
  expect(checkedInPass.checkedInAt).toBeDefined();
  console.log(
    "✅ Security verified and checked in guest. Status updated to CHECKED_IN!",
  );

  // ----------------------------------------------------
  // TEST CASE 3: Package delivery & OTP code verification flow
  // ----------------------------------------------------
  console.log("\n📦 Test Case 3: Packages Delivery & OTP Lock");
  const carrierPackage = await staffBlockACaller.package.receivePackage({
    unitId: unitA1.id,
    carrierName: "FedEx",
  });
  console.log(`✅ Reception registered incoming FedEx package for Unit A-1`);

  // Verify resident got an alert notification with the 6-digit OTP code
  const residentNotifs =
    await residentCaller.notification.listMyNotifications();
  const packageNotif = residentNotifs.find(
    (n) => n.type === "PACKAGE_DELIVERY",
  );
  expect(packageNotif).toBeDefined();
  console.log(`🔔 Alert notification received: "${packageNotif?.title}"`);

  // Get OTP from DB for security verification simulation
  const [dbPackage] = await db
    .select()
    .from(packageDeliveries)
    .where(eq(packageDeliveries.id, carrierPackage.id));
  const validOtp = dbPackage.otpCode;
  console.log(`🔑 Real OTP registered in db is: ${validOtp}`);

  // Delivering with incorrect OTP must fail
  try {
    await staffBlockACaller.package.verifyOtpAndDeliver({
      packageId: carrierPackage.id,
      otpCode: "000000",
    });
    throw new Error("Delivering with incorrect OTP did not fail!");
  } catch (error: any) {
    expect(error.message).toContain("Geçersiz OTP kodu");
    console.log(
      "🔒 OTP lock validated: delivery failed correctly on invalid code!",
    );
  }

  // Delivering with correct OTP must succeed
  const deliveredPack = await staffBlockACaller.package.verifyOtpAndDeliver({
    packageId: carrierPackage.id,
    otpCode: validOtp,
  });
  expect(deliveredPack.status).toBe("DELIVERED");
  expect(deliveredPack.deliveredAt).toBeDefined();
  console.log("✅ Package successfully delivered upon correct OTP matching!");

  // ----------------------------------------------------
  // CLEANUP TEST RECORDS
  // ----------------------------------------------------
  console.log("\n🗑️  Cleaning up test records...");
  await db
    .delete(packageDeliveries)
    .where(eq(packageDeliveries.siteId, testSite.id));
  await db.delete(visitorPasses).where(eq(visitorPasses.siteId, testSite.id));
  await db
    .delete(ticketActivities)
    .where(eq(ticketActivities.siteId, testSite.id));
  await db.delete(tickets).where(eq(tickets.siteId, testSite.id));
  await db.delete(notifications).where(eq(notifications.siteId, testSite.id));
  await db.delete(memberships).where(eq(memberships.siteId, testSite.id));
  await db.delete(roles).where(eq(roles.siteId, testSite.id));
  await db.delete(units).where(eq(units.blockId, blockA.id));
  await db.delete(blocks).where(eq(blocks.siteId, testSite.id));
  await db.delete(sites).where(eq(sites.id, testSite.id));
  console.log("✅ Cleanup complete!");

  console.log("\n🎉 ALL PHASE 3 DAILY OPS TESTS PASSED TRIUMPHANTLY! 🏆");
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
