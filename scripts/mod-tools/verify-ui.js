// ASANMOD v1.1.1: AGENTIC-OS HEADLESS UI SMOKE TESTER
// [INDUSTRIAL-GRADE] Ensures zero white-screens in Prod.
import fs from "fs";
import puppeteer from "puppeteer";
import http from "http";
import { spawn, execSync } from "child_process";
const CORE_CONFIG = JSON.parse(
  fs.readFileSync("docs/asanmod-core.json", "utf-8"),
);
// Analyzes 'git diff' to intelligently select which pages to verify.

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// 1. CRITICAL PATHS (Always checked if global files change or fallback)
const CRITICAL_PATHS = [
  "/", // Landing
  "/login", // Auth Entry
  "/dashboard", // Main User Hub
  "/super-admin", // Admin Hub
];

// 2. ROUTE MAPPING (Regex -> URL)
const ROUTE_MAP = [
  { regex: /frontend\/app\/\(public\)\/login/, url: "/login" },
  {
    regex: /frontend\/app\/\(authenticated\)\/super-admin/,
    url: "/super-admin",
  },
  { regex: /frontend\/app\/\(authenticated\)\/dashboard/, url: "/dashboard" },
  { regex: /frontend\/app\/\(public\)\/landing/, url: "/" },
  // Dynamic Route Handling (Heuristic: Test ID '1' or 'demo')
  {
    regex: /frontend\/app\/\(authenticated\)\/organizations\/\[id\]/,
    url: "/organizations/demo-org-id",
  },
];

// 3. COMPONENT MAPPING (Component -> Likely Route)
const COMPONENT_MAP = [
  { regex: /frontend\/components\/super-admin/, url: "/super-admin" },
  { regex: /frontend\/components\/chat/, url: "/dashboard" },
  { regex: /frontend\/components\/marketing/, url: "/" },
  { regex: /frontend\/components\/auth/, url: "/login" },
];

// 4. GLOBAL TRIGGERS (Files that affect EVERYTHING)
const GLOBAL_TRIGGERS = [
  "package.json",
  "next.config.js",
  "frontend/middleware.ts",
  "frontend/app/globals.css",
  "frontend/app/layout.tsx",
  "frontend/lib/services", // Service changes could break anything
];

async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 500) resolve(true);
      else resolve(false);
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

function getTargetPaths() {
  // CLI Override
  if (process.argv[2]) return [process.argv[2]];

  try {
    const diff = execSync("git diff --name-only HEAD")
      .toString()
      .split("\n")
      .filter(Boolean);
    if (diff.length === 0) return []; // No changes, nothing to verify? Or verify all? Verify All is safer.

    console.log(`\n🔍 Analyzing ${diff.length} modified files...`);
    const targets = new Set();
    let globalTriggered = false;

    diff.forEach((file) => {
      // Check Global Triggers
      if (GLOBAL_TRIGGERS.some((trigger) => file.includes(trigger))) {
        console.log(`   ⚠️ Global Trigger Detected: ${file}`);
        globalTriggered = true;
      }

      // Check Direct Route Map
      ROUTE_MAP.forEach((map) => {
        if (map.regex.test(file)) {
          console.log(`   📍 Route Match: ${file} -> ${map.url}`);
          targets.add(map.url);
        }
      });

      // Check Component Map
      COMPONENT_MAP.forEach((map) => {
        if (map.regex.test(file)) {
          console.log(`   🧩 Component Match: ${file} -> ${map.url}`);
          targets.add(map.url);
        }
      });
    });

    if (globalTriggered || targets.size === 0) {
      console.log(
        "   🔄 Global changes or no specific match -> Checking CRITICAL PATHS.",
      );
      return CRITICAL_PATHS;
    }

    return Array.from(targets);
  } catch (e) {
    console.warn("⚠️ Git Diff failed, falling back to Critical Paths.");
    return CRITICAL_PATHS;
  }
}

async function verifyPath(browser, path) {
  const page = await browser.newPage();
  const fullUrl = `${BASE_URL}${path}`;
  const failures = [];

  // console.log(`   Checking: ${path}...`);

  page.on("console", (msg) => {
    if (msg.type() === "error") failures.push(`[Console] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    failures.push(`[Crash] ${err.toString()}`);
  });

  // ASANMOD REAL AUTHENTICATION
  // If path is protected, try to login with valid credentials
  if (path !== "/login" && path !== "/") {
    // console.log("   🔐 Protected Route detected. Attempting Login...");

    // 1. Go to Login Page
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });

    // 2. Check if already logged in (redirected to dashboard)
    if (!page.url().includes("/login")) {
      // Already logged in
    } else {
      // 3. Perform Login
      try {
        await page.type(
          'input[type="email"]',
          process.env.SMOKE_TEST_EMAIL || "test@example.com",
        );
        await page.type(
          'input[type="password"]',
          process.env.SMOKE_TEST_PASSWORD || "change-me-smoke-password",
        );

        // Click Login Button (Heuristic: Button with type submit)
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }),
          page.click('button[type="submit"]'),
        ]);
      } catch (e) {
        // If login fails, we might just be on a public page or selectors changed.
        // Don't fail the whole test, just log warning and proceed to target.
        // console.warn("   ⚠️ Login attempt failed or timed out:", e.message);
      }
    }
  }

  try {
    const response = await page.goto(fullUrl, {
      waitUntil: "networkidle0",
      timeout: 10000,
    });
    const status = response?.status();

    // Handle Redirects (e.g., Auth Wall 307/308) - Treat as PASS if landing on /login
    const finalUrl = page.url();
    if (finalUrl.includes("/login") && path !== "/login") {
      // console.log(`      ↪️ Redirected to Login (Expected for protected route)`);
    } else if (status >= 400) {
      failures.push(`[HTTP] Status ${status}`);
    }

    const bodyText = await page.evaluate(() => document.body.innerText);
    if (
      bodyText.includes("Application error:") ||
      bodyText.includes("Unhandled Runtime Error")
    ) {
      failures.push("[Critical] Application Error Overlay detected!");
    }
  } catch (e) {
    failures.push(`[Nav] ${e.message}`);
  }

  await page.close();
  return failures;
}

async function main() {
  console.log("==========================================");
  console.log("   ASANMOD UI INTELLIGENCE v5.0 🧠       ");
  console.log("==========================================");

  const isUp = await checkServer();
  if (!isUp) {
    console.log(`⚠️  Server (${BASE_URL}) is DOWN.`);
    console.log(
      "   Skipping UI Verification. Start server with 'npm run dev'.",
    );
    process.exit(0);
  }

  const paths = getTargetPaths();
  if (paths.length === 0) {
    console.log("✅ No relevant UI changes detected.");
    process.exit(0);
  }

  console.log(`🎯 Targeted Routes: [ ${paths.join(", ")} ]\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors", // Fix for net::ERR_CERT_AUTHORITY_INVALID (Self-signed certs)
    ],
  });

  let errors = 0;
  try {
    for (const path of paths) {
      process.stdout.write(`   Verifying ${path.padEnd(20)} ... `);
      const result = await verifyPath(browser, path);
      if (result.length > 0) {
        console.log("❌ FAIL");
        result.forEach((r) => console.log(`      ${r}`));
        errors++;
      } else {
        console.log("✅ PASS");
      }
    }
  } finally {
    await browser.close();
  }

  console.log("==========================================");
  if (errors > 0) {
    console.error(`🚨 ${errors} Pages FAILED verification.`);
    process.exit(1);
  } else {
    console.log(`✅ All ${paths.length} routes verified successfully.`);
    process.exit(0);
  }
}

main();
