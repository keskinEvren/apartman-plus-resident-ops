/**
 * ASANMOD MCP Tool: ASANMOD Context Auto-Load
 * Session başlangıcında ASANMOD context'ini otomatik yükler
 *
 * Phase 5: ASANMOD-Specific Customization
 */

import { existsSync } from "fs";
import { join } from "path";

interface ASANMODContextLoadResult {
  success: boolean;
  loadedEntities: string[];
  loadedPatterns: number;
  loadedRules: number;
  contextSize: number;
  timestamp: string;
  contextFormat: {
    asanmodProject?: any;
    patterns?: any[];
    rules?: any[];
    mcps?: any[];
  };
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
 * Load ASANMOD context from Memory MCP
 * Returns the format for Memory MCP queries
 */
export async function loadContext(
  path?: string
): Promise<ASANMODContextLoadResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: ASANMODContextLoadResult = {
    success: true,
    loadedEntities: [],
    loadedPatterns: 0,
    loadedRules: 0,
    contextSize: 0,
    timestamp: new Date().toISOString(),
    contextFormat: {},
  };

  try {
    // Define entities to load
    const entitiesToLoad = [
      "ASANMOD_PROJECT",
      "PATTERN_ASANMOD_RBAC",
      "PATTERN_ASANMOD_MULTI_TENANT",
      "PATTERN_ASANMOD_DEV_PROD",
      "PATTERN_ASANMOD_MCP_FIRST",
      "RULE_6_DEV_PROD",
      "RULE_7_PROD_PROTECTION",
      "MCP_FILESYSTEM",
      "MCP_MEMORY",
      "MCP_ASANMOD",
    ];

    // Generate Memory MCP query format
    // Note: This function returns the format
    // The actual Memory MCP call should be made by the caller

    result.contextFormat = {
      asanmodProject: {
        entityName: "ASANMOD_PROJECT",
        note: "Use mcp_memory_open_nodes({names: ['ASANMOD_PROJECT']}) to load",
      },
      patterns: [
        {
          entityName: "PATTERN_ASANMOD_RBAC",
          note: "Use mcp_memory_search_nodes({query: 'PATTERN_ASANMOD'}) to load all ASANMOD patterns",
        },
        {
          entityName: "PATTERN_ASANMOD_MULTI_TENANT",
        },
        {
          entityName: "PATTERN_ASANMOD_DEV_PROD",
        },
        {
          entityName: "PATTERN_ASANMOD_MCP_FIRST",
        },
      ],
      rules: [
        {
          entityName: "RULE_6_DEV_PROD",
          note: "ASANMOD-specific rule",
        },
        {
          entityName: "RULE_7_PROD_PROTECTION",
          note: "ASANMOD-specific rule",
        },
      ],
      mcps: [
        {
          entityName: "MCP_FILESYSTEM",
          note: "Core MCP for ASANMOD",
        },
        {
          entityName: "MCP_MEMORY",
          note: "Core MCP for ASANMOD",
        },
        {
          entityName: "MCP_ASANMOD",
          note: "ASANMOD MCP for ASANMOD",
        },
      ],
    };

    result.loadedEntities = entitiesToLoad;
    result.loadedPatterns = 4; // 4 ASANMOD patterns
    result.loadedRules = 2; // 2 ASANMOD-specific rules
    result.contextSize = entitiesToLoad.length;

    return result;
  } catch (error) {
    result.success = false;
    throw new Error(
      `ASANMOD context load failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate Memory MCP query format for ASANMOD context
 */
export function generateContextQueries(): {
  openNodes: string[];
  searchQueries: string[];
} {
  return {
    openNodes: [
      "ASANMOD_PROJECT",
      "PATTERN_ASANMOD_RBAC",
      "PATTERN_ASANMOD_MULTI_TENANT",
      "PATTERN_ASANMOD_DEV_PROD",
      "PATTERN_ASANMOD_MCP_FIRST",
      "RULE_6_DEV_PROD",
      "RULE_7_PROD_PROTECTION",
    ],
    searchQueries: ["PATTERN_ASANMOD", "ASANMOD RBAC", "ASANMOD DEV PROD", "ASANMOD MCP"],
  };
}

/**
 * MCP Tool Handler
 */
export async function handleContextLoad(args: {
  path?: string;
}): Promise<ASANMODContextLoadResult> {
  return loadContext(args.path);
}
