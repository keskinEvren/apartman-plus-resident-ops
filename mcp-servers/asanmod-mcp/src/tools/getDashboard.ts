/**
 * Unified Status Dashboard
 * Tüm durumu tek seferde döner (PM2, git, tasks hepsi bir arada)
 * WORKER system removed - MOD-only (2026-12-17)
 */

import { sessionStart } from "./sessionStart.js";
import { verifyPM2Health } from "./verifyPM2Health.js";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { gitStatusMCP, gitLogMCP } from "../utils/mcpClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DashboardResult {
  success: boolean;
  timestamp: string;
  pm2: {
    status: "healthy" | "warning" | "error";
    processes: Array<{
      name: string;
      status: string;
      cpu?: string;
      memory?: string;
      uptime?: string;
    }>;
    online: number;
    total: number;
    details?: any;
  };
  git: {
    lastCommit: string;
    lastCommitDate: string;
    commits24h: number;
    branch: string;
    uncommittedFiles: number;
  };
  tasks: {
    pending: {
      total: number;
      high: number;
      medium: number;
      low: number;
    };
    completed: {
      last24h: number;
      total: number;
    };
  };
  mod: {
    lastAction: string;
    lastCommit: string;
    commitCount: number;
    lastActivity: string;
  };
  summary: {
    overallStatus: "healthy" | "warning" | "error";
    issues: string[];
    recommendations: string[];
  };
  error?: string;
}

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || path.join(__dirname, "../../../..");

export async function getDashboard(): Promise<DashboardResult> {
  const timestamp = new Date().toISOString();
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // PARALLEL EXECUTION: PM2, Git Status, Session Start run simultaneously (3x faster!)
    const [pm2Result, gitStatusResult, sessionDataResult] =
      await Promise.allSettled([
        verifyPM2Health("both"),
        // Git Status (Git MCP - Phase 3.2)
        getGitStatus().catch(() => ({
          lastCommit: "",
          lastCommitDate: "",
          commits24h: 0,
          branch: "",
          uncommittedFiles: 0,
        })),
        sessionStart(),
      ]);

    // 1. PM2 Status
    let pm2ResultValue: any = { processes: [], offline: 0 };
    if (pm2Result.status === "fulfilled") {
      pm2ResultValue = pm2Result.value;
    }
    const pm2Processes = pm2ResultValue.processes || [];
    const offlineCount = pm2ResultValue.offline || 0;
    const onlineCount = pm2Processes.length - offlineCount;
    const pm2Status =
      offlineCount === 0
        ? "healthy"
        : offlineCount < pm2Processes.length
          ? "warning"
          : "error";

    if (offlineCount > 0) {
      issues.push(`${offlineCount} PM2 process(es) offline`);
      recommendations.push("Check PM2 logs and restart offline processes");
    }

    // 2. Git Status
    const gitStatus =
      gitStatusResult.status === "fulfilled"
        ? gitStatusResult.value
        : {
            lastCommit: "",
            lastCommitDate: "",
            commits24h: 0,
            branch: "",
            uncommittedFiles: 0,
          };

    if (gitStatus.uncommittedFiles > 0) {
      issues.push(`${gitStatus.uncommittedFiles} uncommitted file(s)`);
      recommendations.push("Commit or stash uncommitted changes");
    }

    // 3. Tasks Status (from sessionStart)
    const sessionData =
      sessionDataResult.status === "fulfilled"
        ? sessionDataResult.value
        : {
            projectContext: {
              pendingTasks: {
                total: 0,
                high: 0,
                medium: 0,
                low: 0,
                completed: 0,
              },
              stateFile: { mod: {} },
            },
          };
    const tasks = sessionData.projectContext?.pendingTasks || {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      completed: 0,
    };

    // Calculate completed tasks total from git history - only [MOD] commits (Git MCP - Phase 3.2)
    let completedTotal = 0;
    try {
      const commits = await gitLogMCP(
        {
          grep: "[MOD]",
          since: "30 days ago",
          oneline: true,
          format: "hash",
        },
        PROJECT_ROOT
      );
      completedTotal = commits.length;
    } catch (error) {
      completedTotal = 0;
    }

    if (tasks.high > 0) {
      issues.push(`${tasks.high} high priority task(s) pending`);
      recommendations.push("Address high priority tasks first");
    }

    // 4. MOD Status (workers removed)
    const mod = sessionData.projectContext?.stateFile?.mod || {
      lastAction: "N/A",
      lastCommit: "N/A",
      commitCount: 0,
      lastActivity: timestamp,
    };

    // 5. Overall Status
    const overallStatus =
      pm2Status === "error" || tasks.high > 0 || gitStatus.uncommittedFiles > 10
        ? "error"
        : pm2Status === "warning" ||
            tasks.medium > 5 ||
            gitStatus.uncommittedFiles > 5
          ? "warning"
          : "healthy";

    return {
      success: true,
      timestamp,
      pm2: {
        status: pm2Status,
        processes: pm2Processes,
        online: onlineCount,
        total: pm2Processes.length,
        details: pm2Result,
      },
      git: gitStatus,
      tasks: {
        pending: {
          total: tasks.total,
          high: tasks.high,
          medium: tasks.medium,
          low: tasks.low,
        },
        completed: {
          last24h: tasks.completed || 0,
          total: completedTotal,
        },
      },
      mod,
      summary: {
        overallStatus,
        issues,
        recommendations,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      timestamp,
      pm2: {
        status: "error",
        processes: [],
        online: 0,
        total: 0,
      },
      git: {
        lastCommit: "",
        lastCommitDate: "",
        commits24h: 0,
        branch: "",
        uncommittedFiles: 0,
      },
      tasks: {
        pending: { total: 0, high: 0, medium: 0, low: 0 },
        completed: { last24h: 0, total: 0 },
      },
      mod: {
        lastAction: "N/A",
        lastCommit: "N/A",
        commitCount: 0,
        lastActivity: timestamp,
      },
      summary: {
        overallStatus: "error",
        issues: [error.message],
        recommendations: [],
      },
      error: error.message,
    };
  }
}

async function getGitStatus() {
  try {
    // Get git status using Git MCP (Phase 3.2)
    const [gitStatus, lastCommitLog, commits24hLog] = await Promise.all([
      gitStatusMCP(PROJECT_ROOT),
      gitLogMCP({ limit: 1, format: "hash" }, PROJECT_ROOT),
      gitLogMCP(
        { since: "1 day ago", oneline: true, format: "hash" },
        PROJECT_ROOT
      ),
    ]);

    const lastCommit = lastCommitLog[0]?.hash || "";
    const lastCommitDate = lastCommitLog[0]?.date || "";
    const commits24h = commits24hLog.length;
    const branch = gitStatus.branch;
    const uncommittedFiles = gitStatus.uncommittedFiles;

    return {
      lastCommit,
      lastCommitDate,
      commits24h,
      branch,
      uncommittedFiles,
    };
  } catch (error) {
    return {
      lastCommit: "",
      lastCommitDate: "",
      commits24h: 0,
      branch: "",
      uncommittedFiles: 0,
    };
  }
}
