/**
 * Dependency Analyzer Utility
 * Token optimization: Analyzes file dependencies for smart context loading
 */

import { getFileDependencies, getFileIndex } from "../tools/fileIndexer.js";
import { readFileSync, existsSync } from "fs";

export interface DependencyNode {
  file: string;
  dependencies: string[];
  dependents: string[];
  depth: number;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  roots: string[]; // Files with no dependencies
  leaves: string[]; // Files with no dependents
}

/**
 * Analyze dependencies for a file
 */
export function analyzeDependencies(
  filePath: string,
  codebaseRoot: string = process.cwd()
): string[] {
  try {
    const index = getFileIndex(filePath);
    if (!index) {
      // Try to read file and extract imports manually
      try {
        if (!existsSync(filePath)) {
          console.warn(`[DependencyAnalyzer] File not found: ${filePath}`);
          return [];
        }

        const content = readFileSync(filePath, "utf-8");
        const imports: string[] = [];
        const lines = content.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("import ")) {
            const importMatch = trimmed.match(
              /import\s+(?:.*?\s+from\s+)?["']([^"']+)["']/
            );
            if (importMatch) {
              imports.push(importMatch[1]);
            }
          }
        }

        return imports;
      } catch (error: any) {
        console.warn(
          `[DependencyAnalyzer] Failed to analyze dependencies for ${filePath}: ${error.message}`
        );
        return [];
      }
    }

    return index.imports || [];
  } catch (error: any) {
    console.warn(
      `[DependencyAnalyzer] Error analyzing dependencies: ${error.message}`
    );
    return [];
  }
}

/**
 * Build dependency graph for multiple files
 */
export function buildDependencyGraph(
  filePaths: string[],
  codebaseRoot: string = process.cwd()
): DependencyGraph {
  const nodes = new Map<string, DependencyNode>();

  // Initialize nodes
  for (const filePath of filePaths) {
    nodes.set(filePath, {
      file: filePath,
      dependencies: [],
      dependents: [],
      depth: 0,
    });
  }

  // Build dependency relationships
  for (const filePath of filePaths) {
    const node = nodes.get(filePath)!;
    const dependencies = analyzeDependencies(filePath, codebaseRoot);

    // Resolve relative imports to absolute paths (simplified)
    const resolvedDeps = dependencies.map((dep) => {
      // Skip node_modules and external packages
      if (dep.startsWith(".") || dep.startsWith("/")) {
        // Try to resolve relative path
        const path = require("path");
        const dir = require("path").dirname(filePath);
        try {
          return require("path").resolve(dir, dep);
        } catch {
          return dep;
        }
      }
      return dep;
    });

    node.dependencies = resolvedDeps.filter((dep) => nodes.has(dep));

    // Update dependents
    for (const dep of node.dependencies) {
      const depNode = nodes.get(dep);
      if (depNode && !depNode.dependents.includes(filePath)) {
        depNode.dependents.push(filePath);
      }
    }
  }

  // Calculate depths (BFS)
  const queue: string[] = [];
  const visited = new Set<string>();

  // Find roots (files with no dependencies)
  const roots: string[] = [];
  for (const [filePath, node] of nodes.entries()) {
    if (node.dependencies.length === 0) {
      roots.push(filePath);
      queue.push(filePath);
      visited.add(filePath);
    }
  }

  // BFS to calculate depths
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = nodes.get(current)!;

    for (const dependent of currentNode.dependents) {
      if (!visited.has(dependent)) {
        visited.add(dependent);
        const dependentNode = nodes.get(dependent)!;
        dependentNode.depth = currentNode.depth + 1;
        queue.push(dependent);
      }
    }
  }

  // Find leaves (files with no dependents)
  const leaves: string[] = [];
  for (const [filePath, node] of nodes.entries()) {
    if (node.dependents.length === 0) {
      leaves.push(filePath);
    }
  }

  return {
    nodes,
    roots,
    leaves,
  };
}

/**
 * Get files needed for context (dependency closure)
 */
export function getContextFiles(
  filePath: string,
  maxDepth: number = 3,
  codebaseRoot: string = process.cwd()
): string[] {
  const contextFiles = new Set<string>([filePath]);
  const queue: Array<{ file: string; depth: number }> = [
    { file: filePath, depth: 0 },
  ];

  while (queue.length > 0) {
    const { file, depth } = queue.shift()!;

    if (depth >= maxDepth) continue;

    const dependencies = analyzeDependencies(file, codebaseRoot);
    for (const dep of dependencies) {
      // Only include local files (not node_modules)
      if (dep.startsWith(".") || dep.startsWith("/")) {
        const path = require("path");
        const dir = require("path").dirname(file);
        try {
          const resolvedDep = require("path").resolve(dir, dep);
          if (!contextFiles.has(resolvedDep) && existsSync(resolvedDep)) {
            contextFiles.add(resolvedDep);
            queue.push({ file: resolvedDep, depth: depth + 1 });
          }
        } catch {
          // Ignore resolution errors
        }
      }
    }
  }

  return Array.from(contextFiles);
}

/**
 * Prioritize files by importance (dependencies first, then dependents)
 */
export function prioritizeFiles(
  filePaths: string[],
  codebaseRoot: string = process.cwd()
): string[] {
  const graph = buildDependencyGraph(filePaths, codebaseRoot);

  // Sort by depth (dependencies first)
  const sorted = Array.from(graph.nodes.values())
    .sort((a, b) => a.depth - b.depth)
    .map((node) => node.file);

  return sorted;
}
