#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec, execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const server = new Server(
  {
    name: "git-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Git komutlarını çalıştır (shell kullanarak - basit komutlar için)
async function runGitCommand(
  command: string,
  directory: string
): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: directory || process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    if (stderr && !stderr.includes("warning:")) {
      throw new Error(stderr);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

// Git komutlarını execFile ile çalıştır (dosya yolları için güvenli)
async function runGitCommandSafe(
  args: string[],
  directory: string
): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd: directory || process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    if (stderr && !stderr.includes("warning:")) {
      throw new Error(stderr);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

// GitHub push with retry mechanism
async function pushWithRetry(
  directory: string,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<{ success: boolean; error?: string }> {
  // Check if remote exists
  try {
    await runGitCommand("git remote get-url origin", directory);
  } catch {
    return { success: false, error: "No remote configured" };
  }

  // Get current branch
  let currentBranch: string;
  try {
    currentBranch = await runGitCommand(
      "git rev-parse --abbrev-ref HEAD",
      directory
    );
  } catch {
    currentBranch = "main";
  }

  // Retry push
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await runGitCommand(`git push origin ${currentBranch}`, directory);
      return { success: true };
    } catch (error: any) {
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

// Initialize handler (required for MCP SDK)
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "git-mcp",
      version: "1.0.0",
    },
  };
});

// Tool listesi
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "git_status",
      description: "Get git status (staged, unstaged, untracked files)",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
            default: "current working directory",
          },
        },
      },
    },
    {
      name: "git_log",
      description: "Get git commit log",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          limit: {
            type: "number",
            description: "Number of commits to show",
            default: 10,
          },
          oneline: {
            type: "boolean",
            description: "Show one line per commit",
            default: true,
          },
        },
      },
    },
    {
      name: "git_branch",
      description: "List or create git branches",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          action: {
            type: "string",
            enum: ["list", "create"],
            description: "Action to perform",
            default: "list",
          },
          branch_name: {
            type: "string",
            description: "Branch name (required for create)",
          },
        },
      },
    },
    {
      name: "git_blame",
      description:
        "Show what revision and author last modified each line of a file",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          file: {
            type: "string",
            description: "File path to blame",
          },
        },
        required: ["file"],
      },
    },
    {
      name: "git_add",
      description: "Add file contents to the index (git add)",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Files to add (empty array = add all)",
            default: [],
          },
        },
      },
    },
    {
      name: "git_commit",
      description: "Record changes to the repository (git commit)",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          message: {
            type: "string",
            description: "Commit message",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Specific files to commit (optional)",
          },
        },
        required: ["message"],
      },
    },
    {
      name: "git_checkout",
      description: "Switch branches or restore working tree files",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          branch: {
            type: "string",
            description: "Branch name to checkout",
          },
        },
        required: ["branch"],
      },
    },
    {
      name: "git_stash",
      description: "Stash the changes in a dirty working directory",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          name: {
            type: "string",
            description: "Optional name for the stash",
          },
        },
      },
    },
    {
      name: "git_diff",
      description:
        "Show changes between commits, commit and working tree, etc.",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          commit: {
            type: "string",
            description: "Commit to compare (default: HEAD)",
          },
        },
      },
    },
    {
      name: "git_worktree",
      description: "List or add git worktrees",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          action: {
            type: "string",
            enum: ["list", "add"],
            description: "Action to perform",
            default: "list",
          },
          path: {
            type: "string",
            description: "Path for the worktree (required for add)",
          },
          branch: {
            type: "string",
            description: "Branch for the worktree (optional for add)",
          },
        },
      },
    },
    {
      name: "git_push",
      description: "Push commits to GitHub (with automatic retry)",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Git repository directory path",
          },
          branch: {
            type: "string",
            description: "Branch to push (default: current branch or main)",
          },
        },
      },
    },
  ],
}));

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const directory = (args as any)?.directory || process.cwd();

  try {
    let result: string;

    switch (name) {
      case "git_status":
        result = await runGitCommand("git status", directory);
        break;

      case "git_log":
        const limit = (args as any)?.limit || 10;
        const oneline = (args as any)?.oneline !== false;
        const logFormat = oneline ? "--oneline" : "";
        result = await runGitCommand(
          `git log ${logFormat} -n ${limit}`,
          directory
        );
        break;

      case "git_branch":
        if ((args as any)?.action === "create") {
          if (!(args as any)?.branch_name) {
            throw new Error("branch_name is required for create action");
          }
          result = await runGitCommand(
            `git branch ${(args as any).branch_name}`,
            directory
          );
        } else {
          result = await runGitCommand("git branch", directory);
        }
        break;

      case "git_blame":
        if (!(args as any)?.file) {
          throw new Error("file is required");
        }
        // Use execFile for safe file path handling (no shell interpretation)
        const blameFile = String((args as any).file);
        result = await runGitCommandSafe(["blame", blameFile], directory);
        break;

      case "git_add":
        const files = (args as any)?.files || [];
        if (files.length > 0) {
          // Use execFile for safe file path handling (no shell interpretation)
          const gitArgs = ["add", ...files];
          result = await runGitCommandSafe(gitArgs, directory);
        } else {
          result = await runGitCommand("git add .", directory);
        }
        break;

      case "git_commit":
        if (!(args as any)?.message) {
          throw new Error("message is required");
        }
        const message = String((args as any).message);
        if (
          (args as any)?.files &&
          Array.isArray((args as any).files) &&
          (args as any).files.length > 0
        ) {
          // Use execFile for safe file path handling (no shell interpretation)
          const gitArgs = ["commit", "-m", message, ...(args as any).files];
          result = await runGitCommandSafe(gitArgs, directory);
        } else {
          result = await runGitCommand(
            `git commit -m "${message.replace(/"/g, '\\"')}"`,
            directory
          );
        }

        // Auto-push to GitHub (with retry)
        const pushResult = await pushWithRetry(directory, 3, 2000);
        if (!pushResult.success) {
          // Push failed but commit succeeded - log warning but don't fail
          result += `\n⚠️  GitHub push failed: ${pushResult.error || "Unknown error"}`;
        }
        break;

      case "git_checkout":
        if (!(args as any)?.branch) {
          throw new Error("branch is required");
        }
        result = await runGitCommand(
          `git checkout ${(args as any).branch}`,
          directory
        );
        break;

      case "git_stash":
        const stashName = (args as any)?.name ? `"${(args as any).name}"` : "";
        result = await runGitCommand(
          `git stash push -m ${stashName}`,
          directory
        );
        break;

      case "git_diff":
        const commit = (args as any)?.commit || "HEAD";
        result = await runGitCommand(`git diff ${commit}`, directory);
        break;

      case "git_worktree":
        if ((args as any)?.action === "add") {
          if (!(args as any)?.path) {
            throw new Error("path is required for add action");
          }
          const branch = (args as any)?.branch
            ? `-b ${(args as any).branch}`
            : "";
          result = await runGitCommand(
            `git worktree add ${(args as any).path} ${branch}`,
            directory
          );
        } else {
          result = await runGitCommand("git worktree list", directory);
        }
        break;

      case "git_push":
        const pushBranch = (args as any)?.branch || "main";
        const pushResult2 = await pushWithRetry(directory, 3, 2000);
        if (pushResult2.success) {
          result = `Successfully pushed to origin/${pushBranch}`;
        } else {
          throw new Error(
            `Push failed: ${pushResult2.error || "Unknown error"}`
          );
        }
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: result || "Command executed successfully",
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Don't output to stderr - Cursor IDE may parse this incorrectly
    // console.error("Git MCP server running on stdio");
  } catch (error) {
    console.error("Fatal error in main:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
