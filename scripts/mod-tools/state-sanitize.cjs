#!/usr/bin/env node

/**
 * ASANMOD v1.1.1 - State Sanitizer
 *
 * Cleans up stale tasks and manages state file hygiene.
 * - Marks tasks older than 24h as stale
 * - Limits history to 5 entries
 * - Resets to idle if task is stale
 *
 * Usage: node scripts/mod-tools/state-sanitize.cjs
 */

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "../../.state/active-task.json");
const TTL_HOURS = 24;
const MAX_HISTORY = 5;

function loadState() {
  try {
    const content = fs.readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}

function isStale(timestamp) {
  if (!timestamp) return false;
  const taskTime = new Date(timestamp).getTime();
  const now = Date.now();
  const hoursDiff = (now - taskTime) / (1000 * 60 * 60);
  return hoursDiff > TTL_HOURS;
}

function sanitize() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  🧹 ASANMOD v1.1.1 STATE SANITIZER                       ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");

  const state = loadState();

  if (!state) {
    console.log("⚠️  No state file found. Nothing to sanitize.");
    return;
  }

  let changes = 0;

  // Check for stale task
  if (state.startTime && isStale(state.startTime)) {
    console.log(
      `🕐 Task started at ${state.startTime} is stale (>${TTL_HOURS}h)`,
    );
    console.log("   Resetting to idle...");

    // Add to history before resetting
    if (state.taskId && state.history) {
      state.history.unshift({
        timestamp: new Date().toISOString(),
        entry: `[STALE] Task "${state.taskId}" auto-closed after ${TTL_HOURS}h timeout.`,
      });
    }

    state.taskId = null;
    state.status = "idle";
    state.startTime = null;
    state.phase = null;
    changes++;
  }

  // Limit history
  if (state.history && state.history.length > MAX_HISTORY) {
    const removed = state.history.length - MAX_HISTORY;
    state.history = state.history.slice(0, MAX_HISTORY);
    console.log(
      `📜 Trimmed history: removed ${removed} old entries (limit: ${MAX_HISTORY})`,
    );
    changes++;
  }

  // Update handover timestamp
  if (state.handover) {
    state.handover.lastSnapshot = new Date().toISOString();
  }

  if (changes > 0) {
    saveState(state);
    console.log("");
    console.log(`✅ State sanitized. ${changes} change(s) made.`);
  } else {
    console.log("✅ State is clean. No changes needed.");
  }

  console.log("");
  console.log("📊 Current State:");
  console.log(`   Task ID: ${state.taskId || "null (idle)"}`);
  console.log(`   Status: ${state.status}`);
  console.log(
    `   History entries: ${state.history?.length || 0}/${MAX_HISTORY}`,
  );
}

sanitize();
