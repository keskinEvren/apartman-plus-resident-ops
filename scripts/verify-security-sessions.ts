import { db } from "../src/db";
import { users, userSessions } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { appRouter } from "../src/server/routers/_app";
import { hashPassword } from "../src/lib/auth";

async function runTest() {
  console.log(
    "🚀 Starting Security & Active Session Management E2E Integration Test...\n",
  );

  const [residentUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "user@example.com"));

  if (!residentUser) {
    console.error(
      "❌ Seeded resident user not found. Please run npm run seed first.",
    );
    process.exit(1);
  }
  console.log(
    `✅ Found Resident User: ${residentUser.name} (${residentUser.id})`,
  );

  // 0. Clean up any existing sessions for this resident user to ensure clean test state
  console.log("🧹 Pre-test cleanup: deleting any existing active sessions...");
  await db.delete(userSessions).where(eq(userSessions.userId, residentUser.id));

  // 1. Test Login Endpoint (No 2FA should be requested or required)
  console.log("\n🔑 Testing login mutation via authRouter...");
  const authCaller = appRouter.createCaller({ db } as any);

  const loginResult = await authCaller.auth.login({
    email: "user@example.com",
    password: "user123",
  });

  expect(loginResult.token).toBeDefined();
  expect(loginResult.user.email).toBe("user@example.com");
  console.log("✅ Login succeeded directly and returned JWT token!");

  // Extract session details
  const [sessionInDb] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.userId, residentUser.id));

  expect(sessionInDb).toBeDefined();
  console.log(`✅ Session successfully registered in DB: ${sessionInDb.id}`);

  // 2. Test Session Listing (Should return 1 active session which is Current)
  const residentCtx = {
    db,
    user: {
      userId: residentUser.id,
      email: residentUser.email,
      role: residentUser.role,
      sessionId: sessionInDb.id,
    },
  };

  const securityCaller = appRouter.createCaller(residentCtx as any);

  console.log("\n📱 Listing active sessions...");
  let activeSessions = await securityCaller.security.listActiveSessions();

  console.log(`✅ Found ${activeSessions.length} active session(s)`);
  expect(activeSessions.length).toBe(1);
  expect(activeSessions[0].id).toBe(sessionInDb.id);
  expect(activeSessions[0].isCurrent).toBe(true);
  console.log(
    "✅ Session list matches precisely and identifies current session correctly",
  );

  // 3. Simulate another concurrent active session in DB
  console.log("\n⚡ Simulating second active session...");
  const [secondSession] = await db
    .insert(userSessions)
    .values({
      userId: residentUser.id,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      ipAddress: "192.168.1.50",
      isActive: true,
    })
    .returning();

  console.log(`✅ Created simulated mobile session: ${secondSession.id}`);

  activeSessions = await securityCaller.security.listActiveSessions();
  console.log(`✅ Active session count: ${activeSessions.length}`);
  expect(activeSessions.length).toBe(2);

  const currentSession = activeSessions.find((s) => s.isCurrent);
  const otherSession = activeSessions.find((s) => !s.isCurrent);

  expect(currentSession?.id).toBe(sessionInDb.id);
  expect(otherSession?.id).toBe(secondSession.id);
  expect(otherSession?.ipAddress).toBe("192.168.1.50");
  expect(otherSession?.userAgent).toBe(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
  );
  console.log(
    "✅ Session list correctly differentiates between multiple active sessions",
  );

  // 4. Test Session Revocation
  console.log(`\n🛑 Revoking simulated mobile session: ${secondSession.id}`);
  const revokeResult = await securityCaller.security.revokeSession({
    sessionId: secondSession.id,
  });

  expect(revokeResult.success).toBe(true);
  console.log("✅ Revocation mutation returned success");

  // Confirm session is no longer active in list
  activeSessions = await securityCaller.security.listActiveSessions();
  console.log(
    `✅ Active session count after revocation: ${activeSessions.length}`,
  );
  expect(activeSessions.length).toBe(1);
  expect(activeSessions[0].id).toBe(sessionInDb.id);
  console.log("✅ Revoked session is no longer listed as active");

  // Confirm session status in Database is set to inactive
  const [revokedDbSession] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.id, secondSession.id));

  expect(revokedDbSession.isActive).toBe(false);
  expect(revokedDbSession.revokedAt).toBeDefined();
  console.log("✅ Session status verified in DB as inactive and revoked");

  // 5. Test Password Rotation
  console.log("\n🔐 Testing password rotation/change...");
  const changePassResult = await securityCaller.security.changePassword({
    currentPassword: "user123",
    newPassword: "newPassword123!",
  });

  expect(changePassResult.success).toBe(true);
  console.log("✅ Password successfully rotated via mutation");

  // Attempt login with old password (should fail)
  console.log("🔒 Verifying old password no longer works...");
  try {
    await authCaller.auth.login({
      email: "user@example.com",
      password: "user123",
    });
    throw new Error("Old password worked! Mutation failure.");
  } catch (err: any) {
    expect(err.message).toBe("Kullanıcı bulunamadı veya şifre hatalı");
    console.log("✅ Old password rejected with correct unauthorized error");
  }

  // Attempt login with new password (should succeed)
  console.log("🔑 Verifying new password works...");
  const newLoginResult = await authCaller.auth.login({
    email: "user@example.com",
    password: "newPassword123!",
  });
  expect(newLoginResult.token).toBeDefined();
  console.log("✅ Login with new password succeeded perfectly!");

  // Revert back to original password for seed database consistency
  console.log("\n🔄 Reverting password to original state...");
  const revertedHash = await hashPassword("user123");
  await db
    .update(users)
    .set({ password: revertedHash, updatedAt: new Date() })
    .where(eq(users.id, residentUser.id));
  console.log("✅ Password reverted back successfully");

  // 6. Clean up active sessions created during test
  console.log("\n🗑️ Cleaning up test sessions...");
  await db.delete(userSessions).where(eq(userSessions.userId, residentUser.id));
  console.log("✅ Cleanup complete!");

  console.log(
    "\n🎉 ALL SECURITY & ACTIVE SESSION TESTS PASSED TRIUMPHANTLY! 🏆",
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
  };
}

runTest().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
