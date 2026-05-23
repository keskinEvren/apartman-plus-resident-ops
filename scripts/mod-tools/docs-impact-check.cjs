#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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

function getChangedFiles() {
  const run = spawnSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (run.status !== 0) {
    throw new Error(
      (run.stderr || "").trim() || "git status --porcelain failed",
    );
  }
  const out = run.stdout.trimEnd();
  if (!out) return new Set();
  const lines = out.split("\n").filter(Boolean);
  const parsed = lines.map((line) => {
    const parsed = line.length >= 4 ? line.slice(3).trim() : "";
    const fallback = line.replace(/^[ MARCUD?!]{1,3}\s+/, "").trim();
    return (parsed || fallback).replace(/\\/g, "/");
  });
  const files = [];
  for (const rel of parsed) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      const stack = [abs];
      while (stack.length > 0) {
        const dir = stack.pop();
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const nextAbs = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            stack.push(nextAbs);
            continue;
          }
          files.push(path.relative(ROOT, nextAbs).replace(/\\/g, "/"));
        }
      }
      continue;
    }
    files.push(rel);
  }
  return new Set(files);
}

function main() {
  try {
    const graph = readJson(GRAPH_PATH);
    const changed = getChangedFiles();
    const failures = [];

    for (const rule of graph.impactRules || []) {
      if (!changed.has(rule.whenChanged)) continue;
      for (const dep of rule.mustAlsoChange || []) {
        if (!changed.has(dep)) {
          failures.push(
            `${rule.whenChanged} changed but related file not updated: ${dep}`,
          );
        }
      }
    }

    if (failures.length > 0) {
      console.error("reason: docs impact check failed");
      console.error(
        "fix: update related files defined in config/asanmod-universal/docs-graph.json",
      );
      console.error(
        "next: edit missing related docs/files and rerun docs:impact:check",
      );
      failures.forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("docs-impact-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error("fix:", "validate docs-graph config and git status parsing");
    console.error("next:", "run npm run docs:impact:check");
    process.exit(1);
  }
}

main();
