// @ts-nocheck
/**
 * Tool: asanmod_check_pre_commit
 * Commit öncesi tüm kontrolleri çalıştırır (PROD kalitesi için)
 */

import { verifyLint } from "./verifyLint.js";
import { checkProductionReady } from "./checkProductionReady.js";
import { verifyBuild } from "./verifyBuild.js";
import { verifyTypeScript } from "./verifyTypeScript.js";
import { verifySecurity } from "./verifySecurity.js";
import { verifyRBACPatterns } from "./verifyRBACPatterns.js";
import { verifyEnvironmentIsolation } from "./verifyEnvironmentIsolation.js";
import { verifyFormatting } from "./verifyFormatting.js";
import { verifyImports } from "./verifyImports.js";
import { verifyMigrations } from "./verifyMigrations.js";
import { verifyUnusedCode } from "./verifyUnusedCode.js";
import { verifyConsoleErrors } from "./verifyConsoleErrors.js";
import type { ConsoleErrorsResult } from "./verifyConsoleErrors.js";
import { verifyProdProtection } from "./verifyProdProtection.js";
import { verifyPM2Health } from "./verifyPM2Health.js";
import { verifyGitCommitMessage } from "./verifyGitCommitMessage.js";
import { verifyDatabaseConnection } from "./verifyDatabaseConnection.js";
import { verifyEnvironmentVariables } from "./verifyEnvironmentVariables.js";
import { verifyLighthouse } from "./verifyLighthouse.js";
import type { LighthouseResult } from "./verifyLighthouse.js";
import { execSync } from "child_process";
import { compactify, CompactOutput } from "./compactOutput.js";

export interface PreCommitResult {
  success: boolean;
  checks: {
    // Mevcut
    lint: boolean;
    productionReady: boolean;
    build: boolean;
    // Yeni - Blocker
    typescript: boolean;
    security: boolean;
    rbac: boolean;
    environment: boolean;
    prodProtection: boolean;
    pm2Health: boolean;
    gitCommitMessage: boolean;
    databaseConnection: boolean;
    environmentVariables: boolean;
    // Yeni - Warning
    formatting: boolean;
    imports: boolean;
    migrations: boolean;
    unusedCode: boolean;
    consoleErrors: boolean;
    lighthouse: boolean;
  };
  errors: string[];
  warnings: string[];
  qualityChecks?: {
    lint: boolean;
    typescript: boolean;
    formatting: boolean;
    allPassed: boolean;
  };
  evidence?: {
    productionReady?: { found: string[] };
    security?: {
      count: number;
      issues: Array<{ file: string; line: number; issue: string }>;
    };
    consoleErrors?: ConsoleErrorsResult;
    lighthouse?: LighthouseResult;
  };
  meta?: {
    hasFrontendChanges: boolean;
    hasSchemaChanges: boolean;
    concurrency: { cpu: number; io: number; browser: number };
  };
  compact?: CompactOutput; // Compact format for token optimization
}

async function hasFrontendChanges(): Promise<boolean> {
  try {
    const { gitDiffMCP } = await import("../utils/mcpClient.js");
    const staged = await gitDiffMCP({ staged: true, nameOnly: true });
    if (staged.includes("frontend/")) return true;

    // In worktrees it is common to run checks before staging.
    const unstaged = await gitDiffMCP({ nameOnly: true });
    return unstaged.includes("frontend/");
  } catch {
    return false;
  }
}

async function hasSchemaChanges(): Promise<boolean> {
  try {
    const { gitDiffMCP } = await import("../utils/mcpClient.js");
    const staged = await gitDiffMCP({ staged: true, nameOnly: true });
    if (staged.includes("prisma/schema.prisma")) return true;

    const unstaged = await gitDiffMCP({ nameOnly: true });
    return unstaged.includes("prisma/schema.prisma");
  } catch {
    return false;
  }
}

type Task<T> = () => Promise<T>;

