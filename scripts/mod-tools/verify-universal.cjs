#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const GATES_PATH = path.join(ROOT, "config", "asanmod-universal", "gates.json");
const PROFILES_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "profiles.json",
);
const PROFILE_STATE_PATH = path.join(
  ROOT,
  ".asanmod",
  "state",
  "profile-state.json",
);
const AGENT_CONTRACT_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "agent-contract.json",
);
// version-lock gate is command-driven via config/asanmod-universal/gates.json
// and executed by runCommandGate("npm run version:lock:check")
// quality domains (runbook/schema/api/perf/modular/ui/format) are also command-driven gates
// sourced from config/asanmod-universal/gates.json.

const REQUIRED_DOCS = [
  "docs/PRODUCT_BRIEF.md",
  "docs/EXECUTION_PLAN.md",
  "docs/QUESTIONNAIRE_ANSWERS.md",
  "docs/AGENT_DRIVE_PROTOCOL.md",
  "docs/plans/product-intake.json",
];

const PLACEHOLDER_PATTERN =
  /\[PROJECT_NAME\]|\[PROJECT_DESCRIPTION\]|\[WIZARD_WILL_FILL/g;

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseArgs() {
  const args = {
    profile: null,
    risk: "code-change",
    dryRun: false,
  };

  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--profile" && argv[i + 1]) {
      args.profile = argv[i + 1];
      i++;
      continue;
    }
    if (token.startsWith("--profile=")) {
      args.profile = token.split("=", 2)[1] || null;
      continue;
    }
    if (token === "--risk" && argv[i + 1]) {
      args.risk = argv[i + 1];
      i++;
      continue;
    }
    if (token.startsWith("--risk=")) {
      args.risk = token.split("=", 2)[1] || "code-change";
      continue;
    }
    if (token === "--dry-run") args.dryRun = true;
  }

  const allowedRisks = new Set([
    "docs-only",
    "code-change",
    "db-migration",
    "ops-runtime",
    "prod-sensitive",
  ]);
  if (!allowedRisks.has(args.risk)) {
    throw new Error(
      `invalid --risk value '${args.risk}'. allowed: docs-only, code-change, db-migration, ops-runtime, prod-sensitive`,
    );
  }

  return args;
}

function rankProfile(name) {
  const order = { rapid: 1, standard: 2, strict: 3 };
  return order[name] || 0;
}

function riskRequiredProfile(risk) {
  switch (risk) {
    case "docs-only":
      return "rapid";
    case "code-change":
      return "standard";
    case "db-migration":
    case "ops-runtime":
    case "prod-sensitive":
      return "strict";
    default:
      return "standard";
  }
}

function ensureEvidenceDir() {
  const dir = path.join(ROOT, "reports", "verification");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function checkInstallLock() {
  const filePath = path.join(ROOT, ".asanmod", "install.lock.json");
  if (!fs.existsSync(filePath)) {
    return { ok: false, detail: "missing .asanmod/install.lock.json" };
  }
  const parsed = readJson(filePath);
  if (!parsed || !parsed.installedAt) {
    return {
      ok: false,
      detail: "install lock exists but invalid JSON payload",
    };
  }
  if (parsed.executionModel !== "only-agent-driven") {
    return {
      ok: false,
      detail: "install lock execution model is not only-agent-driven",
    };
  }
  return { ok: true, detail: "install lock present" };
}

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");
    env[key] = value;
  }
  return env;
}

