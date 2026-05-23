#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const LOCK_CFG = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "version-lock.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readVersion() {
  const file = path.join(ROOT, "VERSION");
  return fs.readFileSync(file, "utf8").trim();
}

function getByPath(obj, dottedPath) {
  return dottedPath
    .split(".")
    .reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

function listFiles() {
  const run = spawnSync("git", ["ls-files"], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (run.status !== 0)
    throw new Error((run.stderr || "").trim() || "git ls-files failed");
  return run.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((x) => x.replace(/\\/g, "/"));
}

function shouldScan(file, includeRegex, excludeRegex) {
  const included = includeRegex.some((re) => re.test(file));
  if (!included) return false;
  return !excludeRegex.some((re) => re.test(file));
}

function globToRegex(glob) {
  const esc = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "___GLOBSTAR___")
    .replace(/\*/g, "[^/]*")
    .replace(/___GLOBSTAR___/g, ".*");
  return new RegExp(`^${esc}$`);
}

function main() {
  try {
    const cfg = readJson(LOCK_CFG);
    const version = readVersion();
    const failures = [];

    for (const rule of cfg.required || []) {
      const abs = path.join(ROOT, rule.file);
      if (!fs.existsSync(abs)) {
        failures.push(`missing required file: ${rule.file}`);
        continue;
      }

      const json = readJson(abs);
      const value = getByPath(json, rule.jsonPath);
      const expected = rule.format === "prefixed" ? `v${version}` : version;
      if (value !== expected) {
        failures.push(
          `${rule.file}:${rule.jsonPath} expected ${expected}, got ${value}`,
        );
      }
    }

    const patterns = (cfg.forbiddenVersionPatterns || []).map(
      (p) => new RegExp(p, "g"),
    );
    const files = listFiles();
    const includeRegex = (cfg.scanGlobs || []).map(globToRegex);
    const excludeRegex = (cfg.excludeGlobs || []).map(globToRegex);

    for (const file of files) {
      if (!shouldScan(file, includeRegex, excludeRegex)) continue;
      const abs = path.join(ROOT, file);
      let content;
      try {
        content = fs.readFileSync(abs, "utf8");
      } catch {
        continue;
      }

      for (const re of patterns) {
        if (re.test(content)) {
          failures.push(
            `${file} contains forbidden version pattern: ${re.source}`,
          );
          break;
        }
        re.lastIndex = 0;
      }
    }

    if (failures.length > 0) {
      console.error("reason: version lock check failed");
      console.error(
        "fix: run `node scripts/mod-tools/version-sync.cjs` then review remaining mismatches",
      );
      console.error("next: rerun npm run version:lock:check");
      failures.slice(0, 100).forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log(`version-lock-check passed (version=${version})`);
  } catch (error) {
    console.error("reason:", error.message);
    console.error(
      "fix:",
      "validate VERSION and config/asanmod-universal/version-lock.json",
    );
    console.error("next:", "rerun npm run version:lock:check");
    process.exit(1);
  }
}

main();
