/**
 * Tool: asanmod_verify_environment_isolation
 * DEV/PROD environment isolation kontrolü
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface EnvironmentIsolationResult {
  success: boolean;
  issues: string[];
  count: number;
  error?: string;
}

export async function verifyEnvironmentIsolation(
  path?: string
): Promise<EnvironmentIsolationResult> {
  const targetPath = path || process.cwd();
  const issues: string[] = [];

  try {
    // 1. .env.dev ve .env.prod dosyalarını kontrol et
    const envDevPath = join(targetPath, ".env.dev");
    const envProdPath = join(targetPath, ".env.prod");

    if (existsSync(envDevPath)) {
      const envDev = readFileSync(envDevPath, "utf-8");
      if (envDev.includes("asanmod_prod_db")) {
        issues.push("DEV .env file contains PROD database reference");
      }
      if (envDev.includes("8204") || envDev.includes("8205")) {
        issues.push("DEV .env file contains PROD ports (8204/8205)");
      }
    }

    if (existsSync(envProdPath)) {
      const envProd = readFileSync(envProdPath, "utf-8");
      if (envProd.includes("asanmod_dev_db")) {
        issues.push("PROD .env file contains DEV database reference");
      }
      if (envProd.includes("8202") || envProd.includes("8203")) {
        issues.push("PROD .env file contains DEV ports (8202/8203)");
      }
    }

    // 2. PM2 ecosystem config dosyasını kontrol et
    // ✅ STANDARD: Use root ecosystem.config.cjs (pm2/ecosystem.config.cjs is deprecated)
    const pm2EcosystemPath = join(targetPath, "ecosystem.config.cjs");
    const pm2EcosystemPathDeprecated = join(
      targetPath,
      "pm2",
      "ecosystem.config.cjs"
    );

    // Check root config first (standard)
    let pm2ConfigPath = pm2EcosystemPath;
    if (
      !existsSync(pm2EcosystemPath) &&
      existsSync(pm2EcosystemPathDeprecated)
    ) {
      // Fallback to deprecated path (for backward compatibility)
      pm2ConfigPath = pm2EcosystemPathDeprecated;
      issues.push(
        "WARNING: Using deprecated pm2/ecosystem.config.cjs. Should use root ecosystem.config.cjs"
      );
    }

    if (existsSync(pm2ConfigPath)) {
      const pm2Config = readFileSync(pm2ConfigPath, "utf-8");

      // DEV process'ler PROD port'larını kullanıyor mu?
      if (
        pm2Config.includes('name: "asanmod-dev-backend"') &&
        pm2Config.includes("8204")
      ) {
        issues.push("DEV PM2 process (asanmod-dev-backend) uses PROD port (8204)");
      }
      if (
        pm2Config.includes('name: "asanmod-dev-frontend"') &&
        pm2Config.includes("8205")
      ) {
        issues.push(
          "DEV PM2 process (asanmod-dev-frontend) uses PROD port (8205)"
        );
      }

      // PROD process'ler DEV port'larını kullanıyor mu?
      if (
        pm2Config.includes('name: "asanmod-prod-backend"') &&
        pm2Config.includes("8202")
      ) {
        issues.push(
          "PROD PM2 process (asanmod-prod-backend) uses DEV port (8202)"
        );
      }
      if (
        pm2Config.includes('name: "asanmod-prod-frontend"') &&
        pm2Config.includes("8203")
      ) {
        issues.push(
          "PROD PM2 process (asanmod-prod-frontend) uses DEV port (8203)"
        );
      }

      // DEV process'ler PROD database'ini kullanıyor mu?
      if (
        pm2Config.includes('name: "asanmod-dev-backend"') &&
        pm2Config.includes("asanmod_prod_db")
      ) {
        issues.push("DEV PM2 process uses PROD database");
      }

      // PROD process'ler DEV database'ini kullanıyor mu?
      if (
        pm2Config.includes('name: "asanmod-prod-backend"') &&
        pm2Config.includes("asanmod_dev_db")
      ) {
        issues.push("PROD PM2 process uses DEV database");
      }
    }

    // 3. Backend config dosyalarını kontrol et
    const backendPath = join(targetPath, "backend", "src", "config");
    if (existsSync(backendPath)) {
      const findCommand = `find ${backendPath} -name "*.js" -type f 2>/dev/null || true`;
      const configFiles = execSync(findCommand, { encoding: "utf-8" })
        .split("\n")
        .filter((f) => f.trim().length > 0);

      for (const file of configFiles) {
        const content = readFileSync(file, "utf-8");
        if (
          content.includes("asanmod_prod_db") &&
          content.includes("asanmod_dev_db")
        ) {
          issues.push(
            `Config file ${file.replace(targetPath + "/", "")} mixes DEV and PROD references`
          );
        }
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
      error: err.message || "Environment isolation check failed",
    };
  }
}
