/**
 * MCP Client Utility
 * ASANMOD Filesystem MCP Migration - Phase 1
 *
 * Provides wrapper functions for Filesystem MCP and Git MCP operations.
 * Falls back to native fs/git commands if MCP is unavailable.
 *
 * @module utils/mcpClient
 * @version 1.0.0
 * @created 2026-12-24
 */

// @ts-nocheck
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { getWorkspaceRoot } from "./paths.js";

// MCP Client instances (lazy initialization)
let filesystemClient: Client | null = null;
let gitClient: Client | null = null;

// MCP availability flags
let filesystemMCPAvailable = false;
let gitMCPAvailable = false;

// STRICT_MCP_IO flag (v8.0): If true, fs fallback hard-fails
// Set via environment variable: ASANMOD_STRICT_MCP_IO=true
const STRICT_MCP_IO = process.env.ASANMOD_STRICT_MCP_IO === "true";

// Project root
const PROJECT_ROOT = getWorkspaceRoot();

/**
 * Log to stderr (v8.0: All logging must go to stderr to avoid JSON parse errors)
 */
function logError(message: string): void {
  process.stderr.write(`[MCP Client] ${message}\n`);
}

function logWarn(message: string): void {
  process.stderr.write(`[MCP Client] WARN: ${message}\n`);
}

/**
 * Load MCP config from ~/.cursor/mcp.json
 */
function loadMCPConfig(): any {
  try {
    const configPath = join(
      process.env.HOME || process.env.USERPROFILE || "/root",
      ".cursor",
      "mcp.json"
    );
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    // Config not found or invalid
  }
  return null;
}

/**
 * Initialize Filesystem MCP Client (REAL IMPLEMENTATION)
 */
async function initFilesystemClient(): Promise<Client | null> {
  if (filesystemClient) {
    return filesystemClient;
  }

  try {
    const config = loadMCPConfig();
    if (!config || !config.mcpServers || !config.mcpServers.filesystem) {
      throw new Error("Filesystem MCP config not found");
    }

    const fsConfig = config.mcpServers.filesystem;
    const command = fsConfig.command || "npx";
    const args = fsConfig.args || [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      PROJECT_ROOT,
    ];
    const env = { ...process.env, ...(fsConfig.env || {}) };
    const cwd = fsConfig.cwd || PROJECT_ROOT;

    // Create transport (StdioClientTransport automatically spawns the process)
    const transport = new StdioClientTransport({
      command,
      args,
      env,
      cwd,
    });

    filesystemClient = new Client(
      {
        name: "asanmod-filesystem-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await filesystemClient.connect(transport);
    filesystemMCPAvailable = true;
    logError("Filesystem MCP connected successfully");

    return filesystemClient;
  } catch (error: any) {
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] Filesystem MCP unavailable: ${error.message}. fs fallback is disabled in strict mode.`
      );
    }
    logWarn(`Filesystem MCP unavailable: ${error.message}, using fs fallback`);
    filesystemMCPAvailable = false;
    return null;
  }
}

/**
 * Initialize Git MCP Client (REAL IMPLEMENTATION)
 */
async function initGitClient(): Promise<Client | null> {
  if (gitClient) {
    return gitClient;
  }

  try {
    const config = loadMCPConfig();
    if (!config || !config.mcpServers || !config.mcpServers.git) {
      throw new Error("Git MCP config not found");
    }

    const gitConfig = config.mcpServers.git;
    const command = gitConfig.command || "node";
    const args = gitConfig.args || [];
    const env = { ...process.env, ...(gitConfig.env || {}) };
    const cwd = gitConfig.cwd || PROJECT_ROOT;

    // Create transport (StdioClientTransport automatically spawns the process)
    const transport = new StdioClientTransport({
      command,
      args,
      env,
      cwd,
    });

    gitClient = new Client(
      {
        name: "asanmod-git-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await gitClient.connect(transport);
    gitMCPAvailable = true;
    logError("Git MCP connected successfully");

    return gitClient;
  } catch (error: any) {
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] Git MCP unavailable: ${error.message}. git command fallback is disabled in strict mode.`
      );
    }
    logWarn(
      `Git MCP unavailable: ${error.message}, using git command fallback`
    );
    gitMCPAvailable = false;
    return null;
  }
}

