#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const PROFILE_CONFIG = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "profiles.json",
);
const STATE_PATH = path.join(ROOT, ".asanmod", "state", "profile-state.json");

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n");
}

function loadConfig() {
  const cfg = readJson(PROFILE_CONFIG);
  if (!cfg || !cfg.profiles) {
    throw new Error(
      "Profile config not found: config/asanmod-universal/profiles.json",
    );
  }
  return cfg;
}

function loadState(defaultProfile) {
  const state = readJson(STATE_PATH, null);
  if (state) return state;
  return {
    selectedProfile: defaultProfile,
    overrides: { enabled: [], disabled: [] },
    updatedAt: new Date().toISOString(),
  };
}

function printUsage() {
  console.log("Usage:");
  console.log("  node scripts/mod-tools/profile-manager.cjs status");
  console.log("  node scripts/mod-tools/profile-manager.cjs list");
  console.log(
    "  node scripts/mod-tools/profile-manager.cjs set <rapid|standard|strict>",
  );
  console.log(
    "  node scripts/mod-tools/profile-manager.cjs gate <on|off> <gateId>",
  );
}

function uniq(arr) {
  return [...new Set(arr)];
}

function main() {
  try {
    const cfg = loadConfig();
    const [command, arg1, arg2] = process.argv.slice(2);
    const state = loadState(cfg.defaultProfile || "standard");

    if (!command || command === "help") {
      printUsage();
      return;
    }

    if (command === "list") {
      console.log("Profiles:");
      for (const [name, p] of Object.entries(cfg.profiles)) {
        console.log(`- ${name}: ${p.description}`);
      }
      return;
    }

    if (command === "status") {
      console.log(
        JSON.stringify(
          {
            selectedProfile: state.selectedProfile,
            overrides: state.overrides,
            updatedAt: state.updatedAt,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (command === "set") {
      if (!cfg.profiles[arg1]) {
        throw new Error(`Unknown profile: ${arg1}`);
      }
      state.selectedProfile = arg1;
      state.updatedAt = new Date().toISOString();
      writeJson(STATE_PATH, state);
      console.log(`profile set to ${arg1}`);
      return;
    }

    if (command === "gate") {
      const action = arg1;
      const gateId = arg2;
      if (!gateId) {
        throw new Error("gate id is required");
      }
      if (action !== "on" && action !== "off") {
        throw new Error("gate action must be on|off");
      }

      if (action === "on") {
        state.overrides.enabled = uniq([
          ...(state.overrides.enabled || []),
          gateId,
        ]);
        state.overrides.disabled = (state.overrides.disabled || []).filter(
          (g) => g !== gateId,
        );
      } else {
        state.overrides.disabled = uniq([
          ...(state.overrides.disabled || []),
          gateId,
        ]);
        state.overrides.enabled = (state.overrides.enabled || []).filter(
          (g) => g !== gateId,
        );
      }

      state.updatedAt = new Date().toISOString();
      writeJson(STATE_PATH, state);
      console.log(`gate ${gateId} => ${action}`);
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error("reason:", error.message);
    console.error(
      "fix:",
      "Run `node scripts/mod-tools/profile-manager.cjs help` and use valid arguments.",
    );
    console.error("next:", "Retry with one of: list, status, set, gate.");
    process.exit(1);
  }
}

main();
