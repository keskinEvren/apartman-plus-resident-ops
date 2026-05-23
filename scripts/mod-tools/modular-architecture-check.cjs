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

function collectCodeFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectCodeFiles(abs, out);
      continue;
    }
    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

function startsWithAny(target, prefixes) {
  return prefixes.some((p) => target.startsWith(p));
}

function main() {
  try {
    const contract = readJson(CONTRACT_PATH);
    const mod = contract.modularArchitecture || {};
    const frontPrefixes = mod.frontendPathPrefixes || [
      "src/app/",
      "src/components/",
      "src/lib/",
    ];
    const backPrefixes = mod.backendPathPrefixes || ["src/server/", "src/db/"];
    const ignorePrefixes = mod.ignorePathPrefixes || [];
    const frontMax = mod.frontendMaxLines || 180;
    const backMax = mod.backendMaxLines || 220;
    const hardMax = mod.globalHardMaxLines || 260;

    const failures = [];
    const files = collectCodeFiles(SRC);

    for (const abs of files) {
      const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
      if (startsWithAny(rel, ignorePrefixes)) continue;

      const lines = fs.readFileSync(abs, "utf8").split(/\r?\n/).length;
      if (lines > hardMax) {
        failures.push(
          `god-file hard limit exceeded (${lines}/${hardMax}): ${rel}`,
        );
        continue;
      }

      if (startsWithAny(rel, frontPrefixes) && lines > frontMax) {
        failures.push(
          `frontend modular limit exceeded (${lines}/${frontMax}): ${rel}`,
        );
      }

      if (startsWithAny(rel, backPrefixes) && lines > backMax) {
        failures.push(
          `backend modular limit exceeded (${lines}/${backMax}): ${rel}`,
        );
      }
    }

    if (failures.length > 0) {
      console.error("reason: modular architecture check failed");
      console.error(
        "fix: split oversized files into focused modules/components/services",
      );
      console.error(
        "next: refactor violating files and rerun npm run modular:check",
      );
      failures.forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("modular-architecture-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error(
      "fix:",
      "validate quality-contract modularArchitecture section",
    );
    console.error("next:", "run npm run modular:check");
    process.exit(1);
  }
}

main();
