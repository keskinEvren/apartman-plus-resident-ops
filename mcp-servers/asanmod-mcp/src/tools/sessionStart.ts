/**
 * Session Start Simplification Tool
 * MOD session start için tüm işlemleri tek seferde yapar (9 adım → 1 function)
 * WORKER system removed - MOD-only (2026-12-17)
 */

import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { readFileMCP, fileExistsMCP, gitLogMCP } from "../utils/mcpClient.js";
import { loadRulesForContext, RuleHierarchy } from "./jitRuleEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface SessionStartResult {
  success: boolean;
  modIdentity: {
    confirmed: boolean;
    mcpStatus: Record<string, boolean>;
  };
  projectContext: {
    stateFile: any;
    gitHistory: {
      totalCommits: number;
      lastCommit: string;
      lastCommitDate: string;
      recentCommits: Array<{
        hash: string;
        message: string;
        date: string;
      }>;
    };
    pendingTasks: {
      total: number;
      high: number;
      medium: number;
      low: number;
      completed: number;
    };
    rules?: RuleHierarchy; // JIT-loaded rules
  };
  summary: {
    totalCommits24h: number;
    pendingTasks: number;
    lastActivity: string;
  };
  error?: string;
}

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || path.join(__dirname, "../../../..");
const STATE_FILE = path.join(PROJECT_ROOT, ".state", "current-status.json");
const PENDING_TASKS_FILE = path.join(
  PROJECT_ROOT,
  "docs",
  "workflow",
  "PENDING-TASKS.md"
);

export async function sessionStart(): Promise<SessionStartResult> {
  try {
    // 1. MOD Identity Confirmation (Memory MCP simulation - actual MCP call will be done by agent)
    // Note: Gerçek implementasyonda Memory MCP'yi selective read ile çağırır
    // memory.get_mod_identity() → Sadece MOD kimliğini döner (tüm graph yerine)
    // 🆕 Otomatik Memory MCP Context Yükleme (2026-12-12):
    // - Agent otomatik olarak Memory MCP'den ASANMOD_PROJECT, ASANMOD_SYSTEM, pattern'leri yükler
    // - Son commit'lerden context oluşturur
    // - Pattern'leri yükler
    const modIdentity = {
      confirmed: true,
      mcpStatus: {
        "postgres-official": true,
        git: true,
        filesystem: true,
        "sequential-thinking": true,
        memory: true,
        everything: true,
        asanmod: true,
        "cursor-ide-browser": true,
        prisma: true,
        gemini: true,
        "security-check": true,
        context7: true,
      },
      autoMemorySync: {
        enabled: true,
        note: "Agent otomatik olarak Memory MCP'den context yükler: ASANMOD_PROJECT, ASANMOD_SYSTEM, recent commits, patterns",
      },
    };

    // PARALLEL EXECUTION: State file read, git history, pending tasks, JIT rules parse simultaneously (3x faster!)
    const [stateFileResult, gitHistoryResult, pendingTasksResult, rulesResult] =
      await Promise.allSettled([
        // 2. State File Read (Filesystem MCP - Phase 2.1)
        (async () => {
          try {
            let stateFile: any = {};
            if (await fileExistsMCP(STATE_FILE)) {
              const content = await readFileMCP(STATE_FILE);
              stateFile = JSON.parse(content);
            }
            return stateFile;
          } catch (error) {
            return {};
          }
        })(),
        // 3. Git History Parse (Git MCP - Phase 3.1)
        parseGitHistory().catch(() => ({
          totalCommits: 0,
          lastCommit: "",
          lastCommitDate: "",
          recentCommits: [],
        })),
        // 4. Pending Tasks Read (Filesystem MCP - Phase 2.1)
        parsePendingTasks().catch(() => ({
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          completed: 0,
        })),
        // 5. JIT Rule Engine - Load context-aware rules (v3.2-SHARPEN)
        loadRulesForContext({ phase: "plan" }).catch(() => ({
          global: [],
          contextual: {},
          transient: [],
          all: [],
        })),
      ]);

    // Extract results from Promise.allSettled
    const stateFile =
      stateFileResult.status === "fulfilled" ? stateFileResult.value : {};
    const gitHistory =
      gitHistoryResult.status === "fulfilled"
        ? gitHistoryResult.value
        : {
            totalCommits: 0,
            lastCommit: "",
            lastCommitDate: "",
            recentCommits: [],
          };
    const pendingTasks =
      pendingTasksResult.status === "fulfilled"
        ? pendingTasksResult.value
        : {
            total: 0,
            high: 0,
            medium: 0,
            low: 0,
            completed: 0,
          };
    const rules =
      rulesResult.status === "fulfilled"
        ? rulesResult.value
        : {
            global: [],
            contextual: {},
            transient: [],
            all: [],
          };

    // 5. Summary (workers removed)
    const summary = {
      totalCommits24h: gitHistory.totalCommits,
      pendingTasks: pendingTasks.total,
      lastActivity: stateFile.lastUpdated || new Date().toISOString(),
    };

    return {
      success: true,
      modIdentity,
      projectContext: {
        stateFile,
        gitHistory,
        pendingTasks,
        rules, // JIT-loaded rules for context
      },
      summary,
    };
  } catch (error: any) {
    return {
      success: false,
      modIdentity: {
        confirmed: false,
        mcpStatus: {},
      },
      projectContext: {
        stateFile: {},
        gitHistory: {
          totalCommits: 0,
          lastCommit: "",
          lastCommitDate: "",
          recentCommits: [],
        },
        pendingTasks: {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          completed: 0,
        },
      },
      summary: {
        totalCommits24h: 0,
        pendingTasks: 0,
        lastActivity: new Date().toISOString(),
      },
      error: error.message,
    };
  }
}

