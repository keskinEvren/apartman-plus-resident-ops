/**
 * ═══════════════════════════════════════════════════════════════════
 * ASANMOD v1.1.1: UNIVERSAL CONFIG LOADER
 * ═══════════════════════════════════════════════════════════════════
 *
 * The new standard for loading configuration.
 * Strategies:
 * 1. Protocol (Preferred): asanmod.config.json + .env
 * 2. v9 (Legacy): docs/asanmod-core.json
 *
 * USAGE:
 *   const config = require('./config-loader.cjs');
 *   console.log(config.get('infrastructure.backend.port'));
 *
 * NOTE: This is currently in SAFE MODE (Validation only).
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const V10_CONFIG_PATH = path.join(PROJECT_ROOT, "asanmod.config.json");
const V10_ENV_PATH = path.join(PROJECT_ROOT, ".env.Protocol_generated");
const LEGACY_CONFIG_PATH = path.join(PROJECT_ROOT, "docs/asanmod-core.json");

// Helper: Simple .env parser to avoid 'dotenv' dev-dependency in prod scripts
function parseEnv(content) {
  const result = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...values] = trimmed.split("=");
    if (key && values.length > 0) {
      let val = values.join("=").trim();
      // Remove quotes if present
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      result[key.trim()] = val;
    }
  });
  return result;
}

function loadV10() {
  if (!fs.existsSync(V10_CONFIG_PATH)) return null;

  try {
    const rawConfig = JSON.parse(fs.readFileSync(V10_CONFIG_PATH, "utf8"));
    const envVars = fs.existsSync(V10_ENV_PATH)
      ? parseEnv(fs.readFileSync(V10_ENV_PATH, "utf8"))
      : {};

    return {
      source: "Protocol",
      config: rawConfig,
      env: envVars,
      // Helper to simulate the old structure for compatibility
      normalized: {
        network: {
          dev: {
            frontend: rawConfig.infrastructure.frontend.port,
            backend: rawConfig.infrastructure.backend.port,
            binding: rawConfig.infrastructure.frontend.binding,
          },
          prod: {
            frontend: rawConfig.infrastructure.frontend.prodPort,
            backend: rawConfig.infrastructure.backend.prodPort,
            brain: rawConfig.infrastructure.brain.prodPort,
            binding: rawConfig.infrastructure.frontend.prodBinding,
          },
        },
        credentials: {
          dev: {
            superAdmin: {
              email: envVars.SUPER_ADMIN_EMAIL,
              password: envVars.SUPER_ADMIN_PASS,
            },
          },
          services: {
            redis: { password: envVars.REDIS_PASSWORD },
            minio: {
              accessKey: envVars.MINIO_ACCESS_KEY,
              secretKey: envVars.MINIO_SECRET_KEY,
            },
          },
        },
      },
    };
  } catch (e) {
    console.error("❌ Failed to load Protocol config:", e.message);
    return null;
  }
}

function loadLegacy() {
  if (!fs.existsSync(LEGACY_CONFIG_PATH)) return null;
  try {
    return {
      source: "legacy",
      config: JSON.parse(fs.readFileSync(LEGACY_CONFIG_PATH, "utf8")),
    };
  } catch (e) {
    return null;
  }
}

module.exports = {
  loadV10,
  loadLegacy,
  paths: {
    Protocol: V10_CONFIG_PATH,
    ProtocolEnv: V10_ENV_PATH,
    legacy: LEGACY_CONFIG_PATH,
  },
};
