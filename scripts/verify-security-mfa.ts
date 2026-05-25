import { db } from "../src/db";
import { users, userSessions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { appRouter } from "../src/server/routers/_app";
import { hashPassword } from "../src/lib/auth";
import crypto from "crypto";

// Custom TOTP generator for E2E testing helper
function getTOTPCode(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = secret.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let val = 0;
  const bytes = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((val >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const key = Buffer.from(bytes);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  const cBuf = Buffer.alloc(8);
  cBuf.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(cBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1000000;

  return code.toString().padStart(6, "0");
}

async function runTest() {
  console.log(
    "🚀 Starting E2E Account Security, Sessions & MFA Verification...\n",
  );

  const testEmail = `secuser-${Date.now()}@example.com`;
  const [testUser] = await db
    .insert(users)
    .values({
      name: "Security Tester",
      email: testEmail,
      password: await hashPassword("CurrentP@ss1"),
      role: "user",
    })
    .returning();

  console.log(`✅ Configured temporary test user: ${testEmail}`);

  // 1. Initial Login
  console.log("\n🔑 1. Testing Standard Login...");
  const loginRes1 = await appRouter
    .createCaller({
      db,
      user: null,
      activeMembership: null,
      req: {
        headers: new Headers({
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "x-forwarded-for": "192.168.1.50",
        }),
      } as any,
    })
    .auth.login({
      email: testEmail,
      password: "CurrentP@ss1",
    });

  expect(loginRes1.requireMfa).toBe(false);
  expect(loginRes1.token).toBeDefined();
  console.log("✅ Standard login successful, session registered");

  // Decode JWT and test context resolving
  const { verifyToken } = await import("../src/lib/auth");
  const decodedToken = verifyToken(loginRes1.token!);
  expect(decodedToken.sessionId).toBeDefined();

  // Test Context
  const testCtx = {
    db,
    user: decodedToken,
    activeMembership: null,
    req: null as any,
  };
  const caller = appRouter.createCaller(testCtx);

  // 2. Change Password
  console.log("\n🔒 2. Testing Password Change...");
  // Attempt with invalid current password
  try {
    await caller.security.changePassword({
      currentPassword: "WrongPassword123!",
      newPassword: "NewSecureP@ss2",
    });
    throw new Error("Password change allowed wrong current password!");
  } catch (err: any) {
    expect(err.message).toContain("Mevcut şifreniz hatalı");
    console.log("✅ Prevented password change with invalid current password");
  }

  // Attempt with weak password (longer than 8 chars but failing complexity)
  try {
    await caller.security.changePassword({
      currentPassword: "CurrentP@ss1",
      newPassword: "weakpassword",
    });
    throw new Error("Password change allowed weak new password!");
  } catch (err: any) {
    expect(err.message).toContain(
      "Yeni şifre güvenlik kriterlerini karşılamıyor",
    );
    console.log("✅ Prevented password change with weak password strength");
  }

  // Successful change
  await caller.security.changePassword({
    currentPassword: "CurrentP@ss1",
    newPassword: "NewSecureP@ss2",
  });
  console.log("✅ Changed password successfully with strength validation");

  // 3. 2FA Secret Generation & Activation
  console.log("\n🛡️  3. Testing 2FA Setup...");
  const mfaData = await caller.security.generate2faSecret();
  expect(mfaData.secret).toBeDefined();
  expect(mfaData.uri).toContain("otpauth://totp/");
  console.log("✅ Generated 2FA secret and Authenticator URI");

  // Try activating with incorrect code
  try {
    await caller.security.enable2fa({
      secret: mfaData.secret,
      code: "111111",
    });
    throw new Error("2FA activation accepted incorrect code!");
  } catch (err: any) {
    expect(err.message).toContain("Doğrulama kodu geçersiz");
    console.log("✅ Blocked activation with invalid verification code");
  }

  // Activate with correct code
  const correctCode = getTOTPCode(mfaData.secret);
  await caller.security.enable2fa({
    secret: mfaData.secret,
    code: correctCode,
  });
  console.log("✅ Successfully enabled 2FA with correct TOTP code");

  // 4. MFA Step-Up Login
  console.log("\n📱 4. Testing MFA Step-Up Login...");
  const loginRes2 = await appRouter
    .createCaller({
      db,
      user: null,
      activeMembership: null,
      req: null as any,
    })
    .auth.login({
      email: testEmail,
      password: "NewSecureP@ss2",
    });

  expect(loginRes2.requireMfa).toBe(true);
  expect(loginRes2.tempToken).toBeDefined();
  expect(loginRes2.token).toBeUndefined();
  console.log("✅ Credentials accepted, step-up MFA challenge token issued");

  // Try verifying code with wrong TOTP
  try {
    await appRouter
      .createCaller({
        db,
        user: null,
        activeMembership: null,
        req: null as any,
      })
      .auth.verifyMfa({
        tempToken: loginRes2.tempToken!,
        code: "000000",
      });
    throw new Error("MFA verification allowed wrong code!");
  } catch (err: any) {
    expect(err.message).toContain("Girdiğiniz doğrulama kodu hatalı");
    console.log("✅ Prevented access with incorrect MFA verification code");
  }

  // Verify with correct TOTP
  const correctCode2 = getTOTPCode(mfaData.secret);
  const mfaSuccessRes = await appRouter
    .createCaller({
      db,
      user: null,
      activeMembership: null,
      req: {
        headers: new Headers({
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          "x-forwarded-for": "10.0.0.8",
        }),
      } as any,
    })
    .auth.verifyMfa({
      tempToken: loginRes2.tempToken!,
      code: correctCode2,
    });

  expect(mfaSuccessRes.token).toBeDefined();
  console.log("✅ Completed MFA challenge, active session token issued");

  const mfaDecodedToken = verifyToken(mfaSuccessRes.token!);
  const mfaCtx = {
    db,
    user: mfaDecodedToken,
    activeMembership: null,
    req: null as any,
  };
  const mfaCaller = appRouter.createCaller(mfaCtx);

  // 5. Active Sessions & Revocation
  console.log("\n💻 5. Testing Active Sessions & Revocation...");
  const sessions = await mfaCaller.security.listActiveSessions();
  expect(sessions.length).toBeGreaterThan(0);
  console.log(`✅ Fetched active sessions. Count: ${sessions.length}`);

  // Find the non-current session to revoke (the first standard login session)
  const prevSession = sessions.find((s) => !s.isCurrent);
  if (prevSession) {
    await mfaCaller.security.revokeSession({ sessionId: prevSession.id });
    console.log(`✅ Successfully revoked previous session: ${prevSession.id}`);

    // Verify revoked session is blocked by tRPC createContext
    const { createContext } = await import("../src/server/trpc");
    const mockReq = {
      headers: new Headers({
        authorization: `Bearer ${loginRes1.token}`,
      }),
    };
    const resolvedCtx = await createContext({ req: mockReq as any });
    expect(resolvedCtx.user).toBeNull();
    console.log(
      "✅ Verified that revoked session throws UNAUTHORIZED automatically",
    );
  }

  // 6. Cleanup
  console.log("\n🗑️  Cleaning up test records...");
  await db.delete(userSessions).where(eq(userSessions.userId, testUser.id));
  await db.delete(users).where(eq(users.id, testUser.id));
  console.log("✅ Cleanup complete!");

  console.log(
    "\n🎉 ALL PHASE 4 HESAP GÜVENLİĞİ, MFA & OTURUM TESTLERİ GEÇTİ! 🏆",
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
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error("Assertion failed! Expected value to be defined.");
      }
    },
    toBeUndefined() {
      if (actual !== undefined && actual !== null) {
        throw new Error(
          `Assertion failed! Expected value to be undefined, got "${actual}"`,
        );
      }
    },
    toBeGreaterThan(num: number) {
      if (typeof actual !== "number" || actual <= num) {
        throw new Error(
          `Assertion failed! Expected ${actual} to be greater than ${num}`,
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
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Assertion failed! Expected null, got "${actual}"`);
      }
    },
  };
}

runTest().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