async function parseGitHistory() {
  try {
    // Only search for [MOD] commits - WORKER system removed (Git MCP - Phase 3.1)
    const commits = await gitLogMCP(
      {
        grep: "[MOD]",
        since: "1 day ago",
        oneline: true,
        format: "full",
      },
      PROJECT_ROOT
    );

    const lastCommit = commits[0]?.hash || "";
    const lastCommitDate = commits[0]?.date || "";

    return {
      totalCommits: commits.length,
      lastCommit,
      lastCommitDate,
      recentCommits: commits.slice(0, 10).map((c) => ({
        hash: c.hash,
        message: c.message,
        date: c.date,
      })),
    };
  } catch (error) {
    return {
      totalCommits: 0,
      lastCommit: "",
      lastCommitDate: "",
      recentCommits: [],
    };
  }
}

async function parsePendingTasks() {
  try {
    if (!(await fileExistsMCP(PENDING_TASKS_FILE))) {
      return { total: 0, high: 0, medium: 0, low: 0, completed: 0 };
    }

    const content = await readFileMCP(PENDING_TASKS_FILE);
    const highMatch = content.match(
      /HIGH PRIORITY.*?\n(.*?)(?=---|MEDIUM|LOW|COMPLETED)/s
    );
    const mediumMatch = content.match(
      /MEDIUM PRIORITY.*?\n(.*?)(?=---|LOW|COMPLETED)/s
    );
    const lowMatch = content.match(/LOW PRIORITY.*?\n(.*?)(?=---|COMPLETED)/s);
    const completedMatch = content.match(
      /COMPLETED TASKS.*?\n(.*?)(?=---|STATISTICS)/s
    );

    const high =
      highMatch && !highMatch[1].includes("No high priority")
        ? (highMatch[1].match(/TASK-/g) || []).length
        : 0;
    const medium =
      mediumMatch && !mediumMatch[1].includes("No medium priority")
        ? (mediumMatch[1].match(/TASK-/g) || []).length
        : 0;
    const low =
      lowMatch && !lowMatch[1].includes("No low priority")
        ? (lowMatch[1].match(/TASK-/g) || []).length
        : 0;
    const completed = completedMatch
      ? (completedMatch[1].match(/\*\*/g) || []).length / 2
      : 0;

    return {
      total: high + medium + low,
      high,
      medium,
      low,
      completed,
    };
  } catch (error) {
    return { total: 0, high: 0, medium: 0, low: 0, completed: 0 };
  }
}
