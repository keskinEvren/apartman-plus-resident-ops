#!/usr/bin/env node
/**
 * ASANMOD First Run Check
 *
 * Runs universal non-interactive bootstrap on first install.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.join(__dirname, "..");
const FLAG_FILE = path.join(PROJECT_ROOT, ".asanmod", "wizard-completed");

function main() {
  if (fs.existsSync(FLAG_FILE)) {
    return;
  }

  if (process.env.CI || process.env.SKIP_WIZARD) {
    console.log("⏭️  Skipping first-run bootstrap (CI environment detected)");
    return;
  }

  console.log("\n🎉 Welcome to ASANMOD Enterprise Template!\n");
  console.log("📦 First run detected. Running universal bootstrap...\n");

  try {
    execSync("npm run agent:init -- --auto", {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    });

    const flagDir = path.dirname(FLAG_FILE);
    if (!fs.existsSync(flagDir)) {
      fs.mkdirSync(flagDir, { recursive: true });
    }

    const packageJson = require(path.join(PROJECT_ROOT, "package.json"));
    fs.writeFileSync(
      FLAG_FILE,
      JSON.stringify(
        {
          completed: new Date().toISOString(),
          version: packageJson.version,
          bootstrap: "agent-init-auto",
        },
        null,
        2,
      ),
    );

    console.log("\n✅ Universal bootstrap complete!\n");
    console.log(
      "Run `npm run mode:status` and `npm run verify -- --dry-run`\n",
    );
  } catch (error) {
    console.error("\n❌ Bootstrap failed:", error.message);
    console.error("\nreason: first-run bootstrap could not complete");
    console.error(
      "fix: run `npm run agent:init -- --auto` manually and inspect logs",
    );
    console.error(
      "next: rerun npm install after fixing environment prerequisites",
    );
    process.exit(1);
  }
}

main();
