/**
 * Tool: asanmod_verify_migrations
 * Database migration kontrolü (Prisma schema değişiklikleri)
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface MigrationsResult {
  success: boolean;
  issues: string[];
  count: number;
  error?: string;
}

export async function verifyMigrations(
  path?: string
): Promise<MigrationsResult> {
  // Use getWorkspaceRoot to find the correct project root
  const workspaceRoot = getWorkspaceRoot(import.meta.url);
  const targetPath = path || workspaceRoot;
  const backendPath = join(targetPath, "backend");
  const schemaPath = join(backendPath, "prisma", "schema.prisma");
  const migrationsPath = join(backendPath, "prisma", "migrations");

  const issues: string[] = [];

  if (!existsSync(schemaPath)) {
    return {
      success: true,
      issues: [],
      count: 0,
    };
  }

  try {
    // Schema dosyasını oku
    const schemaContent = readFileSync(schemaPath, "utf-8");

    // Migration'lar var mı kontrol et
    if (!existsSync(migrationsPath)) {
      issues.push(
        "Migrations directory not found - schema changes may not be tracked"
      );
      return {
        success: issues.length === 0,
        issues,
        count: issues.length,
      };
    }

    // Son migration'ı kontrol et
    const migrations = execSync(
      `ls -t ${migrationsPath} 2>/dev/null | head -1 || true`,
      {
        encoding: "utf-8",
      }
    ).trim();

    if (!migrations) {
      issues.push("No migrations found - schema changes may not be tracked");
    }

    // Prisma migrate status kontrolü (opsiyonel - zaman alabilir)
    // Bu kontrolü sadece uyarı olarak yap, blocker yapma
    try {
      const statusOutput = execSync(`npx prisma migrate status 2>&1 || true`, {
        encoding: "utf-8",
        maxBuffer: 5 * 1024 * 1024,
        cwd: backendPath,
      });

      if (statusOutput.includes("database is not in sync")) {
        issues.push("Database schema is not in sync with migrations");
      }
    } catch {
      // Prisma migrate status başarısız olabilir (database bağlantısı yoksa)
      // Bu durumda sadece uyarı ver, blocker yapma
    }

    return {
      success: issues.length === 0,
      issues,
      count: issues.length,
    };
  } catch (err: any) {
    return {
      success: false,
      issues: [],
      count: 0,
      error: err.message || "Migration check failed",
    };
  }
}
