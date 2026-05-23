/**
 * ASANMOD Version Update Tools
 * Provides tools for updating and verifying ASANMOD version consistency
 *
 * @module tools/versionUpdate
 * @version 1.0.0
 * @created 2026-12-15
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { readFileMCP, fileExistsMCP } from "../utils/mcpClient.js";

const execAsync = promisify(exec);

// Files that contain ASANMOD version information
// Updated: 2026-12-24 - Added doc files and updated fields
const VERSION_FILES = [
  { path: ".cursorrules", fields: ["version", "tool_count"] },
  { path: ".cursor/rules/asanmod.mdc", fields: ["version", "date", "tool_count"] },
  {
    path: "docs/workflow/ASANMOD-MASTER.md",
    fields: ["version", "date", "tool_count"],
  },
  {
    path: "docs/workflow/ASANMOD-REFERENCE-INDEX.md",
    fields: ["version", "date"],
  },
  {
    path: "docs/xx/MOD-BASLATMA-PROMPT.txt",
    fields: ["version", "tool_count"],
  },
  { path: "CURSOR.md", fields: ["version", "date"] },
  { path: "README.md", fields: ["version", "date"] },
  { path: "mcp-servers/asanmod-mcp/README.md", fields: ["version", "date"] },
  { path: "mcp-servers/asanmod-brain/README.md", fields: ["version", "date"] },
  {
    path: "mcp-servers/asanmod-brain/scripts/import-asanmod-data.ts",
    fields: ["tool_count", "date"],
  },
  { path: ".git/hooks/pre-commit", fields: ["version"] },
  { path: ".git/hooks/post-commit", fields: ["version"] },
  { path: "docs/ASANMOD-QUICK-START.md", fields: ["version", "date"] },
  { path: "docs/ASANMOD-UNIVERSAL-TEMPLATE.md", fields: ["version", "date"] },
  {
    path: "docs/ASANMOD-UNIVERSAL-REDDIT-GUIDE.md",
    fields: ["version", "date"],
  },
  { path: "docs/QUICKSTART.md", fields: ["version", "date"] },
];

interface FileStatus {
  file: string;
  exists: boolean;
  version?: string;
  toolCount?: number;
  date?: string;
  status: "ok" | "outdated" | "missing" | "error";
  errors?: string[];
}

interface VersionInfo {
  currentVersion: string;
  toolCount: number;
  lastUpdated: string;
  fileStatuses: FileStatus[];
  inconsistencies: string[];
}

interface UpdateResult {
  success: boolean;
  filesUpdated: number;
  filesSkipped: number;
  errors: string[];
  report: VersionInfo;
}

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || "/home/root/projects/asanmodcursor";

/**
 * Extract version information from a file
 */
function extractVersionInfo(
  filePath: string,
  content: string
): { version?: string; toolCount?: number; date?: string } {
  const result: { version?: string; toolCount?: number; date?: string } = {};

  // Extract ASANMOD version (e.g., "ASANMOD v1.0.0-BRAIN" or "Version: 2.3-BRAIN")
  const versionPatterns = [
    /ASANMOD v([0-9]+\.[0-9]+-?[A-Z]*)/i,
    /Version:\s*([0-9]+\.[0-9]+-?[A-Z]*)/i,
    /\*\*Version:\*\*\s*([0-9]+\.[0-9]+-?[A-Z]*)/i,
  ];

  for (const pattern of versionPatterns) {
    const match = content.match(pattern);
    if (match) {
      result.version = match[1];
      break;
    }
  }

  // Extract tool count
  const toolCountPatterns = [
    /(\d+)\s*[Tt]ools?/,
    /\| 7 \| asanmod \| \*\*YES\*\* \| (\d+) \|/,
    /tool_count:\s*(\d+)/,
    /"tool_count":\s*(\d+)/,
    /\((\d+) Total\)/,
    /✅ (\d+) Tool implement/,
  ];

  for (const pattern of toolCountPatterns) {
    const match = content.match(pattern);
    if (match) {
      result.toolCount = parseInt(match[1], 10);
      break;
    }
  }

  // Extract date
  const datePatterns = [
    /Last Updated:\s*(\d{4}-\d{2}-\d{2})/i,
    /\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/i,
    /Updated:\s*(\d{4}-\d{2}-\d{2})/i,
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      result.date = match[1];
      break;
    }
  }

  return result;
}

