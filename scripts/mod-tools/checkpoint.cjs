/**
 * ASANMOD v1.1.1: CHECKPOINT MANAGER
 * Creates restore points before risky operations.
 *
 * ASANMOD Safety Net: Auto-rollback on verification failure
 *
 * Checkpoint Types:
 * - FILE: Backup specific files
 * - GIT: Create a temporary git stash/commit
 * - FULL: Full directory snapshot
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

// Configuration
const CONFIG = {
  CHECKPOINTS_DIR: path.join(process.cwd(), ".asanmod", "checkpoints"),
  MAX_CHECKPOINTS: 10, // Keep last 10 checkpoints
  MAX_AGE_HOURS: 24, // Auto-cleanup checkpoints older than 24h
};

/**
 * Generate a unique checkpoint ID
 */
function generateCheckpointId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(2).toString("hex");
  return `CP-${timestamp}-${random}`.toUpperCase();
}

/**
 * Ensure checkpoints directory exists
 */
function ensureDir() {
  if (!fs.existsSync(CONFIG.CHECKPOINTS_DIR)) {
    fs.mkdirSync(CONFIG.CHECKPOINTS_DIR, { recursive: true });
  }
}

/**
 * Create a checkpoint for specific files
 * @param {string[]} files - Array of file paths to backup
 * @param {string} reason - Reason for checkpoint
 * @returns {string} - Checkpoint ID
 */
