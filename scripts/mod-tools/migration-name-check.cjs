#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const BANNED_WORDS = new Set([
  "tmp",
  "temp",
  "test",
  "wip",
  "fix",
  "stuff",
  "thing",
  "update",
  "change",
  "misc",
  "flashy",
  "abomination",
  "naive",
  "foo",
  "bar",
]);

function runGit(args) {
  return spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function collectAddedMigrations() {
  const commands = [
    [
      "diff",
      "--cached",
      "--name-status",
      "--diff-filter=A",
      "--",
      "drizzle/*.sql",
    ],
    ["diff", "--name-status", "--diff-filter=A", "--", "drizzle/*.sql"],
  ];

  const files = new Set();
  for (const cmd of commands) {
    const res = runGit(cmd);
    const lines = (res.stdout || "").split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const rel = parts[1] || parts[0];
      if (rel && rel.endsWith(".sql") && rel.startsWith("drizzle/")) {
        files.add(rel);
      }
    }
  }
  return Array.from(files);
}

function validateName(filePath) {
  const name = path.basename(filePath);
  const match = name.match(/^(\d{4})_([a-z0-9_]+)\.sql$/);
  if (!match) {
    return "must match pattern: 0001_descriptive_change_name.sql";
  }

  const slug = match[2];
  const parts = slug.split("_").filter(Boolean);
  if (parts.length < 2) {
    return "migration slug must contain at least 2 words";
  }
  if (slug.length < 12) {
    return "migration slug must be descriptive (at least 12 chars)";
  }
  if (parts.some((p) => BANNED_WORDS.has(p))) {
    return `migration slug contains banned low-signal word (${parts.find((p) => BANNED_WORDS.has(p))})`;
  }
  return null;
}

function main() {
  const targets = collectAddedMigrations();
  if (targets.length === 0) {
    console.log("migration-name-check passed (no added migration files)");
    return;
  }

  const failures = [];
  for (const rel of targets) {
    const issue = validateName(rel);
    if (issue) failures.push(`${rel}: ${issue}`);
  }

  if (failures.length > 0) {
    console.error("reason: migration naming contract failed");
    console.error(
      "fix: rename migration files to descriptive snake_case names",
    );
    console.error("next: rerun npm run migration:name:check");
    for (const line of failures) {
      console.error(`- ${line}`);
    }
    process.exit(1);
  }

  console.log("migration-name-check passed");
}

main();
