/**
 * File Hash Utility
 * Calculates SHA256 hash for file content caching
 */

import { createHash } from "crypto";
import { readFileSync, statSync, existsSync } from "fs";

export interface FileHashResult {
  hash: string;
  size: number;
  mtime: number; // Last modified time
}

/**
 * Calculate SHA256 hash of file content
 */
export function calculateFileHash(filePath: string): FileHashResult {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = readFileSync(filePath, "utf-8");
    const stats = statSync(filePath);
    const hash = createHash("sha256").update(content).digest("hex");

    return {
      hash,
      size: stats.size,
      mtime: stats.mtimeMs,
    };
  } catch (error: any) {
    // Provide detailed error message
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    } else if (error.code === "EACCES") {
      throw new Error(`Permission denied: ${filePath}`);
    } else if (error.code === "EISDIR") {
      throw new Error(`Path is a directory, not a file: ${filePath}`);
    } else {
      throw new Error(
        `Failed to calculate file hash for ${filePath}: ${error.message}`
      );
    }
  }
}

/**
 * Calculate hash of string content
 */
export function calculateContentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Generate cache key for file
 */
export function getFileCacheKey(filePath: string, hash?: string): string {
  if (hash) {
    return `file:${filePath}:${hash}`;
  }
  return `file:${filePath}`;
}
