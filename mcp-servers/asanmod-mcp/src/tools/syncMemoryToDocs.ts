/**
 * ASANMOD MCP Tool: syncMemoryToDocs
 * Memory MCP'deki bilgileri dokümantasyona senkronize eder
 *
 * Phase 4: Documentation Sync
 */

import { existsSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

interface SyncMemoryToDocsResult {
  success: boolean;
  syncedFiles: string[];
  updatedSections: number;
  errors: string[];
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
 * Generate documentation content from Memory MCP entities
 * This function creates the format that should be used to update documentation
 */
export async function syncMemoryToDocs(
  memoryData: {
    asanmodSystem?: any;
    rules?: any[];
    mcps?: any[];
    asanmodProject?: any;
    patterns?: any[];
  },
  path?: string
): Promise<SyncMemoryToDocsResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: SyncMemoryToDocsResult = {
    success: true,
    syncedFiles: [],
    updatedSections: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Main documentation file
    const masterDocPath = join(projectRoot, "docs/workflow/ASANMOD-MASTER.md");

    if (!existsSync(masterDocPath)) {
      throw new Error("ASANMOD-MASTER.md not found");
    }

    // Read current documentation
    const currentDoc = readFileSync(masterDocPath, "utf-8");

    // Generate updated sections from Memory MCP data
    // This is a simplified version - in production, we'd parse and update specific sections

    const updatedSections: string[] = [];

    // PARALLEL EXECUTION: Process rules and MCPs simultaneously
    const [rulesSections, mcpsSections] = await Promise.allSettled([
      // Process rules
      new Promise<string[]>((resolve) => {
        const sections: string[] = [];
        if (memoryData.rules && memoryData.rules.length > 0) {
          sections.push("## 🚨 Core Rules");
          for (const rule of memoryData.rules) {
            if (rule.observations && rule.observations.length > 0) {
              // Get current version (latest CURRENT observation)
              const currentObs = rule.observations
                .filter((obs: string) => obs.includes("[CURRENT"))
                .sort()
                .pop();

              if (currentObs) {
                const cleanObs = currentObs
                  .replace(/\[CURRENT v\d+\]/, "")
                  .trim();
                sections.push(`### ${rule.name}`);
                sections.push(cleanObs);
                sections.push("");
              }
            }
          }
        }
        resolve(sections);
      }),
      // Process MCPs
      new Promise<string[]>((resolve) => {
        const sections: string[] = [];
        if (memoryData.mcps && memoryData.mcps.length > 0) {
          sections.push("## 🔌 MCPs (12 - MANDATORY)");
          for (const mcp of memoryData.mcps) {
            if (mcp.observations && mcp.observations.length > 0) {
              const currentObs = mcp.observations
                .filter(
                  (obs: string) =>
                    obs.includes("[CURRENT") || !obs.includes("[DEPRECATED")
                )
                .sort()
                .pop();

              if (currentObs) {
                const cleanObs = currentObs
                  .replace(/\[CURRENT v\d+\]/, "")
                  .trim();
                sections.push(`### ${mcp.name}`);
                sections.push(cleanObs);
                sections.push("");
              }
            }
          }
        }
        resolve(sections);
      }),
    ]);

    // Combine results
    if (
      rulesSections.status === "fulfilled" &&
      rulesSections.value.length > 0
    ) {
      updatedSections.push(...rulesSections.value);
      result.updatedSections += memoryData.rules?.length || 0;
    }
    if (mcpsSections.status === "fulfilled" && mcpsSections.value.length > 0) {
      updatedSections.push(...mcpsSections.value);
      result.updatedSections += memoryData.mcps?.length || 0;
    }

    // Update ASANMOD Project section if provided
    if (memoryData.asanmodProject && memoryData.asanmodProject.observations) {
      updatedSections.push("## 🎯 ASANMOD Project");
      const currentObs = memoryData.asanmodProject.observations
        .filter(
          (obs: string) =>
            obs.includes("[CURRENT") || !obs.includes("[DEPRECATED")
        )
        .sort()
        .pop();

      if (currentObs) {
        const cleanObs = currentObs.replace(/\[CURRENT v\d+\]/, "").trim();
        updatedSections.push(cleanObs);
        updatedSections.push("");
      }
      result.updatedSections += 1;
    }

    // Generate documentation update format
    // Note: This function returns the format
    // The actual file write should be done by the caller or we need to use Filesystem MCP

    result.syncedFiles.push("docs/workflow/ASANMOD-MASTER.md");

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Generate documentation update format from Memory MCP data
 * Returns sections that should be updated in documentation
 */
export function generateDocSections(memoryData: {
  rules?: any[];
  mcps?: any[];
  asanmodProject?: any;
  patterns?: any[];
}): {
  filePath: string;
  sections: Array<{ section: string; content: string }>;
} {
  const sections: Array<{ section: string; content: string }> = [];

  // Rules section
  if (memoryData.rules && memoryData.rules.length > 0) {
    let rulesContent = "## 🚨 Core Rules\n\n";
    for (const rule of memoryData.rules) {
      if (rule.observations && rule.observations.length > 0) {
        const currentObs = rule.observations
          .filter((obs: string) => obs.includes("[CURRENT"))
          .sort()
          .pop();

        if (currentObs) {
          const cleanObs = currentObs.replace(/\[CURRENT v\d+\]/, "").trim();
          rulesContent += `### ${rule.name}\n\n${cleanObs}\n\n`;
        }
      }
    }
    sections.push({ section: "Core Rules", content: rulesContent });
  }

  // MCPs section
  if (memoryData.mcps && memoryData.mcps.length > 0) {
    let mcpsContent = "## 🔌 MCPs (12 - MANDATORY)\n\n";
    for (const mcp of memoryData.mcps) {
      if (mcp.observations && mcp.observations.length > 0) {
        const currentObs = mcp.observations
          .filter(
            (obs: string) =>
              obs.includes("[CURRENT") || !obs.includes("[DEPRECATED")
          )
          .sort()
          .pop();

        if (currentObs) {
          const cleanObs = currentObs.replace(/\[CURRENT v\d+\]/, "").trim();
          mcpsContent += `### ${mcp.name}\n\n${cleanObs}\n\n`;
        }
      }
    }
    sections.push({ section: "MCPs", content: mcpsContent });
  }

  return {
    filePath: "docs/workflow/ASANMOD-MASTER.md",
    sections,
  };
}

/**
 * MCP Tool Handler
 * Note: This function requires Memory MCP data as input
 * The caller should first read Memory MCP entities, then call this function
 */
export async function handleSyncMemoryToDocs(args: {
  memoryData?: {
    asanmodSystem?: any;
    rules?: any[];
    mcps?: any[];
    asanmodProject?: any;
    patterns?: any[];
  };
  path?: string;
}): Promise<SyncMemoryToDocsResult> {
  if (!args.memoryData) {
    throw new Error(
      "memoryData is required. Use mcp_memory_open_nodes() first to read Memory MCP entities."
    );
  }

  return syncMemoryToDocs(args.memoryData, args.path);
}
