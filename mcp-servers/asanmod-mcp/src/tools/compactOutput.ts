/**
 * Compact Output Format
 * Token optimization: Reduces verbose text reports to compact JSON format
 * Format: {"v":"1.0","t":"verification","s":0,"e":[],"f":5,"c":2}
 */

import { isFeatureEnabled } from "../utils/featureFlags.js";
import { recordCompactOutput } from "../utils/tokenMetrics.js";

export interface CompactOutput {
  v: string; // version
  t: string; // type (verification, task, status)
  s: number; // status (0=ok, 1=error, 2=warning)
  e: string[]; // errors (compact)
  w?: string[]; // warnings (optional)
  f: number; // files
  c: number; // commits
  m?: any; // metadata (optional)
}

export interface CompactCheck {
  s: number; // status (0=ok, 1=error)
  e?: number; // error count
  w?: number; // warning count
  d?: any; // details (optional, minimal)
}

/**
 * Compactify verification result
 */
export function compactify(data: any): CompactOutput {
  // Check feature flag
  if (!isFeatureEnabled("compactOutput")) {
    // Return verbose format if disabled
    return {
      v: "1.0",
      t: data.type || "verification",
      s: data.errors?.length > 0 ? 1 : 0,
      e: data.errors || [],
      f: data.files || 0,
      c: data.commits || 0,
      m: data, // Include full metadata if disabled
    };
  }
  const errors: string[] = [];
  const warnings: string[] = [];
  let status = 0; // 0=ok, 1=error, 2=warning
  let files = 0;
  let commits = 0;

  // Extract errors and warnings
  if (data.errors && Array.isArray(data.errors)) {
    errors.push(
      ...data.errors.map((e: any) =>
        typeof e === "string" ? e : e.message || JSON.stringify(e)
      )
    );
  }
  if (data.warnings && Array.isArray(data.warnings)) {
    warnings.push(
      ...data.warnings.map((w: any) =>
        typeof w === "string" ? w : w.message || JSON.stringify(w)
      )
    );
  }

  // Determine status
  if (errors.length > 0) {
    status = 1;
  } else if (warnings.length > 0) {
    status = 2;
  }

  // Extract files and commits
  if (data.files !== undefined) files = data.files;
  if (data.commits !== undefined) commits = data.commits;
  if (data.checks) {
    // Count files from checks
    const checkFiles = Object.values(data.checks)
      .filter((c: any) => c.files)
      .reduce((sum: number, c: any) => sum + (c.files || 0), 0);
    if (checkFiles > 0) files = checkFiles;
  }

  const result: CompactOutput = {
    v: "1.0",
    t: data.type || data.operationType || "verification",
    s: status,
    e: errors.slice(0, 10), // Limit to 10 errors
    f: files,
    c: commits,
  };

  if (warnings.length > 0) {
    result.w = warnings.slice(0, 10); // Limit to 10 warnings
  }

  // Add minimal metadata if needed
  if (data.metadata) {
    result.m = {
      ts: Date.now(),
      // workerId and taskId removed - WORKER system eliminated (2026-12-17)
    };
  }

  // Record metrics (compare original vs compact size)
  const originalSize = JSON.stringify(data).length;
  const compactSize = JSON.stringify(result).length;
  recordCompactOutput(originalSize, compactSize);

  return result;
}

/**
 * Compactify check result
 */
export function compactifyCheck(check: any): CompactCheck {
  const result: CompactCheck = {
    s: check.passed !== false && check.errorCount === 0 ? 0 : 1,
  };

  if (check.errorCount !== undefined) result.e = check.errorCount;
  if (check.warningCount !== undefined) result.w = check.warningCount;
  if (check.errors && check.errors.length > 0) {
    result.e = check.errors.length;
  }
  if (check.warnings && check.warnings.length > 0) {
    result.w = check.warnings.length;
  }

  // Add minimal details only if critical
  if (check.error && result.s === 1) {
    result.d = { err: check.error.substring(0, 100) }; // Truncate error
  }

  return result;
}

/**
 * Compactify verification checks object
 */
export function compactifyChecks(checks: any): Record<string, CompactCheck> {
  const result: Record<string, CompactCheck> = {};

  for (const [key, check] of Object.entries(checks)) {
    result[key] = compactifyCheck(check);
  }

  return result;
}

/**
 * Expand compact output back to readable format (for debugging)
 */
export function expand(compact: CompactOutput): any {
  return {
    version: compact.v,
    type: compact.t,
    status: compact.s === 0 ? "ok" : compact.s === 1 ? "error" : "warning",
    errors: compact.e,
    warnings: compact.w || [],
    files: compact.f,
    commits: compact.c,
    metadata: compact.m,
  };
}
