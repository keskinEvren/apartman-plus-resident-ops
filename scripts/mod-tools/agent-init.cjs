#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const REPORTS_DIR = path.join(ROOT, "reports");
const ASANMOD_DIR = path.join(ROOT, ".asanmod");
const STATE_DIR = path.join(ASANMOD_DIR, "state");
const INSTALL_LOCK = path.join(ASANMOD_DIR, "install.lock.json");
const PROFILE_STATE = path.join(STATE_DIR, "profile-state.json");
const PROFILE_CONFIG = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "profiles.json",
);
const QUESTION_PACK = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "question-pack.json",
);
const AGENT_CONTRACT = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "agent-contract.json",
);
const { synchronizePortsAndEnv } = require("./port-env-sync.cjs");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeReadJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function runVersion(command) {
  try {
    return execSync(command, { cwd: ROOT, stdio: "pipe" }).toString().trim();
  } catch {
    return null;
  }
}

function buildEnvironmentBaseline() {
  return {
    capturedAt: new Date().toISOString(),
    platform: {
      os: os.type(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemoryGb: Math.round((os.totalmem() / 1024 ** 3) * 100) / 100,
      freeMemoryGb: Math.round((os.freemem() / 1024 ** 3) * 100) / 100,
      shell: process.env.SHELL || process.env.ComSpec || "unknown",
    },
    tools: {
      node: process.version,
      npm: runVersion("npm -v"),
      git: runVersion("git --version"),
      pm2: runVersion("pm2 -v") || runVersion("npx pm2 -v"),
      psql: runVersion("psql --version"),
      docker: runVersion("docker --version"),
    },
  };
}

function toMarkdownEnv(report) {
  const toolsRows = Object.entries(report.tools)
    .map(([name, value]) => `| ${name} | ${value || "missing"} |`)
    .join("\n");

  return [
    "# Environment Baseline Report",
    "",
    `- Captured At: ${report.capturedAt}`,
    `- OS: ${report.platform.os} ${report.platform.release}`,
    `- Arch: ${report.platform.arch}`,
    `- CPUs: ${report.platform.cpus}`,
    `- Total Memory (GB): ${report.platform.totalMemoryGb}`,
    `- Free Memory (GB): ${report.platform.freeMemoryGb}`,
    `- Shell: ${report.platform.shell}`,
    "",
    "## Tooling",
    "",
    "| Tool | Version |",
    "|---|---|",
    toolsRows,
    "",
  ].join("\n");
}

function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question, fallback = "") {
  const prompt = fallback ? `${question} [${fallback}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve((answer || "").trim() || fallback);
    });
  });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function replacePlaceholders(projectName, projectDescription) {
  const targets = [
    "README.md",
    "package.json",
    "docs/asanmod-core.json",
    "src/app/page.tsx",
    "src/app/layout.tsx",
  ];

  for (const relativePath of targets) {
    const abs = path.join(ROOT, relativePath);
    if (!fs.existsSync(abs)) continue;

    let content = fs.readFileSync(abs, "utf8");
    content = content.replace(/\[PROJECT_NAME\]/g, projectName);
    content = content.replace(/\[PROJECT_DESCRIPTION\]/g, projectDescription);
    fs.writeFileSync(abs, content);
  }
}

function renderProductBrief(data) {
  return [
    "# Product Brief",
    "",
    `- Product Name: ${data.projectName}`,
    `- Description: ${data.projectDescription}`,
    `- Target User: ${data.answers.target_user}`,
    `- Problem Statement: ${data.answers.problem_statement}`,
    `- Core MVP Flow: ${data.answers.core_flow}`,
    `- Success Metric: ${data.answers.success_metric}`,
    "",
  ].join("\n");
}

function renderExecutionPlan(data) {
  return [
    "# Execution Plan",
    "",
    "## Scope Lock",
    `- Core Flow: ${data.answers.core_flow}`,
    `- Constraints: ${data.answers.constraints}`,
    `- Risks: ${data.answers.risks}`,
    "",
    "## Delivery Cadence",
    "- 0-15 min: scope and acceptance lock",
    "- 15-120 min: vertical slice implementation",
    "- 120-150 min: hardening and smoke checks",
    "- 150-180 min: demo script and fallback prep",
    "",
  ].join("\n");
}

function renderAgentDriveProtocol(data, contract) {
  return [
    "# Agent Drive Protocol",
    "",
    `- Mode: ${contract.mode}`,
    `- Profile: ${data.profile}`,
    `- AI Native: ${contract.aiNative}`,
    `- AI Responsive: ${contract.aiResponsive}`,
    `- Supported Agents: ${(contract.agents || []).join(", ")}`,
    "",
    "## Mandatory Output",
    "- Error: reason / fix / next",
    "- Evidence: command / purpose / status / artifact",
    "",
    "## Rule",
    "- Default execution is agent-driven. Manual/human-only flow is not the baseline path.",
    "",
  ].join("\n");
}

function renderQuestionAnswers(data, questions) {
  const lines = ["# Questionnaire Answers", ""];
  for (const question of questions) {
    lines.push(`## ${question.title}`);
    lines.push(`- Prompt: ${question.prompt}`);
    lines.push(`- Answer: ${data.answers[question.id]}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function collectAnswers(autoMode, projectName, projectDescription) {
  const pack = safeReadJson(QUESTION_PACK, { questions: [] });
  const answers = {};

  if (autoMode) {
    for (const q of pack.questions) {
      answers[q.id] = `TODO: ${q.prompt}`;
    }
    return { questions: pack.questions, answers };
  }

  const rl = createPrompt();
  try {
    for (const q of pack.questions) {
      const defaultValue = `TODO: ${q.prompt}`;
      answers[q.id] = await ask(rl, q.prompt, defaultValue);
    }

    if (!answers.problem_statement) {
      answers.problem_statement = `${projectName} uses AI-native workflows to reduce delivery time.`;
    }

    if (!answers.target_user) {
      answers.target_user = "Engineering teams";
    }

    if (!answers.core_flow) {
      answers.core_flow = `${projectDescription} MVP flow`;
    }
  } finally {
    rl.close();
  }

  return { questions: pack.questions, answers };
}

function initProfileState(defaultProfile) {
  if (fs.existsSync(PROFILE_STATE)) return;
  writeFile(
    PROFILE_STATE,
    JSON.stringify(
      {
        selectedProfile: defaultProfile,
        overrides: { enabled: [], disabled: [] },
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
}

function writeInstallLock(payload) {
  writeFile(INSTALL_LOCK, JSON.stringify(payload, null, 2) + "\n");
}

function parseArgs(argv) {
  const args = {
    auto: false,
    profile: null,
    projectName: null,
    projectDescription: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--auto") args.auto = true;
    if (token === "--profile") args.profile = argv[i + 1] || null;
    if (token === "--project-name") args.projectName = argv[i + 1] || null;
    if (token === "--project-description")
      args.projectDescription = argv[i + 1] || null;
  }

  return args;
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const profiles = safeReadJson(PROFILE_CONFIG, {
      defaultProfile: "standard",
      profiles: {},
    });
    const selectedProfile =
      args.profile || profiles.defaultProfile || "standard";
    const contract = safeReadJson(AGENT_CONTRACT, null);

    if (!profiles.profiles[selectedProfile]) {
      throw new Error(`Unknown profile: ${selectedProfile}`);
    }
    if (!contract || contract.mode !== "only-agent-driven") {
      throw new Error(
        "Agent contract missing or invalid: config/asanmod-universal/agent-contract.json",
      );
    }

    const projectName =
      args.projectName || process.env.ASAN_PROJECT_NAME || "ASANMOD Project";
    const projectDescription =
      args.projectDescription ||
      process.env.ASAN_PROJECT_DESCRIPTION ||
      "AI-responsive application";

    ensureDir(REPORTS_DIR);
    ensureDir(ASANMOD_DIR);
    ensureDir(STATE_DIR);

    const baseline = buildEnvironmentBaseline();
    writeFile(
      path.join(REPORTS_DIR, "environment-baseline.json"),
      JSON.stringify(baseline, null, 2) + "\n",
    );
    writeFile(
      path.join(REPORTS_DIR, "environment-baseline.md"),
      toMarkdownEnv(baseline),
    );

    const qa = await collectAnswers(args.auto, projectName, projectDescription);
    const intake = {
      generatedAt: new Date().toISOString(),
      projectName,
      projectDescription,
      profile: selectedProfile,
      answers: qa.answers,
    };

    writeFile(
      path.join(ROOT, "docs", "plans", "product-intake.json"),
      JSON.stringify(intake, null, 2) + "\n",
    );
    writeFile(
      path.join(ROOT, "docs", "PRODUCT_BRIEF.md"),
      renderProductBrief(intake),
    );
    writeFile(
      path.join(ROOT, "docs", "EXECUTION_PLAN.md"),
      renderExecutionPlan(intake),
    );
    writeFile(
      path.join(ROOT, "docs", "QUESTIONNAIRE_ANSWERS.md"),
      renderQuestionAnswers(intake, qa.questions),
    );
    writeFile(
      path.join(ROOT, "docs", "AGENT_DRIVE_PROTOCOL.md"),
      renderAgentDriveProtocol(intake, contract),
    );

    replacePlaceholders(projectName, projectDescription);
    const syncSummary = await synchronizePortsAndEnv({
      projectName,
      projectDescription,
      preferredPorts: null,
    });
    initProfileState(selectedProfile);

    writeInstallLock({
      installedAt: new Date().toISOString(),
      profile: selectedProfile,
      executionModel: contract.mode,
      aiNative: contract.aiNative,
      aiResponsive: contract.aiResponsive,
      projectName,
      projectDescription,
      agentContractPath: "config/asanmod-universal/agent-contract.json",
      baselineReport: "reports/environment-baseline.json",
      intakePlan: "docs/plans/product-intake.json",
      ports: syncSummary.ports,
      envPath: syncSummary.envPath,
      corePath: syncSummary.corePath,
    });

    console.log("ASANMOD agent init completed.");
    console.log(`profile=${selectedProfile}`);
    console.log(`ports.dev=${syncSummary.ports.dev}`);
    console.log(`ports.prod=${syncSummary.ports.prod}`);
    console.log(`ports.probeMode=${syncSummary.probeMode}`);
    console.log(`env.path=${syncSummary.envPath}`);
    console.log(
      "artifacts=reports/environment-baseline.{json,md},docs/PRODUCT_BRIEF.md,docs/EXECUTION_PLAN.md,docs/QUESTIONNAIRE_ANSWERS.md,docs/AGENT_DRIVE_PROTOCOL.md",
    );
  } catch (error) {
    console.error("reason:", error.message);
    console.error(
      "fix:",
      "Run `npm run agent:init -- --auto` for non-interactive bootstrap or provide valid profile.",
    );
    console.error(
      "next:",
      "Inspect config/asanmod-universal/profiles.json and retry initialization.",
    );
    process.exit(1);
  }
}

main();
