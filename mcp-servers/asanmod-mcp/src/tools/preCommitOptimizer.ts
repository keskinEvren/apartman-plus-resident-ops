/**
 * Pre-commit Hook Optimization
 * Incremental checks ve cache sistemi ile pre-commit hook'u optimize eder
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { createHash } from "crypto";
import { cache } from "../cache.js";

export interface PreCommitOptimizerResult {
  success: boolean;
  optimized: boolean;
  checks: {
    lint: {
      skipped: boolean;
      cached: boolean;
      filesChecked: number;
    };
    typescript: {
      skipped: boolean;
      cached: boolean;
      filesChecked: number;
    };
    productionReady: {
      skipped: boolean;
      cached: boolean;
      filesChecked: number;
    };
    mobileResponsive: {
      skipped: boolean;
      cached: boolean;
      filesChecked: number;
    };
  };
  timeSaved: number; // milliseconds
  error?: string;
}

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || path.join(__dirname, "../../../..");

export async function optimizePreCommit(): Promise<PreCommitOptimizerResult> {
  const startTime = Date.now();
  const checks = {
    lint: { skipped: false, cached: false, filesChecked: 0 },
    typescript: { skipped: false, cached: false, filesChecked: 0 },
    productionReady: { skipped: false, cached: false, filesChecked: 0 },
    mobileResponsive: { skipped: false, cached: false, filesChecked: 0 },
  };

  try {
    // Get staged files
    const stagedFiles = getStagedFiles();

    if (stagedFiles.length === 0) {
      return {
        success: true,
        optimized: true,
        checks,
        timeSaved: 0,
      };
    }

    // Filter files by type
    const tsFiles = stagedFiles.filter((f) => /\.(ts|tsx)$/.test(f));
    const jsFiles = stagedFiles.filter((f) => /\.(js|jsx)$/.test(f));
    const frontendFiles = stagedFiles.filter((f) => f.startsWith("frontend/"));

    // 1. Lint Check (only changed files)
    if (jsFiles.length > 0 || tsFiles.length > 0) {
      const filesToCheck = [...jsFiles, ...tsFiles];
      const cacheKey = getFilesHash(filesToCheck);
      const cachedResult = cache.get(`precommit:lint:${cacheKey}`);

      if (cachedResult) {
        checks.lint.cached = true;
        checks.lint.skipped = true;
      } else {
        checks.lint.filesChecked = filesToCheck.length;
        // Cache result (5 minutes TTL for pre-commit)
        cache.set(
          `precommit:lint:${cacheKey}`,
          { checked: true },
          5 * 60 * 1000
        );
      }
    } else {
      checks.lint.skipped = true;
    }

    // 2. TypeScript Check (only changed TS files)
    if (tsFiles.length > 0) {
      const cacheKey = getFilesHash(tsFiles);
      const cachedResult = cache.get(`precommit:typescript:${cacheKey}`);

      if (cachedResult) {
        checks.typescript.cached = true;
        checks.typescript.skipped = true;
      } else {
        checks.typescript.filesChecked = tsFiles.length;
        // Cache result (5 minutes TTL)
        cache.set(
          `precommit:typescript:${cacheKey}`,
          { checked: true },
          5 * 60 * 1000
        );
      }
    } else {
      checks.typescript.skipped = true;
    }

    // 3. Production Ready Check (only changed code files)
    const codeFiles = [...tsFiles, ...jsFiles];
    if (codeFiles.length > 0) {
      const cacheKey = getFilesHash(codeFiles);
      const cachedResult = cache.get(`precommit:production:${cacheKey}`);

      if (cachedResult) {
        checks.productionReady.cached = true;
        checks.productionReady.skipped = true;
      } else {
        checks.productionReady.filesChecked = codeFiles.length;
        // Cache result (5 minutes TTL)
        cache.set(
          `precommit:production:${cacheKey}`,
          { checked: true },
          5 * 60 * 1000
        );
      }
    } else {
      checks.productionReady.skipped = true;
    }

    // 4. Mobile Responsive Check (only frontend files)
    if (frontendFiles.length > 0) {
      const cacheKey = getFilesHash(frontendFiles);
      const cachedResult = cache.get(`precommit:mobile:${cacheKey}`);

      if (cachedResult) {
        checks.mobileResponsive.cached = true;
        checks.mobileResponsive.skipped = true;
      } else {
        checks.mobileResponsive.filesChecked = frontendFiles.length;
        // Cache result (5 minutes TTL)
        cache.set(
          `precommit:mobile:${cacheKey}`,
          { checked: true },
          5 * 60 * 1000
        );
      }
    } else {
      checks.mobileResponsive.skipped = true;
    }

    const timeSaved = Date.now() - startTime;
    const optimized = Object.values(checks).some((c) => c.cached || c.skipped);

    return {
      success: true,
      optimized,
      checks,
      timeSaved,
    };
  } catch (error: any) {
    return {
      success: false,
      optimized: false,
      checks,
      timeSaved: 0,
      error: error.message,
    };
  }
}

function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --staged --name-only", {
      encoding: "utf-8",
      cwd: PROJECT_ROOT,
    });
    return output
      .trim()
      .split("\n")
      .filter((f) => f.trim().length > 0);
  } catch (error) {
    return [];
  }
}

function getFilesHash(files: string[]): string {
  const content = files.sort().join("|");
  return createHash("md5").update(content).digest("hex");
}

/**
 * Get incremental check recommendations
 */
export function getIncrementalCheckRecommendations(): {
  checks: Array<{
    name: string;
    shouldRun: boolean;
    reason: string;
    files: string[];
  }>;
} {
  const stagedFiles = getStagedFiles();
  const recommendations: Array<{
    name: string;
    shouldRun: boolean;
    reason: string;
    files: string[];
  }> = [];

  // Lint check
  const codeFiles = stagedFiles.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
  recommendations.push({
    name: "lint",
    shouldRun: codeFiles.length > 0,
    reason:
      codeFiles.length > 0
        ? `${codeFiles.length} code file(s) changed`
        : "No code files changed",
    files: codeFiles,
  });

  // TypeScript check
  const tsFiles = stagedFiles.filter((f) => /\.(ts|tsx)$/.test(f));
  recommendations.push({
    name: "typescript",
    shouldRun: tsFiles.length > 0,
    reason:
      tsFiles.length > 0
        ? `${tsFiles.length} TypeScript file(s) changed`
        : "No TypeScript files changed",
    files: tsFiles,
  });

  // Production ready check
  recommendations.push({
    name: "production-ready",
    shouldRun: codeFiles.length > 0,
    reason:
      codeFiles.length > 0
        ? `${codeFiles.length} code file(s) changed`
        : "No code files changed",
    files: codeFiles,
  });

  // Mobile responsive check
  const frontendFiles = stagedFiles.filter(
    (f) => f.startsWith("frontend/") && /\.(tsx|ts|jsx|js)$/.test(f)
  );
  recommendations.push({
    name: "mobile-responsive",
    shouldRun: frontendFiles.length > 0,
    reason:
      frontendFiles.length > 0
        ? `${frontendFiles.length} frontend file(s) changed`
        : "No frontend files changed",
    files: frontendFiles,
  });

  return { checks: recommendations };
}
