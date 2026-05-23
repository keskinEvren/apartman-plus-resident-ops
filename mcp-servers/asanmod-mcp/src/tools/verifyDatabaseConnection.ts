/**
 * Tool: asanmod_verify_database_connection
 * Database connection kontrolü (DEV/PROD)
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface DatabaseConnectionResult {
  success: boolean;
  connections: Array<{
    environment: "dev" | "prod";
    database: string;
    status: "connected" | "failed" | "skipped";
    error?: string;
  }>;
  failed: number;
  error?: string;
}

export async function verifyDatabaseConnection(
  environment?: "dev" | "prod" | "both"
): Promise<DatabaseConnectionResult> {
  const connections: DatabaseConnectionResult["connections"] = [];
  let failed = 0;

  try {
    const targetPath = process.cwd();
    const backendPath = join(targetPath, "backend");

    if (!existsSync(backendPath)) {
      return {
        success: true,
        connections: [],
        failed: 0,
      };
    }

    // .env.dev ve .env.prod dosyalarını kontrol et
    const envDevPath = join(targetPath, ".env.dev");
    const envProdPath = join(targetPath, ".env.prod");

    // DEV database connection
    if (environment === "dev" || environment === "both" || !environment) {
      if (existsSync(envDevPath)) {
        const envDev = readFileSync(envDevPath, "utf-8");
        const dbMatch = envDev.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
        if (dbMatch) {
          const dbUrl = dbMatch[1];
          const isDevDb = dbUrl.includes("asanmod_dev_db");

          try {
            // Basit connection test (psql ile)
            const testQuery = "SELECT 1";
            execSync(`psql "${dbUrl}" -c "${testQuery}"`, {
              encoding: "utf-8",
              stdio: "ignore",
              timeout: 5000,
            });

            connections.push({
              environment: "dev",
              database: "asanmod_dev_db",
              status: "connected",
            });
          } catch (err: any) {
            failed++;
            connections.push({
              environment: "dev",
              database: "asanmod_dev_db",
              status: "failed",
              error: err.message || "Connection failed",
            });
          }
        }
      }
    }

    // PROD database connection (sadece açıkça istenirse)
    if (environment === "prod" || environment === "both") {
      if (existsSync(envProdPath)) {
        const envProd = readFileSync(envProdPath, "utf-8");
        const dbMatch = envProd.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
        if (dbMatch) {
          const dbUrl = dbMatch[1];
          const isProdDb = dbUrl.includes("asanmod_prod_db");

          try {
            // Basit connection test
            const testQuery = "SELECT 1";
            execSync(`psql "${dbUrl}" -c "${testQuery}"`, {
              encoding: "utf-8",
              stdio: "ignore",
              timeout: 5000,
            });

            connections.push({
              environment: "prod",
              database: "asanmod_prod_db",
              status: "connected",
            });
          } catch (err: any) {
            failed++;
            connections.push({
              environment: "prod",
              database: "asanmod_prod_db",
              status: "failed",
              error: err.message || "Connection failed",
            });
          }
        }
      }
    }

    return {
      success: failed === 0,
      connections,
      failed,
    };
  } catch (err: any) {
    return {
      success: false,
      connections: [],
      failed: 0,
      error: err.message || "Database connection check failed",
    };
  }
}
