/**
 * ASANMOD MCP Tool: File Watcher
 * ASANMOD dokümantasyon dosyalarını izler ve değişiklikleri tespit eder
 *
 * Phase 2: Self-Update Detection - File Watcher
 */

import { existsSync, statSync } from "fs";
import { join } from "path";

interface FileWatcherResult {
  watchedFiles: WatchedFile[];
  changes: FileChange[];
  timestamp: string;
}

interface WatchedFile {
  path: string;
  exists: boolean;
  lastModified?: string;
  size?: number;
}

interface FileChange {
  filePath: string;
  changeType: "modified" | "created" | "deleted";
  lastModified: string;
  size: number;
}

/**
 * Project root detection
 */
function getProjectRoot(): string {
  let projectRoot = process.env.WORKSPACE_ROOT || "";

  if (!projectRoot) {
    let currentDir = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (
        existsSync(join(currentDir, "docs", "workflow", "ASANMOD-MASTER.md"))
      ) {
        projectRoot = currentDir;
        break;
      }
      currentDir = join(currentDir, "..");
    }
  }

  return projectRoot || process.cwd();
}

/**
 * Watch ASANMOD documentation files
 */
export async function watchAsanmodFiles(
  path?: string
): Promise<FileWatcherResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  // ASANMOD-related files to watch
  const asanmodFiles = [
    "docs/workflow/ASANMOD-MASTER.md",
    "docs/workflow/ASANMOD-REFERENCE-INDEX.md",
    ".cursorrules",
    ".cursor/rules/asanmod.mdc",
    "docs/ASANMOD-UNIVERSAL-TEMPLATE.md",
    "docs/ASANMOD-QUICK-START.md",
    "docs/MCP-FILESYSTEM-CONFIG.md",
    "docs/workflow/ASANMOD-SELF-UPDATING-SYSTEM-STRATEGY.md",
  ];

  const result: FileWatcherResult = {
    watchedFiles: [],
    changes: [],
    timestamp: new Date().toISOString(),
  };

  for (const file of asanmodFiles) {
    const fullPath = join(projectRoot, file);
    const exists = existsSync(fullPath);

    const watchedFile: WatchedFile = {
      path: file,
      exists,
    };

    if (exists) {
      try {
        const stats = statSync(fullPath);
        watchedFile.lastModified = stats.mtime.toISOString();
        watchedFile.size = stats.size;
      } catch (error) {
        // Ignore stat errors
      }
    }

    result.watchedFiles.push(watchedFile);

    // Detect changes (compare with previous state if available)
    // For now, we just report current state
    // In a real implementation, we would compare with a stored state
    if (exists) {
      try {
        const stats = statSync(fullPath);
        result.changes.push({
          filePath: file,
          changeType: "modified", // Always "modified" for now (we don't have previous state)
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
        });
      } catch (error) {
        // Ignore stat errors
      }
    }
  }

  return result;
}

/**
 * MCP Tool Handler
 */
export async function handleFileWatcher(args: {
  path?: string;
}): Promise<FileWatcherResult> {
  return watchAsanmodFiles(args.path);
}
