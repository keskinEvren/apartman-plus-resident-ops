/**
 * Documentation Index System
 * Semantic search ile dokümanları bulur - Smart documentation access
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DocSearchResult {
  success: boolean;
  query: string;
  results: Array<{
    file: string;
    relevance: number;
    snippets: string[];
    matchType: "filename" | "content" | "title";
  }>;
  totalResults: number;
  error?: string;
}

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || path.join(__dirname, "../../../..");
const DOCS_DIR = path.join(PROJECT_ROOT, "docs", "workflow");

// Documentation index (pre-built for fast search)
const DOC_INDEX: Record<string, string[]> = {
  "session start": [
    "ASANMOD-MASTER.md",
    "MOD-BASLATMA-PROMPT.txt",
    "SESSION-CLOSE-SYSTEM.md",
  ],
  "task assignment": ["MOD-TASK-ASSIGNMENT-TEMPLATES.md", "ASANMOD-MASTER.md"],
  verification: ["ASANMOD-MASTER.md", "MOD-PLAYBOOK.md"],
  worker: ["WORKER-BASLATMA-PROMPT.txt", "ASANMOD-MASTER.md"],
  mod: ["MOD-BASLATMA-PROMPT.txt", "ASANMOD-MASTER.md"],
  rules: ["ASANMOD-MASTER.md", "CURSOR-RULES-COMPLETE.md"],
  rbac: ["ASANMOD-MASTER.md", "RBAC-PATTERNS.md"],
  mcp: ["MCP-USAGE-GUIDE-ASANMOD.md", "ASANMOD-MASTER.md"],
  deployment: ["DEPLOYMENT-TRACKING-SYSTEM.md", "ASANMOD-MASTER.md"],
  "prod fix": ["PROD-FIX-DEV-SYNC-SYSTEM.md", "ASANMOD-MASTER.md"],
  "state tracking": ["STATE-TRACKING-GUIDE.md", "ASANMOD-MASTER.md"],
  "pending tasks": ["PENDING-TASKS.md", "ASANMOD-MASTER.md"],
  templates: ["templates/README.md", "MOD-TASK-ASSIGNMENT-TEMPLATES.md"],
};

export async function searchDocs(query: string): Promise<DocSearchResult> {
  const queryLower = query.toLowerCase();
  const results: DocSearchResult["results"] = [];

  try {
    // 1. Index-based search (fast)
    for (const [keyword, files] of Object.entries(DOC_INDEX)) {
      if (queryLower.includes(keyword) || keyword.includes(queryLower)) {
        for (const file of files) {
          const filePath = path.join(DOCS_DIR, file);
          if (fs.existsSync(filePath)) {
            const existingResult = results.find((r) => r.file === file);
            if (!existingResult) {
              results.push({
                file,
                relevance: calculateRelevance(keyword, queryLower),
                snippets: [],
                matchType: "filename",
              });
            } else {
              existingResult.relevance = Math.max(
                existingResult.relevance,
                calculateRelevance(keyword, queryLower)
              );
            }
          }
        }
      }
    }

    // 2. Filename search
    const allFiles = getAllDocFiles();
    for (const file of allFiles) {
      const fileName = path.basename(file, path.extname(file)).toLowerCase();
      if (fileName.includes(queryLower) || queryLower.includes(fileName)) {
        const existingResult = results.find((r) => r.file === file);
        if (!existingResult) {
          results.push({
            file,
            relevance: 0.7,
            snippets: [],
            matchType: "filename",
          });
        }
      }
    }

    // 3. Content search (limited to top results for performance)
    const topFiles = results.slice(0, 5);
    for (const result of topFiles) {
      const filePath = path.join(DOCS_DIR, result.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        const matchingLines = lines
          .filter((line) => line.toLowerCase().includes(queryLower))
          .slice(0, 3);

        if (matchingLines.length > 0) {
          result.snippets = matchingLines.map((l) =>
            l.trim().substring(0, 150)
          );
          result.matchType = "content";
          result.relevance += 0.2;
        }
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return {
      success: true,
      query,
      results: results.slice(0, 10), // Top 10 results
      totalResults: results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      query,
      results: [],
      totalResults: 0,
      error: error.message,
    };
  }
}

function getAllDocFiles(): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(entry.name);
      } else if (entry.isDirectory()) {
        const subDir = path.join(DOCS_DIR, entry.name);
        const subFiles = fs.readdirSync(subDir, { withFileTypes: true });
        for (const subFile of subFiles) {
          if (subFile.isFile() && subFile.name.endsWith(".md")) {
            files.push(path.join(entry.name, subFile.name));
          }
        }
      }
    }
  } catch (error) {
    // Return empty array on error
  }
  return files;
}

function calculateRelevance(keyword: string, query: string): number {
  // Exact match = 1.0
  if (keyword === query) return 1.0;
  // Keyword contains query = 0.8
  if (keyword.includes(query)) return 0.8;
  // Query contains keyword = 0.6
  if (query.includes(keyword)) return 0.6;
  // Partial match = 0.4
  return 0.4;
}
