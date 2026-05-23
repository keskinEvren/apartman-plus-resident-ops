/**
 * ASANMOD v1.1.1: STATE MANAGER
 * Captures system snapshots, manages agent state with TTL enforcement.
 *
 * ASANMOD Hard Constraint: Stale state (>30min) blocks operations
 */
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

// Protocol Configuration
const CONFIG = {
  STATE_DIR: path.join(process.cwd(), ".asanmod", "state"),
  STATE_FILE: path.join(process.cwd(), ".asanmod", "state", "active-task.json"),
  LEGACY_STATE_FILE: path.join(process.cwd(), ".state", "active-task.json"),
  TTL_MINUTES: parseInt(process.env.ASANMOD_STATE_TTL || "30", 10),
};

/**
 * Protocol State Schema
 */
const DEFAULT_STATE = {
  taskId: null,
  status: "idle", // idle | in-progress | stale | handover-pending
  startTime: null,
  phase: null,
  currentFile: null,
  lastAction: null,
  confidence: null,
  subTasks: [],
  handover: {
    prevAgent: null,
    nextAgent: null,
    lastSnapshot: null,
  },
  context: {
    criticalFiles: [],
    knownIssues: [],
  },
  history: [],
  _meta: {
    version: "1.1.1",
    lastUpdated: null,
    ttlMinutes: CONFIG.TTL_MINUTES,
  },
};

class StateManager {
  constructor() {
    this.ensureStateDir();
  }

  ensureStateDir() {
    if (!fs.existsSync(CONFIG.STATE_DIR)) {
      fs.mkdirSync(CONFIG.STATE_DIR, { recursive: true });
    }
  }

  /**
   * Get current state, with TTL check
   * @returns {{ state: object, isStale: boolean, minutesOld: number }}
   */
  getState() {
    let state = { ...DEFAULT_STATE };

    // Try Protocol location first, then legacy
    const stateFile = fs.existsSync(CONFIG.STATE_FILE)
      ? CONFIG.STATE_FILE
      : fs.existsSync(CONFIG.LEGACY_STATE_FILE)
        ? CONFIG.LEGACY_STATE_FILE
        : null;

    if (stateFile) {
      try {
        state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
      } catch {
        // Use default
      }
    }

    // Calculate staleness
    const lastUpdated = state._meta?.lastUpdated || state.startTime;
    let isStale = false;
    let minutesOld = 0;

    if (lastUpdated && state.status === "in-progress") {
      const diffMs = Date.now() - new Date(lastUpdated).getTime();
      minutesOld = Math.floor(diffMs / 60000);
      isStale = minutesOld > CONFIG.TTL_MINUTES;

      // Auto-mark stale
      if (isStale && state.status !== "stale") {
        state.status = "stale";
        state._meta = state._meta || {};
        state._meta.markedStaleAt = new Date().toISOString();
        this.saveState(state);
      }
    }

    return { state, isStale, minutesOld };
  }