function checkPortEnvConsistency() {
  const corePath = path.join(ROOT, "docs", "asanmod-core.json");
  if (!fs.existsSync(corePath)) {
    return { ok: false, detail: "missing docs/asanmod-core.json" };
  }

  const core = readJson(corePath);
  const devFront = Number(core?.network?.dev?.frontend);
  const devBack = Number(core?.network?.dev?.backend);
  const prodFront = Number(core?.network?.prod?.frontend);
  const prodBack = Number(core?.network?.prod?.backend);
  if (
    !Number.isInteger(devFront) ||
    !Number.isInteger(devBack) ||
    !Number.isInteger(prodFront) ||
    !Number.isInteger(prodBack)
  ) {
    return {
      ok: false,
      detail: "network ports in docs/asanmod-core.json are invalid",
    };
  }
  if (devFront !== devBack) {
    return {
      ok: false,
      detail: `dev frontend/backend mismatch (${devFront}/${devBack})`,
    };
  }
  if (prodFront !== prodBack) {
    return {
      ok: false,
      detail: `prod frontend/backend mismatch (${prodFront}/${prodBack})`,
    };
  }

  const lock = readJson(path.join(ROOT, ".asanmod", "install.lock.json"), {});
  if (
    !lock?.ports ||
    lock.ports.dev !== devFront ||
    lock.ports.prod !== prodFront
  ) {
    return {
      ok: false,
      detail: "install lock ports do not match docs/asanmod-core.json",
    };
  }

  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) {
    return {
      ok: true,
      detail: "core+install lock ports consistent (.env missing, skipped)",
    };
  }

  const env = parseEnvFile(envPath);
  const envPort = Number(env.PORT);
  if (!Number.isInteger(envPort)) {
    return { ok: false, detail: ".env PORT is missing or invalid" };
  }
  if (envPort !== devFront) {
    return {
      ok: false,
      detail: `.env PORT (${envPort}) does not match docs dev port (${devFront})`,
    };
  }

  return { ok: true, detail: "ports and .env are consistent" };
}

function checkAgentContract() {
  if (!fs.existsSync(AGENT_CONTRACT_PATH)) {
    return {
      ok: false,
      detail: "missing config/asanmod-universal/agent-contract.json",
    };
  }
  const contract = readJson(AGENT_CONTRACT_PATH);
  if (!contract) {
    return { ok: false, detail: "agent contract is not valid json" };
  }
  if (contract.mode !== "only-agent-driven") {
    return {
      ok: false,
      detail: "agent contract mode must be only-agent-driven",
    };
  }
  if (!contract.aiNative || !contract.aiResponsive) {
    return {
      ok: false,
      detail: "agent contract must enable aiNative and aiResponsive",
    };
  }
  return { ok: true, detail: "agent contract valid" };
}

function checkEnvironmentReport() {
  const jsonPath = path.join(ROOT, "reports", "environment-baseline.json");
  const mdPath = path.join(ROOT, "reports", "environment-baseline.md");
  const ok = fs.existsSync(jsonPath) && fs.existsSync(mdPath);
  return {
    ok,
    detail: ok
      ? "environment baseline artifacts present"
      : "environment baseline artifacts missing",
  };
}

function checkProductDocs() {
  const missing = REQUIRED_DOCS.filter(
    (p) => !fs.existsSync(path.join(ROOT, p)),
  );
  return {
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? "required product docs present"
        : `missing docs: ${missing.join(", ")}`,
  };
}

function checkNoPlaceholders() {
  const targets = [
    "README.md",
    "package.json",
    "docs/asanmod-core.json",
    "src/app/page.tsx",
  ];

  const hitFiles = [];
  for (const rel of targets) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    if (PLACEHOLDER_PATTERN.test(content)) hitFiles.push(rel);
    PLACEHOLDER_PATTERN.lastIndex = 0;
  }

  return {
    ok: hitFiles.length === 0,
    detail:
      hitFiles.length === 0
        ? "no placeholders found in core files"
        : `placeholder found in: ${hitFiles.join(", ")}`,
  };
}

const INTERNAL_HANDLERS = {
  checkInstallLock,
  checkAgentContract,
  checkEnvironmentReport,
  checkProductDocs,
  checkNoPlaceholders,
  checkPortEnvConsistency,
};

