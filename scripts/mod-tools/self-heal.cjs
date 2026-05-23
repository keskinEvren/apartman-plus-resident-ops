#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "reports", "healing");

function run(cmd) {
  return spawnSync(cmd, {
    cwd: ROOT,
    shell: true,
    stdio: "pipe",
    encoding: "utf8",
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeEvidence(payload) {
  ensureDir(OUT_DIR);
  const id = stamp();
  const jsonPath = path.join(OUT_DIR, `self-heal-${id}.json`);
  const mdPath = path.join(OUT_DIR, `self-heal-${id}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n");

  const lines = [
    "# Self Heal Evidence",
    "",
    `- Timestamp: ${payload.timestamp}`,
    `- Apply: ${payload.apply}`,
    `- Overall: ${payload.overall}`,
    "",
    "## Steps",
  ];
  for (const step of payload.steps) {
    lines.push(
      `- [${step.ok ? "PASS" : "FAIL"}] ${step.name}: ${step.summary}`,
    );
  }
  lines.push("");
  fs.writeFileSync(mdPath, lines.join("\n"));
  return { jsonPath, mdPath };
}

function summarizeOutput(result) {
  const out = ((result.stdout || "") + "\n" + (result.stderr || "")).trim();
  return out.split("\n").slice(-8).join(" | ");
}

function main() {
  const apply = process.argv.includes("--apply");
  const steps = [];

  // detect
  const verify = run(
    "node scripts/mod-tools/verify-universal.cjs --dry-run --risk code-change",
  );
  steps.push({
    name: "detect",
    ok: verify.status === 0,
    summary:
      verify.status === 0
        ? "verification dry-run clean"
        : summarizeOutput(verify),
  });

  // classify and heal plan
  const needInit = verify.status !== 0;
  if (needInit) {
    if (apply) {
      const init = run("npm run agent:init -- --auto");
      steps.push({
        name: "heal:init",
        ok: init.status === 0,
        summary: summarizeOutput(init),
      });
    } else {
      steps.push({
        name: "heal:init",
        ok: true,
        summary: "[dry-plan] would run: npm run agent:init -- --auto",
      });
    }

    if (apply) {
      const sync = run("npm run docs:sync");
      steps.push({
        name: "heal:docs-sync",
        ok: sync.status === 0,
        summary: summarizeOutput(sync),
      });
    } else {
      steps.push({
        name: "heal:docs-sync",
        ok: true,
        summary: "[dry-plan] would run: npm run docs:sync",
      });
    }
  }

  const finalVerify = run(
    "node scripts/mod-tools/verify-universal.cjs --dry-run --risk code-change",
  );
  steps.push({
    name: "re-verify",
    ok: finalVerify.status === 0,
    summary: summarizeOutput(finalVerify),
  });

  const overall = steps.every((s) => s.ok) ? "PASS" : "FAIL";
  const payload = {
    timestamp: new Date().toISOString(),
    apply,
    overall,
    steps,
  };
  const artifacts = writeEvidence(payload);

  console.log(`evidence: ${artifacts.jsonPath}`);
  console.log(`evidence: ${artifacts.mdPath}`);

  if (overall !== "PASS") {
    console.error("reason: self-heal protocol did not fully converge");
    console.error(
      "fix: inspect failing step summaries in reports/healing and remediate deterministically",
    );
    console.error("next: rerun npm run self-heal -- --apply after fixes");
    process.exit(1);
  }

  console.log("self-heal protocol passed");
}

main();
