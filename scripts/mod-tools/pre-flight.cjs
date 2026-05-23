#!/usr/bin/env node
/**
 * ASANMOD v1.1.1: PRE-FLIGHT CHECK
 * Validates system state before production deployments.
 */
const config = require("./deploy.config.cjs");
const { execSync } = require("child_process");
const fs = require("fs");
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(msg, color = colors.reset) {
  console.log(`${color}[PRE-FLIGHT] ${msg}${colors.reset}`);
}

function die(msg) {
  console.error(`${colors.red}[FATAL] ${msg}${colors.reset}`);
  process.exit(1);
}

// target_env argümanı: dev veya prod
const targetEnv = process.argv[2] || "dev";
const rules = config.environments[targetEnv];

if (!rules) die(`Invalid environment: ${targetEnv}`);

log(`Starting checks for environment: ${targetEnv.toUpperCase()}`, colors.blue);

try {
  // 1. GIT BRANCH KONTROLÜ
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();
  log(`Current Branch: ${currentBranch}`);

  let branchValues = rules.allowed_branches;
  let isAllowed = false;

  if (branchValues.includes("*")) {
    isAllowed = true;
  } else {
    // Wildcard desteği (release/* gibi)
    isAllowed = branchValues.some((pattern) => {
      if (pattern.endsWith("*")) {
        return currentBranch.startsWith(pattern.slice(0, -1));
      }
      return pattern === currentBranch;
    });
  }

  if (!isAllowed) {
    die(
      `Branch '${currentBranch}' is NOT allowed for ${targetEnv}. Allowed: ${branchValues.join(", ")}`,
    );
  }
  log(`Branch Check: OK`, colors.green);

  // 2. GIT DIRTY CHECK (Sadece Prod için katı)
  // NOT: version.json deploy script tarafından güncellenir, ignore edilmeli
  if (targetEnv === "prod") {
    const status = execSync("git status --porcelain").toString();
    // version.json değişikliklerini filtrele (deploy script tarafından güncellenir)
    const filteredStatus = status
      .split("\n")
      .filter((line) => !line.includes("frontend/public/version.json"))
      .join("\n");
    if (filteredStatus.trim().length > 0) {
      die(
        `Working directory is DIRTY. Commit changes before deploying to PROD.\n${filteredStatus}`,
      );
    }
    log(`Git Cleanliness: OK`, colors.green);
  }

  // 3. ENV FILE KONTROLÜ
  const envPath = `${config.project.root}/${rules.env_file}`;
  if (!fs.existsSync(envPath)) {
    die(`Missing environment file: ${rules.env_file}`);
  }

  // 3.1 NATIVE HOSTNAME GUARDRAIL (Anti-Docker Trap)
  // Ensures we don't accidentally deploy Docker service names to Native PM2
  const envContent = fs.readFileSync(envPath, "utf-8");
  const forbiddenHostnames = ["postgres", "redis", "minio", "milvus"];

  // Filter out comments and check lines
  const activeLines = envContent
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"));

  for (const line of activeLines) {
    for (const forbidden of forbiddenHostnames) {
      // Regex triggers:
      // 1. URL format: //redis: or //postgres:
      // 2. Host var: _HOST=redis
      const urlPattern = new RegExp(`//${forbidden}:`);
      const hostPattern = new RegExp(`_HOST=${forbidden}\\s*$`);
      const authPattern = new RegExp(`@${forbidden}:`); // postgres://user:pass@postgres:5432

      if (
        urlPattern.test(line) ||
        hostPattern.test(line) ||
        authPattern.test(line)
      ) {
        die(
          `FORBIDDEN DOCKER HOSTNAME DETECTED in ${rules.env_file}:\n   >>> ${line.trim()}\n   [CRITICAL] Native PM2 requires '127.0.0.1'. Docker hostnames like '${forbidden}' will fail.`,
        );
      }
    }
  }
  log(`Env Hygiene (No Docker Hostnames): OK`, colors.green);

  log(`Env File (${rules.env_file}): OK`, colors.green);

  // 4. HANDOVER STATE KONTROLÜ (v5.0)
  const statePath = `${config.project.root}/.state/active-task.json`;
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    log(`Active Task ID: ${state.taskId} (${state.status})`, colors.blue);
    if (state.status === "handover-pending" && !process.env.ACK_HANDOVER) {
      log(
        "⚠️ HANDOVER PENDING. Please acknowledge with ACK_HANDOVER=1",
        colors.yellow,
      );
    }
  }

  // 5. TESTLER (Eğer zorunluysa)

  log(`✅ ALL PRE-FLIGHT CHECKS PASSED`, colors.green);
  process.exit(0);
} catch (e) {
  die(`Unexpected Error: ${e.message}`);
}