/**
 * Verify ASANMOD version consistency across all files
 */
export async function verifyVersionConsistency(params: {
  expectedVersion?: string;
  expectedToolCount?: number;
}): Promise<VersionInfo> {
  const { expectedVersion, expectedToolCount } = params;
  const fileStatuses: FileStatus[] = [];
  const inconsistencies: string[] = [];
  let detectedVersion = "";
  let detectedToolCount = 0;
  let detectedDate = "";

  // Read all files in parallel for better performance
  const fileChecks = await Promise.allSettled(
    VERSION_FILES.map(async (fileInfo) => {
      const fullPath = path.join(PROJECT_ROOT, fileInfo.path);
      const status: FileStatus = {
        file: fileInfo.path,
        exists: false,
        status: "missing",
      };

      try {
        if (await fileExistsMCP(fullPath)) {
          status.exists = true;
          const content = await readFileMCP(fullPath);
          const extracted = extractVersionInfo(fileInfo.path, content);

          status.version = extracted.version;
          status.toolCount = extracted.toolCount;
          status.date = extracted.date;

          // Track first detected values as reference
          if (!detectedVersion && extracted.version) {
            detectedVersion = extracted.version;
          }
          if (!detectedToolCount && extracted.toolCount) {
            detectedToolCount = extracted.toolCount;
          }
          if (!detectedDate && extracted.date) {
            detectedDate = extracted.date;
          }

          // Check consistency
          if (
            expectedVersion &&
            extracted.version &&
            extracted.version !== expectedVersion
          ) {
            status.status = "outdated";
            inconsistencies.push(
              `${fileInfo.path}: Expected v${expectedVersion}, found v${extracted.version}`
            );
          } else if (
            expectedToolCount &&
            extracted.toolCount &&
            extracted.toolCount !== expectedToolCount
          ) {
            status.status = "outdated";
            inconsistencies.push(
              `${fileInfo.path}: Expected ${expectedToolCount} tools, found ${extracted.toolCount}`
            );
          } else {
            status.status = "ok";
          }
        }

        return status;
      } catch (error: any) {
        return {
          file: fileInfo.path,
          exists: false,
          status: "error",
          errors: [error.message],
        } as FileStatus;
      }
    })
  );

  // Extract results from Promise.allSettled and track detected values
  for (const result of fileChecks) {
    if (result.status === "fulfilled") {
      const status = result.value;

      // Track detected values from all files
      if (status.exists && status.version && !detectedVersion) {
        detectedVersion = status.version;
      }
      if (status.exists && status.toolCount && !detectedToolCount) {
        detectedToolCount = status.toolCount;
      }
      if (status.exists && status.date && !detectedDate) {
        detectedDate = status.date;
      }

      fileStatuses.push(status);
    }
  }

  // Cross-check consistency if no expected values provided
  if (!expectedVersion) {
    for (const status of fileStatuses) {
      if (
        status.exists &&
        status.version &&
        status.version !== detectedVersion
      ) {
        if (status.status !== "error") {
          status.status = "outdated";
          inconsistencies.push(
            `${status.file}: Found v${status.version}, expected v${detectedVersion}`
          );
        }
      }
      if (
        status.exists &&
        status.toolCount &&
        status.toolCount !== detectedToolCount
      ) {
        if (status.status !== "error") {
          status.status = "outdated";
          if (!inconsistencies.some((i) => i.includes(status.file))) {
            inconsistencies.push(
              `${status.file}: Found ${status.toolCount} tools, expected ${detectedToolCount}`
            );
          }
        }
      }
    }
  }

  return {
    currentVersion: expectedVersion || detectedVersion || "unknown",
    toolCount: expectedToolCount || detectedToolCount || 0,
    lastUpdated: detectedDate || new Date().toISOString().split("T")[0],
    fileStatuses,
    inconsistencies,
  };
}

