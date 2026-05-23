/**
 * Scope-aware source scanning utilities.
 * Designed for fast, deterministic checks without scanning editor caches.
 */

import { promises as fs } from "fs";
import { existsSync } from "fs";
import { extname, join } from "path";

export const DEFAULT_PRODUCT_DIRS = ["frontend", "backend", "prisma"] as const;

export const DEFAULT_EXCLUDE_DIRS = new Set([
  "node_modules",

  // Next.js / frontend build artifacts
  ".next",
  ".next-dev",
  ".next-cache",

  // Build outputs
  "dist",
  "build",
  "out",
  "coverage",

  // Tooling / IDE caches
  ".git",
  ".cursor",
  ".cursor-server",
  ".vscode",
  ".turbo",
  ".cache",

  "_snapshot",
]);

export function resolveScanRoots(
  workspaceRoot: string,
  targetPath?: string
): string[] {
  if (targetPath) {
    return [targetPath];
  }

  const roots = DEFAULT_PRODUCT_DIRS.map((dir) =>
    join(workspaceRoot, dir)
  ).filter((p) => existsSync(p));

  return roots.length > 0 ? roots : [workspaceRoot];
}

export async function collectSourceFiles(
  roots: string[],
  options?: {
    excludeDirs?: Set<string>;
    includeExtensions?: Set<string>;
    maxFiles?: number;
  }
): Promise<string[]> {
  const excludeDirs = options?.excludeDirs ?? DEFAULT_EXCLUDE_DIRS;
  const includeExtensions =
    options?.includeExtensions ?? new Set([".ts", ".tsx", ".js", ".jsx"]);
  const maxFiles = options?.maxFiles ?? 50_000;

  const files: string[] = [];

  async function walkDir(dir: string): Promise<void> {
    if (files.length >= maxFiles) return;

    let entries: Array<import("fs").Dirent> = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Fast-path excludes by directory name
        if (excludeDirs.has(entry.name)) continue;

        // Defensive exclude for Next.js artifacts (covers .next-dev/.next-cache variations)
        if (entry.name.startsWith(".next")) continue;

        await walkDir(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      const ext = extname(entry.name);
      if (!includeExtensions.has(ext)) continue;

      // Path-based exclude: skip any file path containing build artifacts
      // Check both Unix (/) and Windows (\) path separators
      if (fullPath.includes("/.next") || fullPath.includes("\\.next")) continue;
      if (fullPath.includes("/dist/") || fullPath.includes("\\dist\\"))
        continue;
      if (fullPath.includes("/build/") || fullPath.includes("\\build\\"))
        continue;
      if (
        fullPath.includes("/node_modules/") ||
        fullPath.includes("\\node_modules\\")
      )
        continue;

      files.push(fullPath);
    }
  }

  for (const root of roots) {
    await walkDir(root);
    if (files.length >= maxFiles) break;
  }

  return files;
}

export function toWorkspaceRelativePath(
  workspaceRoot: string,
  absolutePath: string
): string {
  const normalizedRoot = workspaceRoot.endsWith("/")
    ? workspaceRoot
    : workspaceRoot + "/";
  return absolutePath.startsWith(normalizedRoot)
    ? absolutePath.slice(normalizedRoot.length)
    : absolutePath;
}

export function getLineInfoFromIndex(
  content: string,
  index: number
): {
  line: number;
  snippet: string;
} {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content.charCodeAt(i) === 10) line++; // \n
  }

  const lineStart = content.lastIndexOf("\n", index);
  const lineEnd = content.indexOf("\n", index);
  const start = lineStart === -1 ? 0 : lineStart + 1;
  const end = lineEnd === -1 ? content.length : lineEnd;
  const snippet = content.slice(start, end).trim().slice(0, 200);

  return { line, snippet };
}
