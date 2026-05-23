/**
 * Tool: asanmod_verify_deployment_tracking
 * Deployment Tracking verification (Rule 10)
 */

import { execSync } from "child_process";
// import { log } from "@modelcontextprotocol/sdk/ext"; // Not available in current SDK version
// Using console methods instead
const log = {
  error: console.error,
  info: console.log,
  warn: console.warn,
  debug: console.debug,
};

export interface DeploymentTrackingResult {
  success: boolean;
  lastProdTag?: string;
  newCommitsCount: number;
  newCommits?: string[];
  nextVersion?: string;
  isFirstDeployment: boolean;
  tagRequired: boolean; // Tag zorunluluğu kontrolü (Rule 10)
  tagMissing: boolean; // Tag eksik mi?
  errors: string[];
}

/**
 * Get last PROD deployment tag
 */
function getLastProdTag(): string | null {
  try {
    const tag = execSync(
      'git describe --tags --abbrev=0 --match "v*" 2>/dev/null || echo ""',
      { encoding: "utf-8" }
    ).trim();

    return tag || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get new commits since last tag
 */
function getNewCommits(lastTag: string | null): string[] {
  try {
    let command: string;
    if (!lastTag) {
      // First deployment - return all commits
      command = "git log --oneline";
    } else {
      // Incremental deployment
      command = `git log "${lastTag}..HEAD" --oneline`;
    }

    const commits = execSync(command, { encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter((line) => line.trim().length > 0);

    return commits;
  } catch (error: any) {
    log.error(`Error getting new commits: ${error.message}`);
    return [];
  }
}

/**
 * Calculate next semantic version
 */
function calculateNextVersion(
  lastTag: string | null,
  newCommits: string[]
): string {
  if (!lastTag) {
    return "v1.0.0";
  }

  // Extract version numbers (remove 'v' prefix)
  const version = lastTag.replace(/^v/, "");
  const parts = version.split(".");
  let major = parseInt(parts[0] || "1", 10);
  let minor = parseInt(parts[1] || "0", 10);
  let patch = parseInt(parts[2] || "0", 10);

  // Check commit messages for version increment
  let hasBreaking = false;
  let hasFeat = false;
  let hasFix = false;

  for (const commit of newCommits) {
    const msg = commit.split(" ").slice(1).join(" ").toLowerCase();
    if (msg.includes("breaking") || msg.includes("major")) {
      hasBreaking = true;
    }
    if (msg.match(/^(feat|feature)/)) {
      hasFeat = true;
    }
    if (msg.match(/^(fix|bugfix)/)) {
      hasFix = true;
    }
  }

  // Calculate new version
  if (hasBreaking) {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (hasFeat) {
    minor += 1;
    patch = 0;
  } else if (hasFix) {
    patch += 1;
  } else {
    // Default: patch increment if no specific type found
    patch += 1;
  }

  return `v${major}.${minor}.${patch}`;
}

/**
 * Verify deployment tracking status
 */
export async function verifyDeploymentTracking(): Promise<DeploymentTrackingResult> {
  const errors: string[] = [];
  let lastProdTag: string | null = null;
  let newCommits: string[] = [];
  let nextVersion: string | undefined;
  let isFirstDeployment = false;
  let tagRequired = false;
  let tagMissing = false;

  try {
    // Get last PROD tag
    lastProdTag = getLastProdTag();
    isFirstDeployment = !lastProdTag;

    if (isFirstDeployment) {
      log.info("First PROD deployment detected");
      newCommits = getNewCommits(null);
      nextVersion = "v1.0.0";
      // İlk deployment için tag zorunluluğu yok (henüz tag yok)
      tagRequired = false;
      tagMissing = false;
    } else {
      log.info(`Last PROD deployment tag: ${lastProdTag}`);
      newCommits = getNewCommits(lastProdTag);
      nextVersion = calculateNextVersion(lastProdTag, newCommits);

      // Tag zorunluluğu kontrolü (Rule 10)
      // Eğer tag'siz commit varsa tag zorunlu
      if (newCommits.length > 0) {
        tagRequired = true;
        tagMissing = true;
        errors.push(
          `Tag zorunluluğu ihlali: ${newCommits.length} tag'siz commit var. ` +
            `Önce tag verin: git tag -a ${nextVersion} -m 'PROD deployment'`
        );
      } else {
        tagRequired = false;
        tagMissing = false;
      }

      // Tag push verification - Check if tag is pushed to remote
      try {
        const remoteTags = execSync(
          `git ls-remote --tags origin 2>/dev/null | grep "${lastProdTag}$" || echo ""`,
          { encoding: "utf-8" }
        ).trim();

        if (!remoteTags) {
          errors.push(
            `Tag ${lastProdTag} is not pushed to remote. Run: git push origin ${lastProdTag}`
          );
        }
      } catch (e) {
        // Ignore - remote may not be accessible
      }
    }

    return {
      success: tagRequired ? false : true, // Tag eksikse success false
      lastProdTag: lastProdTag || undefined,
      newCommitsCount: newCommits.length,
      newCommits: newCommits.slice(0, 20), // Return first 20 commits
      nextVersion,
      isFirstDeployment,
      tagRequired,
      tagMissing,
      errors,
    };
  } catch (error: any) {
    errors.push(error.message);
    log.error(`Error verifying deployment tracking: ${error.message}`);
    return {
      success: false,
      lastProdTag: lastProdTag || undefined,
      newCommitsCount: 0,
      isFirstDeployment,
      nextVersion,
      tagRequired: false,
      tagMissing: false,
      errors,
    };
  }
}
