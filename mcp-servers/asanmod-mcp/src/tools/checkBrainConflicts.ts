/**
 * Brain Conflict Check
 * Checks if current changes conflict with Brain error patterns
 * Part of Hard-Lock Verification (Phase 3)
 */

import { createHash } from "crypto";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BRAIN_API = process.env.BRAIN_API || "http://localhost:8250";
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

export interface BrainConflictCheckResult {
  success: boolean;
  signature: string; // Hash of check execution + result
  conflicts: Array<{
    pattern: string;
    description: string;
    severity: "high" | "medium" | "low";
  }>;
  error?: string;
}

/**
 * Generate signature for check result
 */
function generateSignature(checkName: string, result: any): string {
  const data = JSON.stringify({
    check: checkName,
    timestamp: new Date().toISOString(),
    result: result,
  });
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Check for conflicts with Brain error patterns
 */
/**
 * Get changed files from git (staged or working directory)
 */
function getChangedFiles(): string[] {
  try {
    // Get staged files first
    let files = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      cwd: PROJECT_ROOT,
    })
      .trim()
      .split("\n")
      .filter((f) => f.trim());

    // If no staged files, get working directory changes
    if (files.length === 0) {
      files = execSync("git diff --name-only", {
        encoding: "utf-8",
        cwd: PROJECT_ROOT,
      })
        .trim()
        .split("\n")
        .filter((f) => f.trim());
    }

    return files;
  } catch (error) {
    return [];
  }
}

/**
 * Get file content for analysis
 */
function getFileContent(filePath: string): string {
  try {
    const fullPath = join(PROJECT_ROOT, filePath);
    if (existsSync(fullPath)) {
      return readFileSync(fullPath, "utf-8");
    }
  } catch (error) {
    // File can't be read
  }
  return "";
}

/**
 * Check if code matches error pattern
 */
function matchesErrorPattern(code: string, pattern: string): boolean {
  try {
    // Simple pattern matching - check if pattern keywords appear in code
    const patternKeywords = pattern
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 3);
    const codeLower = code.toLowerCase();

    return patternKeywords.some((keyword) => codeLower.includes(keyword));
  } catch (error) {
    return false;
  }
}

export async function checkBrainConflicts(
  path?: string
): Promise<BrainConflictCheckResult> {
  const conflicts: BrainConflictCheckResult["conflicts"] = [];

  try {
    // Get changed files from git
    const changedFiles = getChangedFiles();

    if (changedFiles.length === 0) {
      // No changes - return success
      const result = {
        success: true,
        conflicts: [],
      };
      return {
        ...result,
        signature: generateSignature("brainConflicts", result),
      };
    }

    // Query Brain for error patterns
    let solutions: any[] = [];
    try {
      const response = await fetch(
        `${BRAIN_API}/brain/error-solutions?limit=20`
      );
      if (response.ok) {
        const data = (await response.json()) as any;
        solutions = Array.isArray(data.solutions)
          ? data.solutions
          : Array.isArray(data)
            ? data
            : [];
      }
    } catch (error) {
      // Brain not available - continue with empty solutions
    }

    // Check each changed file against error patterns
    for (const file of changedFiles) {
      // Only check code files
      if (!file.match(/\.(ts|tsx|js|jsx|prisma)$/)) {
        continue;
      }

      const fileContent = getFileContent(file);
      if (!fileContent) {
        continue;
      }

      // Check against each error solution
      for (const solution of solutions) {
        const errorPattern =
          solution.error_pattern || solution.error_message || "";
        if (!errorPattern) continue;

        // Check if file content matches error pattern
        if (matchesErrorPattern(fileContent, errorPattern)) {
          // Check if this is a known fix (solution exists)
          if (solution.solution_description) {
            // This might be a conflict - code matches error pattern
            conflicts.push({
              pattern: errorPattern.substring(0, 100),
              description: `File ${file} matches error pattern: ${errorPattern.substring(0, 50)}...`,
              severity:
                solution.success_count > solution.fail_count
                  ? "medium"
                  : "high",
            });
          }
        }
      }
    }

    const result = {
      success: conflicts.length === 0,
      conflicts,
    };

    return {
      ...result,
      signature: generateSignature("brainConflicts", result),
    };
  } catch (error) {
    // If Brain check fails, don't block (non-critical)
    const result = {
      success: true, // Non-blocking - Brain check is advisory
      conflicts: [],
    };

    return {
      ...result,
      signature: generateSignature("brainConflicts", result),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
