#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");
const CONTRACT_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "quality-contract.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(abs, out);
      continue;
    }
    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

function main() {
  try {
    const contract = readJson(CONTRACT_PATH);
    const maxLines = contract.performance.clientComponentMaxLines || 350;
    const forbidden = contract.performance.forbiddenClientImports || [];
    const failures = [];

    const files = collectFiles(SRC);
    for (const abs of files) {
      const content = fs.readFileSync(abs, "utf8");
      if (!/^\s*['"]use client['"]\s*;?/m.test(content)) continue;

      const lines = content.split(/\r?\n/).length;
      const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
      if (lines > maxLines) {
        failures.push(
          `client file exceeds line budget (${lines}/${maxLines}): ${rel}`,
        );
      }

      for (const dep of forbidden) {
        const importRe = new RegExp(
          `from\\s+['"]${dep}['"]|require\\(['"]${dep}['"]\\)`,
          "m",
        );
        if (importRe.test(content)) {
          failures.push(`forbidden client import (${dep}): ${rel}`);
        }
      }
    }

    if (failures.length > 0) {
      console.error("reason: performance contract check failed");
      console.error(
        "fix: reduce client component weight and remove forbidden server-side imports",
      );
      console.error("next: refactor files and rerun npm run perf:check");
      failures.forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("perf-contract-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error("fix:", "validate quality-contract performance section json");
    console.error("next:", "run npm run perf:check");
    process.exit(1);
  }
}

main();
