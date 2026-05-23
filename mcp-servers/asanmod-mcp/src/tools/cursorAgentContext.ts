/**
 * ASANMOD MCP Tool: Cursor Agent Context
 * Session başlangıcında Cursor agent context'ini otomatik yükler
 *
 * Phase 6: Cursor IDE Integration
 */

import { existsSync } from "fs";
import { join } from "path";

interface CursorAgentContextResult {
  success: boolean;
  contextLoaded: boolean;
  contextEntities: string[];
  contextSize: number;
  contextFormat: {
    asanmodSystem?: any;
    asanmodProject?: any;
    rules?: any[];
    patterns?: any[];
    mcps?: any[];
  };
  autoLoadInstructions: string;
  timestamp: string;
}

/**
 * Project root detection
 */
function getProjectRoot(): string {
  let projectRoot = process.env.WORKSPACE_ROOT || "";

  if (!projectRoot) {
    let currentDir = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (
        existsSync(join(currentDir, "docs", "workflow", "ASANMOD-MASTER.md"))
      ) {
        projectRoot = currentDir;
        break;
      }
      currentDir = join(currentDir, "..");
    }
  }

  return projectRoot || process.cwd();
}

/**
 * Generate Cursor agent context format
 */
export function generateCursorAgentContext(): {
  entitiesToLoad: string[];
  searchQueries: string[];
  contextFormat: {
    asanmodSystem?: any;
    asanmodProject?: any;
    rules?: any[];
    patterns?: any[];
    mcps?: any[];
  };
} {
  const entitiesToLoad = [
    "ASANMOD_SYSTEM",
    "ASANMOD_PROJECT",
    "MOD_IDENTITY",
    "WORKER_IDENTITY",
    "RULE_0_PM2_LOGS",
    "RULE_0_MCP_FIRST",
    "RULE_0_TERMINAL",
    "RULE_0",
    "RULE_1",
    "RULE_2",
    "RULE_3",
    "RULE_4",
    "RULE_6",
    "RULE_7",
    "RULE_8",
    "RULE_9",
    "RULE_10",
    "RULE_11",
    "RULE_14",
    "PATTERN_ASANMOD_RBAC",
    "PATTERN_ASANMOD_MULTI_TENANT",
    "PATTERN_ASANMOD_DEV_PROD",
    "PATTERN_ASANMOD_MCP_FIRST",
    "MCP_FILESYSTEM",
    "MCP_MEMORY",
    "MCP_ASANMOD",
    "MCP_POSTGRES_OFFICIAL",
    "MCP_GIT",
    "MCP_SEQUENTIAL_THINKING",
    "MCP_EVERYTHING",
    "MCP_CURSOR_IDE_BROWSER",
    "MCP_PRISMA",
    "MCP_GEMINI",
    "MCP_SECURITY_CHECK",
    "MCP_CONTEXT7",
  ];

  const searchQueries = [
    "ASANMOD",
    "ASANMOD",
    "RULE",
    "PATTERN_ASANMOD",
    "MCP",
    "MOD",
    "WORKER",
  ];

  return {
    entitiesToLoad,
    searchQueries,
    contextFormat: {
      asanmodSystem: {
        entityName: "ASANMOD_SYSTEM",
        note: "Use mcp_memory_open_nodes({names: ['ASANMOD_SYSTEM']})",
      },
      asanmodProject: {
        entityName: "ASANMOD_PROJECT",
        note: "Use mcp_memory_open_nodes({names: ['ASANMOD_PROJECT']})",
      },
      rules: entitiesToLoad
        .filter((e) => e.startsWith("RULE_"))
        .map((e) => ({
          entityName: e,
          note: `Use mcp_memory_open_nodes({names: ['${e}']})`,
        })),
      patterns: entitiesToLoad
        .filter((e) => e.startsWith("PATTERN_"))
        .map((e) => ({
          entityName: e,
          note: `Use mcp_memory_open_nodes({names: ['${e}']})`,
        })),
      mcps: entitiesToLoad
        .filter((e) => e.startsWith("MCP_"))
        .map((e) => ({
          entityName: e,
          note: `Use mcp_memory_open_nodes({names: ['${e}']})`,
        })),
    },
  };
}

/**
 * Load Cursor agent context
 */
export async function loadCursorAgentContext(
  path?: string
): Promise<CursorAgentContextResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const { entitiesToLoad, searchQueries, contextFormat } =
    generateCursorAgentContext();

  const result: CursorAgentContextResult = {
    success: true,
    contextLoaded: true,
    contextEntities: entitiesToLoad,
    contextSize: entitiesToLoad.length,
    contextFormat,
    autoLoadInstructions: `Session başlangıcında şu Memory MCP query'lerini çalıştır:
1. mcp_memory_open_nodes({names: ${JSON.stringify(entitiesToLoad)}})
2. mcp_memory_search_nodes({query: "ASANMOD"})
3. mcp_memory_search_nodes({query: "ASANMOD"})
4. mcp_memory_search_nodes({query: "RULE"})
5. mcp_memory_search_nodes({query: "PATTERN_ASANMOD"})
6. mcp_memory_search_nodes({query: "MCP"})`,
    timestamp: new Date().toISOString(),
  };

  return result;
}

/**
 * MCP Tool Handler
 */
export async function handleCursorAgentContext(args: {
  path?: string;
}): Promise<CursorAgentContextResult> {
  return loadCursorAgentContext(args.path);
}
