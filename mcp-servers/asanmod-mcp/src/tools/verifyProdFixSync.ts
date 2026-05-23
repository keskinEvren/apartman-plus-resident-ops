/**
 * Tool: asanmod_verify_prod_fix_sync
 * PROD Fix → DEV Sync verification (Rule 9)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export interface ProdFixSyncResult {
  success: boolean;
  lastProdFixCommit?: string;
  devSyncStatus: "synced" | "pending" | "unknown";
  differences: string[];
  errors: string[];
}

/**
 * Get last PROD fix commit
 */
function getLastProdFixCommit(): string | null {
  try {
    const commitHash = execSync(
      'git log --all --grep="\\[PROD-FIX\\]" --pretty=format:"%H" -1',
      { encoding: "utf-8" }
    ).trim();

    return commitHash || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check DEV sync status
 */
function checkDevSyncStatus(
  commitHash: string
): "synced" | "pending" | "unknown" {
  try {
    // Check if commit exists in main/master branch (DEV)
    const branches = execSync(`git branch --contains ${commitHash}`, {
      encoding: "utf-8",
    });

    if (
      branches.includes("main") ||
      branches.includes("master") ||
      branches.includes("dev")
    ) {
      return "synced";
    }

    return "pending";
  } catch (error) {
    return "unknown";
  }
}

/**
 * Compare DEV and PROD schemas
 */
function compareEnvironments(): string[] {
  const differences: string[] = [];

  try {
    const scriptPath = join(process.cwd(), "scripts", "deep-schema-check.sh");

    if (!existsSync(scriptPath)) {
      differences.push("Schema check script not found");
      return differences;
    }

    // Run schema check script
    const output = execSync(`bash ${scriptPath}`, { encoding: "utf-8" });

    // Extract differences
    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes("❌ MISSING") || line.includes("MISSING")) {
        differences.push(line.trim());
      }
    }
  } catch (error) {
    differences.push(`Schema comparison failed: ${error}`);
  }

  return differences;
}

/**
 * Verify PROD Fix → DEV Sync status
 */
export async function verifyProdFixSync(): Promise<ProdFixSyncResult> {
  const errors: string[] = [];
  const differences: string[] = [];

  try {
    // Get last PROD fix commit
    const lastProdFixCommit = getLastProdFixCommit();

    if (!lastProdFixCommit) {
      return {
        success: true,
        devSyncStatus: "unknown",
        differences: [],
        errors: [],
      };
    }

    // Check DEV sync status
    const devSyncStatus = checkDevSyncStatus(lastProdFixCommit);

    // Compare environments
    const schemaDifferences = compareEnvironments();
    differences.push(...schemaDifferences);

    // Determine success
    const success = devSyncStatus === "synced" && differences.length === 0;

    return {
      success,
      lastProdFixCommit,
      devSyncStatus,
      differences,
      errors,
    };
  } catch (error) {
    errors.push(`Verification failed: ${error}`);
    return {
      success: false,
      devSyncStatus: "unknown",
      differences,
      errors,
    };
  }
}
