/**
 * Tool: asanmod_verify_rbac_patterns
 * RBAC pattern kontrolü (organizationId filter, SUPER_ADMIN bypass, etc.)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export interface RBACResult {
  success: boolean;
  violations: Array<{
    file: string;
    line: number;
    issue: string;
    code?: string;
  }>;
  count: number;
  error?: string;
}

export async function verifyRBACPatterns(path?: string): Promise<RBACResult> {
  const targetPath = path || process.cwd();
  const backendPath = join(targetPath, "backend", "src", "controllers");

  const violations: RBACResult["violations"] = [];

  if (!existsSync(backendPath)) {
    return {
      success: true,
      violations: [],
      count: 0,
    };
  }

  try {
    // Controller dosyalarını bul
    const findCommand = `find ${backendPath} -name "*.js" -type f 2>/dev/null || true`;
    const files = execSync(findCommand, { encoding: "utf-8" })
      .split("\n")
      .filter((f) => f.trim().length > 0);

    for (const file of files) {
      const content = execSync(`cat "${file}"`, { encoding: "utf-8" });
      const lines = content.split("\n");

      // RBAC Pattern Kontrolü (Rule 2: Multi-Tenant + RBAC)
      // Pattern 1: SUPER_ADMIN bypass kontrolü
      // Pattern 2: organizationId filter (ADMIN/MANAGER/HR_SPECIALIST için)
      // Pattern 3: userId + organizationId filter (USER için)

      const hasFindMany =
        content.includes("findMany") || content.includes("findFirst");
      const hasOrganizationFilter = content.includes("organizationId");
      const hasSuperAdminCheck =
        content.includes("SUPER_ADMIN") ||
        content.includes("userRole === 'SUPER_ADMIN'") ||
        content.includes("userRole !== 'SUPER_ADMIN'") ||
        content.includes("req.user?.role === 'SUPER_ADMIN'");

      // Prisma query'lerinde organizationId filter var mı?
      if (hasFindMany) {
        // organizationId filter'ı olan query'lerde SUPER_ADMIN bypass kontrolü olmalı
        if (hasOrganizationFilter && !hasSuperAdminCheck) {
          // İlk organizationId kullanımını bul
          for (let i = 0; i < lines.length; i++) {
            if (
              lines[i].includes("organizationId") &&
              (lines[i].includes("where") || lines[i].includes("="))
            ) {
              // Bu satırdan önce SUPER_ADMIN kontrolü var mı? (20 satır öncesine bak)
              const contextStart = Math.max(0, i - 20);
              const context = lines.slice(contextStart, i + 1).join("\n");

              if (
                !context.includes("SUPER_ADMIN") &&
                !context.includes("userRole") &&
                !context.includes("req.user?.role")
              ) {
                violations.push({
                  file: file.replace(targetPath + "/", ""),
                  line: i + 1,
                  issue:
                    "organizationId filter var ama SUPER_ADMIN bypass kontrolü yok. Pattern: if (userRole !== 'SUPER_ADMIN') { where.organizationId = ... }",
                  code: lines[i].trim().substring(0, 100),
                });
                break;
              }
            }
          }
        }

        // organizationId filter yoksa ve SUPER_ADMIN kontrolü de yoksa uyarı
        if (!hasOrganizationFilter && !hasSuperAdminCheck) {
          // İlk findMany satırını bul
          for (let i = 0; i < lines.length; i++) {
            if (
              lines[i].includes("findMany") ||
              lines[i].includes("findFirst")
            ) {
              violations.push({
                file: file.replace(targetPath + "/", ""),
                line: i + 1,
                issue:
                  "Prisma query'de organizationId filter veya SUPER_ADMIN bypass kontrolü yok. RBAC pattern uygulanmalı!",
                code: lines[i].trim().substring(0, 100),
              });
              break;
            }
          }
        }
      }
    }

    return {
      success: violations.length === 0,
      violations,
      count: violations.length,
    };
  } catch (err: any) {
    return {
      success: false,
      violations: [],
      count: 0,
      error: err.message || "RBAC pattern check failed",
    };
  }
}
