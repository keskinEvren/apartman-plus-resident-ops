/**
 * Tool: asanmod_check_prod_fix_commit
 * PROD Fix commit message check (Rule 9)
 */

import { execSync } from "child_process";

export interface ProdFixCommitResult {
  isProdFix: boolean;
  formatValid: boolean;
  module?: string;
  description?: string;
  errors: string[];
}

/**
 * Extract module from commit message
 */
function extractModule(commitMessage: string): string | undefined {
  const match = commitMessage.match(
    /^(?:feat|fix|refactor|docs|style|test|chore|perf|ci|build|revert)\(([^)]+)\):/
  );
  return match ? match[1] : undefined;
}

/**
 * Extract description from commit message
 */
function extractDescription(commitMessage: string): string | undefined {
  const match = commitMessage.match(
    /^(?:feat|fix|refactor|docs|style|test|chore|perf|ci|build|revert)(?:\([^)]+\))?:\s*(.+?)(?:\s*\[PROD-FIX\])?$/
  );
  return match ? match[1].trim() : undefined;
}

/**
 * Validate commit message format
 */
function validateFormat(commitMessage: string): boolean {
  // Expected format: fix(module): description [PROD-FIX]
  const formatPattern =
    /^(feat|fix|refactor|docs|style|test|chore|perf|ci|build|revert)(\(.+\))?: .+ \[PROD-FIX\]/;

  const firstLine = commitMessage.split("\n")[0];
  return formatPattern.test(firstLine);
}

/**
 * Check PROD Fix commit
 */
export async function checkProdFixCommit(
  commitHash?: string
): Promise<ProdFixCommitResult> {
  const errors: string[] = [];

  try {
    // Get commit message
    const commitMessage = execSync(
      `git log -1 --pretty=%B ${commitHash || "HEAD"}`,
      { encoding: "utf-8" }
    ).trim();

    // Check if commit contains [PROD-FIX] tag
    const isProdFix = commitMessage.includes("[PROD-FIX]");

    if (!isProdFix) {
      return {
        isProdFix: false,
        formatValid: false,
        errors: [],
      };
    }

    // Validate format
    const formatValid = validateFormat(commitMessage);

    // Extract module and description
    const module = extractModule(commitMessage);
    const description = extractDescription(commitMessage);

    // Add errors if format is invalid
    if (!formatValid) {
      errors.push(
        `Invalid commit format. Expected: fix(module): description [PROD-FIX]`
      );
    }

    return {
      isProdFix: true,
      formatValid,
      module,
      description,
      errors,
    };
  } catch (error) {
    errors.push(`Check failed: ${error}`);
    return {
      isProdFix: false,
      formatValid: false,
      errors,
    };
  }
}