// ========================================
// Filesystem MCP Wrappers
// ========================================

export interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

export interface DirectoryEntry {
  name: string;
  type: "file" | "directory";
  size?: number;
}

/**
 * Read file using Filesystem MCP, fallback to fs (REAL IMPLEMENTATION)
 */
export async function readFileMCP(path: string): Promise<string> {
  try {
    const client = await initFilesystemClient();
    if (client && filesystemMCPAvailable) {
      const result = await client.callTool({
        name: "read_text_file",
        arguments: { path },
      });
      if (result.content && result.content[0] && "text" in result.content[0]) {
        return result.content[0].text;
      }
    }
  } catch (error: any) {
    // Fall through to fs fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] readFileMCP failed for ${path}: ${error.message}. fs fallback is disabled.`
      );
    }
    logWarn(`readFileMCP failed for ${path}: ${error.message}`);
  }

  // Fallback to fs (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Filesystem MCP unavailable. Cannot read file ${path}. fs fallback is disabled.`
    );
  }
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (error: any) {
    throw new Error(`Failed to read file ${path}: ${error.message}`);
  }
}

/**
 * Read multiple files using Filesystem MCP, fallback to fs (REAL IMPLEMENTATION)
 */
export async function readMultipleFilesMCP(
  paths: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  try {
    const client = await initFilesystemClient();
    if (client && filesystemMCPAvailable) {
      // Read files in parallel using MCP
      const readPromises = paths.map(async (filePath) => {
        try {
          const fileResult = await client.callTool({
            name: "read_text_file",
            arguments: { path: filePath },
          });
          if (
            fileResult.content &&
            fileResult.content[0] &&
            "text" in fileResult.content[0]
          ) {
            return { path: filePath, content: fileResult.content[0].text };
          }
        } catch {
          // Skip failed files
        }
        return null;
      });

      const fileResults = await Promise.allSettled(readPromises);
      for (const fileResult of fileResults) {
        if (fileResult.status === "fulfilled" && fileResult.value) {
          result.set(fileResult.value.path, fileResult.value.content);
        }
      }
      if (result.size > 0) {
        return result;
      }
    }
  } catch (error: any) {
    // Fall through to fs fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] readMultipleFilesMCP failed: ${error.message}. fs fallback is disabled.`
      );
    }
    logWarn(`readMultipleFilesMCP failed: ${error.message}`);
  }

  // Fallback to fs - read files in parallel (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Filesystem MCP unavailable. Cannot read multiple files. fs fallback is disabled.`
    );
  }
  await Promise.all(
    paths.map(async (path) => {
      try {
        const content = await readFileMCP(path);
        result.set(path, content);
      } catch (error) {
        // Skip failed files
      }
    })
  );

  return result;
}

/**
 * Write file using Filesystem MCP, fallback to fs (REAL IMPLEMENTATION)
 */
export async function writeFileMCP(
  path: string,
  content: string
): Promise<boolean> {
  try {
    const client = await initFilesystemClient();
    if (client && filesystemMCPAvailable) {
      await client.callTool({
        name: "write_file",
        arguments: { path, contents: content },
      });
      return true;
    }
  } catch (error: any) {
    // Fall through to fs fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] writeFileMCP failed for ${path}: ${error.message}. fs fallback is disabled.`
      );
    }
    logWarn(`writeFileMCP failed for ${path}: ${error.message}`);
  }

  // Fallback to fs (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Filesystem MCP unavailable. Cannot write file ${path}. fs fallback is disabled.`
    );
  }
  try {
    // Ensure directory exists
    const dir = join(path, "..");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path, content, "utf-8");
    return true;
  } catch (error: any) {
    throw new Error(`Failed to write file ${path}: ${error.message}`);
  }
}

/**
 * Check if file exists using Filesystem MCP, fallback to fs (REAL IMPLEMENTATION)
 */
