#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const MAP_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "architecture-map.json",
);
// Structure policy is fully data-driven from architecture-map.json (zone + extension contract)
// Updated: Added support for Next.js public directory static assets zone
// Updated: Allowed task.md as an approved root-level file for task tracking.

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toRel(p) {
  return p.replace(/\\/g, "/");
}

function getChangedOrTrackedFiles() {
  const trackedRun = spawnSync("git", ["ls-files"], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (trackedRun.status !== 0)
    throw new Error((trackedRun.stderr || "").trim() || "git ls-files failed");
  const untrackedRun = spawnSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { cwd: ROOT, stdio: "pipe", encoding: "utf8" },
  );
  if (untrackedRun.status !== 0)
    throw new Error(
      (untrackedRun.stderr || "").trim() || "git ls-files --others failed",
    );

  const tracked = trackedRun.stdout.trim().split("\n").filter(Boolean);
  const untracked = untrackedRun.stdout.trim().split("\n").filter(Boolean);
  return Array.from(new Set([...tracked, ...untracked])).map(toRel);
}

function isIgnored(file, ignoredPrefixes) {
  return ignoredPrefixes.some((p) => file.startsWith(p));
}

function fileExt(file) {
  return path.extname(file);
}

function findZone(file, zones) {
  return zones.find((z) => {
    if (z.pathPrefix === "") {
      if (!z.includeDepth) return false;
      return file.split("/").length <= z.includeDepth;
    }
    return file.startsWith(z.pathPrefix);
  });
}

function checkFileAgainstZone(file, zone) {
  const issues = [];

  if (zone.allowedFiles && zone.pathPrefix === "") {
    if (!zone.allowedFiles.includes(file)) {
      issues.push(`root file is not in allowedFiles list (${file})`);
    }
    return issues;
  }

  if (zone.allowedExtensions) {
    const ext = fileExt(file);
    const hasNoExt = path.basename(file).indexOf(".") === -1;
    const ok =
      zone.allowedExtensions.includes(ext) ||
      (hasNoExt && zone.allowedExtensions.includes(""));
    if (!ok) {
      issues.push(
        `extension not allowed by zone ${zone.id}: ${ext || "<none>"}`,
      );
    }
  }

  return issues;
}

function main() {
  try {
    const map = readJson(MAP_PATH);
    const files = getChangedOrTrackedFiles();
    const failures = [];

    for (const file of files) {
      if (isIgnored(file, map.ignoredPrefixes || [])) continue;

      const zone = findZone(file, map.zones || []);
      if (!zone) {
        failures.push(`${file}: no zone mapping`);
        continue;
      }

      const issues = checkFileAgainstZone(file, zone);
      for (const issue of issues) {
        failures.push(`${file}: ${issue}`);
      }
    }

    if (failures.length > 0) {
      console.error("reason: structure-check failed");
      console.error(
        "fix: align files with config/asanmod-universal/architecture-map.json",
      );
      console.error(
        "next: update architecture map or move files into approved zones",
      );
      failures.slice(0, 50).forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("structure-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error("fix:", "validate architecture-map json and rerun check");
    console.error("next:", "run npm run structure:check");
    process.exit(1);
  }
}

main();
