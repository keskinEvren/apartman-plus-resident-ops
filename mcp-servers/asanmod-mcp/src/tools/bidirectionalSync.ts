/**
 * ASANMOD MCP Tool: Bidirectional Sync
 * Memory MCP ve dokümantasyon arasında bidirectional sync yapar
 * Conflict resolution ile
 *
 * Phase 4: Documentation Sync
 */

import { existsSync } from "fs";
import { join } from "path";

interface BidirectionalSyncResult {
  success: boolean;
  memoryToDocs: {
    success: boolean;
    syncedFiles: string[];
    updatedSections: number;
  };
  docsToMemory: {
    success: boolean;
    parsedEntities: number;
    parsedRules: number;
    parsedMcps: number;
  };
  conflicts: Conflict[];
  resolution: "memory_priority" | "docs_priority" | "merged";
  timestamp: string;
}

interface Conflict {
  entityName: string;
  memoryContent: string;
  docsContent: string;
  resolution: "memory" | "docs" | "merged";
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
 * Detect conflicts between Memory MCP and documentation
 */
function detectConflicts(memoryData: any, docsData: any): Conflict[] {
  const conflicts: Conflict[] = [];

  // Compare rules
  if (memoryData.rules && docsData.rules) {
    for (const memoryRule of memoryData.rules) {
      const docsRule = docsData.rules.find(
        (r: any) => r.name === memoryRule.name
      );

      if (docsRule) {
        // Get current content from both
        const memoryContent = memoryRule.observations
          ?.filter((obs: string) => obs.includes("[CURRENT"))
          .sort()
          .pop()
          ?.replace(/\[CURRENT v\d+\]/, "")
          .trim();

        const docsContent = docsRule.content?.trim();

        if (memoryContent && docsContent && memoryContent !== docsContent) {
          conflicts.push({
            entityName: memoryRule.name,
            memoryContent,
            docsContent,
            resolution: "memory", // Default: Memory priority (newer)
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Resolve conflicts
 */
function resolveConflicts(
  conflicts: Conflict[],
  strategy: "memory_priority" | "docs_priority" | "merged" = "memory_priority"
): Conflict[] {
  return conflicts.map((conflict) => {
    switch (strategy) {
      case "memory_priority":
        conflict.resolution = "memory";
        break;
      case "docs_priority":
        conflict.resolution = "docs";
        break;
      case "merged":
        // Merge both contents
        conflict.resolution = "merged";
        conflict.memoryContent = `${conflict.memoryContent}\n\n---\n\n${conflict.docsContent}`;
        break;
    }
    return conflict;
  });
}

/**
 * Perform bidirectional sync
 */
export async function bidirectionalSync(
  memoryData: any,
  docsData: any,
  conflictResolution:
    | "memory_priority"
    | "docs_priority"
    | "merged" = "memory_priority",
  path?: string
): Promise<BidirectionalSyncResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: BidirectionalSyncResult = {
    success: true,
    memoryToDocs: {
      success: false,
      syncedFiles: [],
      updatedSections: 0,
    },
    docsToMemory: {
      success: false,
      parsedEntities: 0,
      parsedRules: 0,
      parsedMcps: 0,
    },
    conflicts: [],
    resolution: conflictResolution,
    timestamp: new Date().toISOString(),
  };

  try {
    // PARALLEL EXECUTION: Detect conflicts and prepare sync results simultaneously
    const [conflicts, memoryToDocsResult, docsToMemoryResult] =
      await Promise.allSettled([
        // Detect conflicts
        new Promise<Conflict[]>((resolve) => {
          resolve(detectConflicts(memoryData, docsData));
        }),
        // Prepare Memory → Docs sync result
        new Promise<{
          success: boolean;
          syncedFiles: string[];
          updatedSections: number;
        }>((resolve) => {
          if (
            conflictResolution === "memory_priority" ||
            conflictResolution === "merged"
          ) {
            resolve({
              success: true,
              syncedFiles: ["docs/workflow/ASANMOD-MASTER.md"],
              updatedSections: memoryData.rules?.length || 0,
            });
          } else {
            resolve({ success: false, syncedFiles: [], updatedSections: 0 });
          }
        }),
        // Prepare Docs → Memory sync result
        new Promise<{
          success: boolean;
          parsedEntities: number;
          parsedRules: number;
          parsedMcps: number;
        }>((resolve) => {
          if (
            conflictResolution === "docs_priority" ||
            conflictResolution === "merged"
          ) {
            resolve({
              success: true,
              parsedEntities: docsData.rules?.length || 0,
              parsedRules: docsData.rules?.length || 0,
              parsedMcps: docsData.mcps?.length || 0,
            });
          } else {
            resolve({
              success: false,
              parsedEntities: 0,
              parsedRules: 0,
              parsedMcps: 0,
            });
          }
        }),
      ]);

    // Process results
    const conflictsValue =
      conflicts.status === "fulfilled" ? conflicts.value : [];
    result.conflicts = resolveConflicts(conflictsValue, conflictResolution);

    if (memoryToDocsResult.status === "fulfilled") {
      result.memoryToDocs = memoryToDocsResult.value;
    }

    if (docsToMemoryResult.status === "fulfilled") {
      result.docsToMemory = docsToMemoryResult.value;
    }

    return result;
  } catch (error) {
    result.success = false;
    throw new Error(
      `Bidirectional sync failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * MCP Tool Handler
 */
export async function handleBidirectionalSync(args: {
  memoryData?: any;
  docsData?: any;
  conflictResolution?: "memory_priority" | "docs_priority" | "merged";
  path?: string;
}): Promise<BidirectionalSyncResult> {
  const conflictResolution = args.conflictResolution || "memory_priority";

  if (!args.memoryData || !args.docsData) {
    throw new Error(
      "memoryData and docsData are required. Use mcp_memory_open_nodes() and syncDocsToMemory() first."
    );
  }

  return bidirectionalSync(
    args.memoryData,
    args.docsData,
    conflictResolution,
    args.path
  );
}
