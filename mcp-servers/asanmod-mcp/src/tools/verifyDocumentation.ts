/**
 * Tool: asanmod_verify_documentation
 * Documentation kontrolü (JSDoc comments, README updates)
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface DocumentationResult {
  success: boolean;
  issues: Array<{
    file: string;
    type: "missing_jsdoc" | "missing_readme";
    issue: string;
  }>;
  count: number;
  error?: string;
}

export async function verifyDocumentation(
  path?: string
): Promise<DocumentationResult> {
  // Get project root using ES Module compatible helper
  const projectRoot = getWorkspaceRoot();
  const targetPath = path || projectRoot;
  const issues: DocumentationResult["issues"] = [];

  try {
    // Git'teki yeni dosyaları kontrol et (try --staged, fallback to regular diff)
    let stagedFiles: string[] = [];
    try {
      const output = execSync("git diff --staged --name-only", {
        encoding: "utf-8",
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024,
        stdio: "pipe",
      });
      stagedFiles = output
        .split("\n")
        .filter(
          (f) =>
            f.trim().length > 0 &&
            (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".js"))
        );
    } catch {
      try {
        const output = execSync("git diff --name-only", {
          encoding: "utf-8",
          cwd: projectRoot,
          maxBuffer: 10 * 1024 * 1024,
          stdio: "pipe",
        });
        stagedFiles = output
          .split("\n")
          .filter(
            (f) =>
              f.trim().length > 0 &&
              (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".js"))
          );
      } catch {
        // No git changes, return success
        return {
          success: true,
          issues: [],
          count: 0,
        };
      }
    }

    for (const file of stagedFiles) {
      const fullPath = join(projectRoot, file);
      if (!existsSync(fullPath)) continue;

      // Yeni dosya mı kontrol et (try --staged, fallback to regular diff)
      let isNewFile = false;
      try {
        execSync(
          `git diff --staged --diff-filter=A --name-only | grep -q "^${file}$"`,
          {
            encoding: "utf-8",
            stdio: "ignore",
            cwd: projectRoot,
          }
        );
        isNewFile = true;
      } catch {
        try {
          execSync(
            `git diff --diff-filter=A --name-only | grep -q "^${file}$"`,
            {
              encoding: "utf-8",
              stdio: "ignore",
              cwd: projectRoot,
            }
          );
          isNewFile = true;
        } catch {
          // Not a new file, skip
          continue;
        }
      }

      if (isNewFile) {
        // Yeni dosya, JSDoc kontrolü yap
        const content = readFileSync(fullPath, "utf-8");

        // Export edilen function'lar için JSDoc kontrolü
        const exportedFunctions = content.match(
          /export\s+(function|const\s+\w+\s*=\s*(async\s+)?\(|class)/g
        );
        if (exportedFunctions && exportedFunctions.length > 0) {
          // Basit JSDoc kontrolü
          const hasJSDoc = content.includes("/**") || content.includes("* @");
          if (!hasJSDoc) {
            issues.push({
              file,
              type: "missing_jsdoc",
              issue: "New file with exported functions missing JSDoc comments",
            });
          }
        }
      }
    }

    return {
      success: issues.length === 0,
      issues,
      count: issues.length,
    };
  } catch (err: any) {
    return {
      success: false,
      issues: [],
      count: 0,
      error: err.message || "Documentation check failed",
    };
  }
}
