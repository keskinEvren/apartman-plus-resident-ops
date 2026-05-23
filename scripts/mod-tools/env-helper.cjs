/**
 * ═══════════════════════════════════════════════════════════════════
 * ASANMOD v1.0.0: ENVIRONMENT HELPER (Universal Bridge)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Single source of truth for ports, paths, and environment config.
 * NOW POWERED BY: config-loader.cjs (v3 Config + .env)
 * Universal Template - No hardcoded project names.
 */

const path = require("path");
const loader = require("./config-loader.cjs");

// Load Configuration (Auto-detect v3 or Legacy)
const loaded = loader.loadV10() || loader.loadLegacy();

if (!loaded) {
  console.error("❌ ASANMOD FATAL: No valid configuration found!");
  console.error("   Checked: asanmod.config.json AND asanmod-core.json");
  process.exit(1);
}

const config = loaded.config;
const source = loaded.source; // 'Protocol' or 'legacy'
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTER LAYERS
// ─────────────────────────────────────────────────────────────────────────────

function getPort(service, env = "dev") {
  if (source === "Protocol") {
    // Protocol Structure: infrastructure.frontend.port / prodPort
    const infra = config.infrastructure;
    if (!infra)
      throw new Error("Invalid Protocol config: missing infrastructure");

    // Map service names
    const serviceKey = service === "brain" ? "brain" : service;
    const target = infra[serviceKey];

    if (!target) throw new Error(`Unknown service: ${service}`);

    if (env === "prod") {
      return target.prodPort || target.port;
    } else {
      return target.port;
    }
  } else {
    // Legacy Structure
    const envConfig = config.network[env];
    if (!envConfig) throw new Error(`Unknown environment: ${env}`);
    return envConfig[service];
  }
}

function getDbUrl(env = "dev") {
  // Use ENV variables if available (Protocol), fallback to config
  if (source === "Protocol") {
    if (env === "prod")
      return process.env.DB_CONNECTION_PROD || loaded.env.DB_CONNECTION_PROD;
    return process.env.DB_CONNECTION_DEV || loaded.env.DB_CONNECTION_DEV;
  }
  // Legacy - use environment variables
  const dbName =
    env === "prod"
      ? process.env.PROD_DB_NAME || "myapp_prod_db"
      : process.env.DEV_DB_NAME || "myapp_dev_db";
  const dbUser = process.env.DB_USER || "dbuser";
  const dbPass = process.env.DB_PASSWORD || "dbpassword";
  return `postgresql://${dbUser}:${dbPass}@localhost:5432/${dbName}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

function isProduction() {
  return (
    process.env.NODE_ENV === "production" || process.env.APP_ENV === "prod"
  );
}

module.exports = {
  // Metadata
  version: config.version,
  name: config.name,
  configSource: source,

  // Paths (Normalized to Absolute)
  paths: {
    root: PROJECT_ROOT,
    scripts: path.join(PROJECT_ROOT, "scripts/mod-tools"),
    docs: path.join(PROJECT_ROOT, "docs"),
    src: path.join(PROJECT_ROOT, "src"),
    state: path.join(PROJECT_ROOT, ".asanmod/state"), // Protocol standard
    logs: path.join(PROJECT_ROOT, "logs"), // Standard logs
    coreConfig: loader.paths[source === "Protocol" ? "Protocol" : "legacy"],
  },

  // Network
  port: getPort,
  binding:
    source === "Protocol"
      ? config.infrastructure.frontend.prodBinding || "127.0.0.1"
      : config.network?.prod?.binding || "127.0.0.1",

  pm2Name: (service, env = "dev") => {
    // Universal PM2 naming convention: app-{env}
    // service parameter is kept for backward compat but ignored in universal mode
    return `app-${env}`;
  },

  // Database
  databaseUrl: getDbUrl,
  redis: {
    dev: process.env.REDIS_URL_DEV || "redis://localhost:6379/0",
    prod: process.env.REDIS_URL_PROD || "redis://localhost:6379/1",
  },

  // Environment
  isProduction,
  currentEnv: () => (isProduction() ? "prod" : "dev"),

  // Rules (Direct map or Fallback)
  rules: config.rules || {},

  // Backwards Compat
  big5Tools: config.big5Tools,
  safeZones: config.safeZones,

  // Raw Access
  raw: config,
};
