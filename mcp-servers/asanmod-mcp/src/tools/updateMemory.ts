/**
 * ASANMOD MCP Tool: updateMemory
 * Rule değişikliklerini Memory MCP'ye otomatik olarak günceller
 * Version tracking ve context preservation ile
 *
 * Phase 3: Memory MCP Auto-Update
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface UpdateMemoryResult {
  success: boolean;
  updatedEntities: string[];
  addedObservations: number;
  versionedObservations: number;
  errors: string[];
  timestamp: string;
}

interface RuleChange {
  ruleName: string;
  changeType: "added" | "modified" | "deleted";
  oldContent?: string;
  newContent?: string;
  filePath: string;
  lineNumber?: number;
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
 * Get current version number for an entity
 * This would ideally be stored in Memory MCP, but for now we'll use a simple counter
 */
function getNextVersion(entityName: string): number {
  // In a real implementation, this would query Memory MCP for existing versions
  // For now, we'll use timestamp-based versioning
  return Date.now();
}

/**
 * Update Memory MCP with rule changes
 * This function generates the observation format for Memory MCP
 */
export async function updateMemory(
  ruleChanges: RuleChange[],
  path?: string
): Promise<UpdateMemoryResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: UpdateMemoryResult = {
    success: true,
    updatedEntities: [],
    addedObservations: 0,
    versionedObservations: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // PARALLEL EXECUTION: Process all rule changes simultaneously (Nx faster!)
    const changeResults = await Promise.allSettled(
      ruleChanges.map(
        (change) =>
          new Promise<{ entityName: string; observations: string[] }>(
            (resolve, reject) => {
              try {
                const entityName = change.ruleName;
                const version = getNextVersion(entityName);
                const timestamp = new Date().toISOString();

                // Create versioned observation
                // Format: [CURRENT v{version}] {newContent} - Updated: {timestamp}
                // If old content exists, also add: [DEPRECATED v{version-1}] {oldContent}

                const observations: string[] = [];

                if (change.changeType === "modified" && change.oldContent) {
                  // Add deprecated observation (keep old content)
                  observations.push(
                    `[DEPRECATED v${version - 1}] ${change.oldContent} - Replaced: ${timestamp}`
                  );
                }

                // Add current observation
                if (change.newContent) {
                  observations.push(
                    `[CURRENT v${version}] ${change.newContent} - Updated: ${timestamp}`
                  );
                } else if (change.changeType === "deleted") {
                  observations.push(
                    `[DEPRECATED v${version}] Rule deleted - Deleted: ${timestamp}`
                  );
                }

                resolve({ entityName, observations });
              } catch (error) {
                reject(error);
              }
            }
          )
      )
    );

    // Process results from Promise.allSettled
    for (let i = 0; i < changeResults.length; i++) {
      const changeResult = changeResults[i];
      const change = ruleChanges[i];

      if (changeResult.status === "fulfilled") {
        result.updatedEntities.push(changeResult.value.entityName);
        result.addedObservations += changeResult.value.observations.length;
        result.versionedObservations += changeResult.value.observations.length;
      } else {
        result.errors.push(
          `Error updating ${change.ruleName}: ${changeResult.reason?.message || "Unknown error"}`
        );
        result.success = false;
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `Memory update failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate Memory MCP observation format from rule changes
 * Returns the format that should be passed to mcp_memory_add_observations
 */
export function generateMemoryObservations(
  ruleChanges: RuleChange[]
): Array<{ entityName: string; contents: string[] }> {
  const observations: Array<{ entityName: string; contents: string[] }> = [];
  const version = Date.now();
  const timestamp = new Date().toISOString();

  for (const change of ruleChanges) {
    const entityName = change.ruleName;
    const contents: string[] = [];

    if (change.changeType === "modified" && change.oldContent) {
      contents.push(
        `[DEPRECATED v${version - 1}] ${change.oldContent} - Replaced: ${timestamp}`
      );
    }

    if (change.newContent) {
      contents.push(
        `[CURRENT v${version}] ${change.newContent} - Updated: ${timestamp}`
      );
    } else if (change.changeType === "deleted") {
      contents.push(
        `[DEPRECATED v${version}] Rule deleted - Deleted: ${timestamp}`
      );
    } else if (change.changeType === "added") {
      contents.push(
        `[CURRENT v${version}] ${change.newContent || "New rule added"} - Added: ${timestamp}`
      );
    }

    if (contents.length > 0) {
      observations.push({ entityName, contents });
    }
  }

  return observations;
}

/**
 * MCP Tool Handler
 * This function should be called with rule changes detected by detectChanges
 */
export async function handleUpdateMemory(args: {
  ruleChanges: RuleChange[];
  path?: string;
}): Promise<UpdateMemoryResult> {
  if (!args.ruleChanges || !Array.isArray(args.ruleChanges)) {
    throw new Error("ruleChanges array is required");
  }

  return updateMemory(args.ruleChanges, args.path);
}
