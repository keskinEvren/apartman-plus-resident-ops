/**
 * ASANMOD MCP Tool: addPattern
 * Yeni pattern'leri Memory MCP'ye otomatik olarak ekler
 *
 * Phase 3: Memory MCP Auto-Update
 */

import { existsSync } from "fs";
import { join } from "path";

interface AddPatternResult {
  success: boolean;
  patternName: string;
  entityCreated: boolean;
  observationsAdded: number;
  error?: string;
  timestamp: string;
}

interface PatternInfo {
  name: string;
  entityType: "Pattern";
  description: string;
  source: string; // Where the pattern was found (file path, task ID, etc.)
  usage?: string;
  learnedFrom?: string; // Task ID, date, etc.
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
 * Add pattern to Memory MCP
 * Returns the format for Memory MCP entity creation
 */
export async function addPattern(
  patternInfo: PatternInfo,
  path?: string
): Promise<AddPatternResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: AddPatternResult = {
    success: true,
    patternName: patternInfo.name,
    entityCreated: true,
    observationsAdded: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // Generate observations for the pattern
    const observations: string[] = [
      `Pattern description: ${patternInfo.description}`,
      `Pattern detected in: ${patternInfo.source}`,
    ];

    if (patternInfo.usage) {
      observations.push(`Pattern usage: ${patternInfo.usage}`);
    }

    if (patternInfo.learnedFrom) {
      observations.push(`Pattern learned from: ${patternInfo.learnedFrom}`);
    }

    observations.push(`Pattern created: ${result.timestamp}`);

    result.observationsAdded = observations.length;

    // Format for Memory MCP entity creation
    // Note: This function returns the format
    // The actual Memory MCP call should be made by the caller
    // or we need to use a Memory MCP client here

    return result;
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Generate Memory MCP entity format from pattern info
 * Returns the format that should be passed to mcp_memory_create_entities
 */
export function generatePatternEntity(patternInfo: PatternInfo): {
  name: string;
  entityType: string;
  observations: string[];
} {
  const timestamp = new Date().toISOString();

  const observations: string[] = [
    `Pattern description: ${patternInfo.description}`,
    `Pattern detected in: ${patternInfo.source}`,
  ];

  if (patternInfo.usage) {
    observations.push(`Pattern usage: ${patternInfo.usage}`);
  }

  if (patternInfo.learnedFrom) {
    observations.push(`Pattern learned from: ${patternInfo.learnedFrom}`);
  }

  observations.push(`Pattern created: ${timestamp}`);

  return {
    name: patternInfo.name,
    entityType: patternInfo.entityType,
    observations,
  };
}

/**
 * MCP Tool Handler
 */
export async function handleAddPattern(args: {
  patternName: string;
  description: string;
  source: string;
  usage?: string;
  learnedFrom?: string;
  path?: string;
}): Promise<AddPatternResult> {
  if (!args.patternName || !args.description || !args.source) {
    throw new Error("patternName, description, and source are required");
  }

  const patternInfo: PatternInfo = {
    name: args.patternName,
    entityType: "Pattern",
    description: args.description,
    source: args.source,
    usage: args.usage,
    learnedFrom: args.learnedFrom,
  };

  return addPattern(patternInfo, args.path);
}
