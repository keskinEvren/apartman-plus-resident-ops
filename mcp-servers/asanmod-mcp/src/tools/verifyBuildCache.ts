/**
 * Tool: asanmod_verify_build_cache
 * Build cache temizleme kontrolü
 */

import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface CacheRecommendation {
  scenario: "dev-normal" | "dev-build-error" | "prod-build" | "prod-deployment";
  shouldClean: boolean;
  cleanTargets: string[];
  reason: string;
  cleanCommand: string | null;
  warning?: string;
}

export interface BuildCacheResult {
  success: boolean;
  cacheDirectories: Array<{
    path: string;
    exists: boolean;
    size?: string;
  }>;
  totalSize?: string;
  shouldClean: boolean;
  recommendations: {
    dev: CacheRecommendation;
    prod: CacheRecommendation;
    deployment: CacheRecommendation;
  };
  errors: string[];
}

/**
 * Detect scenario based on cache state and context
 */
function detectScenario(
  cacheDirs: Array<{ path: string; exists: boolean }>
): "dev-normal" | "dev-build-error" | "prod-build" | "prod-deployment" {
  const hasNextDev =
    cacheDirs.find((d) => d.path === ".next-dev")?.exists || false;
  const hasNextProd =
    cacheDirs.find((d) => d.path === ".next-prod")?.exists || false;
  const hasSharedCache =
    cacheDirs.find(
      (d) => d.path === "node_modules/.cache" || d.path === ".turbo"
    )?.exists || false;

  // Default: dev-normal (cache korunmalı)
  return "dev-normal";
}

/**
 * Get cache recommendation based on scenario
 */
function getRecommendation(
  scenario: "dev-normal" | "dev-build-error" | "prod-build" | "prod-deployment",
  cacheDirs: Array<{ path: string; exists: boolean }>
): CacheRecommendation {
  switch (scenario) {
    case "dev-normal":
      return {
        scenario: "dev-normal",
        shouldClean: false,
        cleanTargets: [],
        reason: "Normal geliştirme - cache korunmalı (hot reload için gerekli)",
        cleanCommand: null,
      };

    case "dev-build-error":
      return {
        scenario: "dev-build-error",
        shouldClean:
          cacheDirs.find((d) => d.path === ".next-dev")?.exists || false,
        cleanTargets: [".next-dev", ".next-dev/cache"],
        reason: "DEV build hataları - sadece .next-dev temizlenmeli",
        cleanCommand: "./scripts/pm2-build-dev.sh",
      };

    case "prod-build":
      return {
        scenario: "prod-build",
        shouldClean:
          cacheDirs.find((d) => d.path === ".next-prod")?.exists || false,
        cleanTargets: [".next-prod", ".next-prod/cache"],
        reason: "PROD build - sadece .next-prod temizlenmeli (DEV korunmalı)",
        cleanCommand: "./scripts/pm2-build-prod.sh",
      };

    case "prod-deployment":
      return {
        scenario: "prod-deployment",
        shouldClean: true,
        cleanTargets: [
          ".next-prod",
          ".next-prod/cache",
          "node_modules/.cache",
          ".turbo",
        ],
        reason:
          "PROD deployment - önbelleksiz güncelleme için tüm cache temizlenmeli (.next-dev hariç)",
        cleanCommand: "./scripts/deploy-prod.sh",
        warning:
          "Paylaşılan cache'ler temizlenir ama DEV hot reload yeniden oluşturur (normal)",
      };

    default:
      return {
        scenario: "dev-normal",
        shouldClean: false,
        cleanTargets: [],
        reason: "Normal geliştirme - cache korunmalı",
        cleanCommand: null,
      };
  }
}

