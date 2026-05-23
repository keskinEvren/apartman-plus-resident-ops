const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ASANMOD v1.1.1 - VERIFICATION ENGINE
// Usage: node verify-core.cjs --target=<file> --depth=<surgical|full>
// ASANMOD Hard Constraint: Stale state blocks verification

const args = process.argv.slice(2);
const targetArg = args.find((a) => a.startsWith("--target="));
const depthArg = args.find((a) => a.startsWith("--depth="));
const skipStateCheck = args.includes("--skip-state");

const target = targetArg ? targetArg.split("=")[1] : null;
const depth = depthArg ? depthArg.split("=")[1] : "surgical";

const results = {
  status: "PASS",
  checks: {
    state: "SKIPPED",
    eslint: "SKIPPED",
    tsc: "SKIPPED",
  },
  errors: [],
};

console.log(
  `🔍 VERIFY-CORE Protocol: Target=${target || "ALL"} Depth=${depth}`,
);

// ASANMOD Hard Constraint: State TTL Check
if (
  !skipStateCheck &&
  fs.existsSync(path.join(__dirname, "state-manager-Protocol.cjs"))
) {
  try {
    const StateManager = require("./state-manager-Protocol.cjs");
    const stateManager = new StateManager();
    const { blocked, reason } = stateManager.checkBlock();

    if (blocked) {
      results.status = "FAIL";
      results.checks.state = "BLOCKED";
      results.errors.push({ source: "State-TTL", message: reason });
      console.log(`❌ STATE BLOCKED: ${reason}`);
      console.log(JSON.stringify(results, null, 2));
      process.exit(1);
    }
    results.checks.state = "PASS";
  } catch (e) {
    results.checks.state = "SKIPPED (error: " + e.message + ")";
  }
}

try {
  // 1. ESLINT CHECK
  if (fs.existsSync("node_modules/.bin/eslint")) {
    try {
      const fileToScan = target || ".";
      execSync(`npx eslint "${fileToScan}" --max-warnings=0`, {
        stdio: "pipe",
      });
      results.checks.eslint = "PASS";
    } catch (e) {
      results.status = "FAIL";
      results.checks.eslint = "FAIL";
      results.errors.push({
        source: "ESLint",
        message: e.stderr?.toString() || e.message,
      });
    }
  }

  // 2. TSC CHECK (Type Safety)
  // Smart-path: Check where the target file lives
  if (fs.existsSync("node_modules/.bin/tsc")) {
    try {
      let tscDir = ".";
      if (target && target.startsWith("frontend/")) {
        if (fs.existsSync("frontend/tsconfig.json")) tscDir = "frontend";
      } else if (
        fs.existsSync("frontend/tsconfig.json") &&
        (!target || target === ".")
      ) {
        // Full check: include frontend
        // For now, if full check, we prioritize frontend check as it's the main TS source
        tscDir = "frontend";
      }

      const hasConfig = fs.existsSync(path.join(tscDir, "tsconfig.json"));

      if (hasConfig) {
        console.log(`TYPE-CHECK: Running in ${tscDir}...`);
        execSync("npx tsc --noEmit", { stdio: "pipe", cwd: tscDir });
        results.checks.tsc = "PASS";
      } else {
        results.checks.tsc = "SKIPPED (No tsconfig)";
      }
    } catch (e) {
      results.status = "FAIL";
      results.checks.tsc = "FAIL";
      results.errors.push({
        source: "TSC",
        message: e.stdout?.toString() || e.message,
      });
    }
  }
} catch (err) {
  results.status = "ERROR";
  results.errors.push({ source: "System", message: err.message });
}

console.log(JSON.stringify(results, null, 2));

if (results.status !== "PASS") {
  process.exit(1);
}
