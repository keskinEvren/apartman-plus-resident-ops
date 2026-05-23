#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const CONTRACT_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "quality-contract.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  try {
    const contract = readJson(CONTRACT_PATH);
    const failures = [];

    for (const rel of contract.schema.requiredFiles || []) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs))
        failures.push(`missing required schema file: ${rel}`);
    }

    for (const rule of contract.schema.requiredPatterns || []) {
      const abs = path.join(ROOT, rule.file);
      if (!fs.existsSync(abs)) continue;
      const content = fs.readFileSync(abs, "utf8");
      if (!content.includes(rule.pattern)) {
        failures.push(`pattern missing in ${rule.file}: ${rule.description}`);
      }
    }

    if (failures.length > 0) {
      console.error("reason: schema contract check failed");
      console.error(
        "fix: satisfy schema file/pattern rules in config/asanmod-universal/quality-contract.json",
      );
      console.error(
        "next: update schema exports and rerun npm run schema:check",
      );
      failures.forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("schema-contract-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error("fix:", "validate quality-contract schema section json");
    console.error("next:", "run npm run schema:check");
    process.exit(1);
  }
}

main();