export async function verifyBuildCache(): Promise<BuildCacheResult> {
  const result: BuildCacheResult = {
    success: true,
    cacheDirectories: [],
    shouldClean: false,
    recommendations: {
      dev: {
        scenario: "dev-normal",
        shouldClean: false,
        cleanTargets: [],
        reason: "",
        cleanCommand: null,
      },
      prod: {
        scenario: "prod-build",
        shouldClean: false,
        cleanTargets: [],
        reason: "",
        cleanCommand: null,
      },
      deployment: {
        scenario: "prod-deployment",
        shouldClean: false,
        cleanTargets: [],
        reason: "",
        cleanCommand: null,
      },
    },
    errors: [],
  };

  // Use getWorkspaceRoot to find the correct project root
  const projectRoot = getWorkspaceRoot(import.meta.url);
  const frontendPath = join(projectRoot, "frontend");

  const cacheDirs = [
    ".next-prod",
    ".next-dev",
    ".next",
    "node_modules/.cache",
    ".turbo",
    ".next-prod/cache",
    ".next-dev/cache",
    ".next/cache",
  ];

  // PARALLEL EXECUTION: Check all cache directories simultaneously
  const cacheChecks = await Promise.allSettled(
    cacheDirs.map(
      (dir) =>
        new Promise<{ path: string; exists: boolean; size?: string }>(
          (resolve) => {
            const fullPath = join(frontendPath, dir);
            const exists = existsSync(fullPath);

            let size: string | undefined;
            if (exists) {
              try {
                const stats = statSync(fullPath);
                if (stats.isDirectory()) {
                  const duOutput = execSync(
                    `du -sh "${fullPath}" 2>/dev/null | awk '{print $1}' || echo "0"`,
                    { encoding: "utf-8" }
                  ).trim();
                  size = duOutput !== "0" ? duOutput : undefined;
                }
              } catch (e) {
                // Ignore
              }
            }

            resolve({ path: dir, exists, size });
          }
        )
    )
  );

  // Process cache check results
  for (const check of cacheChecks) {
    if (check.status === "fulfilled") {
      result.cacheDirectories.push(check.value);
      if (check.value.exists) {
        result.shouldClean = true;
      }
    }
  }

  // Generate recommendations based on cache strategy
  const scenario = detectScenario(result.cacheDirectories);

  // DEV recommendation (normal geliştirme)
  result.recommendations.dev = {
    scenario: "dev-normal",
    shouldClean: false,
    cleanTargets: [],
    reason: "Normal geliştirme - cache korunmalı (hot reload için gerekli)",
    cleanCommand: null,
  };

  // DEV recommendation (build hataları)
  const devCacheExists =
    result.cacheDirectories.find((d) => d.path === ".next-dev")?.exists ||
    false;
  if (devCacheExists) {
    result.recommendations.dev = {
      scenario: "dev-build-error",
      shouldClean: true,
      cleanTargets: [".next-dev", ".next-dev/cache"],
      reason:
        "DEV build hataları - sadece .next-dev temizlenmeli (PROD korunur)",
      cleanCommand: "./scripts/pm2-build-dev.sh",
    };
  }

  // PROD recommendation
  const prodCacheExists =
    result.cacheDirectories.find((d) => d.path === ".next-prod")?.exists ||
    false;
  result.recommendations.prod = {
    scenario: "prod-build",
    shouldClean: prodCacheExists,
    cleanTargets: [".next-prod", ".next-prod/cache"],
    reason: prodCacheExists
      ? "PROD build - sadece .next-prod temizlenmeli (DEV korunur)"
      : "PROD build - .next-prod temizlenmeli",
    cleanCommand: "./scripts/pm2-build-prod.sh",
  };

  // Deployment recommendation
  const sharedCacheExists =
    result.cacheDirectories.find((d) => d.path === "node_modules/.cache")
      ?.exists ||
    result.cacheDirectories.find((d) => d.path === ".turbo")?.exists ||
    false;
  result.recommendations.deployment = {
    scenario: "prod-deployment",
    shouldClean: prodCacheExists || sharedCacheExists,
    cleanTargets: [
      ".next-prod",
      ".next-prod/cache",
      "node_modules/.cache",
      ".turbo",
    ],
    reason:
      "PROD deployment - önbelleksiz güncelleme için tüm cache temizlenmeli (.next-dev hariç)",
    cleanCommand: "./scripts/deploy-prod.sh",
    warning:
      "Paylaşılan cache'ler temizlenir ama DEV hot reload yeniden oluşturur (normal davranış)",
  };

  // Total size calculation
  if (result.shouldClean) {
    try {
      const totalSizeOutput = execSync(
        `du -sh .next-prod .next-dev .next node_modules/.cache .turbo 2>/dev/null | awk '{sum+=\$1} END {print sum}' || echo "0"`,
        {
          encoding: "utf-8",
          cwd: frontendPath,
        }
      ).trim();
      result.totalSize = totalSizeOutput !== "0" ? totalSizeOutput : undefined;
    } catch (e) {
      // Ignore
    }
  }

  result.success = result.errors.length === 0;

  return result;
}
