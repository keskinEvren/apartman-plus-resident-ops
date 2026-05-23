/**
 * Tool: asanmod_verify_lint
 * Lint kontrolü yapar. Errors=0, Warnings=0 şartı aranır.
 */

import { execSync } from "child_process";
import { cache } from "../cache.js";
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface LintResult {
  success: boolean;
  errors: number;
  warnings: number;
  output?: string;
  error?: string;
}

export async function verifyLint(path?: string): Promise<LintResult> {
  try {
    // Use getWorkspaceRoot to find the correct project root
    const workspaceRoot = getWorkspaceRoot(import.meta.url);
    const targetPath = path || workspaceRoot;
    const frontendPath = join(targetPath, "frontend");
    const backendPath = join(targetPath, "backend");

    let totalErrors = 0;
    let totalWarnings = 0;
    const outputs: string[] = [];

    // Frontend ESLint check
    if (existsSync(frontendPath)) {
      try {
        const packageJsonPath = join(frontendPath, "package.json");
        let contentHash = "default";
        const { fileExistsMCP, readFileMCP } =
          await import("../utils/mcpClient.js");
        if (await fileExistsMCP(packageJsonPath)) {
          const content = await readFileMCP(packageJsonPath);
          contentHash = createHash("md5")
            .update(content)
            .digest("hex")
            .substring(0, 8);
        }

        const cacheKey = cache.getLintKey(frontendPath, contentHash);
        const cached = cache.get<LintResult>(cacheKey);
        if (cached) {
          totalErrors += cached.errors;
          totalWarnings += cached.warnings;
          if (cached.output) outputs.push(`[Frontend] ${cached.output}`);
        } else {
          const output = execSync(`npm run lint 2>&1 || true`, {
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
            cwd: frontendPath,
          });

          const errorMatch = output.match(/(\d+)\s+error/i);
          const warningMatch = output.match(/(\d+)\s+warning/i);

          const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;
          const warnings = warningMatch ? parseInt(warningMatch[1], 10) : 0;

          totalErrors += errors;
          totalWarnings += warnings;
          if (output) outputs.push(`[Frontend] ${output.substring(0, 500)}`);

          const result: LintResult = {
            success: errors === 0 && warnings === 0,
            errors,
            warnings,
            output: output.substring(0, 1000),
          };

          cache.set(cacheKey, result, 5 * 60 * 1000);
        }
      } catch (err: any) {
        totalErrors += 1;
        outputs.push(`[Frontend] Error: ${err.message || "Lint check failed"}`);
      }
    }

    // Backend ESLint check
    if (existsSync(backendPath)) {
      try {
        const packageJsonPath = join(backendPath, "package.json");
        let contentHash = "default";
        const { fileExistsMCP, readFileMCP } =
          await import("../utils/mcpClient.js");
        if (await fileExistsMCP(packageJsonPath)) {
          const content = await readFileMCP(packageJsonPath);
          contentHash = createHash("md5")
            .update(content)
            .digest("hex")
            .substring(0, 8);
        }

        const cacheKey = cache.getLintKey(backendPath, contentHash);
        const cached = cache.get<LintResult>(cacheKey);
        if (cached) {
          totalErrors += cached.errors;
          totalWarnings += cached.warnings;
          if (cached.output) outputs.push(`[Backend] ${cached.output}`);
        } else {
          const output = execSync(`npm run lint 2>&1 || true`, {
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
            cwd: backendPath,
          });

          const errorMatch = output.match(/(\d+)\s+error/i);
          const warningMatch = output.match(/(\d+)\s+warning/i);

          const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;
          const warnings = warningMatch ? parseInt(warningMatch[1], 10) : 0;

          totalErrors += errors;
          totalWarnings += warnings;
          if (output) outputs.push(`[Backend] ${output.substring(0, 500)}`);

          const result: LintResult = {
            success: errors === 0 && warnings === 0,
            errors,
            warnings,
            output: output.substring(0, 1000),
          };

          cache.set(cacheKey, result, 5 * 60 * 1000);
        }
      } catch (err: any) {
        totalErrors += 1;
        outputs.push(`[Backend] Error: ${err.message || "Lint check failed"}`);
      }
    }

    return {
      success: totalErrors === 0 && totalWarnings === 0,
      errors: totalErrors,
      warnings: totalWarnings,
      output: outputs.join("\n").substring(0, 1000),
    };
  } catch (error) {
    return {
      success: false,
      errors: 1,
      warnings: 0,
      output: error instanceof Error ? error.message : "Lint check failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
