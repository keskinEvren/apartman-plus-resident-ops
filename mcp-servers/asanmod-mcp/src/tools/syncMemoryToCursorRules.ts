/**
 * ASANMOD MCP Tool: syncMemoryToCursorRules
 * Memory MCP'deki ASANMOD bilgilerini .cursorrules dosyasına senkronize eder
 *
 * Phase 6: Cursor IDE Integration
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface SyncMemoryToCursorRulesResult {
  success: boolean;
  updatedSections: string[];
  cursorRulesPath: string;
  changesCount: number;
  timestamp: string;
  note: string;
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
 * Generate .cursorrules content from Memory MCP data
 */
export function generateCursorRulesContent(memoryData: {
  asanmodSystem?: any;
  rules?: any[];
  mcps?: any[];
  asanmodProject?: any;
}): {
  sections: Array<{ section: string; content: string }>;
  fullContent: string;
} {
  const sections: Array<{ section: string; content: string }> = [];
  let fullContent = "# Cursor Rules - ASANMOD Application - ASANMOD v1.0.0\n\n";

  // MOD Identity section
  fullContent += "## MOD Identity\n\n";
  fullContent +=
    'When user says "sen modsun", you become MOD CLAUDE (Master Coordinator & Verifier).\n\n';

  // WORKER Identity section
  fullContent += "## WORKER Identity\n\n";
  fullContent +=
    'When user says "sen W[1-6]\'sın", you become WORKER CLAUDE (Executor).\n\n';

  // Master Documentation section
  fullContent += "## Master Documentation\n\n";
  fullContent +=
    "**READ THIS FIRST:** `docs/workflow/ASANMOD-MASTER.md` (~3400 lines, 9 parts, Last Updated: 2026-12-13)\n\n";

  // Core Rules section
  if (memoryData.rules && memoryData.rules.length > 0) {
    fullContent += "## Core Rules (13 Core Rules + Deployment Rules)\n\n";

    for (const rule of memoryData.rules) {
      const ruleName = rule.entityName || rule.name || "Unknown Rule";
      const ruleNumber = ruleName.match(/RULE_(\d+)/)?.[1] || "";
      const ruleTitle = ruleName.replace(/RULE_\d+_?/, "").replace(/_/g, " ");

      // Get current observations (filter DEPRECATED)
      const currentObs = (rule.observations || []).filter(
        (obs: string) => !obs.includes("[DEPRECATED]")
      );

      if (currentObs.length > 0) {
        const ruleDesc =
          currentObs[0]?.replace(/^\[CURRENT\]\s*/, "") || ruleTitle;
        fullContent += `${ruleNumber ? `${ruleNumber}. ` : ""}**${ruleTitle}**: ${ruleDesc}\n\n`;
      }
    }
  }

  // MCPs section
  if (memoryData.mcps && memoryData.mcps.length > 0) {
    fullContent += "## MCPs (12 - MANDATORY)\n\n";

    const mcpList = memoryData.mcps
      .map((mcp) => {
        const mcpName = mcp.entityName || mcp.name || "Unknown MCP";
        const mcpDesc = (mcp.observations || [])
          .filter((obs: string) => !obs.includes("[DEPRECATED]"))
          .map((obs: string) => obs.replace(/^\[CURRENT\]\s*/, ""))
          .join(", ");
        return `- ${mcpName}: ${mcpDesc}`;
      })
      .join("\n");

    fullContent += mcpList + "\n\n";
  }

  // ASANMOD Project section
  if (memoryData.asanmodProject) {
    fullContent += "## ASANMOD Project\n\n";
    const asanmodObs = (memoryData.asanmodProject.observations || [])
      .filter((obs: string) => !obs.includes("[DEPRECATED]"))
      .map((obs: string) => obs.replace(/^\[CURRENT\]\s*/, ""));

    for (const obs of asanmodObs) {
      fullContent += `- ${obs}\n`;
    }
    fullContent += "\n";
  }

  // Communication section
  fullContent += "## Communication\n\n";
  fullContent += "- **User → MOD**: 3-5 satır max\n";
  fullContent +=
    "- **MOD → User**: Tablo + checklist format (KATı KURAL - docs/workflow/ASANMOD-MASTER.md PART 7)\n";
  fullContent += "- **MD Files**: Ultra-detay (500-2000 satır)\n\n";

  // Last Updated
  fullContent += `**Last Updated:** ${new Date().toISOString().split("T")[0]} (MCP-First Golden Rules - Filesystem MCP ve Memory MCP ZORUNLU!)\n`;
  fullContent += "**Version:** 2.1-MASTER\n";
  fullContent += "**Status:** ✅ ACTIVE\n";

  sections.push({
    section: "full",
    content: fullContent,
  });

  return { sections, fullContent };
}

/**
 * Sync Memory MCP to .cursorrules
 */
export async function syncMemoryToCursorRules(
  memoryData: {
    asanmodSystem?: any;
    rules?: any[];
    mcps?: any[];
    asanmodProject?: any;
  },
  path?: string
): Promise<SyncMemoryToCursorRulesResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const cursorRulesPath = join(projectRoot, ".cursorrules");

  const result: SyncMemoryToCursorRulesResult = {
    success: true,
    updatedSections: [],
    cursorRulesPath: cursorRulesPath.replace(projectRoot + "/", ""),
    changesCount: 0,
    timestamp: new Date().toISOString(),
    note: "Use Filesystem MCP to write the generated content to .cursorrules",
  };

  try {
    // Generate cursor rules content
    const { sections, fullContent } = generateCursorRulesContent(memoryData);

    result.updatedSections = sections.map((s) => s.section);
    result.changesCount = sections.length;

    // Store generated content for Filesystem MCP write
    // Note: This function returns the format
    // The actual file write should be done by the caller using Filesystem MCP

    return result;
  } catch (error) {
    result.success = false;
    throw new Error(
      `Sync Memory to Cursor Rules failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * MCP Tool Handler
 */
export async function handleSyncMemoryToCursorRules(args: {
  memoryData?: any;
  path?: string;
}): Promise<SyncMemoryToCursorRulesResult> {
  const memoryData = args.memoryData || {};

  return syncMemoryToCursorRules(memoryData, args.path);
}
