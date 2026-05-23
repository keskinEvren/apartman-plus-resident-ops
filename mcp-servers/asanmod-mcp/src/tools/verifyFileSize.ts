/**
 * Tool: asanmod_verify_file_size
 * File size kontrolü (çok büyük dosyalar, bundle size)
 */

import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface FileSizeResult {
  success: boolean;
  largeFiles: Array<{
    file: string;
    size: number;
    sizeMB: number;
    issue: string;
  }>;
  count: number;
  error?: string;
}

export async function verifyFileSize(path?: string): Promise<FileSizeResult> {
  // Get project root using ES Module compatible helper
  const projectRoot = getWorkspaceRoot();
  const targetPath = path || projectRoot;
  const largeFiles: FileSizeResult["largeFiles"] = [];
  const maxSize = 1 * 1024 * 1024; // 1MB

  try {
    // Git'teki dosyaları kontrol et (try --staged, fallback to regular diff)
    let stagedFiles: string[] = [];
    try {
      const output = execSync("git diff --staged --name-only", {
        encoding: "utf-8",
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024,
        stdio: "pipe",
      });
      stagedFiles = output.split("\n").filter((f) => f.trim().length > 0);
    } catch {
      // If --staged fails, try regular diff
      try {
        const output = execSync("git diff --name-only", {
          encoding: "utf-8",
          cwd: projectRoot,
          maxBuffer: 10 * 1024 * 1024,
          stdio: "pipe",
        });
        stagedFiles = output.split("\n").filter((f) => f.trim().length > 0);
      } catch {
        // No git changes, return success
        return {
          success: true,
          largeFiles: [],
          count: 0,
        };
      }
    }

    for (const file of stagedFiles) {
      const fullPath = join(projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const stats = statSync(fullPath);
      const sizeMB = stats.size / (1024 * 1024);

      if (stats.size > maxSize) {
        largeFiles.push({
          file,
          size: stats.size,
          sizeMB: Math.round(sizeMB * 100) / 100,
          issue: `File size exceeds 1MB (${sizeMB.toFixed(2)}MB)`,
        });
      }
    }

    return {
      success: largeFiles.length === 0,
      largeFiles,
      count: largeFiles.length,
    };
  } catch (err: any) {
    return {
      success: false,
      largeFiles: [],
      count: 0,
      error: err.message || "File size check failed",
    };
  }
}