function createCheckpoint(files, reason = "Manual checkpoint") {
  ensureDir();

  const id = generateCheckpointId();
  const timestamp = new Date().toISOString();
  const checkpointDir = path.join(CONFIG.CHECKPOINTS_DIR, id);

  fs.mkdirSync(checkpointDir, { recursive: true });

  const manifest = {
    id,
    timestamp,
    reason,
    files: [],
    gitRef: getGitRef(),
    status: "ACTIVE",
  };

  // Copy files
  files.forEach((file) => {
    const absPath = path.isAbsolute(file)
      ? file
      : path.join(process.cwd(), file);
    if (fs.existsSync(absPath)) {
      const relativePath = path.relative(process.cwd(), absPath);
      const backupPath = path.join(checkpointDir, relativePath);
      const backupDir = path.dirname(backupPath);

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      fs.copyFileSync(absPath, backupPath);
      manifest.files.push({
        original: relativePath,
        backup: path.relative(checkpointDir, backupPath),
        size: fs.statSync(absPath).size,
      });
    }
  });

  // Save manifest
  fs.writeFileSync(
    path.join(checkpointDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Cleanup old checkpoints
  cleanupOldCheckpoints();

  return id;
}

/**
 * Get current git reference
 */
function getGitRef() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * Restore a checkpoint
 * @param {string} checkpointId - Checkpoint ID to restore
 * @returns {boolean} - Success status
 */
function restoreCheckpoint(checkpointId) {
  const checkpointDir = path.join(CONFIG.CHECKPOINTS_DIR, checkpointId);
  const manifestPath = path.join(checkpointDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error(`Checkpoint not found: ${checkpointId}`);
    return false;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  manifest.files.forEach((file) => {
    const backupPath = path.join(checkpointDir, file.backup);
    const originalPath = path.join(process.cwd(), file.original);

    if (fs.existsSync(backupPath)) {
      const originalDir = path.dirname(originalPath);
      if (!fs.existsSync(originalDir)) {
        fs.mkdirSync(originalDir, { recursive: true });
      }
      fs.copyFileSync(backupPath, originalPath);
    }
  });

  // Mark as restored
  manifest.status = "RESTORED";
  manifest.restoredAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return true;
}

/**
 * Delete a checkpoint
 */
function deleteCheckpoint(checkpointId) {
  const checkpointDir = path.join(CONFIG.CHECKPOINTS_DIR, checkpointId);
  if (fs.existsSync(checkpointDir)) {
    fs.rmSync(checkpointDir, { recursive: true });
    return true;
  }
  return false;
}

/**
 * List all checkpoints
 */
function listCheckpoints() {
  ensureDir();
  const dirs = fs
    .readdirSync(CONFIG.CHECKPOINTS_DIR)
    .filter((d) => d.startsWith("CP-"));

  return dirs
    .map((d) => {
      const manifestPath = path.join(
        CONFIG.CHECKPOINTS_DIR,
        d,
        "manifest.json",
      );
      if (fs.existsSync(manifestPath)) {
        try {
          return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        } catch {
          return null;
        }
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Cleanup old checkpoints
 */
function cleanupOldCheckpoints() {
  const checkpoints = listCheckpoints();

  // Remove excess checkpoints
  if (checkpoints.length > CONFIG.MAX_CHECKPOINTS) {
    const toDelete = checkpoints.slice(CONFIG.MAX_CHECKPOINTS);
    toDelete.forEach((cp) => deleteCheckpoint(cp.id));
  }

  // Remove old checkpoints
  const maxAge = CONFIG.MAX_AGE_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  checkpoints.forEach((cp) => {
    const age = now - new Date(cp.timestamp).getTime();
    if (age > maxAge && cp.status !== "RESTORED") {
      deleteCheckpoint(cp.id);
    }
  });
}

/**
 * Create checkpoint from staged git files
 */
function createFromStaged(reason = "Pre-commit checkpoint") {
  try {
    const staged = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);

    if (staged.length === 0) {
      console.log("No staged files to checkpoint");
      return null;
    }

    return createCheckpoint(staged, reason);
  } catch {
    return null;
  }
}

// CLI interface
if (require.main === module) {
  const action = process.argv[2];
  const arg = process.argv[3];

  const actions = {
    create: () => {
      const files = process.argv.slice(3);
      if (files.length === 0) {
        console.error("Usage: node checkpoint.cjs create <file1> [file2] ...");
        process.exit(1);
      }
      const id = createCheckpoint(files, "CLI checkpoint");
      console.log(`✅ Checkpoint created: ${id}`);
    },

    "create-staged": () => {
      const id = createFromStaged(arg || "Pre-commit checkpoint");
      if (id) {
        console.log(`✅ Checkpoint created from staged files: ${id}`);
      } else {
        console.log("No staged files to checkpoint");
      }
    },

    restore: () => {
      if (!arg) {
        console.error("Usage: node checkpoint.cjs restore <checkpoint-id>");
        process.exit(1);
      }
      const success = restoreCheckpoint(arg);
      if (success) {
        console.log(`✅ Checkpoint restored: ${arg}`);
      } else {
        console.error(`❌ Failed to restore: ${arg}`);
        process.exit(1);
      }
    },

    delete: () => {
      if (!arg) {
        console.error("Usage: node checkpoint.cjs delete <checkpoint-id>");
        process.exit(1);
      }
      const success = deleteCheckpoint(arg);
      if (success) {
        console.log(`✅ Checkpoint deleted: ${arg}`);
      } else {
        console.error(`❌ Checkpoint not found: ${arg}`);
        process.exit(1);
      }
    },

    list: () => {
      const checkpoints = listCheckpoints();
      if (checkpoints.length === 0) {
        console.log("No checkpoints found");
        return;
      }

      console.log(`📦 ASANMOD v1.1.1 Checkpoints (${checkpoints.length})\n`);
      checkpoints.forEach((cp, i) => {
        const date = new Date(cp.timestamp).toLocaleString("tr-TR");
        const files = cp.files.length;
        console.log(`${i + 1}. [${cp.id}] ${date}`);
        console.log(`   Status: ${cp.status} | Files: ${files}`);
        console.log(`   Reason: ${cp.reason}\n`);
      });
    },

    cleanup: () => {
      cleanupOldCheckpoints();
      console.log("✅ Old checkpoints cleaned up");
    },
  };

  if (actions[action]) {
    actions[action]();
  } else {
    console.log(`Usage: node checkpoint.cjs <action> [args]
Actions:
  create <file1> [file2] ...  - Create checkpoint for specific files
  create-staged [reason]      - Create checkpoint from staged git files
  restore <checkpoint-id>     - Restore files from checkpoint
  delete <checkpoint-id>      - Delete a checkpoint
  list                        - List all checkpoints
  cleanup                     - Remove old checkpoints`);
  }
}

module.exports = {
  createCheckpoint,
  restoreCheckpoint,
  deleteCheckpoint,
  listCheckpoints,
  createFromStaged,
  cleanupOldCheckpoints,
};
