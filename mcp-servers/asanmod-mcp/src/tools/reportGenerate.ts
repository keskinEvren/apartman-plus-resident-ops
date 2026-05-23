/**
 * Tool: asanmod_report_generate
 * Worker veya MOD süreci için JSON log üretir.
 */

export interface Report {
  timestamp: string;
  context: string;
  checks: {
    lint?: any;
    productionReady?: any;
    build?: any;
    task?: any;
  };
  success: boolean;
  errors: string[];
}

export async function generateReport(
  context: string,
  checks: any
): Promise<Report> {
  const errors: string[] = [];

  // Check results'ları parse et
  if (checks.lint && !checks.lint.success) {
    errors.push(
      `Lint: ${checks.lint.errors} errors, ${checks.lint.warnings} warnings`
    );
  }

  if (checks.productionReady && !checks.productionReady.success) {
    errors.push(
      `Production Ready: Found ${checks.productionReady.found?.join(", ")}`
    );
  }

  if (checks.build && !checks.build.success) {
    errors.push(`Build: ${checks.build.error || "Unknown error"}`);
  }

  if (checks.task && !checks.task.success) {
    errors.push(...checks.task.errors);
  }

  return {
    timestamp: new Date().toISOString(),
    context,
    checks,
    success: errors.length === 0,
    errors,
  };
}
