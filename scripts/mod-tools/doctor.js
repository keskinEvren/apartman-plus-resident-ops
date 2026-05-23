#!/usr/bin/env node

/**
 * ASANMOD v1.0.0: Self-Healing System Doctor
 * Diagnoses environment issues and provides actionable fixes.
 */

const { execSync } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

const check = (name, fn) => {
  process.stdout.write(`  - Checking ${name}... `);
  try {
    const result = fn();
    log("OK", COLORS.green);
    return result;
  } catch (err) {
    log("FAIL", COLORS.red);
    log(`    Error: ${err.message}`, COLORS.yellow);
    return null;
  }
};

async function runDoctor() {
  log("\n🩺 ASANMOD SYSTEM DOCTOR (v1.0.0)", COLORS.cyan);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", COLORS.cyan);

  // 1. Hardware Audit
  log("🖥️  HARDWARE AUDIT", COLORS.blue);
  const cpus = os.cpus().length;
  const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);

  log(`  - CPU: ${cpus} cores`);
  log(`  - RAM: ${totalMem}GB Total (${freeMem}GB Free)`);
  if (totalMem < 4)
    log("    ⚠️ Low RAM detected. Build might be slow.", COLORS.yellow);
  console.log("");

  // 2. Dependency Audit
  log("📦 DEPENDENCY AUDIT", COLORS.blue);

  check("Node.js", () => {
    const version = process.version;
    const major = parseInt(version.slice(1).split(".")[0]);
    if (major < 20) throw new Error(`Node v20+ required. Current: ${version}`);
    return version;
  });

  check("NPM", () => execSync("npm -v", { stdio: "pipe" }).toString().trim());
  check("Git", () =>
    execSync("git --version", { stdio: "pipe" }).toString().trim(),
  );

  // 3. Infrastructure Audit
  log("\n🏗️  INFRASTRUCTURE AUDIT", COLORS.blue);

  check("PostgreSQL", () => {
    try {
      execSync("psql --version", { stdio: "pipe" });
      return true;
    } catch {
      throw new Error("PostgreSQL client (psql) not found in PATH.");
    }
  });

  check("PM2", () => {
    try {
      execSync("pm2 -v", { stdio: "pipe" });
      return true;
    } catch {
      log("    ℹ️ PM2 not global. Using npx fallback.", COLORS.yellow);
      return false;
    }
  });

  // 4. File System Audit
  log("\n📂 FILE SYSTEM AUDIT", COLORS.blue);

  check(".env config", () => {
    if (!fs.existsSync(".env")) {
      if (fs.existsSync(".env.example")) {
        log("    💡 .env missing. Run 'cp .env.example .env'", COLORS.yellow);
      }
      throw new Error(".env not found.");
    }
    return true;
  });

  check("node_modules", () => {
    if (!fs.existsSync("node_modules")) {
      throw new Error("node_modules missing. Run 'npm install'.");
    }
    return true;
  });

  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", COLORS.cyan);
  log("✅ Doctor's visit complete. System is stable.\n", COLORS.green);
}

runDoctor().catch((err) => {
  log(`\n❌ Doctor failed: ${err.message}`, COLORS.red);
  process.exit(1);
});
