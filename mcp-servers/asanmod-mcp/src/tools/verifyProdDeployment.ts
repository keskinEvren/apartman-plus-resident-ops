/**
 * Tool: asanmod_verify_prod_deployment
 * PROD deployment verification (comprehensive)
 */

import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";

export interface ProdDeploymentResult {
  success: boolean;
  buildCache: {
    cleaned: boolean;
    directories: string[];
    totalSize?: string;
  };
  environmentVariables: {
    asanmodEnvSet: boolean;
    nodeEnvSet: boolean;
  };
  buildOutput: {
    exists: boolean;
    buildId?: string;
    standaloneExists: boolean;
    staticFilesExist: boolean;
    size?: string;
  };
  dependencies: {
    packageLockExists: boolean;
    synced: boolean;
  };
  errors: string[];
}

export async function verifyProdDeployment(): Promise<ProdDeploymentResult> {
  const result: ProdDeploymentResult = {
    success: true,
    buildCache: {
      cleaned: false,
      directories: [],
    },
    environmentVariables: {
      asanmodEnvSet: false,
      nodeEnvSet: false,
    },
    buildOutput: {
      exists: false,
      standaloneExists: false,
      staticFilesExist: false,
    },
    dependencies: {
      packageLockExists: false,
      synced: false,
    },
    errors: [],
  };

  const projectRoot = process.cwd();
  const frontendPath = join(projectRoot, "frontend");

  // Build cache kontrolü
  const cacheDirs = [
    ".next-prod",
    ".next-dev",
    ".next",
    "node_modules/.cache",
    ".turbo",
  ];

  let totalCacheSize = 0;
  for (const dir of cacheDirs) {
    const fullPath = join(frontendPath, dir);
    if (existsSync(fullPath)) {
      result.buildCache.directories.push(dir);
      try {
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          totalCacheSize += stats.size || 0;
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  if (result.buildCache.directories.length === 0) {
    result.buildCache.cleaned = true;
  }

  // Environment variables kontrolü
  result.environmentVariables.asanmodEnvSet = process.env.ASANMOD_ENV === "prod";
  result.environmentVariables.nodeEnvSet =
    process.env.NODE_ENV === "production";

  // Build output kontrolü
  const nextProdPath = join(frontendPath, ".next-prod");
  if (existsSync(nextProdPath)) {
    result.buildOutput.exists = true;

    const buildIdPath = join(nextProdPath, "BUILD_ID");
    if (existsSync(buildIdPath)) {
      try {
        result.buildOutput.buildId = execSync(`cat "${buildIdPath}"`, {
          encoding: "utf-8",
        }).trim();
      } catch (e) {
        result.errors.push(`Cannot read BUILD_ID: ${e}`);
      }
    }

    const standalonePath = join(nextProdPath, "standalone");
    result.buildOutput.standaloneExists = existsSync(standalonePath);

    const staticPath = join(nextProdPath, "static");
    result.buildOutput.staticFilesExist = existsSync(staticPath);

    try {
      const size = execSync(
        `du -sh "${nextProdPath}" 2>/dev/null | awk '{print $1}'`,
        {
          encoding: "utf-8",
        }
      ).trim();
      result.buildOutput.size = size;
    } catch (e) {
      // Ignore
    }
  }

  // Dependencies kontrolü
  const packageLockPath = join(frontendPath, "package-lock.json");
  result.dependencies.packageLockExists = existsSync(packageLockPath);

  try {
    const gitStatus = execSync(
      `git status --short "${packageLockPath}" 2>/dev/null || echo ""`,
      { encoding: "utf-8" }
    ).trim();
    result.dependencies.synced = gitStatus === "";
  } catch (e) {
    // Ignore
  }

  // Success kontrolü
  if (
    !result.buildOutput.exists ||
    !result.environmentVariables.asanmodEnvSet ||
    result.errors.length > 0
  ) {
    result.success = false;
  }

  return result;
}