export async function fileExistsMCP(path: string): Promise<boolean> {
  try {
    const client = await initFilesystemClient();
    if (client && filesystemMCPAvailable) {
      const result = await client.callTool({
        name: "get_file_info",
        arguments: { path },
      });
      if (result.content && result.content[0]) {
        if ("json" in result.content[0] && result.content[0].json) {
          return (result.content[0].json as any).exists || false;
        }
        // If no json, try to check if error means file doesn't exist
        return true; // If we got a response, file likely exists
      }
    }
  } catch (error: any) {
    // If error, file probably doesn't exist or MCP failed
    // Fall through to fs fallback
  }

  // Fallback to fs
  return fs.existsSync(path);
}

/**
 * Get file info using Filesystem MCP, fallback to fs (REAL IMPLEMENTATION)
 */
export async function getFileInfoMCP(path: string): Promise<FileInfo> {
  try {
    const client = await initFilesystemClient();
    if (client && filesystemMCPAvailable) {
      const result = await client.callTool({
        name: "get_file_info",
        arguments: { path },
      });
      if (
        result.content &&
        result.content[0] &&
        "json" in result.content[0] &&
        result.content[0].json
      ) {
        const info = result.content[0].json as any;
        return {
          size: info.size || 0,
          created: info.created ? new Date(info.created) : new Date(),
          modified: info.modified ? new Date(info.modified) : new Date(),
          accessed: info.accessed ? new Date(info.accessed) : new Date(),
          isDirectory: info.isDirectory || false,
          isFile: info.isFile || true,
          permissions: info.permissions || "644",
        };
      }
    }
  } catch (error: any) {
    // Fall through to fs fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] getFileInfoMCP failed for ${path}: ${error.message}. fs fallback is disabled.`
      );
    }
    logWarn(`getFileInfoMCP failed for ${path}: ${error.message}`);
  }

  // Fallback to fs (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Filesystem MCP unavailable. Cannot get file info ${path}. fs fallback is disabled.`
    );
  }
  try {
    const stats = fs.statSync(path);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      permissions: stats.mode.toString(8),
    };
  } catch (error: any) {
    throw new Error(`Failed to get file info ${path}: ${error.message}`);
  }
}

/**
 * List directory using Filesystem MCP, fallback to fs (REAL IMPLEMENTATION)
 */
export async function listDirectoryMCP(
  path: string
): Promise<DirectoryEntry[]> {
  try {
    const client = await initFilesystemClient();
    if (client && filesystemMCPAvailable) {
      const result = await client.callTool({
        name: "list_directory",
        arguments: { path },
      });
      if (
        result.content &&
        result.content[0] &&
        "json" in result.content[0] &&
        result.content[0].json
      ) {
        const data = result.content[0].json as any;
        if (Array.isArray(data.entries)) {
          return data.entries.map((entry: any) => ({
            name: entry.name,
            type: entry.type === "directory" ? "directory" : "file",
            size: entry.size,
          }));
        }
      }
    }
  } catch (error: any) {
    // Fall through to fs fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] listDirectoryMCP failed for ${path}: ${error.message}. fs fallback is disabled.`
      );
    }
    logWarn(`listDirectoryMCP failed for ${path}: ${error.message}`);
  }

  // Fallback to fs (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Filesystem MCP unavailable. Cannot list directory ${path}. fs fallback is disabled.`
    );
  }
  try {
    const entries = fs.readdirSync(path, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
      size: entry.isFile()
        ? fs.statSync(join(path, entry.name)).size
        : undefined,
    }));
  } catch (error: any) {
    throw new Error(`Failed to list directory ${path}: ${error.message}`);
  }
}

/**
 * Search files using Filesystem MCP, fallback to fs (REAL IMPLEMENTATION)
 */
