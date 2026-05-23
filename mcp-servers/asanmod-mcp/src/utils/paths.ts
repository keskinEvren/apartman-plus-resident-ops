/**
 * ES Module compatible path utilities
 * Replaces __dirname with import.meta.url based approach
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

/**
 * Get the directory name of the current module
 * Use this instead of __dirname in ES modules
 */
export function getDirname(importMetaUrl: string): string {
  return dirname(fileURLToPath(importMetaUrl));
}

/**
 * Get the workspace root directory
 * Tries multiple strategies to find the project root
 */
export function getWorkspaceRoot(importMetaUrl?: string): string {
  // 1. Check environment variable first
  if (process.env.WORKSPACE_ROOT) {
    return process.env.WORKSPACE_ROOT;
  }

  // 2. Try to detect from import.meta.url if provided
  if (importMetaUrl) {
    const currentDir = getDirname(importMetaUrl);

    // If we're in dist/tools, go up 4 levels
    if (currentDir.includes("dist/tools")) {
      const root = join(currentDir, "..", "..", "..", "..");
      if (existsSync(join(root, "frontend"))) {
        return root;
      }
    }

    // If we're in mcp-servers/asanmod-mcp/src/tools, go up appropriately
    if (currentDir.includes("mcp-servers")) {
      // Go up until we find frontend/
      let testDir = currentDir;
      for (let i = 0; i < 6; i++) {
        if (existsSync(join(testDir, "frontend"))) {
          return testDir;
        }
        testDir = join(testDir, "..");
      }
    }
  }

  // 3. Try to detect from the running script path (works even if cwd is wrong)
  const argvPath = process.argv?.[1];
  if (argvPath) {
    let testDir = dirname(argvPath);
    for (let i = 0; i < 8; i++) {
      if (existsSync(join(testDir, "frontend"))) {
        return testDir;
      }
      testDir = join(testDir, "..");
    }
  }

  // 4. Try to detect from process.cwd()
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(currentDir, "frontend"))) {
      return currentDir;
    }
    currentDir = join(currentDir, "..");
  }

  // 5. Fallback to process.cwd()
  return process.cwd();
}

/**
 * Get possible frontend paths
 */
export function getFrontendPaths(importMetaUrl?: string): string[] {
  const workspaceRoot = getWorkspaceRoot(importMetaUrl);
  const currentDir = importMetaUrl ? getDirname(importMetaUrl) : process.cwd();

  return [
    join(workspaceRoot, "frontend"),
    join(process.cwd(), "frontend"),
    join(process.cwd(), "..", "frontend"),
    join(currentDir, "..", "..", "..", "frontend"),
    join(currentDir, "..", "..", "..", "..", "frontend"),
  ].filter((p) => existsSync(p));
}

/**
 * Get possible backend paths
 */
export function getBackendPaths(importMetaUrl?: string): string[] {
  const workspaceRoot = getWorkspaceRoot(importMetaUrl);
  const currentDir = importMetaUrl ? getDirname(importMetaUrl) : process.cwd();

  return [
    join(workspaceRoot, "backend"),
    join(process.cwd(), "backend"),
    join(process.cwd(), "..", "backend"),
    join(currentDir, "..", "..", "..", "backend"),
    join(currentDir, "..", "..", "..", "..", "backend"),
  ].filter((p) => existsSync(p));
}
