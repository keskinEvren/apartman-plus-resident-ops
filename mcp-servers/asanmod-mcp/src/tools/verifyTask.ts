/**
 * Tool: asanmod_verify_task
 * Task doğrulama - WORKER system removed (2026-12-17)
 */

import { verifyLint } from "./verifyLint.js";
import { checkProductionReady } from "./checkProductionReady.js";
import { verifyBuild } from "./verifyBuild.js";

export interface TaskVerificationResult {
  success: boolean;
  taskId: string;
  checks: {
    lint: boolean;
    productionReady: boolean;
    build: boolean;
  };
  errors: string[];
}

export async function verifyTask(
  taskId: string
): Promise<TaskVerificationResult> {
  const errors: string[] = [];
  const checks = {
    lint: false,
    productionReady: false,
    build: false,
  };

  // PARALLEL EXECUTION: All 3 checks run simultaneously (3x faster!)
  const [lintResult, prodResult, buildResult] = await Promise.allSettled([
    verifyLint(),
    checkProductionReady(),
    verifyBuild(),
  ]);

  // 1. Lint Check
  if (lintResult.status === "fulfilled") {
    checks.lint = lintResult.value.success;
    if (!lintResult.value.success) {
      errors.push(
        `Lint errors: ${lintResult.value.errors}, warnings: ${lintResult.value.warnings}`
      );
    }
  } else {
    checks.lint = false;
    errors.push(
      `Lint check failed: ${lintResult.reason?.message || "Unknown error"}`
    );
  }

  // 2. Production Ready Check
  if (prodResult.status === "fulfilled") {
    checks.productionReady = prodResult.value.success;
    if (!prodResult.value.success) {
      errors.push(
        `Production ready check failed: ${prodResult.value.found.join(", ")}`
      );
    }
  } else {
    checks.productionReady = false;
    errors.push(
      `Production ready check failed: ${prodResult.reason?.message || "Unknown error"}`
    );
  }

  // 3. Build Check
  if (buildResult.status === "fulfilled") {
    checks.build = buildResult.value.success;
    if (!buildResult.value.success) {
      errors.push(
        `Build check failed: ${buildResult.value.error || "Unknown error"}`
      );
    }
  } else {
    checks.build = false;
    errors.push(
      `Build check failed: ${buildResult.reason?.message || "Unknown error"}`
    );
  }

  return {
    success: checks.lint && checks.productionReady && checks.build,
    taskId,
    checks,
    errors,
  };
}
