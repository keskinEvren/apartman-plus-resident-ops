#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const TEMPLATE_CFG = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "doc-templates.json",
);
// Template rules include operational docs (for example runbook index headings).

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  try {
    const cfg = readJson(TEMPLATE_CFG);
    const failures = [];

    for (const rule of cfg.rules || []) {
      const filePath = path.join(ROOT, rule.path);
      if (!fs.existsSync(filePath)) {
        failures.push(`${rule.path}: missing document`);
        continue;
      }

      const content = fs.readFileSync(filePath, "utf8");
      for (const heading of rule.requiredHeadings || []) {
        if (!content.includes(heading)) {
          failures.push(`${rule.path}: missing heading -> ${heading}`);
        }
      }
    }

    if (failures.length > 0) {
      console.error("reason: docs template check failed");
      console.error(
        "fix: align docs with required headings in config/asanmod-universal/doc-templates.json",
      );
      console.error(
        "next: update document sections and rerun docs:template:check",
      );
      failures.forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("docs-template-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error("fix:", "validate doc-templates config and markdown files");
    console.error("next:", "run npm run docs:template:check");
    process.exit(1);
  }
}

main();
