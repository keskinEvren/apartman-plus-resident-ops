/**
 * ASANMOD v1.0.0: MANIFEST UPDATE UTILITY
 *
 * Allows scripts to programmatically update .asanmod/manifest.json flags and state.
 *
 * Usage:
 *   const { updateFlag, updateHealth, updateVerification } = require('./manifest-update.cjs');
 *   updateFlag('db_seeded', true);
 */

const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = path.join(process.cwd(), ".asanmod", "manifest.json");

/**
 * Read manifest
 */
function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("❌ Manifest not found at:", MANIFEST_PATH);
    return null;
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
}

/**
 * Write manifest
 */
function writeManifest(data) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Update a flag
 */
function updateFlag(flagName, value) {
  const manifest = readManifest();
  if (!manifest) return false;

  if (!manifest.flags.hasOwnProperty(flagName)) {
    console.warn(`⚠️  Flag '${flagName}' does not exist in manifest`);
    return false;
  }

  manifest.flags[flagName] = value;
  writeManifest(manifest);
  console.log(`✅ Flag '${flagName}' updated to:`, value);
  return true;
}

/**
 * Update health status
 */
function updateHealth(key, value) {
  const manifest = readManifest();
  if (!manifest) return false;

  manifest.health[key] = value;
  manifest.health.last_check = new Date().toISOString();
  writeManifest(manifest);
  console.log(`✅ Health '${key}' updated to:`, value);
  return true;
}

/**
 * Update verification results
 */
function updateVerification(passed, failed) {
  const manifest = readManifest();
  if (!manifest) return false;

  manifest.verification.last_run = new Date().toISOString();
  manifest.verification.gates_passed = passed || [];
  manifest.verification.gates_failed = failed || [];
  writeManifest(manifest);
  console.log(
    `✅ Verification updated: ${passed.length} passed, ${failed.length} failed`,
  );
  return true;
}

/**
 * Update state
 */
function updateState(newState) {
  const manifest = readManifest();
  if (!manifest) return false;

  manifest.state = newState;
  writeManifest(manifest);
  console.log(`✅ State updated to:`, newState);
  return true;
}

// CLI interface
if (require.main === module) {
  const [, , action, key, value] = process.argv;

  if (action === "flag") {
    updateFlag(key, value === "true");
  } else if (action === "health") {
    updateHealth(key, value);
  } else if (action === "state") {
    updateState(key);
  } else {
    console.log(`Usage:
  node manifest-update.cjs flag <flagName> <true|false>
  node manifest-update.cjs health <key> <value>
  node manifest-update.cjs state <newState>
    `);
  }
}

module.exports = {
  updateFlag,
  updateHealth,
  updateVerification,
  updateState,
  readManifest,
};
