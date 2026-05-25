import { db } from "../src/db";
import {
  users,
  sites,
  roles,
  memberships,
  userPets,
  userNotificationPreferences,
} from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { appRouter } from "../src/server/routers/_app";

async function runTest() {
  console.log(
    "🚀 Starting Phase 3 E2E Profile, Pets & Preferences Verification...\n",
  );

  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "user@example.com"));

  if (!demoUser) {
    console.error(
      "❌ Seeded resident user not found. Please run npm run seed first.",
    );
    process.exit(1);
  }

  // Create temporary site context for isolated test
  const [testSite] = await db
    .insert(sites)
    .values({ name: "Phase 3 Test Site", address: "Ankara" })
    .returning();

  const [residentRole] = await db
    .insert(roles)
    .values({
      siteId: testSite.id,
      name: "RESIDENT",
      permissions: [],
    })
    .returning();

  const [membership] = await db
    .insert(memberships)
    .values({
      userId: demoUser.id,
      siteId: testSite.id,
      roleId: residentRole.id,
      isActive: true,
    })
    .returning();

  console.log("✅ Configured temporary site and membership context");

  const ctx = {
    db,
    user: {
      userId: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
    },
    activeMembership: {
      id: membership.id,
      siteId: testSite.id,
      unitId: null,
      roleId: residentRole.id,
      roleName: "RESIDENT",
      permissions: [],
    },
  };

  const caller = appRouter.createCaller(ctx as any);

  // 1. Test Profile Updates
  console.log("\n👤 Testing Resident Profile endpoints...");
  const myProfile = await caller.user.me();
  expect(myProfile.email).toBe(demoUser.email);
  console.log(`   Fetched profile successfully: "${myProfile.name}"`);

  const updatedProfile = await caller.user.updateProfile({
    name: "Evren Keskin Updated",
    phoneNumber: "5551234567",
    emergencyContactName: "Kemal Keskin",
    emergencyContactPhone: "5559876543",
  });

  expect(updatedProfile.name).toBe("Evren Keskin Updated");
  expect(updatedProfile.phoneNumber).toBe("5551234567");
  expect(updatedProfile.emergencyContactName).toBe("Kemal Keskin");
  expect(updatedProfile.emergencyContactPhone).toBe("5559876543");
  console.log(
    "✅ Profile details and emergency contacts updated successfully!",
  );

  // Restore original name to avoid corrupting seed user name
  await caller.user.updateProfile({
    name: demoUser.name,
    phoneNumber: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
  });

  // 2. Test Pet Registry (CRUD)
  console.log("\n🐾 Testing Pet Registry endpoints...");
  const initialPets = await caller.pet.listMyPets();
  expect(initialPets.length).toBe(0);
  console.log("   Initial pet count is 0");

  const newPet = await caller.pet.createPet({
    name: "Pamuk",
    species: "Kedi",
    breed: "Ankara Kedisi",
    vaccineStatus: "Aşıları Tam",
    notes: "Tüyleri çok beyaz ve yumuşak",
  });

  expect(newPet.name).toBe("Pamuk");
  expect(newPet.species).toBe("Kedi");
  expect(newPet.breed).toBe("Ankara Kedisi");
  console.log(`✅ Created pet: "${newPet.name}"`);

  const petList = await caller.pet.listMyPets();
  expect(petList.length).toBe(1);
  expect(petList[0].id).toBe(newPet.id);
  console.log(`   Listed pets successfully, count: ${petList.length}`);

  const updatedPet = await caller.pet.updatePet({
    petId: newPet.id,
    name: "Pamuk Şeker",
    species: "Kedi",
    breed: "Ankara Kedisi",
    vaccineStatus: "Eksik Aşıları Var",
    notes: "Aşı takvimi kontrol edilmeli",
  });

  expect(updatedPet.name).toBe("Pamuk Şeker");
  expect(updatedPet.vaccineStatus).toBe("Eksik Aşıları Var");
  console.log("✅ Pet details updated successfully!");

  await caller.pet.deletePet({ petId: newPet.id });
  const postDeletePets = await caller.pet.listMyPets();
  expect(postDeletePets.length).toBe(0);
  console.log("✅ Pet deleted successfully!");

  // 3. Test Notification Preference Matrix
  console.log("\n🔔 Testing Notification Preferences Matrix endpoints...");
  const initialPrefs = await caller.preference.getNotificationPreferences();
  expect(initialPrefs.announcementsEmail).toBe(true); // default
  expect(initialPrefs.announcementsSms).toBe(false); // default
  console.log("   Fetched default notification preferences successfully");

  const updatedPrefs = await caller.preference.updateNotificationPreferences({
    announcementsEmail: false,
    announcementsSms: true,
    announcementsPush: true,
    announcementsInApp: false,
    packagesEmail: true,
    packagesSms: true,
    packagesPush: true,
    packagesInApp: true,
    visitorsEmail: true,
    visitorsSms: true,
    visitorsPush: true,
    visitorsInApp: true,
    bookingsEmail: false,
    bookingsSms: false,
    bookingsPush: true,
    bookingsInApp: true,
  });

  expect(updatedPrefs.announcementsEmail).toBe(false);
  expect(updatedPrefs.announcementsSms).toBe(true);
  expect(updatedPrefs.bookingsEmail).toBe(false);
  console.log(
    "✅ Notification preferences matrix updated and persisted successfully!",
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
    "\n🎉 ALL PHASE 3 PROFILE, PETS & PREFERENCES TESTS PASSED TRIUMPHANTLY! 🏆",
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
  };
}

runTest().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
