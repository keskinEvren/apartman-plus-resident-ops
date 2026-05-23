#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const GRAPH_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "docs-graph.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function syncAll(checkOnly = false) {
  const graph = readJson(GRAPH_PATH);
  const mismatches = [];

  for (const rule of graph.canonicalMirrorRules || []) {
    const srcPath = path.join(ROOT, rule.source);
    if (!fs.existsSync(srcPath)) {
      mismatches.push(`missing source: ${rule.source}`);
      continue;
    }
    const src = read(srcPath);

    for (const mirror of rule.mirrors || []) {
      const mPath = path.join(ROOT, mirror);
      if (!fs.existsSync(mPath)) {
        if (checkOnly) {
          mismatches.push(`missing mirror: ${mirror}`);
        } else {
          write(mPath, src);
        }
        continue;
      }

      const cur = read(mPath);
      if (cur !== src) {
        if (checkOnly) {
          mismatches.push(`out-of-sync mirror: ${mirror}`);
        } else {
          write(mPath, src);
        }
      }
    }
  }

  return mismatches;
}

function main() {
  try {
    const checkOnly = process.argv.includes("--check");
    const mismatches = syncAll(checkOnly);

    if (checkOnly && mismatches.length > 0) {
      console.error("reason: docs sync check failed");
      console.error("fix: run npm run docs:sync");
      console.error("next: rerun npm run docs:sync:check");
      mismatches.forEach((m) => console.error(`- ${m}`));
      process.exit(1);
    }

    if (!checkOnly) {
      console.log("docs-sync completed");
    } else {
      console.log("docs-sync-check passed");
    }
  } catch (error) {
    console.error("reason:", error.message);
    console.error(
      "fix:",
      "validate docs-graph canonicalMirrorRules and rerun sync",
    );
    console.error("next:", "run npm run docs:sync");
    process.exit(1);
  }
}

main();
