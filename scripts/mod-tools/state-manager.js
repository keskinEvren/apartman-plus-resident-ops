/**
 * ASANMOD v1.1.1: STATE MANAGER
 * Captures system snapshots and manages agent handover state.
 */
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

class StateManager {
  static STATE_FILE = "./state/active-task.json";

  async captureSnapshot() {
    try {
      const pm2Status = await execAsync("pm2 jlist");
      const gitStatus = await execAsync("git status --porcelain");

      const snapshot = {
        timestamp: new Date().toISOString(),
        pm2: JSON.parse(pm2Status.stdout),
        git: gitStatus.stdout.trim().split("\n").filter(Boolean),
        env: process.env.APP_ENV || "unknown",
      };

      return snapshot;
    } catch (error) {
      console.error("Failed to capture snapshot:", error);
      return null;
    }
  }

  async updateTaskState(update) {
    try {
      const currentData = JSON.parse(
        await fs.readFile(StateManager.STATE_FILE, "utf-8"),
      );
      const newData = {
        ...currentData,
        ...update,
        lastUpdated: new Date().toISOString(),
      };
      await fs.writeFile(
        StateManager.STATE_FILE,
        JSON.stringify(newData, null, 2),
      );
      return true;
    } catch (error) {
      console.error("Failed to update task state:", error);
      return false;
    }
  }

  async handover(nextAgentName) {
    const snapshot = await this.captureSnapshot();
    return this.updateTaskState({
      status: "handover-pending",
      handover: {
        prevAgent: "Antigravity",
        nextAgent: nextAgentName,
        lastSnapshot: snapshot,
      },
    });
  }
}

const manager = new StateManager();

if (process.argv[1].endsWith("state-manager.js")) {
  const action = process.argv[2];
  if (action === "snapshot") {
    manager
      .captureSnapshot()
      .then((s) => console.log(JSON.stringify(s, null, 2)));
  }
}

export default manager;
