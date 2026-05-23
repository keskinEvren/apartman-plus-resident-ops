/**
 * Tool: asanmod_verify_build
 * Build hatası ve dependency eksikliği kontrolü.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot, getFrontendPaths } from "../utils/paths.js";

export interface BuildResult {
  success: boolean;
  exitCode: number;
  output?: string;
  error?: string;
}

export async function verifyBuild(): Promise<BuildResult> {
  // Get workspace root using ES Module compatible helper
  const workspaceRoot = getWorkspaceRoot(import.meta.url);

  // Try multiple possible paths using helper
  const possiblePaths = getFrontendPaths(import.meta.url);
  if (possiblePaths.length === 0) {
    // Fallback paths
    possiblePaths.push(
      join(workspaceRoot, "frontend"),
      join(process.cwd(), "frontend"),
      join(process.cwd(), "..", "frontend")
    );
  }

  let frontendPath: string | null = null;
  for (const path of possiblePaths) {
    const normalizedPath = path.replace(/\/+/g, "/"); // Normalize path
    if (existsSync(normalizedPath)) {
      frontendPath = normalizedPath;
      break;
    }
  }

  if (!frontendPath) {
    return {
      success: false,
      exitCode: 1,
      error:
        "Frontend directory not found. Checked paths: " +
        possiblePaths.join(", ") +
        ". Workspace root: " +
        workspaceRoot,
    };
  }

  try {
    // TypeScript check (use cwd instead of `cd` for safety)
    const tsOut = execSync("npx tsc --noEmit --pretty false", {
      encoding: "utf-8",
      cwd: frontendPath,
      maxBuffer: 10 * 1024 * 1024,
    });

    // `tsc` can print "Found 0 errors"; treat only >0 as failure.
    const foundErrorsMatch = tsOut.match(/Found\s+(\d+)\s+error/i);
    const foundErrors = foundErrorsMatch ? Number(foundErrorsMatch[1]) : 0;
    const hasErrors = /error TS\d+:/i.test(tsOut) || foundErrors > 0;

    if (hasErrors) {
      return {
        success: false,
        exitCode: 1,
        output: tsOut.substring(0, 1000),
        error: "TypeScript errors found",
      };
    }

    return {
      success: true,
      exitCode: 0,
      output: "Build check passed",
    };
  } catch (err: any) {
    const output = String(err?.stdout || err?.output || err?.message || "");
    return {
      success: false,
      exitCode: err?.status || 1,
      output: output ? output.substring(0, 1000) : undefined,
      error: "TypeScript errors found",
    };
  }
}
