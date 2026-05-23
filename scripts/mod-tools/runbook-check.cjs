#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const RUNBOOK_CFG = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "runbooks.json",
);
// Config-driven to keep docs-impact linkage deterministic when runbook inventory evolves.

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  try {
    const cfg = readJson(RUNBOOK_CFG);
    const failures = [];

    for (const item of cfg.requiredRunbooks || []) {
      const abs = path.join(ROOT, item.path);
      if (!fs.existsSync(abs)) {
        failures.push(`${item.path}: missing runbook`);
        continue;
      }

      const content = fs.readFileSync(abs, "utf8");
      for (const heading of item.requiredHeadings || []) {
        if (!content.includes(heading)) {
          failures.push(`${item.path}: missing heading -> ${heading}`);
        }
      }
    }

    if (failures.length > 0) {
      console.error("reason: runbook check failed");
      console.error(
        "fix: create/update required runbook files and headings from config/asanmod-universal/runbooks.json",
      );
      console.error("next: rerun npm run runbook:check");
      failures.forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("runbook-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error("fix:", "validate runbooks config and markdown files");
    console.error("next:", "run npm run runbook:check");
    process.exit(1);
  }
}

main();
