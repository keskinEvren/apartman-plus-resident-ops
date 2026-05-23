#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const ENV_FILE = path.join(ROOT, ".env");

function parseArgs(argv) {
  return {
    check: argv.includes("--check"),
  };
}

function readEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");
    env[key] = value;
  }
  return env;
}

function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    const dbName = (parsed.pathname || "").replace(/^\//, "");
    if (!dbName) return null;
    return {
      host: parsed.hostname || "localhost",
      port: parsed.port || "5432",
      user: decodeURIComponent(parsed.username || "postgres"),
      password: decodeURIComponent(parsed.password || ""),
      database: dbName,
    };
  } catch {
    return null;
  }
}

function run(cmd, args, env = process.env) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const envFromFile = readEnvFile(ENV_FILE);
  const mergedEnv = { ...process.env, ...envFromFile };
  const dbUrl = mergedEnv.DATABASE_URL || "";

  if (!dbUrl) {
    console.error("reason: DATABASE_URL is missing");
    console.error("fix: set DATABASE_URL in .env before running db ensure");
    console.error("next: rerun npm run db:ensure");
    process.exit(1);
  }

  const db = parseDatabaseUrl(dbUrl);
  if (!db) {
    console.error("reason: DATABASE_URL is invalid");
    console.error("fix: provide valid postgres connection string in .env");
    console.error("next: rerun npm run db:ensure");
    process.exit(1);
  }

  const psqlEnv = { ...mergedEnv };
  if (db.password) {
    psqlEnv.PGPASSWORD = db.password;
  }

  const existsCmd = [
    "-h",
    db.host,
    "-p",
    db.port,
    "-U",
    db.user,
    "-d",
    "postgres",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname='${db.database.replace(/'/g, "''")}';`,
  ];
  const existsRes = run("psql", existsCmd, psqlEnv);
  if (existsRes.status !== 0) {
    console.error("reason: failed to query postgres for database existence");
    console.error(
      "fix: ensure PostgreSQL is running and DATABASE_URL credentials are valid",
    );
    console.error("next: rerun npm run db:ensure");
    process.stderr.write(existsRes.stderr || "");
    process.exit(1);
  }

  const exists = (existsRes.stdout || "").trim() === "1";
  if (exists) {
    console.log(`db-ensure: database already exists (${db.database})`);
    process.exit(0);
  }

  if (args.check) {
    console.error("reason: database does not exist");
    console.error("fix: run npm run db:ensure to create missing database");
    console.error("next: rerun your db command");
    process.exit(1);
  }

  const createArgs = ["-h", db.host, "-p", db.port, "-U", db.user, db.database];
  const createRes = run("createdb", createArgs, psqlEnv);
  if (createRes.status !== 0) {
    console.error("reason: failed to create missing database");
    console.error(
      "fix: verify create privileges for DB user or create database manually",
    );
    console.error("next: rerun npm run db:ensure");
    process.stderr.write(createRes.stderr || "");
    process.exit(1);
  }

  console.log(`db-ensure: database created (${db.database})`);
}

main();
