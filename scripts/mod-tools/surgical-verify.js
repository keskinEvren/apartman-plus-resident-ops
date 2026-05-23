/**
 * ASANMOD v1.1.1: SURGICAL-VERIFY (The Speed Demon)
 *
 * Usage: node surgical-verify.js [target_file]
 *
 * Logic:
 * 1. Calculate Blast Radius using `dependency-graph.js`.
 * 2. If Blast Radius > 50 files or detects GLOBAL change (e.g. package.json), fallback to FULL verify.
 * 3. Else, run ESLint ONLY on the blast radius.
 * 4. Run TypeScript (Incremental) - TSC is usually fast enough incrementally.
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ESM Shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const targetFile = process.argv[2] ? path.resolve(process.argv[2]) : null;

function runCommand(cmd) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: projectRoot });
    return true;
  } catch (e) {
    return false;
  }
}

console.log(`${colors.blue}🚀 ASANMOD SURGICAL-VERIFY v7.0${colors.reset}`);

// 1. GLOBAL CHECK
if (
  !targetFile ||
  targetFile.endsWith("package.json") ||
  targetFile.endsWith("tsconfig.json")
) {
  console.log(
    `${colors.yellow}⚠️  Global file changed/No target. Running FULL VERIFY...${colors.reset}`,
  );
  const success = runCommand("npm run verify");
  process.exit(success ? 0 : 1);
}

// 2. BLAST RADIUS
console.log(`${colors.blue}🔍 Calculating Blast Radius...${colors.reset}`);
let impact = { dependents: [], count: 0 };
try {
  const output = execSync(
    `node scripts/mod-tools/dependency-graph.js "${targetFile}"`,
    {
      cwd: projectRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  impact = JSON.parse(output);
} catch (e) {
  console.log(
    `${colors.red}❌ Graph calculation failed. Fallback to full verify.${colors.reset}`,
  );
  const success = runCommand("npm run verify");
  process.exit(success ? 0 : 1);
}

const fileList = [targetFile, ...impact.dependents];
const relativeFiles = fileList
  .map((f) => path.relative(projectRoot, f))
  .join(" ");

console.log(
  `${colors.green}🎯 Target: ${path.relative(projectRoot, targetFile)}${colors.reset}`,
);
console.log(
  `${colors.yellow}💥 Impact: ${impact.count} files affected.${colors.reset}`,
);

// 3. THRESHOLD CHECK
if (impact.count > 50) {
  console.log(
    `${colors.yellow}⚠️  Blast Radius too large (>50). Running FULL VERIFY for safety.${colors.reset}`,
  );
  const success = runCommand("npm run verify");
  process.exit(success ? 0 : 1);
}

// 4. SURGICAL EXECUTION
console.log(
  `${colors.blue}💉 Executing Surgical Verify on ${impact.count + 1} files...${colors.reset}`,
);

// A. ESLint (Surgical)
console.log(`> Linting subset...`);
const validFiles = fileList.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));

// Group by context
const feFiles = validFiles.filter((f) =>
  path.relative(projectRoot, f).startsWith("frontend/"),
);
const beFiles = validFiles.filter((f) =>
  path.relative(projectRoot, f).startsWith("backend/"),
);

if (feFiles.length > 0) {
  const relFiles = feFiles
    .map((f) => path.relative(path.join(projectRoot, "frontend"), f))
    .join(" ");
  console.log(`  [Frontend] Linting ${feFiles.length} files...`);
  if (
    !runCommand(
      `cd frontend && npm exec eslint ${relFiles} -- --max-warnings 0 --fix`,
    )
  ) {
    console.log(`${colors.red}❌ FRONTEND LINT FAILED${colors.reset}`);
    process.exit(1);
  }
}

if (beFiles.length > 0) {
  const relFiles = beFiles
    .map((f) => path.relative(path.join(projectRoot, "backend"), f))
    .join(" ");
  console.log(`  [Backend] Linting ${beFiles.length} files...`);
  if (
    !runCommand(
      `cd backend && npm exec eslint ${relFiles} -- --max-warnings 0 --fix`,
    )
  ) {
    console.log(`${colors.red}❌ BACKEND LINT FAILED${colors.reset}`);
    process.exit(1);
  }
}

// B. TypeScript (Incremental)
console.log(`> Type Checking (Incremental)...`);

if (feFiles.length > 0) {
  console.log(`  [Frontend] Checking Types...`);
  if (!runCommand(`cd frontend && npx tsc --noEmit`)) {
    console.log(`${colors.red}❌ FRONTEND TYPESCRIPT FAILED${colors.reset}`);
    process.exit(1);
  }
}

if (beFiles.length > 0) {
  console.log(`  [Backend] Checking Types...`);
  if (!runCommand(`cd backend && npx tsc --noEmit`)) {
    console.log(`${colors.red}❌ BACKEND TYPESCRIPT FAILED${colors.reset}`);
    process.exit(1);
  }
}

console.log(`${colors.green}✅ SURGICAL VERIFY PASSED${colors.reset}`);
process.exit(0);
