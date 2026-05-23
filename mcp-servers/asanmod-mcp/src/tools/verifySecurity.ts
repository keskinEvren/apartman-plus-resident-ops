/**
 * Tool: asanmod_verify_security
 * Security vulnerability kontrolü (security-check MCP entegrasyonu)
 */

import { promises as fs } from "fs";
import { getWorkspaceRoot } from "../utils/paths.js";
import {
  collectSourceFiles,
  DEFAULT_EXCLUDE_DIRS,
  getLineInfoFromIndex,
  resolveScanRoots,
  toWorkspaceRelativePath,
} from "../utils/scan.js";

export interface SecurityResult {
  success: boolean;
  issues: Array<{
    file: string;
    line: number;
    issue: string;
    code?: string;
  }>;
  vulnerabilities: number; // For compatibility with consolidated securityAudit tool
  count: number;
  error?: string;
}

export async function verifySecurity(path?: string): Promise<SecurityResult> {
  // Use undefined instead of import.meta.url to avoid TypeScript module issues in test environment
  const projectRoot = getWorkspaceRoot(undefined);
  const roots = resolveScanRoots(projectRoot, path);

  // STRICT SECRETS PATTERNS (Updated 2026-12-19)
  const securityPatterns = [
    // Secrets / Keys
    {
      pattern:
        /(password|passwd|pwd|secret|token|api_?key|access_?key|auth_?key)\s*[:=]\s*["'][a-zA-Z0-9_\-]{8,}["']/gi,
      name: "Hardcoded Secret/Token",
    },
    { pattern: /sk-[a-zA-Z0-9]{20,}/gi, name: "OpenAI Secret Key" },
    {
      pattern: /(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}/gi,
      name: "GitHub Token",
    },
    { pattern: /xox[baprs]-[a-zA-Z0-9]{20,}/gi, name: "Slack Token" },

    // Dangerous Functions
    { pattern: /eval\s*\(/gi, name: "Eval usage" },
    { pattern: /dangerouslySetInnerHTML/gi, name: "Dangerous HTML" },
    { pattern: /\.innerHTML\s*=/gi, name: "innerHTML assignment" },

    // SQL Injection (Basic Heuristics)
    {
      pattern: /execute\s*\(\s*["']SELECT .* \+ /gi,
      name: "SQL Injection Risk (Concatenation)",
    },
    { pattern: /\$query\s*\(/gi, name: "Raw Query Risk" },

    // Command Injection
    { pattern: /exec\s*\(\s*["'].*\$\{/gi, name: "Command Injection Risk" },
    { pattern: /spawn\s*\(\s*["'].*\$\{/gi, name: "Command Injection Risk" },
  ];

  const issues: SecurityResult["issues"] = [];
  const maxIssues = 200;

  try {
    const files = await collectSourceFiles(roots, {
      excludeDirs: new Set([
        ...DEFAULT_EXCLUDE_DIRS,
        ".git",
        ".env",
        "node_modules",
        "dist",
        "build",
        ".next",
        "coverage",
      ]),
      includeExtensions: new Set([
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".json",
        ".yml",
        ".yaml",
      ]), // Added config files
      maxFiles: 50_000,
    });

    for (const file of files) {
      if (issues.length >= maxIssues) break;

      // Skip test files for "Hardcoded Secret" checks specifically (usually mock data)
      // But keep checking them for Dangerous Functions
      const isTestFile =
        file.includes(".test.") ||
        file.includes(".spec.") ||
        file.includes("__tests__");

      let content = "";
      try {
        content = await fs.readFile(file, "utf-8");
      } catch {
        continue;
      }

      for (const def of securityPatterns) {
        if (issues.length >= maxIssues) break;

        // Skip secret check in test files
        if (
          isTestFile &&
          (def.name.includes("Hardcoded") || def.name.includes("Token"))
        )
          continue;

        const regex = new RegExp(def.pattern.source, def.pattern.flags);
        regex.lastIndex = 0;

        let match;
        while ((match = regex.exec(content)) !== null) {
          if (issues.length >= maxIssues) break;

          const { line, snippet } = getLineInfoFromIndex(content, match.index);

          // False positive reduction: Ignore if line contains "process.env"
          if (snippet.includes("process.env")) continue;
          // False positive reduction: Ignore import statements
          if (snippet.trim().startsWith("import ")) continue;

          issues.push({
            file: toWorkspaceRelativePath(projectRoot, file),
            line,
            issue: def.name,
            code: snippet.trim(),
          });
        }
      }
    }

    return {
      success: issues.length === 0,
      issues,
      count: issues.length,
      vulnerabilities: issues.length,
    };
  } catch (err: any) {
    return {
      success: false,
      issues: [],
      count: 0,
      vulnerabilities: 0,
      error: err.message || "Security check failed",
    };
  }
}
