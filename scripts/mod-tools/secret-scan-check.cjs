#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const MAX_RESULTS = 30;

const KEYWORD_ASSIGNMENT =
  /\b(?:api[_-]?key|token|secret|password|passwd|pgpassword|access[_-]?key|auth[_-]?key)\b\s*[:=]\s*["'`][^"'`\n]{8,}["'`]/i;
const GOOGLE_API_KEY = /\bAIza[0-9A-Za-z\-_]{35}\b/;
const POSTGRES_CRED_URL = /\bpostgres(?:ql)?:\/\/[^:\s\/]+:[^@\s]+@/i;
const PRIVATE_KEY_BLOCK = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;

const ALLOW_VALUE_HINTS = [
  "change-me",
  "your-",
  "example",
  "placeholder",
  "dummy",
  "sample",
  "test",
  "local",
  "localhost",
  "dbpassword",
];

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "coverage",
  "dist",
  "build",
  "out",
]);

function runGit(args) {
  return spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function collectCandidateFiles() {
  const tracked = runGit(["ls-files", "-z"]);
  const staged = runGit([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
    "-z",
  ]);

  const files = new Set();
  const addFromOutput = (text) => {
    for (const rel of (text || "").split("\0")) {
      if (!rel) continue;
      if (!isScannablePath(rel)) continue;
      files.add(rel);
    }
  };

  addFromOutput(tracked.stdout);
  addFromOutput(staged.stdout);
  return Array.from(files);
}

function isScannablePath(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  if (!normalized || normalized.endsWith("/")) return false;
  if (normalized.startsWith("reports/verification/")) return false;
  if (normalized.startsWith("reports/healing/")) return false;
  if (normalized.startsWith(".asanmod/")) return false;
  if (normalized === ".env.example") return true;

  const parts = normalized.split("/");
  for (const part of parts.slice(0, -1)) {
    if (EXCLUDED_DIRS.has(part)) return false;
  }
  return true;
}

function isLikelyBinary(content) {
  return content.includes("\u0000");
}

function hasPlaceholderValue(text) {
  const lower = text.toLowerCase();
  return ALLOW_VALUE_HINTS.some((hint) => lower.includes(hint));
}

function hasDynamicValue(text) {
  return (
    text.includes("${") ||
    text.includes("process.env") ||
    text.includes("encodeURIComponent(") ||
    text.includes("db.password") ||
    text.includes("dbPass")
  );
}

function findIssues(relPath, content) {
  const issues = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || /^\s*#/.test(line)) continue;

    if (GOOGLE_API_KEY.test(line)) {
      issues.push({
        file: relPath,
        line: i + 1,
        reason: "google_api_key_pattern",
      });
      continue;
    }
    if (PRIVATE_KEY_BLOCK.test(line)) {
      issues.push({
        file: relPath,
        line: i + 1,
        reason: "private_key_material",
      });
      continue;
    }
    if (
      POSTGRES_CRED_URL.test(line) &&
      !hasPlaceholderValue(line) &&
      !hasDynamicValue(line)
    ) {
      issues.push({
        file: relPath,
        line: i + 1,
        reason: "credentialed_database_url",
      });
      continue;
    }
    if (
      KEYWORD_ASSIGNMENT.test(line) &&
      !hasPlaceholderValue(line) &&
      !hasDynamicValue(line)
    ) {
      issues.push({
        file: relPath,
        line: i + 1,
        reason: "hardcoded_secret_assignment",
      });
    }
  }
  return issues;
}

function main() {
  const files = collectCandidateFiles();
  const findings = [];

  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;

    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (isLikelyBinary(content)) continue;

    const issues = findIssues(rel, content);
    findings.push(...issues);
    if (findings.length >= MAX_RESULTS) break;
  }

  if (findings.length > 0) {
    console.error(
      "reason: secret scan detected high-confidence secret patterns",
    );
    console.error(
      "fix: remove hardcoded secrets, move values to .env (untracked), keep placeholders in tracked files",
    );
    console.error(
      "next: rotate exposed credentials, rerun npm run secret:scan:check",
    );
    for (const item of findings) {
      console.error(`- ${item.file}:${item.line} [${item.reason}]`);
    }
    process.exit(1);
  }

  console.log("secret-scan-check passed");
}

main();
