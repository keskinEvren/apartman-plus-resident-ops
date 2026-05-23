/**
 * Tool: asanmod_lint_fix
 * Otomatik lint düzeltmesi (safe mode).
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface LintFixResult {
  success: boolean;
  fixed: number;
  output?: string;
  error?: string;
}

export async function lintFix(path?: string): Promise<LintFixResult> {
  // Use getWorkspaceRoot to find the correct project root
  const workspaceRoot = getWorkspaceRoot(import.meta.url);
  const targetPath = path || workspaceRoot;
  const lintPath = join(targetPath, "frontend");

  if (!existsSync(lintPath)) {
    return {
      success: false,
      fixed: 0,
      error: "Frontend directory not found",
    };
  }

  try {
    // ESLint --fix çalıştır
    const output = execSync(`npx eslint . --fix 2>&1 || true`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      cwd: lintPath,
    });

    // Fixed count parse (yaklaşık)
    const fixedMatch = output.match(/(\d+)\s+problem/i);
    const fixed = fixedMatch ? parseInt(fixedMatch[1], 10) : 0;

    return {
      success: true,
      fixed,
      output: output.substring(0, 1000),
    };
  } catch (err: any) {
    return {
      success: false,
      fixed: 0,
      error: err.message || "Lint fix failed",
    };
  }
}
