/**
 * ASANMOD v1.1.1: INTERACTION GUARD
 * Forces agent to present options before large changes.
 *
 * ASANMOD Hard Constraint: Large commits without option selection are REJECTED
 *
 * Options Matrix:
 * [1] Minimal     - Quick patch, minimal changes
 * [2] Standard    - ASANMOD best practice
 * [3] Refactor    - Deep cleanup, structural changes
 * [4] Spec Draft  - Explain understanding first (no code)
 * [5] Reset       - Clear intent, start over
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const CONFIG = {
  // Threshold: commits with more than this many changed lines require option selection
  LINE_THRESHOLD: parseInt(
    process.env.ASANMOD_INTERACTION_THRESHOLD || "50",
    10,
  ),
  // Pattern to detect option selection in commit message
  OPTION_PATTERN: /\[Option:\s*([1-5])\]/i,
  // Alternative patterns
  ALT_PATTERNS: [/Option:\s*([1-5])/i, /\(([1-5])\)/, /seçenek:\s*([1-5])/i],
  // Files that always require option selection regardless of size
  CRITICAL_FILES: [
    "prisma/schema.prisma",
    "ecosystem.config.cjs",
    "package.json",
    ".env.prod",
  ],
};

/**
 * Get the number of changed lines in staged files
 */
function getStagedChangesStats() {
  try {
    const diffStat = execSync("git diff --cached --numstat", {
      encoding: "utf-8",
    });

    let totalAdded = 0;
    let totalDeleted = 0;
    const files = [];

    diffStat
      .trim()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        const [added, deleted, file] = line.split("\t");
        if (added !== "-" && deleted !== "-") {
          totalAdded += parseInt(added, 10);
          totalDeleted += parseInt(deleted, 10);
          files.push(file);
        }
      });

    return {
      totalAdded,
      totalDeleted,
      totalChanged: totalAdded + totalDeleted,
      files,
    };
  } catch {
    return { totalAdded: 0, totalDeleted: 0, totalChanged: 0, files: [] };
  }
}

/**
 * Check if any critical files are in the staged changes
 */
function hasCriticalFiles(files) {
  return files.some((file) =>
    CONFIG.CRITICAL_FILES.some(
      (critical) => file.endsWith(critical) || file.includes(critical),
    ),
  );
}

/**
 * Extract option number from commit message
 */
function extractOption(commitMessage) {
  // Try main pattern
  let match = commitMessage.match(CONFIG.OPTION_PATTERN);
  if (match) return parseInt(match[1], 10);

  // Try alternative patterns
  for (const pattern of CONFIG.ALT_PATTERNS) {
    match = commitMessage.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Main check function
 * @param {string} commitMessage - The commit message to check
 * @returns {{ pass: boolean, reason: string | null, stats: object }}
 */
function checkInteraction(commitMessage) {
  const stats = getStagedChangesStats();
  const isCritical = hasCriticalFiles(stats.files);
  const isLargeChange = stats.totalChanged > CONFIG.LINE_THRESHOLD;
  const selectedOption = extractOption(commitMessage);

  // Small change, no critical files = pass without option
  if (!isLargeChange && !isCritical) {
    return {
      pass: true,
      reason: null,
      stats,
      requiresOption: false,
    };
  }

  // Large change or critical file, but has option = pass
  if (selectedOption) {
    return {
      pass: true,
      reason: null,
      stats,
      requiresOption: true,
      selectedOption,
    };
  }

  // Large change or critical file WITHOUT option = FAIL
  const reason = isCritical
    ? `Critical file(s) modified. Option selection required.\nFiles: ${stats.files.filter((f) => CONFIG.CRITICAL_FILES.some((c) => f.includes(c))).join(", ")}`
    : `Large change (${stats.totalChanged} lines > ${CONFIG.LINE_THRESHOLD} threshold). Option selection required.`;

  return {
    pass: false,
    reason,
    stats,
    requiresOption: true,
  };
}

/**
 * Print the options menu
 */
function printOptionsMenu() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🎯 ASANMOD v1.1.1: INTERACTION REQUIRED                        ║
╠══════════════════════════════════════════════════════════════╣
║  Bu değişiklik büyük veya kritik dosya içeriyor.             ║
║  Lütfen commit mesajına seçenek ekleyin:                     ║
║                                                              ║
║  [1] Minimal    → Hızlı yama, minimum değişiklik             ║
║  [2] Standard   → ASANMOD best practice                      ║
║  [3] Refactor   → Derin temizlik, yapısal değişiklik         ║
║  [4] Spec Draft → Anladığımı özetle (kod yazma)              ║
║  [5] Reset      → Niyeti temizle, baştan başla               ║
║                                                              ║
║  Örnek commit: "ID: FEAT-001 | Login [Option: 2]"            ║
╚══════════════════════════════════════════════════════════════╝
`);
}

// CLI interface
if (require.main === module) {
  const action = process.argv[2];

  if (action === "check") {
    // Check mode: validate commit message
    const commitMsgFile = process.argv[3];
    if (!commitMsgFile || !fs.existsSync(commitMsgFile)) {
      console.error(
        "Usage: node interaction-guard.cjs check <commit-msg-file>",
      );
      process.exit(1);
    }

    const commitMessage = fs.readFileSync(commitMsgFile, "utf-8");
    const result = checkInteraction(commitMessage);

    if (!result.pass) {
      console.log(`❌ ASANMOD INTERACTION BLOCK: ${result.reason}`);
      printOptionsMenu();
      process.exit(1);
    }

    if (result.selectedOption) {
      console.log(
        `✅ ASANMOD INTERACTION: Option ${result.selectedOption} selected`,
      );
    }
    process.exit(0);
  } else if (action === "stats") {
    // Stats mode: show current staged changes
    const stats = getStagedChangesStats();
    console.log(JSON.stringify(stats, null, 2));
  } else if (action === "menu") {
    // Menu mode: just show the options
    printOptionsMenu();
  } else {
    console.log(`Usage: node interaction-guard.cjs <action>
Actions:
  check <commit-msg-file>  - Check if commit requires option (exit 1 if blocked)
  stats                    - Show staged changes statistics
  menu                     - Show options menu`);
  }
}

module.exports = { checkInteraction, extractOption, getStagedChangesStats };