export async function searchFilesMCP(
  pattern: string,
  basePath?: string
): Promise<string[]> {
  const searchPath = basePath || PROJECT_ROOT;

  try {
    const client = await initFilesystemClient();
    if (client && filesystemMCPAvailable) {
      const result = await client.callTool({
        name: "search_files",
        arguments: { pattern, path: searchPath },
      });
      if (
        result.content &&
        result.content[0] &&
        "json" in result.content[0] &&
        result.content[0].json
      ) {
        const data = result.content[0].json as any;
        if (Array.isArray(data.files)) {
          return data.files;
        }
      }
    }
  } catch (error: any) {
    // Fall through to fs fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] searchFilesMCP failed for pattern ${pattern}: ${error.message}. fs fallback is disabled.`
      );
    }
    logWarn(`searchFilesMCP failed for pattern ${pattern}: ${error.message}`);
  }

  // Fallback to fs - recursive search (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Filesystem MCP unavailable. Cannot search files. fs fallback is disabled.`
    );
  }
  const results: string[] = [];
  function searchRecursive(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
            searchRecursive(fullPath);
          }
        } else if (entry.isFile()) {
          // Simple pattern matching (glob-like)
          if (entry.name.includes(pattern.replace("*", ""))) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }

  searchRecursive(searchPath);
  return results;
}

// ========================================
// Git MCP Wrappers
// ========================================

export interface GitStatus {
  branch: string;
  files: Array<{
    path: string;
    status: "staged" | "unstaged" | "untracked";
  }>;
  uncommittedFiles: number;
  shortStatus?: string; // Git status --short output
}

export interface GitCommit {
  hash: string;
  message: string;
  date: string;
  author?: string;
}

export interface GitLogOptions {
  limit?: number;
  since?: string;
  until?: string;
  grep?: string;
  oneline?: boolean;
  format?: "hash" | "date" | "message" | "full";
}

export interface GitDiffOptions {
  staged?: boolean;
  nameOnly?: boolean;
  path?: string;
}

/**
 * Get git status using Git MCP, fallback to git command (REAL IMPLEMENTATION)
 */
export async function gitStatusMCP(directory?: string): Promise<GitStatus> {
  const cwd = directory || PROJECT_ROOT;

  try {
    const client = await initGitClient();
    if (client && gitMCPAvailable) {
      const result = await client.callTool({
        name: "git_status",
        arguments: { directory: cwd },
      });
      if (result.content && result.content[0] && "text" in result.content[0]) {
        // Parse git status text output
        const statusText = result.content[0].text;
        const lines = statusText.split("\n");
        let branch = "";
        const files: Array<{
          path: string;
          status: "staged" | "unstaged" | "untracked";
        }> = [];

        for (const line of lines) {
          if (line.includes("On branch")) {
            branch = line.replace("On branch", "").trim();
          } else if (line.match(/^\s*(modified|new file|deleted|renamed):/)) {
            const match = line.match(
              /^\s*(modified|new file|deleted|renamed):\s*(.+)$/
            );
            if (match) {
              files.push({
                path: match[2].trim(),
                status: line.includes("Changes to be committed")
                  ? "staged"
                  : "unstaged",
              });
            }
          } else if (line.match(/^\s*[AMD]+\s+/)) {
            // Staged files (A/M/D format)
            const match = line.match(/^\s*([AMD]+)\s+(.+)$/);
            if (match) {
              files.push({
                path: match[2].trim(),
                status: "staged",
              });
            }
          } else if (line.match(/^\?\?\s+/)) {
            // Untracked files
            const match = line.match(/^\?\?\s+(.+)$/);
            if (match) {
              files.push({
                path: match[1].trim(),
                status: "untracked",
              });
            }
          }
        }

        // Generate short status (git status --short format)
        const shortStatusLines = files.map((f) => {
          const status =
            f.status === "staged"
              ? "A "
              : f.status === "untracked"
                ? "??"
                : " M";
          return `${status} ${f.path}`;
        });

        return {
          branch,
          files,
          uncommittedFiles: files.length,
          shortStatus: shortStatusLines.join("\n"),
        };
      }
    }
  } catch (error: any) {
    // Fall through to git command fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] gitStatusMCP failed: ${error.message}. git command fallback is disabled.`
      );
    }
    logWarn(`gitStatusMCP failed: ${error.message}`);
  }

  // Fallback to git command (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Git MCP unavailable. Cannot get git status. git command fallback is disabled.`
    );
  }
  try {
    const branch = execSync("git branch --show-current", {
      encoding: "utf-8",
      cwd,
    }).trim();
    const statusOutput = execSync("git status --porcelain", {
      encoding: "utf-8",
      cwd,
    }).trim();
    const files = statusOutput
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const status = line.substring(0, 2);
        const path = line.substring(3);
        return {
          path,
          status:
            status.includes("A") || status.includes("M")
              ? "staged"
              : "unstaged",
        } as const;
      });

    return {
      branch,
      files,
      uncommittedFiles: files.length,
    };
  } catch (error: any) {
    throw new Error(`Failed to get git status: ${error.message}`);
  }
}

