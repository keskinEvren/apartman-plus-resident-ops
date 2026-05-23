/**
 * Tool: asanmod_verify_prod_protection
 * PROD protection kontrolü (Rule 7) - PROD'a dokunulmaması kontrolü
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface ProdProtectionResult {
  success: boolean;
  violations: Array<{
    type:
      | "database"
      | "process"
      | "deployment"
      | "env"
      | "port"
      | "minio"
      | "redis";
    file?: string;
    line?: number;
    issue: string;
    code?: string;
  }>;
  count: number;
  error?: string;
}

export async function verifyProdProtection(
  path?: string
): Promise<ProdProtectionResult> {
  // Get project root using ES Module compatible helper
  const projectRoot = getWorkspaceRoot();
  const targetPath = path || projectRoot;
  const violations: ProdProtectionResult["violations"] = [];

  try {
    // Git diff'te PROD referansları var mı kontrol et (try --staged, fallback to regular diff)
    let stagedFiles: string[] = [];
    try {
      const output = execSync("git diff --staged --name-only", {
        encoding: "utf-8",
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024,
        stdio: "pipe",
      });
      stagedFiles = output.split("\n").filter((f) => f.trim().length > 0);
    } catch {
      try {
        const output = execSync("git diff --name-only", {
          encoding: "utf-8",
          cwd: projectRoot,
          maxBuffer: 10 * 1024 * 1024,
          stdio: "pipe",
        });
        stagedFiles = output.split("\n").filter((f) => f.trim().length > 0);
      } catch {
        // No git changes, return success
        return {
          success: true,
          violations: [],
          count: 0,
        };
      }
    }

    // PROD database referansları
    const prodDbPatterns = [
      /asanmod_prod_db/gi,
      /asanmod-prod-/gi,
      /8204|8205/gi, // PROD ports
      /asanmod-prod-files/gi, // PROD MinIO bucket
      /redis.*db.*1/gi, // PROD Redis DB
    ];

    for (const file of stagedFiles) {
      const fullPath = join(projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      // PROD database referansı
      if (
        content.includes("asanmod_prod_db") &&
        !content.includes("// PROD") &&
        !content.includes("/* PROD")
      ) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("asanmod_prod_db")) {
            violations.push({
              type: "database",
              file,
              line: i + 1,
              issue: "PROD database reference found (asanmod_prod_db)",
              code: lines[i].trim().substring(0, 100),
            });
            break;
          }
        }
      }

      // PROD process referansları
      if (
        content.includes("asanmod-prod-") &&
        !content.includes("// PROD") &&
        !content.includes("/* PROD")
      ) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("asanmod-prod-")) {
            violations.push({
              type: "process",
              file,
              line: i + 1,
              issue: "PROD PM2 process reference found (asanmod-prod-*)",
              code: lines[i].trim().substring(0, 100),
            });
            break;
          }
        }
      }

      // PROD deployment script
      if (
        file.includes("deploy.sh") &&
        content.includes("prod") &&
        !content.includes("--prod") &&
        !content.includes("PROD")
      ) {
        violations.push({
          type: "deployment",
          file,
          issue: "PROD deployment script execution detected",
        });
      }

      // PROD ports (8204, 8205)
      if (
        content.match(/820[45]/) &&
        !content.includes("// PROD") &&
        !content.includes("/* PROD")
      ) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/820[45]/)) {
            violations.push({
              type: "port",
              file,
              line: i + 1,
              issue: "PROD port reference found (8204/8205)",
              code: lines[i].trim().substring(0, 100),
            });
            break;
          }
        }
      }

      // PROD MinIO bucket
      if (
        content.includes("asanmod-prod-files") &&
        !content.includes("// PROD") &&
        !content.includes("/* PROD")
      ) {
        violations.push({
          type: "minio",
          file,
          issue: "PROD MinIO bucket reference found (asanmod-prod-files)",
        });
      }

      // PROD Redis DB
      if (
        content.includes("redis") &&
        content.includes("db") &&
        content.includes("1") &&
        !content.includes("// PROD")
      ) {
        violations.push({
          type: "redis",
          file,
          issue: "PROD Redis DB reference found (DB 1)",
        });
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
      error: err.message || "PROD protection check failed",
    };
  }
}
