/**
 * ASANMOD MCP Tool: syncDocsToMemory
 * Dokümantasyondaki bilgileri Memory MCP'ye senkronize eder
 *
 * Phase 4: Documentation Sync
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface SyncDocsToMemoryResult {
  success: boolean;
  parsedEntities: number;
  parsedRules: number;
  parsedMcps: number;
  parsedPatterns: number;
  errors: string[];
  timestamp: string;
  memoryObservationsFormat: Array<{ entityName: string; contents: string[] }>;
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
 * Parse documentation and extract entities for Memory MCP
 */
export async function syncDocsToMemory(
  path?: string
): Promise<SyncDocsToMemoryResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: SyncDocsToMemoryResult = {
    success: true,
    parsedEntities: 0,
    parsedRules: 0,
    parsedMcps: 0,
    parsedPatterns: 0,
    errors: [],
    timestamp: new Date().toISOString(),
    memoryObservationsFormat: [],
  };

  try {
    // Read ASANMOD-MASTER.md
    const masterDocPath = join(projectRoot, "docs/workflow/ASANMOD-MASTER.md");

    if (!existsSync(masterDocPath)) {
      throw new Error("ASANMOD-MASTER.md not found");
    }

    const docContent = readFileSync(masterDocPath, "utf-8");
    const lines = docContent.split("\n");

    // Parse rules (PARALLEL EXECUTION: All rule patterns parsed simultaneously)
    const rulePatterns = [
      { name: "RULE_0_PM2_LOGS", pattern: /Rule\s+0-PM2-LOGS/gi },
      { name: "RULE_0_MCP_FIRST", pattern: /Rule\s+0-MCP-FIRST/gi },
      { name: "RULE_0_TERMINAL", pattern: /Rule\s+0-TERMINAL/gi },
      {
        name: "RULE_0_PRODUCTION_READY",
        pattern: /Rule\s+0:\s*Production-Ready/gi,
      },
      { name: "RULE_1_MCP_VERIFICATION", pattern: /Rule\s+1:\s*MCP-First/gi },
      { name: "RULE_2_RBAC", pattern: /Rule\s+2:\s*Multi-Tenant/gi },
      { name: "RULE_3_TOKEN_OPT", pattern: /Rule\s+3:\s*Token/gi },
      { name: "RULE_4_DONE_VERIFICATION", pattern: /Rule\s+4:\s*Done/gi },
      { name: "RULE_6_DEV_PROD", pattern: /Rule\s+6:\s*DEV-PROD/gi },
      {
        name: "RULE_7_PROD_PROTECTION",
        pattern: /Rule\s+7:\s*PROD\s+Protection/gi,
      },
      { name: "RULE_8_DEPLOYMENT", pattern: /Rule\s+8:\s*Deployment/gi },
      { name: "RULE_9_PROD_FIX_SYNC", pattern: /Rule\s+9:\s*PROD\s+Fix/gi },
      {
        name: "RULE_10_DEPLOYMENT_TRACKING",
        pattern: /Rule\s+10:\s*Deployment\s+Tracking/gi,
      },
      { name: "RULE_11_TAG_FORMAT", pattern: /Rule\s+11:\s*Tag\s+Format/gi },
      { name: "RULE_14_TODO_ENFORCEMENT", pattern: /Rule\s+14:\s*TODO/gi },
    ];

    // PARALLEL EXECUTION: Parse all rule patterns simultaneously
    const ruleResults = await Promise.allSettled(
      rulePatterns.map(
        (rulePattern) =>
          new Promise<{ entityName: string; contents: string[] }>((resolve) => {
            let ruleContent: string[] = [];
            let inRuleSection = false;
            let ruleStartLine = -1;

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];

              if (rulePattern.pattern.test(line)) {
                inRuleSection = true;
                ruleStartLine = i;
                ruleContent.push(line.trim());
                continue;
              }

              if (inRuleSection) {
                // Stop at next rule or major section
                if (
                  line.match(/^##\s+/) ||
                  line.match(/^###\s+Rule\s+\d+/i) ||
                  (line.trim() === "" && i > ruleStartLine + 20) // Stop after 20 lines if empty line
                ) {
                  break;
                }

                if (line.trim()) {
                  ruleContent.push(line.trim());
                }
              }
            }

            if (ruleContent.length > 0) {
              const timestamp = new Date().toISOString();
              resolve({
                entityName: rulePattern.name,
                contents: [
                  `[CURRENT v${Date.now()}] ${ruleContent.join(" ")} - Synced from docs: ${timestamp}`,
                ],
              });
            } else {
              resolve({ entityName: rulePattern.name, contents: [] });
            }
          })
      )
    );

    // Process rule results
    for (const ruleResult of ruleResults) {
      if (
        ruleResult.status === "fulfilled" &&
        ruleResult.value.contents.length > 0
      ) {
        result.memoryObservationsFormat.push({
          entityName: ruleResult.value.entityName,
          contents: ruleResult.value.contents,
        });
        result.parsedRules++;
        result.parsedEntities++;
      }
    }

    // Parse MCPs (PARALLEL EXECUTION: All MCP patterns checked simultaneously)
    const mcpPatterns = [
      { name: "MCP_FILESYSTEM", pattern: /filesystem/i },
      { name: "MCP_MEMORY", pattern: /memory/i },
      { name: "MCP_GIT", pattern: /git\s+\(custom\)/i },
      { name: "MCP_POSTGRES", pattern: /postgres-official/i },
      { name: "MCP_ASANMOD", pattern: /asanmod/i },
      { name: "MCP_BROWSER", pattern: /cursor-ide-browser/i },
      { name: "MCP_PRISMA", pattern: /prisma/i },
      { name: "MCP_GEMINI", pattern: /gemini/i },
      { name: "MCP_SECURITY", pattern: /security-check/i },
      { name: "MCP_CONTEXT7", pattern: /context7/i },
      { name: "MCP_SEQUENTIAL_THINKING", pattern: /sequential-thinking/i },
      { name: "MCP_EVERYTHING", pattern: /everything/i },
    ];

    // Find MCP section
    let inMcpSection = false;
    const mcpSectionLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.match(/##\s+.*MCP/i)) {
        inMcpSection = true;
        continue;
      }

      if (inMcpSection) {
        // Stop at next major section
        if (line.match(/^##\s+/) && !line.match(/MCP/i)) {
          break;
        }
        mcpSectionLines.push(line);
      }
    }

    // PARALLEL EXECUTION: Check all MCP patterns simultaneously
    const mcpResults = await Promise.allSettled(
      mcpPatterns.map(
        (mcpPattern) =>
          new Promise<{ entityName: string; contents: string[] }>((resolve) => {
            for (const line of mcpSectionLines) {
              if (mcpPattern.pattern.test(line)) {
                const timestamp = new Date().toISOString();
                resolve({
                  entityName: mcpPattern.name,
                  contents: [
                    `[CURRENT v${Date.now()}] ${line.trim()} - Synced from docs: ${timestamp}`,
                  ],
                });
                return;
              }
            }
            resolve({ entityName: mcpPattern.name, contents: [] });
          })
      )
    );

    // Process MCP results
    for (const mcpResult of mcpResults) {
      if (
        mcpResult.status === "fulfilled" &&
        mcpResult.value.contents.length > 0
      ) {
        result.memoryObservationsFormat.push({
          entityName: mcpResult.value.entityName,
          contents: mcpResult.value.contents,
        });
        result.parsedMcps++;
        result.parsedEntities++;
      }
    }

    // Parse ASANMOD Project info
    if (
      docContent.includes("ASANMOD Application") ||
      docContent.includes("ASANMOD_PROJECT")
    ) {
      const asanmodContent: string[] = [];
      let inASANMODSection = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/ASANMOD|asanmod/i) && line.match(/Project|Platform/i)) {
          inASANMODSection = true;
          asanmodContent.push(line.trim());
          continue;
        }

        if (inASANMODSection) {
          if (line.match(/^##\s+/) || (line.trim() === "" && i > 50)) {
            break;
          }
          if (
            line.trim() &&
            (line.includes("Location:") ||
              line.includes("Tech Stack:") ||
              line.includes("DEV:") ||
              line.includes("PROD:"))
          ) {
            asanmodContent.push(line.trim());
          }
        }
      }

      if (asanmodContent.length > 0) {
        const timestamp = new Date().toISOString();
        result.memoryObservationsFormat.push({
          entityName: "ASANMOD_PROJECT",
          contents: [
            `[CURRENT v${Date.now()}] ${asanmodContent.join(" | ")} - Synced from docs: ${timestamp}`,
          ],
        });
        result.parsedEntities++;
      }
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * MCP Tool Handler
 */
export async function handleSyncDocsToMemory(args: {
  path?: string;
}): Promise<SyncDocsToMemoryResult> {
  return syncDocsToMemory(args.path);
}
