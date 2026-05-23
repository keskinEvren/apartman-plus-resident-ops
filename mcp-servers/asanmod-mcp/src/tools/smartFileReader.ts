/**
 * Smart File Reader
 * Token optimization: Selective file reading (offset/limit, function/class-based)
 * Falls back to full file reading if selective reading fails
 */

import { cache } from "../cache.js";
import { calculateFileHash, getFileCacheKey } from "../utils/fileHash.js";
import {
  parseAST,
  findFunction,
  findClass,
  findMethod,
} from "../utils/astParser.js";
import { isFeatureEnabled } from "../utils/featureFlags.js";
import { recordFileRead } from "../utils/tokenMetrics.js";
import {
  isMemoryMCPAvailable,
  getFileContentMemoryFormat,
} from "../utils/memoryMcpIntegration.js";

export interface SmartReadOptions {
  function?: string;
  class?: string;
  method?: string;
  offset?: number;
  limit?: number;
  useCache?: boolean;
}

export interface SmartReadResult {
  content: string;
  fromCache: boolean;
  linesRead: number;
  totalLines: number;
  method: "full" | "function" | "class" | "method" | "range";
}

/**
 * Read file smartly (selective reading with cache)
 * Token optimization: Only reads necessary parts of large files
 */
export async function readFileSmart(
  filePath: string,
  options: SmartReadOptions = {}
): Promise<SmartReadResult> {
  // Check feature flags
  const useCache =
    options.useCache !== false && isFeatureEnabled("contextCaching");
  const useSelective = isFeatureEnabled("selectiveReading");

  // If selective reading disabled, fallback to full file
  if (
    !useSelective &&
    (options.function || options.class || options.offset !== undefined)
  ) {
    // Force full file read
    options = {};
  }

  const useCacheFlag = options.useCache !== false;

  // 1. Calculate file hash for cache invalidation
  let fileHash: string;
  try {
    const hashResult = calculateFileHash(filePath);
    fileHash = hashResult.hash;
  } catch (error: any) {
    // If hash calculation fails, use timestamp-based key
    fileHash = Date.now().toString();
  }

  // 2. Check cache
  if (useCache) {
    const cached = cache.getFile<string>(filePath, fileHash);
    if (cached) {
      recordFileRead(filePath, cached, true, "cache");
      return {
        content: cached,
        fromCache: true,
        linesRead: cached.split("\n").length,
        totalLines: cached.split("\n").length,
        method: "full",
      };
    }
  }

  // 3. Read file (Filesystem MCP - Phase 2.5)
  let fullContent: string;
  try {
    const { readFileMCP } = await import("../utils/mcpClient.js");
    fullContent = await readFileMCP(filePath);
  } catch (error: any) {
    throw new Error(`Failed to read file: ${error.message}`);
  }

  const allLines = fullContent.split("\n");
  const totalLines = allLines.length;

  // 4. Selective reading based on options
  let content: string;
  let method: SmartReadResult["method"] = "full";
  let linesRead = totalLines;

  // 4.1 Function-based reading
  if (options.function) {
    const ast = parseAST(fullContent, filePath);
    const func = findFunction(ast, options.function);

    if (func) {
      const startIdx = Math.max(0, func.startLine - 1); // Convert to 0-indexed
      const endIdx = Math.min(allLines.length, func.endLine);
      content = allLines.slice(startIdx, endIdx).join("\n");
      method = "function";
      linesRead = endIdx - startIdx;
    } else {
      // Function not found, fallback to full file
      content = fullContent;
    }
  }
  // 4.2 Class-based reading (only if selective reading enabled)
  else if (useSelective && options.class) {
    const ast = parseAST(fullContent, filePath);
    const classInfo = findClass(ast, options.class);

    if (classInfo) {
      // If method specified, read only method
      if (options.method) {
        const methodInfo = findMethod(classInfo, options.method);
        if (methodInfo) {
          const startIdx = Math.max(0, methodInfo.startLine - 1);
          const endIdx = Math.min(allLines.length, methodInfo.endLine);
          content = allLines.slice(startIdx, endIdx).join("\n");
          method = "method";
          linesRead = endIdx - startIdx;
        } else {
          content = fullContent; // Method not found, fallback
        }
      } else {
        // Read entire class
        const startIdx = Math.max(0, classInfo.startLine - 1);
        const endIdx = Math.min(allLines.length, classInfo.endLine);
        content = allLines.slice(startIdx, endIdx).join("\n");
        method = "class";
        linesRead = endIdx - startIdx;
      }
    } else {
      // Class not found, fallback to full file
      content = fullContent;
    }
  }
  // 4.3 Range-based reading (offset/limit) (only if selective reading enabled)
  else if (
    useSelective &&
    (options.offset !== undefined || options.limit !== undefined)
  ) {
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    const startIdx = Math.max(0, offset);
    const endIdx = Math.min(allLines.length, startIdx + limit);
    content = allLines.slice(startIdx, endIdx).join("\n");
    method = "range";
    linesRead = endIdx - startIdx;
  }
  // 4.4 Full file reading (fallback)
  else {
    content = fullContent;
  }

  // 5. Cache the result (cache full content for future use)
  if (useCache && useCacheFlag) {
    cache.setFile(filePath, content, fileHash);

    // Optional: Sync to Memory MCP if available (for persistence across sessions)
    // Note: Agent should call mcp_memory_create_entities with the result
    if (isMemoryMCPAvailable() && method === "full") {
      // Store memory format info (agent can use this)
      const memoryFormat = getFileContentMemoryFormat(
        filePath,
        content,
        fileHash
      );
      // This is informational - actual sync happens via MCP tool
      // Agent can use: mcp_memory_create_entities(memoryFormat.entities)
    }
  }

  // Record metrics
  recordFileRead(filePath, content, false, method);

  return {
    content,
    fromCache: false,
    linesRead,
    totalLines,
    method,
  };
}

/**
 * Read file range (helper function)
 */
export function readFileRange(
  content: string,
  startLine: number,
  endLine: number
): string {
  const lines = content.split("\n");
  const startIdx = Math.max(0, startLine - 1); // Convert to 0-indexed
  const endIdx = Math.min(lines.length, endLine);
  return lines.slice(startIdx, endIdx).join("\n");
}
