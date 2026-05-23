/**
 * ASANMOD Güncelleme Takip Sistemi
 *
 * Purpose: ASANMOD sisteminde değişiklik yapıldığında hangi dosyaların güncellenmesi gerektiğini kontrol eder
 * MCP Tool: asanmod_check_update_status
 */

import * as path from "path";
import {
  readFileMCP,
  fileExistsMCP,
  gitStatusMCP,
} from "../utils/mcpClient.js";

const PROJECT_ROOT = process.cwd();

// Güncellenmesi gereken dosya listesi
const REQUIRED_FILES = [
  {
    path: "docs/workflow/ASANMOD-MASTER.md",
    checks: ["Last Updated", "Version", "65 tools", "TODO Enforcement"],
    description: "Master Documentation",
  },
  {
    path: ".cursorrules",
    checks: ["Last Updated", "65 tools", "TODO Enforcement"],
    description: "Cursor Rules",
  },
  {
    path: ".cursor/rules/asanmod.mdc",
    checks: ["Last Updated", "65 tools", "TODO Enforcement"],
    description: "Cursor Rules (MDC)",
  },
  {
    path: "README.md",
    checks: ["Last Updated", "12 MCPs", "TODO Enforcement"],
    description: "Project README",
  },
  {
    path: "CURSOR.md",
    checks: ["Last Updated", "65 tools"],
    description: "Cursor Guide",
  },
  {
    path: "docs/xx/MOD-BASLATMA-PROMPT.txt",
    checks: ["Last Updated", "65 tools", "TODO Enforcement"],
    description: "MOD Startup Prompt",
  },
  {
    path: "docs/xx/WORKER-BASLATMA-PROMPT.txt",
    checks: ["Last Updated", "65 tools", "TODO Enforcement"],
    description: "WORKER Startup Prompt",
  },
  {
    path: "/root/.cursor/mcp.json",
    checks: ["65 tools", "TODO Enforcement"],
    description: "MCP Configuration",
  },
  {
    path: "docs/workflow/ASANMOD-REFERENCE-INDEX.md",
    checks: ["Last Updated", "65 tools"],
    description: "Reference Index",
  },
  {
    path: "mcp-servers/asanmod-mcp/README.md",
    checks: ["65 tools", "TODO Enforcement"],
    description: "MCP Server README",
  },
];

interface FileCheckResult {
  path: string;
  description: string;
  exists: boolean;
  checks: Array<{
    check: string;
    status: "found" | "missing" | "outdated" | "error";
    message: string;
  }>;
  needsUpdate: boolean;
}

interface UpdateStatusResult {
  success: boolean;
  totalFiles: number;
  updatedFiles: number;
  needsUpdate: number;
  missingFiles: number;
  gitSyncNeeded: boolean;
  files: FileCheckResult[];
  gitStatus: {
    hasChanges: boolean;
    files: string[];
  };
  message: string;
}

// Dosya içeriğini kontrol et (Filesystem MCP - Phase 2.3)
async function checkFile(
  fileConfig: (typeof REQUIRED_FILES)[0]
): Promise<FileCheckResult> {
  const filePath = fileConfig.path.startsWith("/")
    ? fileConfig.path
    : path.join(PROJECT_ROOT, fileConfig.path);

  const results: FileCheckResult = {
    path: fileConfig.path,
    description: fileConfig.description,
    exists: false,
    checks: [],
    needsUpdate: false,
  };

  try {
    if (!(await fileExistsMCP(filePath))) {
      results.needsUpdate = true;
      results.checks.push({
        check: "File exists",
        status: "missing",
        message: "File not found",
      });
      return results;
    }

    results.exists = true;
    const content = await readFileMCP(filePath);

    // Her check'i kontrol et
    fileConfig.checks.forEach((check) => {
      const found =
        content.includes(check) || new RegExp(check, "i").test(content);
      results.checks.push({
        check: check,
        status: found ? "found" : "missing",
        message: found ? "Found" : `Missing: ${check}`,
      });

      if (!found) {
        results.needsUpdate = true;
      }
    });

    // Last Updated kontrolü (2026-12-11 olmalı)
    if (fileConfig.checks.includes("Last Updated")) {
      const lastUpdatedMatch = content.match(
        /Last Updated.*?(\d{4}-\d{2}-\d{2})/i
      );
      if (lastUpdatedMatch) {
        const lastUpdated = lastUpdatedMatch[1];
        if (lastUpdated !== "2026-12-11") {
          results.needsUpdate = true;
          results.checks.push({
            check: "Last Updated Date",
            status: "outdated",
            message: `Last Updated: ${lastUpdated} (should be 2026-12-11)`,
          });
        }
      }
    }
  } catch (error: any) {
    results.needsUpdate = true;
    results.checks.push({
      check: "File read",
      status: "error",
      message: error.message,
    });
  }

  return results;
}

// Git status kontrolü (Git MCP - Phase 3.5)
async function checkGitStatus() {
  try {
    const gitStatus = await gitStatusMCP(PROJECT_ROOT);
    const asanmodFiles = gitStatus.files
      .filter((file) => {
        const fileName = file.path.split("/").pop() || "";
        return REQUIRED_FILES.some((f) =>
          fileName.includes(f.path.split("/").pop() || "")
        );
      })
      .map((file) => `${file.status === "staged" ? "A" : "M"} ${file.path}`);

    return {
      hasChanges: asanmodFiles.length > 0,
      files: asanmodFiles,
    };
  } catch (error: any) {
    return { hasChanges: false, files: [], error: error.message };
  }
}

// Ana kontrol fonksiyonu (Filesystem MCP - Phase 2.3)
export async function checkUpdateStatus(): Promise<UpdateStatusResult> {
  // Check all files in parallel for better performance
  const results = await Promise.all(REQUIRED_FILES.map(checkFile));
  const needsUpdate = results.filter((r) => r.needsUpdate);
  const gitStatus = await checkGitStatus();

  const totalFiles = results.length;
  const updatedFiles = totalFiles - needsUpdate.length;
  const missingFiles = results.filter((r) => !r.exists).length;

  let message = "";
  if (needsUpdate.length === 0 && !gitStatus.hasChanges) {
    message = "✅ Tüm dosyalar güncel ve git senkronize";
  } else {
    if (needsUpdate.length > 0) {
      message += `❌ ${needsUpdate.length} dosya güncellenmesi gerekiyor. `;
    }
    if (gitStatus.hasChanges) {
      message += `⚠️ Git senkronizasyonu gerekli.`;
    }
  }

  return {
    success: needsUpdate.length === 0 && !gitStatus.hasChanges,
    totalFiles,
    updatedFiles,
    needsUpdate: needsUpdate.length,
    missingFiles,
    gitSyncNeeded: gitStatus.hasChanges,
    files: results,
    gitStatus,
    message,
  };
}
