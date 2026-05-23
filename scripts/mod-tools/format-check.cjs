#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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
  const lines = run.stdout.trimEnd().split("\n").filter(Boolean);
  return lines
    .map((line) => {
      const parsed = line.length >= 4 ? line.slice(3).trim() : "";
      const fallback = line.replace(/^[ MARCUD?!]{1,3}\s+/, "").trim();
      return (parsed || fallback).replace(/\\/g, "/");
    })
    .filter(Boolean);
}

function main() {
  try {
    const contract = readJson(CONTRACT_PATH);
    const changedFiles = getChangedFiles();
    const targets = changedFiles.filter((file) =>
      /\.(ts|tsx|js|jsx|css|json|md|cjs|mjs)$/.test(file),
    );

    if (targets.length === 0) {
      console.log("format-check passed (no changed format-target files)");
      return;
    }

    const result = spawnSync(
      "npx",
      [
        "prettier",
        "--check",
        ...targets,
        "--ignore-path",
        ".gitignore",
        "--ignore-unknown",
      ],
      {
        cwd: ROOT,
        stdio: "pipe",
        encoding: "utf8",
        shell: false,
      },
    );

    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "").trim();
      console.error("reason: format check failed");
      console.error("fix: run `npx prettier --write` on reported files");
      console.error("next: rerun npm run format:check");
      if (detail) console.error(detail.split("\n").slice(0, 20).join("\n"));
      process.exit(1);
    }

    console.log("format-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error(
      "fix:",
      "install prettier and validate formatting contract config",
    );
    console.error("next:", "run npm run format:check");
    process.exit(1);
  }
}

main();
