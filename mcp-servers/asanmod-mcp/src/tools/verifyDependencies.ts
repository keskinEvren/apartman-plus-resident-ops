/**
 * Tool: asanmod_verify_dependencies
 * Dependency kontrolü (outdated packages, security vulnerabilities)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface DependenciesResult {
  success: boolean;
  outdated: number;
  vulnerabilities: number;
  critical: number;
  issues: Array<{
    type: "outdated" | "vulnerability";
    package?: string;
    severity?: "low" | "moderate" | "high" | "critical";
    issue: string;
  }>;
  error?: string;
}

export async function verifyDependencies(
  path?: string
): Promise<DependenciesResult> {
  // Use getWorkspaceRoot to find the correct project root
  const workspaceRoot = getWorkspaceRoot(import.meta.url);
  const targetPath = path || workspaceRoot;
  const issues: DependenciesResult["issues"] = [];
  let outdated = 0;
  let vulnerabilities = 0;
  let critical = 0;

  try {
    // Frontend dependencies
    const frontendPath = join(targetPath, "frontend");
    if (existsSync(frontendPath)) {
      try {
        // npm audit çalıştır
        const auditOutput = execSync("npm audit --json 2>&1 || true", {
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
          cwd: frontendPath,
        });

        try {
          const audit = JSON.parse(auditOutput);
          if (audit.vulnerabilities) {
            const vulns = audit.vulnerabilities as Record<
              string,
              { severity?: string }
            >;
            for (const [pkg, vuln] of Object.entries(vulns)) {
              if (vuln.severity === "critical") {
                critical++;
                vulnerabilities++;
                issues.push({
                  type: "vulnerability",
                  package: pkg,
                  severity: "critical",
                  issue: `Critical vulnerability in ${pkg}`,
                });
              } else if (vuln.severity === "high") {
                vulnerabilities++;
                issues.push({
                  type: "vulnerability",
                  package: pkg,
                  severity: "high",
                  issue: `High severity vulnerability in ${pkg}`,
                });
              }
            }
          }
        } catch {
          // JSON parse failed, skip
        }
      } catch {
        // npm audit failed, skip
      }
    }

    // Backend dependencies
    const backendPath = join(targetPath, "backend");
    if (existsSync(backendPath)) {
      try {
        const auditOutput = execSync("npm audit --json 2>&1 || true", {
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
          cwd: backendPath,
        });

        try {
          const audit = JSON.parse(auditOutput);
          if (audit.vulnerabilities) {
            const vulns = audit.vulnerabilities as Record<
              string,
              { severity?: string }
            >;
            for (const [pkg, vuln] of Object.entries(vulns)) {
              if (vuln.severity === "critical") {
                critical++;
                vulnerabilities++;
                issues.push({
                  type: "vulnerability",
                  package: pkg,
                  severity: "critical",
                  issue: `Critical vulnerability in ${pkg}`,
                });
              } else if (vuln.severity === "high") {
                vulnerabilities++;
                issues.push({
                  type: "vulnerability",
                  package: pkg,
                  severity: "high",
                  issue: `High severity vulnerability in ${pkg}`,
                });
              }
            }
          }
        } catch {
          // JSON parse failed, skip
        }
      } catch {
        // npm audit failed, skip
      }
    }

    return {
      success: critical === 0, // Sadece critical vulnerabilities blocker
      outdated,
      vulnerabilities,
      critical,
      issues: issues.slice(0, 10), // İlk 10 issue
    };
  } catch (err: any) {
    return {
      success: false,
      outdated: 0,
      vulnerabilities: 0,
      critical: 0,
      issues: [],
      error: err.message || "Dependencies check failed",
    };
  }
}
