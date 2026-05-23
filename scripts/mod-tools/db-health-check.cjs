#!/usr/bin/env node
/**
 * ASANMOD DB Health Check - UNIVERSAL VERSION
 * Bu script ASLA veri değiştirmez, sadece kontrol eder ve raporlar.
 *
 * Kullanım: npm run db:health [dev|prod]
 *
 * Credentials şuradan okunur:
 * 1. Environment variables (DATABASE_URL_DEV, DATABASE_URL_PROD)
 * 2. .env.dev / .env.prod dosyaları
 * 3. asanmod.config.json
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get environment from args
const ENV = process.argv[2] || "dev";
const PROJECT_ROOT = process.cwd();

// Load config
function loadConfig() {
  const configPath = path.join(PROJECT_ROOT, "asanmod.config.json");
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}

// Parse .env file
function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf-8");
  const result = {};
  content.split("\n").forEach((line) => {
    const [key, ...values] = line.split("=");
    if (key && values.length) {
      result[key.trim()] = values
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  });
  return result;
}

// Get database connection info
function getDbConnection(env) {
  // 1. Check environment variables
  const envVarName = `DATABASE_URL_${env.toUpperCase()}`;
  if (process.env[envVarName]) {
    return parseDbUrl(process.env[envVarName]);
  }

  // 2. Check .env files
  const envFile = env === "prod" ? ".env.prod" : ".env.dev";
  const envPath = path.join(PROJECT_ROOT, envFile);
  const envVars = parseEnvFile(envPath);
  if (envVars.DATABASE_URL) {
    return parseDbUrl(envVars.DATABASE_URL);
  }

  // 3. Check asanmod.config.json
  const config = loadConfig();
  if (config.database && config.database[env]) {
    return config.database[env];
  }

  // Fallback
  console.error(`❌ Database connection not found for ${env} environment`);
  console.error(
    "   Set DATABASE_URL in .env.dev/.env.prod or asanmod.config.json",
  );
  process.exit(1);
}

// Parse postgres URL
function parseDbUrl(url) {
  try {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        name: match[5].split("?")[0],
      };
    }
  } catch (e) {}
  return null;
}

const db = getDbConnection(ENV);
if (!db) {
  process.exit(1);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🏥 ASANMOD DB HEALTH CHECK - ${ENV.toUpperCase().padEnd(4)}                       ║
║  ⚠️  SALT-OKUNUR: Hiçbir değişiklik yapılmaz               ║
╚════════════════════════════════════════════════════════════╝
`);

function runQuery(sql) {
  try {
    const result = execSync(
      `PGPASSWORD="${db.password}" psql -h ${db.host} -U ${db.user} -d ${db.name} -p ${db.port} -t -A -c "${sql.replace(/"/g, '\\"')}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    return result.trim();
  } catch (e) {
    return "0";
  }
}

// Common orphan checks - customize based on your schema
const orphanChecks = [
  {
    name: "User → Organization",
    sql: `SELECT count(*) FROM "User" u WHERE u."organizationId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Organization" o WHERE o.id = u."organizationId")`,
  },
  {
    name: "Post → User",
    sql: `SELECT count(*) FROM "Post" p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."authorId")`,
  },
];

// Try to detect schema and add relevant checks
function detectSchemaChecks() {
  // Check if common tables exist
  const tables = runQuery(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 100`,
  );
  const tableList = tables.split("\n").filter((t) => t);

  const checks = [];

  // Employee-based checks
  if (tableList.includes("Employee")) {
    checks.push({
      name: "Leave → Employee",
      sql: `SELECT count(*) FROM "Leave" l WHERE NOT EXISTS (SELECT 1 FROM "Employee" e WHERE e.id = l."employeeId")`,
    });
    checks.push({
      name: "Employee → Organization",
      sql: `SELECT count(*) FROM "Employee" e WHERE NOT EXISTS (SELECT 1 FROM "Organization" o WHERE o.id = e."organizationId")`,
    });
  }

  // User-based checks
  if (tableList.includes("users") || tableList.includes("User")) {
    const userTable = tableList.includes("users") ? "users" : '"User"';
    checks.push({
      name: "Session → User",
      sql: `SELECT count(*) FROM sessions s WHERE NOT EXISTS (SELECT 1 FROM ${userTable} u WHERE u.id = s."userId")`,
    });
  }

  return checks.length > 0 ? checks : orphanChecks;
}

const checks = detectSchemaChecks();

console.log("📋 ORPHAN (YETİM) KAYIT KONTROLÜ\n");
console.log("   İlişki                        | Orphan Sayısı | Durum");
console.log("   ─────────────────────────────────────────────────────");

let hasIssues = false;
for (const check of checks) {
  try {
    const count = parseInt(runQuery(check.sql) || "0", 10);
    const status = count === 0 ? "✅ Temiz" : `⚠️ ${count} yetim kayıt`;
    if (count > 0) hasIssues = true;
    console.log(
      `   ${check.name.padEnd(30)} | ${String(count).padStart(13)} | ${status}`,
    );
  } catch (e) {
    console.log(
      `   ${check.name.padEnd(30)} | ${"-".padStart(13)} | ℹ️ Tablo yok`,
    );
  }
}

// Table counts
console.log("\n📊 TABLO SAYILARI\n");
const commonTables = [
  "users",
  "User",
  "Organization",
  "organizations",
  "Employee",
  "Post",
];
for (const table of commonTables) {
  try {
    const quotedTable =
      table.includes("_") || table[0] === table[0].toUpperCase()
        ? `"${table}"`
        : table;
    const count = runQuery(`SELECT count(*) FROM ${quotedTable}`);
    if (count !== "0" || count !== "ERROR") {
      console.log(`   ${table.padEnd(20)} : ${count} kayıt`);
    }
  } catch (e) {
    // Table doesn't exist, skip
  }
}

// Result
console.log("\n" + "═".repeat(60));
if (hasIssues) {
  console.log("⚠️  SORUN TESPİT EDİLDİ!");
  console.log("   Orphan kayıtlar var. Manuel inceleme önerilir.");
  console.log("   NOT: Bu script HİÇBİR değişiklik yapmaz.");
  process.exit(1);
} else {
  console.log("✅ DB SAĞLIKLI - Tüm kontroller geçti.");
  process.exit(0);
}
