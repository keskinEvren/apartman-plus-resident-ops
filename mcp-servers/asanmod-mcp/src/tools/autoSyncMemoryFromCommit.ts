/**
 * ASANMOD MCP Tool: autoSyncMemoryFromCommit
 * Git commit'lerinden otomatik olarak Memory MCP'ye bilgi kaydeder
 *
 * Post-commit hook'tan otomatik çağrılır
 * Her commit'te backend, frontend, ASANMOD değişiklikleri Memory MCP'ye işlenir
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface AutoSyncMemoryResult {
  success: boolean;
  commitHash: string;
  commitMessage: string;
  module?: string;
  changeType?: string;
  entitiesUpdated: string[];
  patternsLearned: number;
  observationsAdded: number;
  memoryObservationsFormat: Array<{
    entityName: string;
    contents: string[];
  }>;
  timestamp: string;
  errors: string[];
}

/**
 * Project root detection
 */
function getProjectRoot(): string {
  let projectRoot = process.env.WORKSPACE_ROOT || "";

  if (!projectRoot) {
    let currentDir = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (
        existsSync(join(currentDir, "docs", "workflow", "ASANMOD-MASTER.md"))
      ) {
        projectRoot = currentDir;
        break;
      }
      currentDir = join(currentDir, "..");
    }
  }

  return projectRoot || process.cwd();
}

/**
 * Parse commit message to extract module, type, and details
 */
function parseCommitMessage(commitMessage: string): {
  module?: string;
  type?: string;
  description: string;
  details?: string[];
  pattern?: string;
  breaking?: boolean;
} {
  // Extract module and type: feat(backend): description
  const moduleMatch = commitMessage.match(/^(\w+)\(([^)]+)\):\s*(.+)/);
  if (moduleMatch) {
    const type = moduleMatch[1];
    const module = moduleMatch[2];
    const description = moduleMatch[3].split("\n")[0].trim();

    // Extract details (lines after first line)
    const lines = commitMessage.split("\n").filter((l) => l.trim());
    const details = lines
      .slice(1)
      .filter((l) => !l.match(/^\[MOD\]|^\[W[1-6]\]/));

    // Extract pattern: Pattern: PATTERN_ASANMOD_*
    const patternMatch = commitMessage.match(/Pattern:\s*(PATTERN_ASANMOD_\w+)/i);
    const pattern = patternMatch ? patternMatch[1] : undefined;

    // Extract breaking change
    const breaking = commitMessage.toLowerCase().includes("breaking:");

    return {
      module,
      type,
      description,
      details: details.length > 0 ? details : undefined,
      pattern,
      breaking,
    };
  }

  // Fallback: no module/type prefix
  return {
    description: commitMessage.split("\n")[0].trim(),
  };
}

/**
 * Get changed files from commit
 */
function getChangedFiles(commitHash: string): string[] {
  try {
    const files = execSync(
      `git diff-tree --no-commit-id --name-only -r ${commitHash}`,
      {
        encoding: "utf-8",
        cwd: getProjectRoot(),
      }
    )
      .trim()
      .split("\n")
      .filter((f) => f.trim());

    return files;
  } catch (error) {
    return [];
  }
}

/**
 * Categorize changed files
 */
function categorizeFiles(files: string[]): {
  backend: string[];
  frontend: string[];
  asanmod: string[];
  docs: string[];
  other: string[];
} {
  const categorized = {
    backend: [] as string[],
    frontend: [] as string[],
    asanmod: [] as string[],
    docs: [] as string[],
    other: [] as string[],
  };

  files.forEach((file) => {
    if (file.startsWith("backend/")) {
      categorized.backend.push(file);
    } else if (file.startsWith("frontend/")) {
      categorized.frontend.push(file);
    } else if (file.includes("asanmod") || file.includes("ASANMOD")) {
      categorized.asanmod.push(file);
    } else if (file.startsWith("docs/")) {
      categorized.docs.push(file);
    } else {
      categorized.other.push(file);
    }
  });

  return categorized;
}

/**
 * Auto sync memory from commit
 */