async function allSettledWithLimit<T>(
  tasks: Array<Task<T>>,
  limit: number
): Promise<Array<PromiseSettledResult<T>>> {
  const results: Array<PromiseSettledResult<T>> = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= tasks.length) return;
      try {
        const value = await tasks[i]();
        results[i] = { status: "fulfilled", value };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }

  const workerCount = Math.max(1, Math.min(limit, tasks.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function checkPreCommit(): Promise<PreCommitResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks = {
    lint: false,
    productionReady: false,
    build: false,
    typescript: false,
    security: false,
    rbac: false,
    environment: false,
    prodProtection: false,
    pm2Health: false,
    gitCommitMessage: false,
    databaseConnection: false,
    environmentVariables: false,
    formatting: false,
    imports: false,
    migrations: false,
    unusedCode: false,
    consoleErrors: false,
    lighthouse: false,
  };

  // PARALLEL EXECUTION (SAFE): checks run in parallel with controlled concurrency (Git MCP - Phase 3.3).
  const [hasSchema, hasFrontend] = await Promise.all([
    hasSchemaChanges(),
    hasFrontendChanges(),
  ]);

  const cpuLimit = Number(process.env.ASANMOD_PRECOMMIT_CPU_CONCURRENCY || 6);
  const ioLimit = Number(process.env.ASANMOD_PRECOMMIT_IO_CONCURRENCY || 20);
  const browserLimit = Number(
    process.env.ASANMOD_PRECOMMIT_BROWSER_CONCURRENCY || 2
  );

  type TaskDef<T> = { group: "cpu" | "io" | "browser"; run: Task<T> };
  const taskDefs: Array<TaskDef<any>> = [
    { group: "cpu", run: () => verifyLint() },
    { group: "cpu", run: () => verifyTypeScript() },
    { group: "io", run: () => checkProductionReady() },
    { group: "io", run: () => verifySecurity() },
    { group: "io", run: () => verifyRBACPatterns() },
    { group: "io", run: () => verifyEnvironmentIsolation() },
    { group: "io", run: () => verifyProdProtection() },
    { group: "io", run: () => verifyGitCommitMessage() },
    { group: "io", run: () => verifyEnvironmentVariables() },
    { group: "io", run: () => verifyPM2Health("both") },
    { group: "io", run: () => verifyDatabaseConnection("dev") },
    { group: "cpu", run: () => verifyBuild() },
    { group: "cpu", run: () => verifyFormatting() },
    { group: "io", run: () => verifyImports() },
    {
      group: "io",
      run: () =>
        hasSchema
          ? verifyMigrations()
          : Promise.resolve({ success: true, issues: [] }),
    },
    { group: "io", run: () => verifyUnusedCode() },
    {
      group: "browser",
      run: () =>
        hasFrontend
          ? verifyConsoleErrors()
          : Promise.resolve({ success: true, errors: [], warnings: [] }),
    },
    {
      group: "browser",
      run: () =>
        hasFrontend
          ? verifyLighthouse()
          : Promise.resolve({ success: true, results: [], count: 0 }),
    },
  ];

  const results: Array<PromiseSettledResult<any>> = new Array(taskDefs.length);
  const grouped = {
    cpu: [] as Array<{ idx: number; run: Task<any> }>,
    io: [] as Array<{ idx: number; run: Task<any> }>,
    browser: [] as Array<{ idx: number; run: Task<any> }>,
  };

  taskDefs.forEach((t, idx) => {
    grouped[t.group].push({ idx, run: t.run });
  });

  async function runGroup(
    group: "cpu" | "io" | "browser",
    limit: number
  ): Promise<void> {
    const items = grouped[group];
    const groupResults = await allSettledWithLimit(
      items.map((i) => i.run),
      limit
    );
    for (let i = 0; i < items.length; i++) {
      results[items[i].idx] = groupResults[i];
    }
  }

  await Promise.all([
    runGroup("cpu", cpuLimit),
    runGroup("io", ioLimit),
    runGroup("browser", browserLimit),
  ]);

  const [
    lintResult,
    tsResult,
    prodResult,
    securityResult,
    rbacResult,
    envResult,
    prodProtectionResult,
    gitCommitResult,
    envVarsResult,
    pm2HealthResult,
    dbConnectionResult,
    buildResult,
    formatResult,
    importResult,
    migrationResult,
    unusedResult,
    consoleResult,
    lighthouseResult,
  ] = results;

  // Process blocker check results
  // 1. LINT CHECK
  if (lintResult.status === "fulfilled") {
    checks.lint = lintResult.value.success;
    if (!lintResult.value.success) {
      errors.push(
        `❌ LINT FAILED: ${lintResult.value.errors} errors, ${lintResult.value.warnings} warnings`
      );
    }
  } else {
    checks.lint = false;
    errors.push(
      `❌ LINT FAILED: ${lintResult.reason?.message || "Unknown error"}`
    );
  }

  // 2. TYPESCRIPT CHECK
  if (tsResult.status === "fulfilled") {
    checks.typescript = tsResult.value.success;
    if (!tsResult.value.success) {
      errors.push(
        `❌ TYPESCRIPT FAILED: ${tsResult.value.errors} errors (Frontend: ${tsResult.value.frontend?.errors || 0}, Backend: ${tsResult.value.backend?.errors || 0})`
      );
    }
  } else {
    checks.typescript = false;
    errors.push(
      `❌ TYPESCRIPT FAILED: ${tsResult.reason?.message || "Unknown error"}`
    );
  }

  // 3. PRODUCTION READY CHECK
  if (prodResult.status === "fulfilled") {
    checks.productionReady = prodResult.value.success;
    if (!prodResult.value.success) {
      errors.push(
        `❌ PRODUCTION READY FAILED: Found ${(prodResult.value as any).found?.join(", ") || "unknown"}`
      );
    }
  } else {
    checks.productionReady = false;
    errors.push(
      `❌ PRODUCTION READY FAILED: ${prodResult.reason?.message || "Unknown error"}`
    );
  }

  // 4. SECURITY CHECK
  if (securityResult.status === "fulfilled") {
    checks.security = securityResult.value.success;
    if (!securityResult.value.success) {
      errors.push(
        `❌ SECURITY FAILED: ${securityResult.value.count || 0} issues found (${
          securityResult.value.issues
            ?.slice(0, 3)
            .map((i: any) => i.issue)
            .join(", ") || "unknown"
        })`
      );
    }
  } else {
    checks.security = false;
    errors.push(
      `❌ SECURITY FAILED: ${securityResult.reason?.message || "Unknown error"}`
    );
  }

  // 5. RBAC PATTERN CHECK
  if (rbacResult.status === "fulfilled") {
    checks.rbac = rbacResult.value.success;
    if (!rbacResult.value.success) {
      errors.push(
        `❌ RBAC PATTERN FAILED: ${rbacResult.value.count || 0} violations found`
      );
    }
  } else {
    checks.rbac = false;
    errors.push(
      `❌ RBAC PATTERN FAILED: ${rbacResult.reason?.message || "Unknown error"}`
    );
  }

  // 6. ENVIRONMENT ISOLATION CHECK
  if (envResult.status === "fulfilled") {
    checks.environment = envResult.value.success;
    if (!envResult.value.success) {
      errors.push(
        `❌ ENVIRONMENT ISOLATION FAILED: ${envResult.value.issues?.join(", ") || "unknown"}`
      );
    }
  } else {
    checks.environment = false;
    errors.push(
      `❌ ENVIRONMENT ISOLATION FAILED: ${envResult.reason?.message || "Unknown error"}`
    );
  }

  // 7. PROD PROTECTION CHECK
  if (prodProtectionResult.status === "fulfilled") {
    checks.prodProtection = prodProtectionResult.value.success;
    if (!prodProtectionResult.value.success) {
      errors.push(
        `❌ PROD PROTECTION FAILED: ${prodProtectionResult.value.count || 0} violations found (Rule 7)`
      );
    }
  } else {
    checks.prodProtection = false;
    errors.push(
      `❌ PROD PROTECTION FAILED: ${prodProtectionResult.reason?.message || "Unknown error"}`
    );
  }

  // 8. GIT COMMIT MESSAGE CHECK
  if (gitCommitResult.status === "fulfilled") {
    checks.gitCommitMessage = gitCommitResult.value.success;
    if (!gitCommitResult.value.success) {
      errors.push(
        `❌ GIT COMMIT MESSAGE FAILED: ${gitCommitResult.value.violations?.map((v: any) => v.issue).join(", ") || "unknown"}`
      );
    }
  } else {
    checks.gitCommitMessage = false;
    errors.push(
      `❌ GIT COMMIT MESSAGE FAILED: ${gitCommitResult.reason?.message || "Unknown error"}`
    );
  }

  // 9. ENVIRONMENT VARIABLES CHECK
  if (envVarsResult.status === "fulfilled") {
    checks.environmentVariables = envVarsResult.value.success;
    if (!envVarsResult.value.success) {
      errors.push(
        `❌ ENVIRONMENT VARIABLES FAILED: ${envVarsResult.value.issues?.map((i: any) => i.issue).join(", ") || "unknown"}`
      );
    }
  } else {
    checks.environmentVariables = false;
    errors.push(
      `❌ ENVIRONMENT VARIABLES FAILED: ${envVarsResult.reason?.message || "Unknown error"}`
    );
  }

  // 10. PM2 HEALTH CHECK
  if (pm2HealthResult.status === "fulfilled") {
    checks.pm2Health = pm2HealthResult.value.success;
    if (!pm2HealthResult.value.success) {
      errors.push(
        `❌ PM2 HEALTH FAILED: ${pm2HealthResult.value.offline || 0} processes offline`
      );
    }
  } else {
    checks.pm2Health = false;
    errors.push(
      `❌ PM2 HEALTH FAILED: ${pm2HealthResult.reason?.message || "Unknown error"}`
    );
  }

  // 11. DATABASE CONNECTION CHECK
  if (dbConnectionResult.status === "fulfilled") {
    checks.databaseConnection = dbConnectionResult.value.success;
    if (!dbConnectionResult.value.success) {
      errors.push(
        `❌ DATABASE CONNECTION FAILED: ${dbConnectionResult.value.failed || 0} connections failed`
      );
    }
  } else {
    checks.databaseConnection = false;
    errors.push(
      `❌ DATABASE CONNECTION FAILED: ${dbConnectionResult.reason?.message || "Unknown error"}`
    );
  }

  // 12. BUILD CHECK
  if (buildResult.status === "fulfilled") {
    checks.build = buildResult.value.success;
    if (!buildResult.value.success) {
      errors.push(
        `❌ BUILD FAILED: ${buildResult.value.error || "Unknown error"}`
      );
    }
  } else {
    checks.build = false;
    errors.push(
      `❌ BUILD FAILED: ${buildResult.reason?.message || "Unknown error"}`
    );
  }

  // 13. FORMATTING CHECK (Rule 0-LINT-QUALITY: Now mandatory blocker)
  if (formatResult.status === "fulfilled") {
    checks.formatting = formatResult.value.success;
    if (!formatResult.value.success) {
      errors.push(
        `❌ FORMATTING FAILED: ${formatResult.value.count || 0} files not formatted (Rule 0-LINT-QUALITY: 0 formatting issues required)`
      );
    }
  } else {
    checks.formatting = false;
    errors.push(
      `❌ FORMATTING FAILED: ${formatResult.reason?.message || "Unknown error"} (Rule 0-LINT-QUALITY)`
    );
  }

  // Process warning check results (14-18)

  // 14. IMPORT VALIDATION
  if (importResult.status === "fulfilled") {
    checks.imports = importResult.value.success;
    if (!importResult.value.success) {
      warnings.push(
        `⚠️ IMPORTS: ${importResult.value.count || 0} issues found (deep nesting, etc.)`
      );
    }
  } else {
    checks.imports = false;
    warnings.push(
      `⚠️ IMPORTS: ${importResult.reason?.message || "Unknown error"}`
    );
  }

  // 15. MIGRATION CHECK
  if (migrationResult.status === "fulfilled") {
    checks.migrations = migrationResult.value.success;
    if (!migrationResult.value.success && hasSchema) {
      warnings.push(
        `⚠️ MIGRATIONS: ${migrationResult.value.issues?.join(", ") || "unknown"}`
      );
    }
  } else {
    checks.migrations = !hasSchema; // Skip if no schema changes
    if (hasSchema) {
      warnings.push(
        `⚠️ MIGRATIONS: ${migrationResult.reason?.message || "Unknown error"}`
      );
    }
  }

  // 16. UNUSED CODE CHECK
  if (unusedResult.status === "fulfilled") {
    checks.unusedCode = unusedResult.value.success;
    if (!unusedResult.value.success) {
      warnings.push(
        `⚠️ UNUSED CODE: ${unusedResult.value.count || 0} items found (consider cleanup)`
      );
    }
  } else {
    checks.unusedCode = false;
    warnings.push(
      `⚠️ UNUSED CODE: ${unusedResult.reason?.message || "Unknown error"}`
    );
  }

  // 17. CONSOLE ERRORS CHECK (hard fail when frontend changes)
  if (consoleResult.status === "fulfilled") {
    checks.consoleErrors = consoleResult.value.success;
    if (!consoleResult.value.success && hasFrontend) {
      const result = consoleResult.value as ConsoleErrorsResult;
      errors.push(
        `❌ CONSOLE ERRORS: ${result.errors?.length || 0} errors, ${result.warnings?.length || 0} warnings found`
      );
      if (result.errors && result.errors.length > 0) {
        const firstErrors = result.errors
          .slice(0, 3)
          .map((err) => err.message || err)
          .join("; ");
        errors.push(`   First errors: ${firstErrors}`);
      }
    }
  } else {
    checks.consoleErrors = !hasFrontend;
    if (hasFrontend) {
      errors.push(
        `❌ CONSOLE ERRORS: ${consoleResult.reason?.message || "Unknown error"}`
      );
    }
  }

  // 18. LIGHTHOUSE CHECK (hard fail when frontend changes)
  if (lighthouseResult.status === "fulfilled") {
    checks.lighthouse = lighthouseResult.value.success;
    if (!lighthouseResult.value.success && hasFrontend) {
      const first = lighthouseResult.value.results?.[0];
      if (first?.scores) {
        errors.push(
          `❌ LIGHTHOUSE FAILED: P=${first.scores.performance}, A=${first.scores.accessibility}, BP=${first.scores.bestPractices}, SEO=${first.scores.seo}`
        );
      } else {
        errors.push("❌ LIGHTHOUSE FAILED");
      }
    }
  } else {
    checks.lighthouse = !hasFrontend;
    if (hasFrontend) {
      errors.push(
        `❌ LIGHTHOUSE FAILED: ${lighthouseResult.reason?.message || "Unknown error"}`
      );
    }
  }

  // BLOCKER = errors.length === 0
  // WARNING = warnings.length > 0 (commit yapılabilir ama uyarı ver)
  // Rule 0-LINT-QUALITY: Zero tolerance - all quality checks must pass
  const qualityChecks = {
    lint: checks.lint,
    typescript: checks.typescript,
    formatting: checks.formatting,
  };

  const qualityFailed =
    !qualityChecks.lint ||
    !qualityChecks.typescript ||
    !qualityChecks.formatting;

  if (qualityFailed) {
    errors.push(
      `🔥🔥🔥 RULE 0-LINT-QUALITY İHLALİ: ESLint, TypeScript veya Prettier kontrolü başarısız! 🔥🔥🔥`
    );
    errors.push(
      `   ESLint: ${checks.lint ? "✅ 0/0" : "❌ FAILED"} | TypeScript: ${checks.typescript ? "✅ 0 errors" : "❌ FAILED"} | Prettier: ${checks.formatting ? "✅ 0 issues" : "❌ FAILED"}`
    );
    errors.push(`   Commit policy: 0/0 olmadan commit yapılamaz!`);
  }

  const evidence: PreCommitResult["evidence"] = {
    productionReady:
      prodResult.status === "fulfilled"
        ? { found: (prodResult.value as any).found || [] }
        : undefined,
    security:
      securityResult.status === "fulfilled"
        ? {
            count: securityResult.value.count || 0,
            issues: (securityResult.value.issues || [])
              .slice(0, 20)
              .map((i: any) => ({
                file: i.file,
                line: i.line,
                issue: i.issue,
              })),
          }
        : undefined,
    consoleErrors:
      hasFrontend && consoleResult.status === "fulfilled"
        ? (consoleResult.value as ConsoleErrorsResult)
        : undefined,
    lighthouse:
      hasFrontend && lighthouseResult.status === "fulfilled"
        ? (lighthouseResult.value as LighthouseResult)
        : undefined,
  };

  const meta: PreCommitResult["meta"] = {
    hasFrontendChanges: hasFrontend,
    hasSchemaChanges: hasSchema,
    concurrency: { cpu: cpuLimit, io: ioLimit, browser: browserLimit },
  };

  // Count changed files for compact output (Git MCP - Phase 3.3)
  let fileCount = 0;
  try {
    const { gitDiffMCP } = await import("../utils/mcpClient.js");
    const staged = await gitDiffMCP({ staged: true, nameOnly: true });
    const unstaged = await gitDiffMCP({ nameOnly: true });
    const allFiles = new Set(
      [...staged.split("\n"), ...unstaged.split("\n")].filter(Boolean)
    );
    fileCount = allFiles.size;
  } catch {
    // Ignore errors
  }

  // Create compact output for token optimization
  const compact = compactify({
    type: "pre-commit",
    errors,
    warnings,
    files: fileCount,
    commits: 0, // Pre-commit doesn't have commit count
  });

  return {
    success: errors.length === 0,
    checks,
    errors,
    warnings,
    qualityChecks: {
      lint: qualityChecks.lint,
      typescript: qualityChecks.typescript,
      formatting: qualityChecks.formatting,
      allPassed: !qualityFailed,
    },
    evidence,
    meta,
    compact, // Add compact format
  };
}
