import { verifyRBACPatterns } from "./verifyRBACPatterns.js";
import { verifySecurity } from "./verifySecurity.js";
import { verifyEnvironmentIsolation } from "./verifyEnvironmentIsolation.js";
import { verifyProdProtection } from "./verifyProdProtection.js";

export interface SecurityAuditOptions {
  check: "rbac" | "secrets" | "isolation" | "prod-protect" | "all";
  path?: string;
}

export interface SecurityAuditResult {
  success: boolean;
  summary: string;
  details: any;
  vulnerabilities: number;
}

export async function securityAudit(
  options: SecurityAuditOptions
): Promise<SecurityAuditResult> {
  const { check, path } = options;
  let success = true;
  let summaryParts: string[] = [];
  let details: any = {};
  let totalVulns = 0;

  try {
    // Paralel execution optimization: Run independent checks in parallel when check === "all"
    if (check === "all") {
      // Run all checks in parallel using Promise.allSettled
      const [rbacResult, secResult, isoResult, protectResult] =
        await Promise.allSettled([
          verifyRBACPatterns(path).catch((error) => ({
            success: false,
            violations: [],
            count: 999,
            error: error?.message || "RBAC check failed",
          })),
          verifySecurity(path).catch((error) => ({
            vulnerabilities: 999,
            error: error?.message || "Security check failed",
          })),
          verifyEnvironmentIsolation(path).catch((error) => ({
            success: false,
            error: error?.message || "Environment isolation check failed",
          })),
          verifyProdProtection(path).catch((error) => ({
            success: false,
            error: error?.message || "Prod protection check failed",
          })),
        ]);

      // Process RBAC result
      if (rbacResult.status === "fulfilled") {
        details.rbac = rbacResult.value;
        const issues = rbacResult.value.count || 0;
        if (issues > 0) {
          success = false;
          totalVulns += issues;
          summaryParts.push(`RBAC: ${issues} issues`);
        } else {
          summaryParts.push("RBAC: PASS");
        }
      } else {
        success = false;
        details.rbac = {
          error: rbacResult.reason?.message || "RBAC check failed",
        };
        summaryParts.push("RBAC: ERROR");
      }

      // Process Security result
      if (secResult.status === "fulfilled") {
        details.security = secResult.value;
        if (secResult.value.vulnerabilities > 0) {
          success = false;
          totalVulns += secResult.value.vulnerabilities;
          summaryParts.push(
            `Secrets: ${secResult.value.vulnerabilities} vulns`
          );
        } else {
          summaryParts.push("Secrets: PASS");
        }
      } else {
        success = false;
        details.security = {
          error: secResult.reason?.message || "Security check failed",
        };
        summaryParts.push("Secrets: ERROR");
      }

      // Process Isolation result
      if (isoResult.status === "fulfilled") {
        details.isolation = isoResult.value;
        if (!isoResult.value.success) {
          success = false;
          totalVulns += 1;
          summaryParts.push("Isolation: FAIL");
        } else {
          summaryParts.push("Isolation: PASS");
        }
      } else {
        success = false;
        details.isolation = {
          error:
            isoResult.reason?.message || "Environment isolation check failed",
        };
        summaryParts.push("Isolation: ERROR");
      }

      // Process Prod Protection result
      if (protectResult.status === "fulfilled") {
        details.prodProtection = protectResult.value;
        if (!protectResult.value.success) {
          success = false;
          totalVulns += 1;
          summaryParts.push("Prod Protect: FAIL");
        } else {
          summaryParts.push("Prod Protect: PASS");
        }
      } else {
        success = false;
        details.prodProtection = {
          error:
            protectResult.reason?.message || "Prod protection check failed",
        };
        summaryParts.push("Prod Protect: ERROR");
      }
    } else {
      // Sequential execution for single check (with error handling)
      if (check === "rbac") {
        try {
          const rbacResult = await verifyRBACPatterns(path).catch((error) => ({
            success: false,
            violations: [],
            count: 999,
            error: error?.message || "RBAC check failed",
          }));
          details.rbac = rbacResult;
          const issues = rbacResult.count || 0;
          if (issues > 0) {
            success = false;
            totalVulns += issues;
            summaryParts.push(`RBAC: ${issues} issues`);
          } else {
            summaryParts.push("RBAC: PASS");
          }
        } catch (error) {
          success = false;
          details.rbac = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("RBAC: ERROR");
        }
      }

      if (check === "secrets") {
        try {
          const secResult = await verifySecurity(path).catch((error) => ({
            vulnerabilities: 999,
            error: error?.message || "Security check failed",
          }));
          details.security = secResult;
          if (secResult.vulnerabilities > 0) {
            success = false;
            totalVulns += secResult.vulnerabilities;
            summaryParts.push(`Secrets: ${secResult.vulnerabilities} vulns`);
          } else {
            summaryParts.push("Secrets: PASS");
          }
        } catch (error) {
          success = false;
          details.security = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("Secrets: ERROR");
        }
      }

      if (check === "isolation") {
        try {
          const isoResult = await verifyEnvironmentIsolation(path).catch(
            (error) => ({
              success: false,
              error: error?.message || "Environment isolation check failed",
            })
          );
          details.isolation = isoResult;
          if (!isoResult.success) {
            success = false;
            totalVulns += 1;
            summaryParts.push("Isolation: FAIL");
          } else {
            summaryParts.push("Isolation: PASS");
          }
        } catch (error) {
          success = false;
          details.isolation = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("Isolation: ERROR");
        }
      }

      if (check === "prod-protect") {
        try {
          const protectResult = await verifyProdProtection(path).catch(
            (error) => ({
              success: false,
              error: error?.message || "Prod protection check failed",
            })
          );
          details.prodProtection = protectResult;
          if (!protectResult.success) {
            success = false;
            totalVulns += 1;
            summaryParts.push("Prod Protect: FAIL");
          } else {
            summaryParts.push("Prod Protect: PASS");
          }
        } catch (error) {
          success = false;
          details.prodProtection = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("Prod Protect: ERROR");
        }
      }
    }
  } catch (error) {
    success = false;
    details.error = error instanceof Error ? error.message : "Unknown error";
    summaryParts.push(`Security Audit: ${details.error}`);
  }

  return {
    success,
    summary: summaryParts.join(" | "),
    details,
    vulnerabilities: totalVulns,
  };
}