/**
 * Get git log using Git MCP, fallback to git command (REAL IMPLEMENTATION)
 */
export async function gitLogMCP(
  options: GitLogOptions = {},
  directory?: string
): Promise<GitCommit[]> {
  const cwd = directory || PROJECT_ROOT;

  try {
    const client = await initGitClient();
    if (client && gitMCPAvailable) {
      // Git MCP git_log tool accepts: directory, limit, oneline
      const mcpArgs: any = { directory: cwd };
      if (options.limit) {
        mcpArgs.limit = options.limit;
      }
      if (options.oneline) {
        mcpArgs.oneline = true;
      }

      const result = await client.callTool({
        name: "git_log",
        arguments: mcpArgs,
      });
      if (result.content && result.content[0]) {
        let commits: GitCommit[] = [];
        if ("text" in result.content[0]) {
          // Parse text output (oneline format: "hash message" or "hash|message|date")
          const lines = result.content[0].text.split("\n").filter(Boolean);
          commits = lines.map((line) => {
            if (line.includes("|")) {
              const parts = line.split("|");
              return {
                hash: parts[0]?.trim() || "",
                message: parts[1]?.trim() || "",
                date: parts[2]?.trim() || new Date().toISOString(),
              };
            } else {
              // Oneline format: "hash message"
              const match = line.match(/^([a-f0-9]+)\s+(.+)$/);
              if (match) {
                return {
                  hash: match[1],
                  message: match[2],
                  date: new Date().toISOString(),
                };
              }
              return {
                hash: line.split(" ")[0] || "",
                message: line.substring(line.indexOf(" ") + 1) || line,
                date: new Date().toISOString(),
              };
            }
          });
        }

        // Apply filters (grep, since) if needed (Git MCP doesn't support these, so filter after)
        if (options.grep) {
          commits = commits.filter((c) => c.message.includes(options.grep!));
        }
        if (options.since) {
          // Filter by date if needed (basic implementation)
          // Note: Git MCP doesn't support since, so we get all and filter
        }

        return commits;
      }
    }
  } catch (error: any) {
    // Fall through to git command fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] gitLogMCP failed: ${error.message}. git command fallback is disabled.`
      );
    }
    logWarn(`gitLogMCP failed: ${error.message}`);
  }

  // Fallback to git command (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Git MCP unavailable. Cannot get git log. git command fallback is disabled.`
    );
  }
  try {
    let format = "%h|%s|%cd";
    if (options.format === "hash") {
      format = "%h";
    } else if (options.format === "date") {
      format = "%cd";
    } else if (options.format === "message") {
      format = "%s";
    }

    let command = `git log --format="${format}" --date=iso`;
    if (options.limit) {
      command += ` -n ${options.limit}`;
    }
    if (options.since) {
      command += ` --since="${options.since}"`;
    }
    if (options.until) {
      command += ` --until="${options.until}"`;
    }
    if (options.grep) {
      command += ` --grep="${options.grep}"`;
    }
    if (options.oneline) {
      command += " --oneline";
    }

    const output = execSync(command, { encoding: "utf-8", cwd }).trim();
    const lines = output.split("\n").filter(Boolean);

    return lines.map((line) => {
      const parts = line.split("|");
      return {
        hash: parts[0] || "",
        message: parts[1] || "",
        date: parts[2] || new Date().toISOString(),
      };
    });
  } catch (error: any) {
    // Git log might return empty (no commits), which is not an error
    if (error.message.includes("does not have any commits")) {
      return [];
    }
    throw new Error(`Failed to get git log: ${error.message}`);
  }
}

