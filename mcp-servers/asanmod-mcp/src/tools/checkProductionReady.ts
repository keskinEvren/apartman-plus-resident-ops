/**
 * Tool: asanmod_check_production_ready
 * Mock, TODO, FIXME tespiti yapar.
 */

import { promises as fs } from "fs";
import { getRule } from "../rules.js";
import { getWorkspaceRoot } from "../utils/paths.js";
import {
  collectSourceFiles,
  DEFAULT_EXCLUDE_DIRS,
  resolveScanRoots,
} from "../utils/scan.js";

export interface ProductionReadyResult {
  success: boolean;
  found: string[];
  count: number;
  error?: string;
}

export async function checkProductionReady(
  path?: string
): Promise<ProductionReadyResult> {
  const projectRoot = process.cwd(); // Safe fallback for tests (avoids import.meta TS1343)
  const roots = resolveScanRoots(projectRoot, path);
  const rule = getRule("0");

  if (!rule || !rule.forbiddenWords) {
    return { success: true, found: [], count: 0 };
  }

  const forbidden = rule.forbiddenWords.map((w) => w.toLowerCase());
  const foundSet = new Set<string>();

  try {
    const files = await collectSourceFiles(roots, {
      excludeDirs: DEFAULT_EXCLUDE_DIRS,
      includeExtensions: new Set([".ts", ".tsx", ".js", ".jsx"]),
      maxFiles: 50_000,
    });

    for (const file of files) {
      if (foundSet.size === forbidden.length) break;

      // Skip build artifacts (defensive check even if collectSourceFiles should exclude them)
      if (file.includes("/.next") || file.includes("\\.next")) continue;
      if (file.includes("/dist/") || file.includes("\\dist\\")) continue;
      if (file.includes("/build/") || file.includes("\\build\\")) continue;
      if (file.includes("/node_modules/") || file.includes("\\node_modules\\"))
        continue;

      // Skip tests and fixtures for production ready checks (TODOs are valid there)
      if (file.includes("/__tests__/") || file.includes("\\__tests__\\"))
        continue;
      if (file.includes("/__fixtures__/") || file.includes("\\__fixtures__\\"))
        continue;

      // Skip backups and snapshots
      if (file.includes("/_snapshot/") || file.includes("\\_snapshot\\"))
        continue;
      if (file.includes("/backups/") || file.includes("\\backups\\")) continue;

      // Skip this file itself (metaphysical awareness)
      if (file.match(/checkProductionReady\.(ts|js)$/)) continue;

      let content = "";
      try {
        content = await fs.readFile(file, "utf-8");
      } catch {
        continue;
      }

      const lower = content.toLowerCase();
      for (let i = 0; i < forbidden.length; i++) {
        if (foundSet.has(rule.forbiddenWords[i])) continue;
        const word = forbidden[i];
        const originalWord = rule.forbiddenWords[i];

        // Skip false positives: HTML/JSX attributes
        if (
          word === "placeholder" &&
          content.match(/placeholder\s*=\s*["'`{]/i)
        )
          continue;

        // Skip false positives: Email addresses
        if (
          (word === "örnek" || word === "ornek") &&
          content.match(/[a-zA-Z0-9._-]*örnek[a-zA-Z0-9._-]*@/i)
        )
          continue;
        if (
          word === "sample" &&
          content.match(/[a-zA-Z0-9._-]*sample[a-zA-Z0-9._-]*@/i)
        )
          continue;

        // Skip false positives: File paths and variable names
        if (
          word === "temp" &&
          (content.match(/\/tmp\//i) || content.match(/temp[A-Z]/))
        )
          continue;

        // Skip false positives: Package names in imports
        if (word === "sample" && content.match(/["']@[^"']*sample/i)) continue;

        // Check if word appears in content (case-insensitive)
        // But exclude common false positive patterns
        const wordIndex = lower.indexOf(word);
        if (wordIndex === -1) continue;

        // Get context around the word (50 chars before and after)
        const start = Math.max(0, wordIndex - 50);
        const end = Math.min(content.length, wordIndex + word.length + 50);
        const context = content.slice(start, end);

        // Skip if it's clearly an HTML/JSX attribute
        if (context.match(/placeholder\s*=\s*["'`{]/i)) continue;

        // Skip if it's part of an email
        if (context.match(/[a-zA-Z0-9._-]*örnek[a-zA-Z0-9._-]*@/i)) continue;
        if (context.match(/[a-zA-Z0-9._-]*sample[a-zA-Z0-9._-]*@/i)) continue;

        // If we get here, it's likely a real forbidden word usage
        foundSet.add(originalWord);
      }
    }

    const found = Array.from(foundSet);
    return { success: found.length === 0, found, count: found.length };
  } catch (err: any) {
    return {
      success: false,
      found: [],
      count: 0,
      error: err.message || "Production ready check failed",
    };
  }
}
