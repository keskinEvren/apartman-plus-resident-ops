#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const POLICY_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "expert-reports-policy.json",
);
const PROFILE_STATE_PATH = path.join(
  ROOT,
  ".asanmod",
  "state",
  "profile-state.json",
);
const PROFILES_CFG_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "profiles.json",
);

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function main() {
  const policy = readJson(POLICY_PATH);
  const profilesCfg = readJson(PROFILES_CFG_PATH, {
    defaultProfile: "standard",
  });
  const profileState = readJson(PROFILE_STATE_PATH, {
    selectedProfile: profilesCfg.defaultProfile || "standard",
  });

  if (!policy) {
    console.error("reason: expert report policy config is missing/invalid");
    console.error(
      "fix: validate config/asanmod-universal/expert-reports-policy.json",
    );
    console.error("next: rerun npm run expert:reports:policy:check");
    process.exit(1);
  }

  const policyDocPath = path.join(ROOT, policy.policyDocPath);
  if (!fs.existsSync(policyDocPath)) {
    console.error("reason: expert report policy document missing");
    console.error(`fix: create ${policy.policyDocPath}`);
    console.error("next: rerun npm run expert:reports:policy:check");
    process.exit(1);
  }

  const profile =
    profileState.selectedProfile || profilesCfg.defaultProfile || "standard";
  const profilePolicy = policy.profiles?.[profile] || { required: false };
  if (!profilePolicy.required) {
    console.log(
      `expert-reports-policy-check passed (profile=${profile}, reports optional)`,
    );
    return;
  }

  const required = policy.requiredReportsWhenEnabled || [];
  const missing = required.filter(
    (rel) => !fs.existsSync(path.join(ROOT, rel)),
  );
  if (missing.length > 0) {
    console.error("reason: required expert reports missing for strict profile");
    console.error("fix: generate missing expert artifacts and backlog records");
    console.error("next: rerun npm run expert:reports:policy:check");
    for (const rel of missing) {
      console.error(`- missing: ${rel}`);
    }
    process.exit(1);
  }

  console.log(
    `expert-reports-policy-check passed (profile=${profile}, reports required)`,
  );
}

main();