  /**
   * Save state to disk
   */
  saveState(state) {
    state._meta = state._meta || {};
    state._meta.lastUpdated = new Date().toISOString();
    state._meta.version = "1.1.1";
    state._meta.ttlMinutes = CONFIG.TTL_MINUTES;

    fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2));
    return true;
  }

  /**
   * Start a new task
   */
  startTask(taskId, phase = null) {
    const { state } = this.getState();

    state.taskId = taskId;
    state.status = "in-progress";
    state.startTime = new Date().toISOString();
    state.phase = phase;
    state.currentFile = null;
    state.lastAction = "task_started";
    state.confidence = null;
    state.subTasks = [];

    // Add to history
    state.history = state.history || [];
    state.history.unshift({
      timestamp: new Date().toISOString(),
      entry: `Task ${taskId} started`,
    });
    if (state.history.length > 10) state.history = state.history.slice(0, 10);

    this.saveState(state);
    return state;
  }

  /**
   * Update current task progress
   */
  updateProgress(updates) {
    const { state, isStale } = this.getState();

    if (isStale) {
      return { success: false, error: "STATE_STALE", state };
    }

    Object.assign(state, updates);
    state.lastAction = updates.lastAction || state.lastAction;
    this.saveState(state);

    return { success: true, state };
  }

  /**
   * Complete current task
   */
  completeTask(summary) {
    const { state } = this.getState();

    state.status = "idle";
    state.taskId = null;
    state.phase = null;
    state.currentFile = null;

    state.history = state.history || [];
    state.history.unshift({
      timestamp: new Date().toISOString(),
      entry: summary,
    });
    if (state.history.length > 10) state.history = state.history.slice(0, 10);

    this.saveState(state);
    return state;
  }

  /**
   * Refresh TTL (heartbeat)
   */
  heartbeat() {
    const { state, isStale } = this.getState();

    if (isStale) {
      return { success: false, error: "STATE_STALE" };
    }

    // Just save to update lastUpdated
    this.saveState(state);
    return { success: true };
  }

  /**
   * Force reset stale state (user-only action)
   */
  forceReset() {
    const state = { ...DEFAULT_STATE };
    state.history = [
      {
        timestamp: new Date().toISOString(),
        entry: "State force-reset by user",
      },
    ];
    this.saveState(state);
    return state;
  }

  /**
   * Check if operations should be blocked (for verify-core integration)
   * @returns {{ blocked: boolean, reason: string | null }}
   */
  checkBlock() {
    const { state, isStale, minutesOld } = this.getState();

    if (isStale) {
      return {
        blocked: true,
        reason: `State is STALE (${minutesOld} min old, TTL: ${CONFIG.TTL_MINUTES} min). Run: npm run state:reset`,
      };
    }

    return { blocked: false, reason: null };
  }

  /**
   * Capture system snapshot
   */
  async captureSnapshot() {
    try {
      const pm2Status = await execAsync("pm2 jlist").catch(() => ({
        stdout: "[]",
      }));
      const gitStatus = await execAsync("git status --porcelain").catch(() => ({
        stdout: "",
      }));

      return {
        timestamp: new Date().toISOString(),
        pm2: JSON.parse(pm2Status.stdout || "[]"),
        git: (gitStatus.stdout || "").trim().split("\n").filter(Boolean),
        env: process.env.APP_ENV || "unknown",
      };
    } catch {
      return null;
    }
  }

  /**
   * Initiate handover to another agent
   */
  async handover(nextAgentName) {
    const snapshot = await this.captureSnapshot();
    const { state } = this.getState();

    state.status = "handover-pending";
    state.handover = {
      prevAgent: "CurrentAgent",
      nextAgent: nextAgentName,
      lastSnapshot: snapshot?.timestamp || new Date().toISOString(),
    };

    this.saveState(state);
    return state;
  }
}

// CLI interface
if (require.main === module) {
  const manager = new StateManager();
  const action = process.argv[2];
  const arg = process.argv[3];

  const actions = {
    status: () => {
      const { state, isStale, minutesOld } = manager.getState();
      console.log(
        JSON.stringify(
          { ...state, _stale: isStale, _age: minutesOld },
          null,
          2,
        ),
      );
    },
    check: () => {
      const result = manager.checkBlock();
      console.log(JSON.stringify(result, null, 2));
      if (result.blocked) process.exit(1);
    },
    start: () => {
      const state = manager.startTask(arg || "UNNAMED");
      console.log(`Task ${arg} started`);
    },
    complete: () => {
      manager.completeTask(arg || "Task completed");
      console.log("Task completed");
    },
    heartbeat: () => {
      const result = manager.heartbeat();
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exit(1);
    },
    reset: () => {
      manager.forceReset();
      console.log("State reset to default");
    },
    snapshot: async () => {
      const snapshot = await manager.captureSnapshot();
      console.log(JSON.stringify(snapshot, null, 2));
    },
  };

  if (actions[action]) {
    Promise.resolve(actions[action]()).catch(console.error);
  } else {
    console.log(`Usage: node state-manager-Protocol.cjs <action> [arg]
Actions:
  status    - Show current state with staleness info
  check     - Check if operations are blocked (exit 1 if blocked)
  start     - Start a new task
  complete  - Complete current task
  heartbeat - Refresh TTL
  reset     - Force reset state (user-only)
  snapshot  - Capture system snapshot`);
  }
}

module.exports = StateManager;
