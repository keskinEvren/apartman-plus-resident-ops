/**
 * ASANMOD MCP Tool: detectChanges
 * ASANMOD dokümantasyon ve rule değişikliklerini tespit eder
 *
 * Phase 2: Self-Update Detection
 */

import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";

interface ChangeDetectionResult {
  hasChanges: boolean;
  changedFiles: string[];
  ruleChanges: RuleChange[];
  documentationChanges: DocumentationChange[];
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

interface DocumentationChange {
  filePath: string;
  changeType: "added" | "modified" | "deleted";
  linesChanged: number;
}

/**
 * Project root detection
 */
function getProjectRoot(): string {
  // Try environment variable first
  let projectRoot = process.env.WORKSPACE_ROOT || "";

  if (!projectRoot) {
    // Try to find from current directory
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
 * Detect changes in ASANMOD documentation and rules
 */
export async function detectChanges(
  path?: string
): Promise<ChangeDetectionResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: ChangeDetectionResult = {
    hasChanges: false,
    changedFiles: [],
    ruleChanges: [],
    documentationChanges: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // ASANMOD-related files to monitor
    const asanmodFiles = [
      "docs/workflow/ASANMOD-MASTER.md",
      "docs/workflow/ASANMOD-REFERENCE-INDEX.md",
      ".cursorrules",
      ".cursor/rules/asanmod.mdc",
      "docs/ASANMOD-UNIVERSAL-TEMPLATE.md",
      "docs/ASANMOD-QUICK-START.md",
      "docs/MCP-FILESYSTEM-CONFIG.md",
    ];

    // Get git diff for ASANMOD files (Git MCP - Phase 3.4)
    const { gitDiffMCP } = await import("../utils/mcpClient.js");
    const gitDiff = await gitDiffMCP({ nameOnly: false }, projectRoot);

    if (!gitDiff) {
      return result;
    }

    // Parse git diff output
    const diffLines = gitDiff.split("\n").filter((line) => line.trim());
    const changedFilesSet = new Set<string>();

    for (const line of diffLines) {
      const match = line.match(/^([AMD])\s+(.+)$/);
      if (match) {
        const [, status, filePath] = match;
        const fullPath = join(projectRoot, filePath);

        // Check if it's an ASANMOD-related file
        const isAsanmodFile = asanmodFiles.some((asanmodFile) =>
          filePath.includes(asanmodFile)
        );

        if (isAsanmodFile && existsSync(fullPath)) {
          changedFilesSet.add(filePath);
          result.hasChanges = true;

          // Detect rule changes
          const ruleChanges = detectRuleChanges(fullPath, status, projectRoot);
          result.ruleChanges.push(...ruleChanges);

          // Detect documentation changes
          result.documentationChanges.push({
            filePath,
            changeType:
              status === "A"
                ? "added"
                : status === "D"
                  ? "deleted"
                  : "modified",
            linesChanged: getLinesChanged(fullPath, projectRoot),
          });
        }
      }
    }

    result.changedFiles = Array.from(changedFilesSet);

    return result;
  } catch (error) {
    throw new Error(
      `Change detection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Detect rule changes in a file
 */
function detectRuleChanges(
  filePath: string,
  status: string,
  projectRoot: string
): RuleChange[] {
  const ruleChanges: RuleChange[] = [];

  try {
    if (status === "D") {
      // File deleted - all rules in that file are deleted
      return ruleChanges;
    }

    const fileContent = readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");

    // Rule patterns to detect
    const rulePatterns = [
      /Rule\s+0-PM2-LOGS/gi,
      /Rule\s+0-MCP-FIRST/gi,
      /Rule\s+0-TERMINAL/gi,
      /Rule\s+0:\s*Production-Ready/gi,
      /Rule\s+1:\s*MCP-First/gi,
      /Rule\s+2:\s*Multi-Tenant/gi,
      /Rule\s+3:\s*Token/gi,
      /Rule\s+4:\s*Done/gi,
      /Rule\s+6:\s*DEV-PROD/gi,
      /Rule\s+7:\s*PROD\s+Protection/gi,
      /Rule\s+8:\s*Deployment/gi,
      /Rule\s+9:\s*PROD\s+Fix/gi,
      /Rule\s+10:\s*Deployment\s+Tracking/gi,
      /Rule\s+11:\s*Tag\s+Format/gi,
      /Rule\s+14:\s*TODO/gi,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of rulePatterns) {
        if (pattern.test(line)) {
          // Extract rule name
          const ruleMatch = line.match(/Rule\s+(\d+(?:-\w+)?):?\s*(.+)/i);
          if (ruleMatch) {
            const ruleNumber = ruleMatch[1];
            const ruleName = `RULE_${ruleNumber.replace(/-/g, "_")}`;

            ruleChanges.push({
              ruleName,
              changeType: status === "A" ? "added" : "modified",
              newContent: line,
              filePath,
              lineNumber: i + 1,
            });
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors in rule detection
    console.error(`Error detecting rule changes in ${filePath}:`, error);
  }

  return ruleChanges;
}

/**
 * Get number of lines changed in a file
 */
function getLinesChanged(filePath: string, projectRoot: string): number {
  try {
    const gitDiff = execSync(
      `git diff HEAD~1 HEAD -- "${filePath}" 2>/dev/null || git diff HEAD -- "${filePath}" 2>/dev/null || echo ""`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
        stdio: "pipe",
      }
    );

    if (!gitDiff) {
      return 0;
    }

    // Count added and removed lines
    const addedLines = (gitDiff.match(/^\+(?!\+)/gm) || []).length;
    const removedLines = (gitDiff.match(/^-(?!-)/gm) || []).length;

    return addedLines + removedLines;
  } catch (error) {
    return 0;
  }
}

/**
 * MCP Tool Handler
 */
export async function handleDetectChanges(args: {
  path?: string;
}): Promise<ChangeDetectionResult> {
  return detectChanges(args.path);
}
