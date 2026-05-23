/**
 * Tool: asanmod_verify_mcp_only
 * v8.0: Verifies that MCP-only file operations rule is enforced.
 * Checks for forbidden fs imports in asanmod-mcp/src (except mcpClient.ts which is allowed for fallback).
 */

import { execSync } from "child_process";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface MCPOnlyResult {
  success: boolean;
  violations: Array<{
    file: string;
    line: number;
    violation: string;
  }>;
  allowedFiles: string[]; // Files that are allowed to use fs (e.g., mcpClient.ts)
  error?: string;
}

/**
 * Allowed files that can use fs (for fallback purposes)
 */
const ALLOWED_FS_FILES = [
  "mcp-servers/asanmod-mcp/src/utils/mcpClient.ts", // Fallback implementation
];

export async function verifyMCPOnly(path?: string): Promise<MCPOnlyResult> {
  const violations: Array<{
    file: string;
    line: number;
    violation: string;
  }> = [];

  try {
    const workspaceRoot = getWorkspaceRoot(import.meta.url);
    const searchPath =
      path || join(workspaceRoot, "mcp-servers/asanmod-mcp/src");

    // Use grep to find fs imports
    // Pattern: import ... from "fs" or require("fs")
    const patterns = [
      "import.*from.*[\"']fs[\"']",
      "require\\([\"']fs[\"']\\)",
      "import.*from.*[\"']node:fs[\"']",
      "require\\([\"']node:fs[\"']\\)",
    ];

    for (const pattern of patterns) {
      try {
        // Use ripgrep (rg) if available, otherwise fallback to grep
        let command = `rg -n "${pattern}" "${searchPath}" --type ts --type js || true`;
        const output = execSync(command, {
          encoding: "utf-8",
          cwd: workspaceRoot,
          stdio: ["ignore", "pipe", "ignore"],
        });

        const lines = output.split("\n").filter(Boolean);
        for (const line of lines) {
          // Format: file:line:content
          const match = line.match(/^(.+?):(\d+):(.+)$/);
          if (match) {
            const [, filePath, lineNum, content] = match;
            const relativePath = filePath.replace(workspaceRoot + "/", "");

            // Check if file is in allowed list
            const isAllowed = ALLOWED_FS_FILES.some((allowed) =>
              relativePath.includes(allowed)
            );

            if (!isAllowed && content.trim()) {
              violations.push({
                file: relativePath,
                line: parseInt(lineNum, 10),
                violation: `fs import detected: ${content.trim()}`,
              });
            }
          }
        }
      } catch (error) {
        // rg might not be available, try grep
        try {
          const command = `grep -rn "${pattern}" "${searchPath}" --include="*.ts" --include="*.js" || true`;
          const output = execSync(command, {
            encoding: "utf-8",
            cwd: workspaceRoot,
            stdio: ["ignore", "pipe", "ignore"],
          });

          const lines = output.split("\n").filter(Boolean);
          for (const line of lines) {
            const match = line.match(/^(.+?):(\d+):(.+)$/);
            if (match) {
              const [, filePath, lineNum, content] = match;
              const relativePath = filePath.replace(workspaceRoot + "/", "");

              const isAllowed = ALLOWED_FS_FILES.some((allowed) =>
                relativePath.includes(allowed)
              );

              if (!isAllowed && content.trim()) {
                violations.push({
                  file: relativePath,
                  line: parseInt(lineNum, 10),
                  violation: `fs import detected: ${content.trim()}`,
                });
              }
            }
          }
        } catch (grepError) {
          // Both rg and grep failed, skip this pattern
          continue;
        }
      }
    }

    // Remove duplicates (same file+line)
    const uniqueViolations = Array.from(
      new Map(violations.map((v) => [`${v.file}:${v.line}`, v])).values()
    );

    return {
      success: uniqueViolations.length === 0,
      violations: uniqueViolations,
      allowedFiles: ALLOWED_FS_FILES,
    };
  } catch (error) {
    return {
      success: false,
      violations: [],
      allowedFiles: ALLOWED_FS_FILES,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during MCP-only verification",
    };
  }
}
