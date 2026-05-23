/**
 * ASANMOD v1.1.1: DECISION LOGGER
 * Archives agent decisions with reasoning and context.
 *
 * ASANMOD Hard Constraint: Critical commits without decision log are REJECTED
 *
 * Decision Schema:
 * - id: DEC-XXXX (auto-generated)
 * - timestamp: ISO date
 * - option: 1-5 (from interaction guard)
 * - reasoning: Why this path was chosen
 * - files: Affected files
 * - alternatives: What was considered but rejected
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Configuration
const CONFIG = {
  DECISIONS_DIR: path.join(process.cwd(), ".asanmod", "logs", "decisions"),
  MAX_DECISIONS: 100, // Keep last 100 decisions
};

/**
 * Generate a unique decision ID
 */
function generateDecisionId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(2).toString("hex");
  return `DEC-${timestamp}-${random}`.toUpperCase();
}

/**
 * Ensure decisions directory exists
 */
function ensureDir() {
  if (!fs.existsSync(CONFIG.DECISIONS_DIR)) {
    fs.mkdirSync(CONFIG.DECISIONS_DIR, { recursive: true });
  }
}

/**
 * Get all decisions sorted by timestamp (newest first)
 */
function getAllDecisions() {
  ensureDir();
  const files = fs
    .readdirSync(CONFIG.DECISIONS_DIR)
    .filter((f) => f.endsWith(".json"));

  return files
    .map((f) => {
      try {
        return JSON.parse(
          fs.readFileSync(path.join(CONFIG.DECISIONS_DIR, f), "utf-8"),
        );
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Log a new decision
 * @param {object} decision - Decision object
 * @returns {string} - Decision ID
 */
function logDecision(decision) {
  ensureDir();

  const id = generateDecisionId();
  const timestamp = new Date().toISOString();

  const fullDecision = {
    id,
    timestamp,
    option: decision.option || null,
    taskId: decision.taskId || null,
    reasoning: decision.reasoning || "",
    summary: decision.summary || "",
    files: decision.files || [],
    alternatives: decision.alternatives || [],
    outcome: decision.outcome || "PENDING",
    agent: decision.agent || "Unknown",
    _meta: {
      version: "1.1.1",
      commitHash: getCommitHash(),
    },
  };

  const filename = `${id}.json`;
  fs.writeFileSync(
    path.join(CONFIG.DECISIONS_DIR, filename),
    JSON.stringify(fullDecision, null, 2),
  );

  // Cleanup old decisions
  cleanupOldDecisions();

  return id;
}

/**
 * Get current commit hash
 */
function getCommitHash() {
  try {
    const { execSync } = require("child_process");
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * Cleanup old decisions beyond MAX_DECISIONS
 */
function cleanupOldDecisions() {
  const decisions = getAllDecisions();
  if (decisions.length > CONFIG.MAX_DECISIONS) {
    const toDelete = decisions.slice(CONFIG.MAX_DECISIONS);
    toDelete.forEach((d) => {
      const filepath = path.join(CONFIG.DECISIONS_DIR, `${d.id}.json`);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });
  }
}

/**
 * Get last N decisions
 */
function getRecentDecisions(n = 10) {
  return getAllDecisions().slice(0, n);
}

/**
 * Check if a decision log exists for current staged changes
 * (Used by git hook to enforce decision logging)
 */
function hasRecentDecision(withinMinutes = 30) {
  const decisions = getRecentDecisions(5);
  if (decisions.length === 0) return false;

  const latest = decisions[0];
  const latestTime = new Date(latest.timestamp).getTime();
  const now = Date.now();
  const diffMinutes = (now - latestTime) / 60000;

  return diffMinutes <= withinMinutes;
}

/**
 * Generate a summary of recent decisions
 */
function generateSummary(n = 10) {
  const decisions = getRecentDecisions(n);

  if (decisions.length === 0) {
    return "No decisions logged yet.";
  }

  let summary = `📋 ASANMOD v1.1.1 Decision Log (Last ${decisions.length})\n`;
  summary += "═".repeat(50) + "\n\n";

  decisions.forEach((d, i) => {
    const date = new Date(d.timestamp).toLocaleString("tr-TR");
    summary += `${i + 1}. [${d.id}] ${date}\n`;
    summary += `   Option: ${d.option || "-"} | Task: ${d.taskId || "-"}\n`;
    summary += `   ${d.summary || d.reasoning || "(no summary)"}\n`;
    if (d.files.length > 0) {
      summary += `   Files: ${d.files.slice(0, 3).join(", ")}${d.files.length > 3 ? "..." : ""}\n`;
    }
    summary += "\n";
  });

  return summary;
}

/**
 * Extract decision info from commit message
 */
function extractDecisionFromCommit(commitMessage) {
  const optionMatch = commitMessage.match(/\[Option:\s*([1-5])\]/i);
  const taskMatch = commitMessage.match(/^ID:\s*([A-Z0-9-]+)/i);

  return {
    option: optionMatch ? parseInt(optionMatch[1], 10) : null,
    taskId: taskMatch ? taskMatch[1] : null,
    summary: commitMessage.replace(/^ID:\s*[A-Z0-9-]+\s*\|\s*/i, "").trim(),
  };
}

// CLI interface
if (require.main === module) {
  const action = process.argv[2];
  const arg = process.argv[3];

  const actions = {
    log: () => {
      // Quick log from command line
      const reasoning = arg || "Manual decision log";
      const id = logDecision({
        reasoning,
        agent: "CLI",
        option: null,
      });
      console.log(`✅ Decision logged: ${id}`);
    },

    "log-commit": () => {
      // Log from commit message file
      if (!arg || !fs.existsSync(arg)) {
        console.error(
          "Usage: node decision-logger.cjs log-commit <commit-msg-file>",
        );
        process.exit(1);
      }
      const commitMsg = fs.readFileSync(arg, "utf-8");
      const extracted = extractDecisionFromCommit(commitMsg);

      const id = logDecision({
        ...extracted,
        reasoning: extracted.summary,
        agent: "GitHook",
      });
      console.log(`✅ Decision logged from commit: ${id}`);
    },

    list: () => {
      const n = parseInt(arg, 10) || 10;
      console.log(generateSummary(n));
    },

    check: () => {
      // Check if recent decision exists (for git hook)
      const minutes = parseInt(arg, 10) || 30;
      const hasRecent = hasRecentDecision(minutes);
      console.log(JSON.stringify({ hasRecentDecision: hasRecent }));
      process.exit(hasRecent ? 0 : 1);
    },

    get: () => {
      // Get specific decision
      if (!arg) {
        console.error("Usage: node decision-logger.cjs get <decision-id>");
        process.exit(1);
      }
      const filepath = path.join(CONFIG.DECISIONS_DIR, `${arg}.json`);
      if (!fs.existsSync(filepath)) {
        console.error(`Decision not found: ${arg}`);
        process.exit(1);
      }
      console.log(fs.readFileSync(filepath, "utf-8"));
    },
  };

  if (actions[action]) {
    actions[action]();
  } else {
    console.log(`Usage: node decision-logger.cjs <action> [arg]
Actions:
  log [reasoning]              - Log a new decision manually
  log-commit <commit-msg-file> - Log decision from commit message
  list [n]                     - Show last N decisions (default: 10)
  check [minutes]              - Check if recent decision exists (exit 1 if not)
  get <decision-id>            - Get specific decision details`);
  }
}

module.exports = {
  logDecision,
  getAllDecisions,
  getRecentDecisions,
  hasRecentDecision,
  generateSummary,
  extractDecisionFromCommit,
};