/**
 * Update ASANMOD version across all files
 */
export async function updateVersion(params: {
  newVersion: string;
  toolCount: number;
  changelogEntry?: string;
  dryRun?: boolean;
}): Promise<UpdateResult> {
  const { newVersion, toolCount, changelogEntry, dryRun = true } = params;
  const currentDate = new Date().toISOString().split("T")[0];
  const errors: string[] = [];
  let filesUpdated = 0;
  let filesSkipped = 0;

  // If not dry run, execute the update script
  if (!dryRun) {
    try {
      const scriptPath = path.join(PROJECT_ROOT, "scripts/asanmod-update.sh");

      if (await fileExistsMCP(scriptPath)) {
        const changelog =
          changelogEntry ||
          `Version update to ${newVersion} with ${toolCount} tools`;
        const { stdout, stderr } = await execAsync(
          `bash "${scriptPath}" "${newVersion}" ${toolCount} "${changelog}"`,
          { cwd: PROJECT_ROOT }
        );

        // Parse output to get counts
        const updatedMatch = stdout.match(/Files Updated:\s*(\d+)/);
        const skippedMatch = stdout.match(/Files Skipped:\s*(\d+)/);

        if (updatedMatch) filesUpdated = parseInt(updatedMatch[1], 10);
        if (skippedMatch) filesSkipped = parseInt(skippedMatch[1], 10);

        if (stderr && stderr.includes("error")) {
          errors.push(stderr);
        }
      } else {
        errors.push("Update script not found: scripts/asanmod-update.sh");
      }
    } catch (error: any) {
      errors.push(`Script execution failed: ${error.message}`);
    }
  }

  // Get current status after update (or preview)
  const report = await verifyVersionConsistency({
    expectedVersion: dryRun ? undefined : newVersion,
    expectedToolCount: dryRun ? undefined : toolCount,
  });

  if (dryRun) {
    // Count what would be updated
    for (const status of report.fileStatuses) {
      if (status.exists && status.status === "ok") {
        filesUpdated++;
      } else if (!status.exists) {
        filesSkipped++;
      }
    }
  }

  // Notify Brain API if update was performed
  if (!dryRun && errors.length === 0) {
    try {
      await fetch("http://localhost:8250/brain/asanmod-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          version: newVersion,
          toolCount: toolCount,
          changelog: changelogEntry || "",
        }),
      });
    } catch {
      // Ignore if Brain API is not available
    }
  }

  return {
    success: errors.length === 0,
    filesUpdated,
    filesSkipped,
    errors,
    report: {
      ...report,
      currentVersion: newVersion,
      toolCount,
      lastUpdated: currentDate,
    },
  };
}

/**
 * Tool definition for listing tools
 */
export const versionUpdateToolDefinitions = [
  {
    name: "asanmod_update_version",
    description:
      "Updates ASANMOD version across all configuration files. Use dry_run=true (default) to preview changes before applying.",
    inputSchema: {
      type: "object",
      properties: {
        new_version: {
          type: "string",
          description: "New ASANMOD version (e.g., '2.4-BRAIN')",
        },
        tool_count: {
          type: "number",
          description: "Number of ASANMOD MCP tools (e.g., 99)",
        },
        changelog_entry: {
          type: "string",
          description: "Optional changelog description for this update",
        },
        dry_run: {
          type: "boolean",
          description:
            "If true (default), preview changes without applying. Set to false to apply updates.",
          default: true,
        },
      },
      required: ["new_version", "tool_count"],
    },
  },
  {
    name: "asanmod_verify_version_consistency",
    description:
      "Verifies ASANMOD version consistency across all configuration files. Detects outdated or inconsistent version references.",
    inputSchema: {
      type: "object",
      properties: {
        expected_version: {
          type: "string",
          description:
            "Optional: Expected version to check against (e.g., '2.3-BRAIN')",
        },
        expected_tool_count: {
          type: "number",
          description: "Optional: Expected tool count to check against",
        },
      },
    },
  },
];
