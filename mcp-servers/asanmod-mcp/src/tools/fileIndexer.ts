/**
 * File Indexer Tool
 * Token optimization: Pre-indexes files for fast function/class lookup
 * Enables selective reading without parsing every time
 */

import { parseAST, ParseResult } from "../utils/astParser.js";
import { calculateFileHash } from "../utils/fileHash.js";
import { join } from "path";
import {
  readFileMCP,
  writeFileMCP,
  fileExistsMCP,
  getFileInfoMCP,
} from "../utils/mcpClient.js";

export interface FileIndex {
  path: string;
  functions: Array<{
    name: string;
    startLine: number;
    endLine: number;
    type: string;
  }>;
  classes: Array<{
    name: string;
    startLine: number;
    endLine: number;
    methods: Array<{ name: string; startLine: number; endLine: number }>;
  }>;
  imports: string[];
  hash: string;
  size: number;
  lastModified: number;
}

export interface IndexStorage {
  [filePath: string]: FileIndex;
}

// In-memory index cache
let indexCache: IndexStorage = {};

// Index file path (JSON storage)
const INDEX_FILE_PATH = join(process.cwd(), ".asanmod-file-index.json");

/**
 * Load index from disk (Filesystem MCP - Phase 2.4)
 */
export async function loadIndex(): Promise<IndexStorage> {
  try {
    if (await fileExistsMCP(INDEX_FILE_PATH)) {
      const content = await readFileMCP(INDEX_FILE_PATH);
      indexCache = JSON.parse(content);
      return indexCache;
    }
  } catch (error: any) {
    console.warn(`[FileIndexer] Failed to load index: ${error.message}`);
  }
  return {};
}

/**
 * Save index to disk (Filesystem MCP - Phase 2.4)
 */
export async function saveIndex(): Promise<void> {
  try {
    await writeFileMCP(INDEX_FILE_PATH, JSON.stringify(indexCache, null, 2));
  } catch (error: any) {
    console.warn(`[FileIndexer] Failed to save index: ${error.message}`);
  }
}

/**
 * Index a single file
 */
export async function indexFile(
  filePath: string,
  force: boolean = false
): Promise<FileIndex> {
  try {
    // Check if file exists (Filesystem MCP - Phase 2.4)
    if (!(await fileExistsMCP(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file info (Filesystem MCP - Phase 2.4)
    const fileInfo = await getFileInfoMCP(filePath);

    // Calculate hash
    const hashResult = calculateFileHash(filePath);

    // Check if already indexed and up-to-date (incremental indexing)
    if (!force) {
      const existingIndex = indexCache[filePath];
      if (existingIndex && existingIndex.hash === hashResult.hash) {
        // File unchanged, return cached index
        return existingIndex;
      }

      // File changed or not indexed, continue to re-index
    }

    // Read file content (Filesystem MCP - Phase 2.4)
    const content = await readFileMCP(filePath);

    // Parse AST
    const ast = parseAST(content, filePath);

    // Build index
    const index: FileIndex = {
      path: filePath,
      functions: ast.functions.map((f) => ({
        name: f.name,
        startLine: f.startLine,
        endLine: f.endLine,
        type: f.type,
      })),
      classes: ast.classes.map((c) => ({
        name: c.name,
        startLine: c.startLine,
        endLine: c.endLine,
        methods: c.methods.map((m) => ({
          name: m.name,
          startLine: m.startLine,
          endLine: m.endLine,
        })),
      })),
      imports: ast.imports,
      hash: hashResult.hash,
      size: hashResult.size,
      lastModified: fileInfo.modified.getTime(),
    };

    // Update cache
    indexCache[filePath] = index;

    return index;
  } catch (error: any) {
    throw new Error(`Failed to index file ${filePath}: ${error.message}`);
  }
}

/**
 * Index multiple files (batch)
 */
export async function indexFiles(filePaths: string[]): Promise<FileIndex[]> {
  const results = await Promise.allSettled(
    filePaths.map((path) => indexFile(path))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<FileIndex> => r.status === "fulfilled"
    )
    .map((r) => r.value);
}

/**
 * Get file index (from cache or create new)
 */
export function getFileIndex(filePath: string): FileIndex | null {
  return indexCache[filePath] || null;
}

/**
 * Find function in index
 */
export function findFunctionInIndex(
  filePath: string,
  functionName: string
): { startLine: number; endLine: number } | null {
  const index = getFileIndex(filePath);
  if (!index) return null;

  const func = index.functions.find((f) => f.name === functionName);
  if (!func) return null;

  return {
    startLine: func.startLine,
    endLine: func.endLine,
  };
}

/**
 * Find class in index
 */
export function findClassInIndex(
  filePath: string,
  className: string
): {
  startLine: number;
  endLine: number;
  methods: Array<{ name: string; startLine: number; endLine: number }>;
} | null {
  const index = getFileIndex(filePath);
  if (!index) return null;

  const classInfo = index.classes.find((c) => c.name === className);
  if (!classInfo) return null;

  return {
    startLine: classInfo.startLine,
    endLine: classInfo.endLine,
    methods: classInfo.methods,
  };
}

/**
 * Get file dependencies (imports)
 */
export function getFileDependencies(filePath: string): string[] {
  const index = getFileIndex(filePath);
  return index?.imports || [];
}

/**
 * Clear index cache
 */
export function clearIndex(): void {
  indexCache = {};
}

/**
 * Get index statistics
 */
export function getIndexStats(): {
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  totalImports: number;
} {
  const files = Object.values(indexCache);
  return {
    totalFiles: files.length,
    totalFunctions: files.reduce((sum, f) => sum + f.functions.length, 0),
    totalClasses: files.reduce((sum, f) => sum + f.classes.length, 0),
    totalImports: files.reduce((sum, f) => sum + f.imports.length, 0),
  };
}

/**
 * Incremental index: Only index changed files
 */
export async function incrementalIndex(filePaths: string[]): Promise<{
  indexed: FileIndex[];
  skipped: number;
  failed: number;
}> {
  const indexed: FileIndex[] = [];
  let skipped = 0;
  let failed = 0;

  for (const filePath of filePaths) {
    try {
      const index = await indexFile(filePath, false); // Don't force, use cache check

      // Check if this was a new index or cached
      const wasCached =
        indexCache[filePath] && indexCache[filePath].hash === index.hash;
      if (!wasCached) {
        indexed.push(index);
      } else {
        skipped++;
      }
    } catch (error: any) {
      console.warn(
        `[FileIndexer] Failed to index ${filePath}: ${error.message}`
      );
      failed++;
    }
  }

  return { indexed, skipped, failed };
}

/**
 * Get changed files (for incremental indexing)
 * Compares file hashes with index cache
 */
export async function getChangedFiles(filePaths: string[]): Promise<string[]> {
  const changed: string[] = [];

  // Check all files in parallel for better performance
  const checks = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      try {
        if (!(await fileExistsMCP(filePath))) return null;

        const hashResult = calculateFileHash(filePath);
        const existingIndex = indexCache[filePath];

        if (!existingIndex || existingIndex.hash !== hashResult.hash) {
          return filePath;
        }
        return null;
      } catch (error: any) {
        // Include file if hash calculation fails (might be new file)
        return filePath;
      }
    })
  );

  for (const result of checks) {
    if (result.status === "fulfilled" && result.value) {
      changed.push(result.value);
    }
  }

  return changed;
}

// Load index on module load (async - will be called when needed)
// Note: loadIndex() is now async, so we can't call it at module load time
// It will be called when needed by the first indexFile() call
