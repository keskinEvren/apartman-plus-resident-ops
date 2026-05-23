import { verifyLint } from "./verifyLint.js";
import { verifyTypeScript } from "./verifyTypeScript.js";
import { verifyFormatting } from "./verifyFormatting.js";
import { verifyUnusedCode } from "./verifyUnusedCode.js";
import { verifyMCPOnly } from "./verifyMCPOnly.js";
import { lintFix } from "./lintFix.js";

export interface QualityGateOptions {
  type: "lint" | "types" | "format" | "dead-code" | "all";
  fix?: boolean;
  path?: string;
}

export interface QualityGateResult {
  success: boolean;
  summary: string;
  details: any;
  fixed?: boolean;
}

export async function qualityGate(
  options: QualityGateOptions
): Promise<QualityGateResult> {
  const { type, fix = false, path } = options;
  let success = true;
  let summaryParts: string[] = [];
  let details: any = {};
  let fixed = false;

  try {
    // Lint fix (if requested) - must run before lint check
    if (fix && (type === "lint" || type === "all")) {
      try {
        const fixResult = await lintFix(path).catch((error) => ({
          success: false,
          error: error?.message || "Lint fix failed",
        }));
        if (fixResult.success) {
          summaryParts.push("Lint fixes applied");
          fixed = true;
        } else {
          summaryParts.push(`Lint fix: ${fixResult.error || "FAIL"}`);
        }
      } catch (error) {
        summaryParts.push(
          `Lint fix: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // v8.0: MCP-only check (always run when type === "all")
    let mcpOnlyResult: any = null;
    if (type === "all") {
      try {
        mcpOnlyResult = await verifyMCPOnly(path);
        if (!mcpOnlyResult.success) {
          success = false;
          summaryParts.push(
            `MCP-only: ${mcpOnlyResult.violations.length} violations`
          );
        } else {
          summaryParts.push("MCP-only: PASS");
        }
      } catch (error) {
        success = false;
        summaryParts.push(
          `MCP-only: ${error instanceof Error ? error.message : "ERROR"}`
        );
      }
    }

    // Paralel execution optimization: Run independent checks in parallel when type === "all"
    if (type === "all") {
      // Run all checks in parallel using Promise.allSettled
      const [lintResult, tsResult, formatResult, unusedResult] =
        await Promise.allSettled([
          verifyLint(path).catch((error) => ({
            errors: 999,
            warnings: 0,
            error: error?.message || "Lint check failed",
          })),
          verifyTypeScript(path).catch((error) => ({
            errors: 999,
            error: error?.message || "TypeScript check failed",
          })),
          verifyFormatting(path).catch((error) => ({
            success: false,
            error: error?.message || "Formatting check failed",
          })),
          verifyUnusedCode(path).catch((error) => ({
            success: false,
            unused: [],
            count: 0,
            error: error?.message || "Dead code check failed",
          })),
        ]);

      // Process results
      if (lintResult.status === "fulfilled") {
        details.lint = lintResult.value;
        if (lintResult.value.errors > 0 || lintResult.value.warnings > 0) {
          success = false;
          summaryParts.push(
            `Lint: ${lintResult.value.errors} errors, ${lintResult.value.warnings} warnings`
          );
        } else {
          summaryParts.push("Lint: PASS");
        }
      } else {
        success = false;
        details.lint = {
          error: lintResult.reason?.message || "Lint check failed",
        };
        summaryParts.push("Lint: ERROR");
      }

      if (tsResult.status === "fulfilled") {
        details.typescript = tsResult.value;
        if (tsResult.value.errors > 0) {
          success = false;
          summaryParts.push(`TypeScript: ${tsResult.value.errors} errors`);
        } else {
          summaryParts.push("TypeScript: PASS");
        }
      } else {
        success = false;
        details.typescript = {
          error: tsResult.reason?.message || "TypeScript check failed",
        };
        summaryParts.push("TypeScript: ERROR");
      }

      if (formatResult.status === "fulfilled") {
        details.format = formatResult.value;
        if (!formatResult.value.success) {
          success = false;
          summaryParts.push("Format: FAIL");
        } else {
          summaryParts.push("Format: PASS");
        }
      } else {
        success = false;
        details.format = {
          error: formatResult.reason?.message || "Formatting check failed",
        };
        summaryParts.push("Format: ERROR");
      }

      if (unusedResult.status === "fulfilled") {
        details.unused = unusedResult.value;
        if (unusedResult.value.unused && unusedResult.value.unused.length > 0) {
          summaryParts.push(
            `Dead Code: ${unusedResult.value.unused.length} items`
          );
        } else {
          summaryParts.push("Dead Code: PASS");
        }
      } else {
        details.unused = {
          error: unusedResult.reason?.message || "Dead code check failed",
        };
        summaryParts.push("Dead Code: ERROR");
      }
    } else {
      // Sequential execution for single type checks (with error handling)
      if (type === "lint") {
        try {
          const lintResult = await verifyLint(path).catch((error) => ({
            errors: 999,
            warnings: 0,
            error: error?.message || "Lint check failed",
          }));
          details.lint = lintResult;
          if (lintResult.errors > 0 || lintResult.warnings > 0) {
            success = false;
            summaryParts.push(
              `Lint: ${lintResult.errors} errors, ${lintResult.warnings} warnings`
            );
          } else {
            summaryParts.push("Lint: PASS");
          }
        } catch (error) {
          success = false;
          details.lint = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("Lint: ERROR");
        }
      }

      if (type === "types") {
        try {
          const tsResult = await verifyTypeScript(path).catch((error) => ({
            errors: 999,
            error: error?.message || "TypeScript check failed",
          }));
          details.typescript = tsResult;
          if (tsResult.errors > 0) {
            success = false;
            summaryParts.push(`TypeScript: ${tsResult.errors} errors`);
          } else {
            summaryParts.push("TypeScript: PASS");
          }
        } catch (error) {
          success = false;
          details.typescript = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("TypeScript: ERROR");
        }
      }

      if (type === "format") {
        try {
          const formatResult = await verifyFormatting(path).catch((error) => ({
            success: false,
            error: error?.message || "Formatting check failed",
          }));
          details.format = formatResult;
          if (!formatResult.success) {
            success = false;
            summaryParts.push("Format: FAIL");
          } else {
            summaryParts.push("Format: PASS");
          }
        } catch (error) {
          success = false;
          details.format = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("Format: ERROR");
        }
      }

      if (type === "dead-code") {
        try {
          const unusedResult = await verifyUnusedCode(path).catch((error) => ({
            success: false,
            unused: [],
            count: 0,
            error: error?.message || "Dead code check failed",
          }));
          details.unused = unusedResult;
          if (unusedResult.unused && unusedResult.unused.length > 0) {
            summaryParts.push(`Dead Code: ${unusedResult.unused.length} items`);
          } else {
            summaryParts.push("Dead Code: PASS");
          }
        } catch (error) {
          details.unused = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("Dead Code: ERROR");
        }
      }
    }
  } catch (error) {
    success = false;
    details.error = error instanceof Error ? error.message : "Unknown error";
    summaryParts.push(`Quality Gate: ${details.error}`);
  }

  return {
    success,
    summary: summaryParts.join(" | "),
    details,
    fixed,
  };
}
