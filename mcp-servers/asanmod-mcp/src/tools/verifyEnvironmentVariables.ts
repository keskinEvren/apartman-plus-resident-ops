/**
 * Tool: asanmod_verify_environment_variables
 * Environment variable kontrolü (required vars, DEV/PROD farkları)
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface EnvironmentVariablesResult {
  success: boolean;
  issues: Array<{
    environment: "dev" | "prod";
    issue: string;
    variable?: string;
  }>;
  count: number;
  error?: string;
}

export async function verifyEnvironmentVariables(
  path?: string
): Promise<EnvironmentVariablesResult> {
  const targetPath = path || process.cwd();
  const issues: EnvironmentVariablesResult["issues"] = [];

  try {
    const requiredVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "REDIS_URL",
      "MINIO_ENDPOINT",
      "MINIO_ACCESS_KEY",
      "MINIO_SECRET_KEY",
    ];

    // .env.dev kontrolü
    const envDevPath = join(targetPath, ".env.dev");
    if (existsSync(envDevPath)) {
      const envDev = readFileSync(envDevPath, "utf-8");

      for (const varName of requiredVars) {
        if (!envDev.includes(`${varName}=`)) {
          issues.push({
            environment: "dev",
            issue: `Missing required environment variable: ${varName}`,
            variable: varName,
          });
        }
      }

      // DEV database kontrolü
      if (envDev.includes("DATABASE_URL") && envDev.includes("asanmod_prod_db")) {
        issues.push({
          environment: "dev",
          issue: "DEV .env contains PROD database reference",
        });
      }
    }

    // .env.prod kontrolü
    const envProdPath = join(targetPath, ".env.prod");
    if (existsSync(envProdPath)) {
      const envProd = readFileSync(envProdPath, "utf-8");

      for (const varName of requiredVars) {
        if (!envProd.includes(`${varName}=`)) {
          issues.push({
            environment: "prod",
            issue: `Missing required environment variable: ${varName}`,
            variable: varName,
          });
        }
      }

      // PROD database kontrolü
      if (envProd.includes("DATABASE_URL") && envProd.includes("asanmod_dev_db")) {
        issues.push({
          environment: "prod",
          issue: "PROD .env contains DEV database reference",
        });
      }
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
      error: err.message || "Environment variables check failed",
    };
  }
}