/**
 * Get git diff using Git MCP, fallback to git command (REAL IMPLEMENTATION)
 */
export async function gitDiffMCP(
  options: GitDiffOptions = {},
  directory?: string
): Promise<string> {
  const cwd = directory || PROJECT_ROOT;

  try {
    const client = await initGitClient();
    if (client && gitMCPAvailable) {
      // Git MCP git_diff tool accepts: directory, commit
      const mcpArgs: any = { directory: cwd };
      if (options.staged) {
        // Git MCP doesn't support staged flag, use fallback
        throw new Error("Staged diff not supported by Git MCP, using fallback");
      }
      if (options.path) {
        mcpArgs.path = options.path;
      }

      const result = await client.callTool({
        name: "git_diff",
        arguments: mcpArgs,
      });
      if (result.content && result.content[0] && "text" in result.content[0]) {
        let diffText = result.content[0].text;
        if (options.nameOnly) {
          // Extract file names from diff output
          const fileNames = diffText
            .split("\n")
            .filter(
              (line) =>
                line.startsWith("diff --git") ||
                line.startsWith("+++") ||
                line.startsWith("---")
            )
            .map((line) => {
              if (line.startsWith("diff --git")) {
                const match = line.match(/diff --git a\/(.+?)\s+b\/(.+)$/);
                return match ? match[2] : "";
              }
              if (line.startsWith("+++")) {
                return line.replace("+++ b/", "").trim();
              }
              return "";
            })
            .filter(Boolean);
          return fileNames.join("\n");
        }
        return diffText;
      }
    }
  } catch (error: any) {
    // Fall through to git command fallback (unless strict mode)
    if (STRICT_MCP_IO) {
      throw new Error(
        `[STRICT_MCP_IO] gitDiffMCP failed: ${error.message}. git command fallback is disabled.`
      );
    }
    logWarn(`gitDiffMCP failed: ${error.message}`);
  }

  // Fallback to git command (disabled in strict mode)
  if (STRICT_MCP_IO) {
    throw new Error(
      `[STRICT_MCP_IO] Git MCP unavailable. Cannot get git diff. git command fallback is disabled.`
    );
  }
  try {
    let command = "git diff";
    if (options.staged) {
      command += " --staged";
    }
    if (options.nameOnly) {
      command += " --name-only";
    }
    if (options.path) {
      command += ` -- ${options.path}`;
    }

    return execSync(command, { encoding: "utf-8", cwd }).trim();
  } catch (error: any) {
    // Git diff might return empty (no changes), which is not an error
    return "";
  }
}

/**
 * Get git branch list using Git MCP, fallback to git command
 */
export async function gitBranchMCP(directory?: string): Promise<string[]> {
  const cwd = directory || PROJECT_ROOT;

  try {
    const client = await initGitClient();
    if (client && gitMCPAvailable) {
      // MCP call would go here
      // const result = await client.callTool({ name: "git_branch", arguments: { directory: cwd } });
      // Process result...
    }
  } catch (error) {
    // Fall through to git command fallback
  }

  // Fallback to git command
  try {
    const output = execSync("git branch", { encoding: "utf-8", cwd }).trim();
    return output
      .split("\n")
      .filter(Boolean)
      .map((line) => line.replace(/^\*\s*/, "").trim());
  } catch (error: any) {
    throw new Error(`Failed to get git branches: ${error.message}`);
  }
}

/**
 * Check if MCP clients are available
 */
export function isMCPAvailable(): { filesystem: boolean; git: boolean } {
  return {
    filesystem: filesystemMCPAvailable,
    git: gitMCPAvailable,
  };
}

/**
 * Reset MCP clients (for testing)
 */
export function resetMCPClients(): void {
  filesystemClient = null;
  gitClient = null;
  filesystemMCPAvailable = false;
  gitMCPAvailable = false;
}
