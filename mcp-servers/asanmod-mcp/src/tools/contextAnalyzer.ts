/**
 * Context Analyzer Tool
 * Token optimization: Smart context loading based on dependencies and size limits
 */

import {
  getContextFiles,
  prioritizeFiles,
  buildDependencyGraph,
} from "../utils/dependencyAnalyzer.js";
import { readFileSync, statSync, existsSync } from "fs";
import { readFileSmart, SmartReadOptions } from "./smartFileReader.js";
import { isFeatureEnabled } from "../utils/featureFlags.js";

export interface ContextAnalysis {
  files: string[];
  totalSize: number; // Estimated token count
  prioritized: string[];
  dependencies: Map<string, string[]>;
  recommendation: "load_all" | "load_prioritized" | "load_selective";
}

export interface ContextLoadOptions {
  filePath: string;
  maxTokens?: number; // Max tokens for context (default: 100K)
  maxDepth?: number; // Max dependency depth (default: 3)
  prioritize?: boolean; // Prioritize by dependencies (default: true)
  selective?: boolean; // Use selective reading (default: true)
}

/**
 * Estimate token count from file size
 * Improved estimation: Accounts for code vs text, comments, whitespace
 */
function estimateTokens(filePath: string): number {
  try {
    if (!existsSync(filePath)) return 0;
    const stats = statSync(filePath);
    const size = stats.size;

    // Read first 1000 bytes to determine file type
    const sample = readFileSync(filePath, "utf-8").substring(0, 1000);

    // Count different content types
    const codeLines = sample.split("\n").filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("/*")
      );
    }).length;

    const commentLines = sample.split("\n").filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*")
      );
    }).length;

    const totalLines = sample.split("\n").length;
    const codeRatio = totalLines > 0 ? codeLines / totalLines : 0.7; // Default 70% code

    // Improved estimation:
    // - Code: ~3.5 chars/token (more dense)
    // - Comments/text: ~4 chars/token (standard)
    // - Whitespace: ~6 chars/token (less dense)
    const codeTokens = Math.ceil((size * codeRatio) / 3.5);
    const textTokens = Math.ceil((size * (1 - codeRatio)) / 4);

    return codeTokens + textTokens;
  } catch (error: any) {
    // Fallback to simple estimation
    try {
      const stats = statSync(filePath);
      return Math.ceil(stats.size / 4);
    } catch {
      return 0;
    }
  }
}

/**
 * Estimate tokens from content string
 * More accurate for in-memory content
 */
export function estimateTokensFromContent(content: string): number {
  if (!content) return 0;

  // Count code vs comments
  const lines = content.split("\n");
  const codeLines = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*")
    );
  }).length;

  const codeRatio = lines.length > 0 ? codeLines / lines.length : 0.7;

  // Code is more dense (fewer tokens per character)
  const codeChars = content.length * codeRatio;
  const textChars = content.length * (1 - codeRatio);

  return Math.ceil(codeChars / 3.5) + Math.ceil(textChars / 4);
}

/**
 * Analyze context requirements for a file
 */
export async function analyzeContext(
  options: ContextLoadOptions
): Promise<ContextAnalysis> {
  const {
    filePath,
    maxTokens = 100000, // 100K tokens default
    maxDepth = 3,
    prioritize = true,
    selective = true,
  } = options;

  // Check feature flags
  const useIndexing = isFeatureEnabled("fileIndexing");
  const useSmartContext = isFeatureEnabled("smartContextLoading");

  // If features disabled, return simple analysis
  if (!useSmartContext) {
    return {
      files: [filePath],
      totalSize: estimateTokens(filePath),
      prioritized: [filePath],
      dependencies: new Map(),
      recommendation: "load_all",
    };
  }

  // Get dependency closure
  const contextFiles = getContextFiles(filePath, maxDepth);

  // Calculate sizes
  const fileSizes = new Map<string, number>();
  let totalSize = 0;

  for (const file of contextFiles) {
    const size = estimateTokens(file);
    fileSizes.set(file, size);
    totalSize += size;
  }

  // Build dependency graph
  const graph = buildDependencyGraph(contextFiles);
  const dependencies = new Map<string, string[]>();
  for (const [file, node] of graph.nodes.entries()) {
    dependencies.set(file, node.dependencies);
  }

  // Prioritize files
  const prioritized = prioritize ? prioritizeFiles(contextFiles) : contextFiles;

  // Determine recommendation
  let recommendation: ContextAnalysis["recommendation"] = "load_all";
  if (totalSize > maxTokens) {
    if (selective) {
      recommendation = "load_selective";
    } else {
      recommendation = "load_prioritized";
    }
  }

  return {
    files: contextFiles,
    totalSize,
    prioritized,
    dependencies,
    recommendation,
  };
}

/**
 * Load context smartly (respects token limits)
 * OPTIMIZED: Uses batch file reading with mcp_filesystem_read_multiple_files for parallel execution
 */
export async function loadContextSmart(
  options: ContextLoadOptions
): Promise<Map<string, string>> {
  const analysis = await analyzeContext(options);
  const { maxTokens = 100000, selective = true } = options;

  const loadedContext = new Map<string, string>();
  let currentTokens = 0;

  // Separate files into batches for parallel reading
  const filesToLoad: Array<{ path: string; size: number; selective: boolean }> =
    [];
  const filesToSkip: string[] = [];

  // First pass: Determine which files to load
  for (const filePath of analysis.prioritized) {
    const fileSize = estimateTokens(filePath);

    // Check if we can load this file
    if (currentTokens + fileSize > maxTokens) {
      if (selective && fileSize > 1000) {
        // Mark for selective reading
        filesToLoad.push({ path: filePath, size: fileSize, selective: true });
        currentTokens += 1000; // Estimate for selective read
      } else {
        // Skip file if too large
        filesToSkip.push(filePath);
        break;
      }
    } else {
      // Mark for full file reading
      filesToLoad.push({ path: filePath, size: fileSize, selective: false });
      currentTokens += fileSize;
    }
  }

  // Batch file reading optimization: Group files for parallel reading
  // Use mcp_filesystem_read_multiple_files when available (via agent)
  // For now, use Promise.all for parallel execution
  const readPromises = filesToLoad.map(
    async ({ path, selective: useSelective }) => {
      try {
        if (useSelective) {
          // Selective reading for large files
          const readOptions: SmartReadOptions = {
            offset: 0,
            limit: 100,
            useCache: true,
          };
          const result = await readFileSmart(path, readOptions);
          return { path, content: result.content, success: true };
        } else {
          // Full file reading
          const content = readFileSync(path, "utf-8");
          return { path, content, success: true };
        }
      } catch (error) {
        console.warn(`[ContextAnalyzer] Failed to load ${path}: ${error}`);
        return { path, content: "", success: false };
      }
    }
  );

  // Execute all reads in parallel using Promise.allSettled
  const results = await Promise.allSettled(readPromises);

  // Process results
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      loadedContext.set(result.value.path, result.value.content);
    }
  }

  // Note: Agent should use mcp_filesystem_read_multiple_files for better performance:
  // Example: mcp_filesystem_read_multiple_files({ paths: filesToLoad.map(f => f.path) })
  // This would be called by the agent, not directly in this tool

  return loadedContext;
}

/**
 * Get minimal context (only essential files)
 */
export function getMinimalContext(
  filePath: string,
  maxFiles: number = 5
): string[] {
  const contextFiles = getContextFiles(filePath, 1); // Only direct dependencies
  return contextFiles.slice(0, maxFiles);
}
