import { db } from "../src/db";
import {
  users,
  sites,
  roles,
  memberships,
  announcements,
  notifications,
  announcementReadReceipts,
} from "../src/db/schema";
import { eq } from "drizzle-orm";
import { appRouter } from "../src/server/routers/_app";

async function runTest() {
  console.log("🚀 Starting Phase 2 E2E Integration Test...\n");

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
  console.log(`✅ Found Admin: ${adminUser.name} (${adminUser.id})`);
  console.log(`✅ Found Resident: ${residentUser.name} (${residentUser.id})`);

  const [testSite] = await db
    .insert(sites)
    .values({
      name: "Golden Heights Residence",
      address: "123 luxury ave",
    })
    .returning();
  console.log(`✅ Created Test Site: ${testSite.name} (${testSite.id})`);

  const [adminRole] = await db
    .insert(roles)
    .values({
      siteId: testSite.id,
      name: "SITE_ADMIN",
      permissions: ["CREATE_ANNOUNCEMENT", "VIEW_READ_RECEIPTS"],
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
  console.log(`✅ Created SITE_ADMIN and RESIDENT roles`);

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
  console.log(`✅ Created active memberships for both users in the site`);

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
      permissions: residentRole.permissions,
    },
  };

  const adminCaller = appRouter.createCaller(adminCtx as any);
  const residentCaller = appRouter.createCaller(residentCtx as any);

  console.log("\n📢 Creating Announcement from Admin...");
  const newAnnouncement = await adminCaller.announcement.createAnnouncement({
    title: "Pool Maintenance",
    content:
      "The swimming pool will be closed on Monday for weekly maintenance.",
    priority: "IMPORTANT",
  });
  console.log(`✅ Announcement Created: "${newAnnouncement.title}"`);

  console.log("\n🔔 Listing notifications for Resident...");
  const residentNotifications =
    await residentCaller.notification.listMyNotifications();
  console.log(
    `✅ Found ${residentNotifications.length} notification(s) for resident`,
  );
  expect(residentNotifications.length).toBe(1);
  expect(residentNotifications[0].title).toBe("Pool Maintenance");
  expect(residentNotifications[0].isRead).toBe(false);
  console.log(
    `✅ Notification content matched perfectly: "${residentNotifications[0].message}"`,
  );

  console.log("✉️ Marking resident notification as read...");
  const markedNotif = await residentCaller.notification.markAsRead({
    id: residentNotifications[0].id,
  });
  expect(markedNotif.isRead).toBe(true);
  console.log("✅ Notification successfully marked as read");

  console.log("\n📖 Resident viewing announcement details...");
  const announcementDetail =
    await residentCaller.announcement.getAnnouncementDetail({
      id: newAnnouncement.id,
    });
  expect(announcementDetail.title).toBe("Pool Maintenance");
  console.log("✅ Detail fetched successfully");

  console.log("\n📊 Admin checking read receipts...");
  const receipts = await adminCaller.announcement.getReadReceipts({
    announcementId: newAnnouncement.id,
  });
  console.log(`✅ Found ${receipts.length} read receipt(s)`);
  expect(receipts.length).toBe(1);
  expect(receipts[0].user?.email).toBe(residentUser.email);
  console.log(
    `✅ Read receipt registered user is indeed: ${receipts[0].user?.name}`,
  );

  console.log("\n🗑️ Cleaning up test records...");
  await db
    .delete(announcementReadReceipts)
    .where(eq(announcementReadReceipts.siteId, testSite.id));
  await db.delete(notifications).where(eq(notifications.siteId, testSite.id));
  await db.delete(announcements).where(eq(announcements.siteId, testSite.id));
  await db.delete(memberships).where(eq(memberships.siteId, testSite.id));
  await db.delete(roles).where(eq(roles.siteId, testSite.id));
  await db.delete(sites).where(eq(sites.id, testSite.id));
  console.log("✅ Cleanup complete!");

  console.log("\n🎉 ALL PHASE 2 INTEGRATION TESTS PASSED TRIUMPHANTLY! 🏆");
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
  };
}

runTest().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