export async function autoSyncMemoryFromCommit(params: {
  commitHash?: string; // Opsiyonel, default: HEAD
  path?: string;
}): Promise<AutoSyncMemoryResult> {
  const { commitHash: providedHash, path } = params;
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: AutoSyncMemoryResult = {
    success: true,
    commitHash: "",
    commitMessage: "",
    entitiesUpdated: [],
    patternsLearned: 0,
    observationsAdded: 0,
    memoryObservationsFormat: [],
    timestamp: new Date().toISOString(),
    errors: [],
  };

  try {
    // Get commit hash (default: HEAD)
    const commitHash =
      providedHash ||
      execSync("git rev-parse HEAD", {
        encoding: "utf-8",
        cwd: projectRoot,
      }).trim();

    // Get commit message
    const commitMessage = execSync(`git log -1 --format="%B" ${commitHash}`, {
      encoding: "utf-8",
      cwd: projectRoot,
    }).trim();

    // Get commit timestamp
    const commitTimestamp = execSync(
      `git log -1 --format="%ci" ${commitHash}`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
      }
    ).trim();

    // Get changed files
    const changedFiles = getChangedFiles(commitHash);
    const categorized = categorizeFiles(changedFiles);

    // Parse commit message
    const parsed = parseCommitMessage(commitMessage);

    result.commitHash = commitHash;
    result.commitMessage = commitMessage;
    result.module = parsed.module;
    result.changeType = parsed.type;

    // Generate Memory MCP observations
    const observations: Array<{ entityName: string; contents: string[] }> = [];

    // 1. ASANMOD_PROJECT Entity Update
    const asanmodProjectContents: string[] = [
      `[COMMIT ${commitHash}] ${parsed.description} - ${commitTimestamp}`,
    ];

    if (parsed.module) {
      asanmodProjectContents.push(`Module: ${parsed.module}`);
    }

    if (parsed.type) {
      asanmodProjectContents.push(`Type: ${parsed.type}`);
    }

    if (changedFiles.length > 0) {
      asanmodProjectContents.push(`Changed files: ${changedFiles.length} file(s)`);
      if (categorized.backend.length > 0) {
        asanmodProjectContents.push(
          `  - Backend: ${categorized.backend.length} file(s)`
        );
      }
      if (categorized.frontend.length > 0) {
        asanmodProjectContents.push(
          `  - Frontend: ${categorized.frontend.length} file(s)`
        );
      }
      if (categorized.asanmod.length > 0) {
        asanmodProjectContents.push(
          `  - ASANMOD: ${categorized.asanmod.length} file(s)`
        );
      }
    }

    if (parsed.details && parsed.details.length > 0) {
      asanmodProjectContents.push(`Details: ${parsed.details.join("; ")}`);
    }

    if (parsed.breaking) {
      asanmodProjectContents.push(`⚠️ BREAKING CHANGE`);
    }

    observations.push({
      entityName: "ASANMOD_PROJECT",
      contents: asanmodProjectContents,
    });

    // 2. ASANMOD_SYSTEM Entity Update (if ASANMOD change)
    if (categorized.asanmod.length > 0 || parsed.module === "asanmod") {
      const asanmodContents: string[] = [
        `[COMMIT ${commitHash}] ASANMOD update: ${parsed.description} - ${commitTimestamp}`,
      ];

      if (categorized.asanmod.length > 0) {
        asanmodContents.push(
          `Changed files: ${categorized.asanmod.join(", ")}`
        );
      }

      if (parsed.details && parsed.details.length > 0) {
        asanmodContents.push(`Details: ${parsed.details.join("; ")}`);
      }

      observations.push({
        entityName: "ASANMOD_SYSTEM",
        contents: asanmodContents,
      });
    }

    // 3. Pattern Learning (if pattern detected)
    if (parsed.pattern) {
      const patternContents: string[] = [
        `Pattern learned from commit: ${commitHash}`,
        `Pattern description: ${parsed.description}`,
        `Pattern source: ${parsed.module || "unknown"} module`,
        `Pattern usage: See commit ${commitHash} for implementation details`,
        `Learned: ${commitTimestamp}`,
      ];

      if (parsed.details && parsed.details.length > 0) {
        patternContents.push(
          `Implementation details: ${parsed.details.join("; ")}`
        );
      }

      observations.push({
        entityName: parsed.pattern,
        contents: patternContents,
      });

      result.patternsLearned = 1;
    }

    // 4. Module-specific entities (if significant changes)
    if (categorized.backend.length > 5 || categorized.frontend.length > 5) {
      const moduleEntityName =
        categorized.backend.length > categorized.frontend.length
          ? "ASANMOD_BACKEND"
          : "ASANMOD_FRONTEND";

      const moduleContents: string[] = [
        `[COMMIT ${commitHash}] ${parsed.description} - ${commitTimestamp}`,
        `Changed files: ${categorized.backend.length + categorized.frontend.length} file(s)`,
      ];

      if (parsed.details && parsed.details.length > 0) {
        moduleContents.push(`Details: ${parsed.details.join("; ")}`);
      }

      observations.push({
        entityName: moduleEntityName,
        contents: moduleContents,
      });
    }

    result.memoryObservationsFormat = observations;
    result.observationsAdded = observations.reduce(
      (sum, obs) => sum + obs.contents.length,
      0
    );
    result.entitiesUpdated = observations.map((obs) => obs.entityName);

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Auto sync error: ${error.message}`);
    return result;
  }
}

/**
 * Generate Memory MCP observation format for agent
 */
export function generateAutoSyncMemoryObservations(
  result: AutoSyncMemoryResult
): Array<{ entityName: string; contents: string[] }> {
  return result.memoryObservationsFormat;
}
