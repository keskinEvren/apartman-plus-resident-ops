#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const VERSION_FILE = path.join(ROOT, "VERSION");

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".nyc_output",
]);
const TARGET_EXT = new Set([
  ".md",
  ".json",
  ".js",
  ".cjs",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
  ".txt",
  ".sh",
  ".mdc",
  ".example",
  ".conf",
  "",
]);

function ensureVersionFile() {
  const version = "1.0.0";
  fs.writeFileSync(VERSION_FILE, `${version}\n`);
  return version;
}

function getAllFiles(dir) {
  const out = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (item.isDirectory()) {
      if (IGNORED_DIRS.has(item.name)) continue;
      out.push(...getAllFiles(full));
      continue;
    }
    const ext = path.extname(item.name);
    if (!TARGET_EXT.has(ext)) continue;
    out.push(rel);
  }
  return out;
}

function patchContent(content, version) {
  const rules = [
    [/\b3\.2\.0\b/g, version],
    [/\b3\.1\.0\b/g, version],
    [/\b3\.0\.0\b/g, version],
    [/\b2\.1\.0-alpha\b/g, version],
    [/\bv3\.2\.0\b/g, `v${version}`],
    [/\bv3\.1\.0\b/g, `v${version}`],
    [/\bv3\.0\.0-alpha\b/g, `v${version}`],
    [/\bv3\.0\.0\b/g, `v${version}`],
    [/ASANMOD v3\.[0-9]+\.[0-9]+/g, `ASANMOD v${version}`],
    [
      /ASANMOD Enterprise Template v3\.[0-9]+\.[0-9]+/g,
      `ASANMOD Enterprise Template v${version}`,
    ],
    [
      /ASANMOD Enterprise Template v3\.2\.0/g,
      `ASANMOD Enterprise Template v${version}`,
    ],
    [/Template Version:\s*2\.1\.0-alpha/g, `Template Version: ${version}`],
    [/VERSION:\s*v3\.[0-9]+\.[0-9]+/g, `VERSION: v${version}`],
  ];

  let next = content;
  for (const [re, rep] of rules) {
    next = next.replace(re, rep);
  }
  return next;
}

function main() {
  const version = ensureVersionFile();

  const files = getAllFiles(ROOT);
  let changed = 0;

  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    const next = patchContent(content, version);
    if (next !== content) {
      fs.writeFileSync(abs, next);
      changed++;
    }
  }

  console.log(
    `version-sync completed: version=${version}, files_changed=${changed}`,
  );
}

main();