function runCommandGate(command, dryRun) {
  if (dryRun) {
    return { ok: true, detail: `[dry-run] ${command}` };
  }

  const result = spawnSync(command, {
    cwd: ROOT,
    shell: true,
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.status === 0) {
    return { ok: true, detail: command };
  }

  const stderr = (result.stderr || "").trim();
  const stdout = (result.stdout || "").trim();
  const detail = stderr || stdout || `exit code ${result.status}`;
  return { ok: false, detail: `${command} failed: ${detail}` };
}

function writeEvidence(payload) {
  const dir = ensureEvidenceDir();
  const stamp = nowStamp();
  const jsonPath = path.join(dir, `verify-${stamp}.json`);
  const mdPath = path.join(dir, `verify-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n");

  const md = [
    "# Verification Evidence",
    "",
    `- Timestamp: ${payload.timestamp}`,
    `- Profile: ${payload.profile}`,
    `- Risk: ${payload.risk}`,
    `- Overall: ${payload.overall}`,
    "",
    "## Gates",
    ...payload.results.map(
      (r) =>
        `- [${r.ok ? "PASS" : "FAIL"}] ${r.id}: ${r.detail}${r.blocking ? " (blocking)" : " (non-blocking)"}`,
    ),
    "",
  ].join("\n");

  fs.writeFileSync(mdPath, md);
  return { jsonPath, mdPath };
}

function computeActiveGates(cfgProfiles, cfgGates, state, selectedProfile) {
  const base = cfgProfiles.profiles[selectedProfile].defaultGates || [];
  const enabled = new Set(base);
  for (const gateId of state.overrides?.enabled || []) enabled.add(gateId);
  for (const gateId of state.overrides?.disabled || []) enabled.delete(gateId);

  const gateMap = new Map((cfgGates.gates || []).map((g) => [g.id, g]));
  return Array.from(enabled)
    .map((id) => gateMap.get(id))
    .filter(Boolean);
}

function main() {
  try {
    const args = parseArgs();
    const cfgProfiles = readJson(PROFILES_PATH);
    const cfgGates = readJson(GATES_PATH);

    if (!cfgProfiles || !cfgProfiles.profiles) {
      throw new Error("profiles config missing");
    }
    if (!cfgGates || !Array.isArray(cfgGates.gates)) {
      throw new Error("gates config missing");
    }

    const state = readJson(PROFILE_STATE_PATH, {
      selectedProfile: cfgProfiles.defaultProfile || "standard",
      overrides: { enabled: [], disabled: [] },
    });

    let selectedProfile =
      args.profile ||
      state.selectedProfile ||
      cfgProfiles.defaultProfile ||
      "standard";
    if (!cfgProfiles.profiles[selectedProfile]) {
      throw new Error(`unknown profile: ${selectedProfile}`);
    }

    const requiredByRisk = riskRequiredProfile(args.risk);
    if (rankProfile(selectedProfile) < rankProfile(requiredByRisk)) {
      selectedProfile = requiredByRisk;
      console.log(
        `risk escalation: profile promoted to ${selectedProfile} for risk=${args.risk}`,
      );
    }

    const activeGates = computeActiveGates(
      cfgProfiles,
      cfgGates,
      state,
      selectedProfile,
    );
    const results = [];
    let blockingFail = false;

    for (const gate of activeGates) {
      let outcome;
      if (gate.kind === "internal") {
        const handler = INTERNAL_HANDLERS[gate.handler];
        if (!handler) {
          outcome = {
            ok: false,
            detail: `missing internal handler: ${gate.handler}`,
          };
        } else {
          outcome = handler();
        }
      } else if (gate.kind === "command") {
        outcome = runCommandGate(gate.command, args.dryRun);
      } else {
        outcome = { ok: false, detail: `unknown gate kind: ${gate.kind}` };
      }

      const item = {
        id: gate.id,
        kind: gate.kind,
        blocking: gate.blocking !== false,
        ok: !!outcome.ok,
        detail: outcome.detail || "",
      };

      if (!item.ok && item.blocking) blockingFail = true;
      results.push(item);
      console.log(
        `[${item.ok ? "PASS" : "FAIL"}] ${item.id} -> ${item.detail}`,
      );
    }

    const payload = {
      timestamp: new Date().toISOString(),
      profile: selectedProfile,
      risk: args.risk,
      dryRun: args.dryRun,
      overall: blockingFail ? "FAIL" : "PASS",
      results,
    };

    const artifacts = writeEvidence(payload);
    console.log(`evidence: ${artifacts.jsonPath}`);
    console.log(`evidence: ${artifacts.mdPath}`);

    if (blockingFail) {
      console.error("reason: one or more blocking gates failed");
      console.error(
        "fix: run failing gate commands or fill missing setup artifacts",
      );
      console.error(
        "next: rerun `npm run verify:code-change` after remediation",
      );
      process.exit(1);
    }

    console.log("verification passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error(
      "fix:",
      "Check profile and gate configs under config/asanmod-universal/*.json",
    );
    console.error(
      "next:",
      "Run `npm run mode:status` then `npm run verify:code-change -- --dry-run`.",
    );
    process.exit(1);
  }
}

main();
