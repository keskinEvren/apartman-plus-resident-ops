/**
 * Tool: asanmod_verify_performance
 * Performance kontrolü (build time, bundle size)
 */

import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";

export interface PerformanceResult {
  success: boolean;
  metrics: {
    buildTime?: number;
    bundleSize?: number;
    bundleSizeMB?: number;
  };
  issues: Array<{
    type: "build_time" | "bundle_size";
    issue: string;
    value?: number;
  }>;
  count: number;
  error?: string;
}

export async function verifyPerformance(
  path?: string
): Promise<PerformanceResult> {
  const targetPath = path || process.cwd();
  const issues: PerformanceResult["issues"] = [];
  const metrics: PerformanceResult["metrics"] = {};

  try {
    const frontendPath = join(targetPath, "frontend");

    if (!existsSync(frontendPath)) {
      return {
        success: true,
        metrics: {},
        issues: [],
        count: 0,
      };
    }

    // Bundle size kontrolü (.next/static)
    const nextStaticPath = join(frontendPath, ".next", "static");
    if (existsSync(nextStaticPath)) {
      try {
        const sizeOutput = execSync(
          `du -sb ${nextStaticPath} 2>/dev/null || echo "0"`,
          {
            encoding: "utf-8",
          }
        );
        const size = parseInt(sizeOutput.split("\t")[0], 10);
        const sizeMB = size / (1024 * 1024);
        metrics.bundleSize = size;
        metrics.bundleSizeMB = Math.round(sizeMB * 100) / 100;

        // Bundle size > 10MB uyarısı
        if (sizeMB > 10) {
          issues.push({
            type: "bundle_size",
            issue: `Bundle size exceeds 10MB (${sizeMB.toFixed(2)}MB)`,
            value: sizeMB,
          });
        }
      } catch {
        // Size check failed, skip
      }
    }

    return {
      success: issues.length === 0,
      metrics,
      issues,
      count: issues.length,
    };
  } catch (err: any) {
    return {
      success: false,
      metrics: {},
      issues: [],
      count: 0,
      error: err.message || "Performance check failed",
    };
  }
}
