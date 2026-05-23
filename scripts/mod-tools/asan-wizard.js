#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync, exec } = require("child_process");
const readline = require("readline");
const net = require("net");
const { synchronizePortsAndEnv } = require("./port-env-sync.cjs");

/**
 * 🧙‍♂️ ASANMOD v1.0.0: AGENTIC WIZARD
 * "The Vibe Coder's Best Friend"
 *
 * Features:
 * - Auto-Environment Detection
 * - Smart Port Selection
 * - Database Connectivity Probing
 * - Automated Configuration
 * - Self-Verification
 */

const PROJECT_ROOT = process.cwd();
const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m",
};

// --- UTILS ---

function log(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function header(title) {
  console.log("\n" + "═".repeat(60));
  log(`  ${title}`, COLORS.cyan + COLORS.bold);
  console.log("═".repeat(60));
}

function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question, defaultValue = "") {
  const prompt = defaultValue
    ? `${question} [${defaultValue}]: `
    : `${question} `;
  return new Promise((resolve) => {
    rl.question(`${COLORS.yellow}${prompt}${COLORS.reset}`, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// --- DETECTION LOGIC ---

async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort, exclude = []) {
  let port = startPort;
  while (exclude.includes(port) || !(await checkPort(port))) {
    port++;
    if (port > startPort + 100) throw new Error("No available ports found!");
  }
  return port;
}

function detectOS() {
  const platform = process.platform;
  if (platform === "darwin") return "macOS";
  if (platform === "win32") return "Windows";
  if (platform === "linux") {
    // Check if WSL
    try {
      const release = execSync("uname -r").toString();
      if (release.includes("microsoft")) return "WSL";
    } catch {}
    return "Linux";
  }
  return "Unknown";
}

function checkPostgresConnection(connectionString) {
  // Try using psql if available
  try {
    execSync(`psql "${connectionString}" -c "SELECT 1"`, { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

// --- CORE WIZARD ---

async function runWizard() {
  const rl = createPrompt();

  header("🤖 ASANMOD AGENTIC WIZARD v1.0.0");
  log("Initializing autonomous setup protocol...", COLORS.magenta);

  // 1. Environment Analysis
  header("🔍 ENVIRONMENT SCAN");

  const envInfo = {
    os: detectOS(),
    node: process.version,
    npm: execSync("npm -v").toString().trim(),
    git: "Not Found",
  };

  try {
    envInfo.git = execSync("git --version").toString().trim();
  } catch {}

  log(`  OS:   ${envInfo.os}`, COLORS.cyan);
  log(`  Node: ${envInfo.node}`, COLORS.cyan);
  log(`  NPM:  ${envInfo.npm}`, COLORS.cyan);
  log(`  Git:  ${envInfo.git}`, COLORS.cyan);

  // 2. Port Negotiation
  const devPort = await findAvailablePort(3000);
  const prodPort = await findAvailablePort(3002, [devPort]);

  log(
    `\n  ✅ Negotiated Ports: DEV=${devPort}, PROD=${prodPort}`,
    COLORS.green,
  );

  // 3. User Interaction (The "Conversation")
  header("🗣️  INITIATING VIBE CODER DIALOGUE");
  log(
    'I need a few details to configure the "Iron Curtain" architecture.\n',
    COLORS.magenta,
  );

  const projectName = await ask(rl, "Project Name", "My Agent App");
  const projectDesc = await ask(
    rl,
    "Description",
    "An AI-native enterprise application",
  );

  // Module Smart Selection
  log(
    "\n  Available Modules: [1]auth, [2]users, [3]admin, [4]payments, [5]files",
    COLORS.cyan,
  );
  const moduleInput = await ask(
    rl,
    "Enable Modules (comma separated numbers)",
    "1,2,3",
  );
  const moduleMap = {
    1: "auth",
    2: "users",
    3: "admin",
    4: "payments",
    5: "files",
  };
  const modules = moduleInput
    .split(",")
    .map((n) => moduleMap[n.trim()])
    .filter(Boolean);

  // Database Configuration
  header("🗄️  DATABASE CONFIGURATION");
  const dbName = projectName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_db";
  let dbUrl = `postgresql://postgres:postgres@localhost:5432/${dbName}`;

  log(`  Proposed DB Name: ${dbName}`, COLORS.cyan);

  // Try default connection
  const defaultBaseUrl =
    "postgresql://postgres:postgres@localhost:5432/postgres";
  let dbAccessible = checkPostgresConnection(defaultBaseUrl);

  if (dbAccessible) {
    log(
      "  ✅ Detected accessible PostgreSQL at localhost:5432 (user: postgres)",
      COLORS.green,
    );
  } else {
    log(
      "  ⚠️  Could not connect to PostgreSQL with default credentials.",
      COLORS.yellow,
    );
    const dbUser = await ask(rl, "DB User", "postgres");
    const dbPass = await ask(rl, "DB Password", "postgres");
    const dbHost = await ask(rl, "DB Host", "localhost");
    const dbPort = await ask(rl, "DB Port", "5432");
    const encodedPass = encodeURIComponent(dbPass);
    dbUrl = `postgresql://${dbUser}:${encodedPass}@${dbHost}:${dbPort}/${dbName}`;

    // Test again
    if (
      !checkPostgresConnection(
        `postgresql://${dbUser}:${encodedPass}@${dbHost}:${dbPort}/postgres`,
      )
    ) {
      log(
        "  ❌ Still cannot connect. Proceeding anyway (you may need to fix .env later).",
        COLORS.red,
      );
    }
  }

  // 4. Execution
  header("⚙️  EXECUTING CONFIGURATION");

  // 4.1 Update asanmod-core.json + .env via shared sync module
  const syncSummary = await synchronizePortsAndEnv({
    projectName,
    projectDescription: projectDesc,
    preferredPorts: { dev: devPort, prod: prodPort },
  });
  log(
    `  ✅ Updated ${syncSummary.corePath} and ${syncSummary.envPath}`,
    COLORS.green,
  );

  // 4.2 Purge Placeholders
  purgePlaceholders(projectName, projectDesc, modules);

  // 4.3 Create Admin & DB
  log("\n  🔄 Bootstrapping Database...", COLORS.cyan);
  try {
    // Create DB if not exists (using psql)
    // Extract connection details from dbUrl to connect to 'postgres' db
    const baseUrl = dbUrl.substring(0, dbUrl.lastIndexOf("/")) + "/postgres";
    try {
      execSync(`psql "${baseUrl}" -c "CREATE DATABASE ${dbName};"`, {
        stdio: "ignore",
      });
      log("    - Database created.", COLORS.green);
    } catch (e) {
      // Database might already exist, which is fine
      log("    - Database check complete.", COLORS.green);
    }
  } catch (e) {
    log("    ⚠️ Failed to bootstrap DB automatically.", COLORS.yellow);
  }

  // 4.4 Lock File
  const lockDir = path.join(PROJECT_ROOT, ".asanmod");
  if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir, { recursive: true });
  fs.writeFileSync(
    path.join(lockDir, "installed.lock"),
    JSON.stringify(
      {
        projectName,
        installedAt: new Date().toISOString(),
        env: envInfo,
        ports: { dev: devPort, prod: prodPort },
      },
      null,
      2,
    ),
  );

  // 5. Final Report
  header("🚀 SYSTEM READY");
  log(`  Project: ${projectName}`, COLORS.bold);
  log(`  Status:  INITIALIZED`, COLORS.green);
  log(`  Command: npm run dev (starts on port ${devPort})`, COLORS.cyan);
  log(
    `\n  "I am ready to code, User. The Iron Curtain is active."`,
    COLORS.magenta,
  );

  rl.close();

  // Update manifest
  updateManifest();
}

function purgePlaceholders(projectName, projectDesc, modules) {
  const targets = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "README.md",
    "package.json",
  ];

  targets.forEach((target) => {
    const filePath = path.join(PROJECT_ROOT, target);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, "utf8");
      content = content.replace(/\[PROJECT_NAME\]/g, projectName);
      content = content.replace(/\[PROJECT_DESCRIPTION\]/g, projectDesc);
      fs.writeFileSync(filePath, content);
      log(`  ✅ Purged placeholders in ${target}`, COLORS.green);
    }
  });
}

function updateManifest() {
  const manifestPath = path.join(PROJECT_ROOT, ".asanmod/manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      manifest.flags = manifest.flags || {};
      manifest.flags.wizard_completed = true;
      manifest.state = "active";
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    } catch (e) {}
  }
}

if (require.main === module) {
  runWizard().catch((err) => {
    console.error(
      COLORS.red + "\n❌ FATAL ERROR IN WIZARD:\n" + err.message + COLORS.reset,
    );
    process.exit(1);
  });
}

module.exports = { runWizard };
