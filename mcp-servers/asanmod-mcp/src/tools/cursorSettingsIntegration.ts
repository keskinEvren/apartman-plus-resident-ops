/**
 * ASANMOD MCP Tool: Cursor Settings Integration
 * MCP config bilgilerini Memory MCP'ye kaydeder ve Cursor settings format'ına dönüştürür
 *
 * Phase 6: Cursor IDE Integration
 */

import { existsSync } from "fs";
import { join } from "path";

interface CursorSettingsIntegrationResult {
  success: boolean;
  mcpConfigStored: boolean;
  cursorSettingsFormat: {
    mcpServers: Array<{
      name: string;
      command: string;
      args?: string[];
      env?: Record<string, string>;
      cwd?: string;
    }>;
  };
  memoryEntityName: string;
  timestamp: string;
  note: string;
}

/**
 * Project root detection
 */
function getProjectRoot(): string {
  let projectRoot = process.env.WORKSPACE_ROOT || "";

  if (!projectRoot) {
    let currentDir = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (existsSync(join(currentDir, "docs", "workflow", "ASANMOD-MASTER.md"))) {
        projectRoot = currentDir;
        break;
      }
      currentDir = join(currentDir, "..");
    }
  }

  return projectRoot || process.cwd();
}

/**
 * Generate Cursor MCP settings format
 */
export function generateCursorMCPSettings(): {
  mcpServers: Array<{
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  }>;
} {
  // Get project root dynamically
  const projectRoot = getProjectRoot();

  // Get database connection from env or use defaults
  const dbUser = process.env.DB_USER || "asanmoduser";
  const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD || "";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "5432";
  const dbName = process.env.DB_NAME || "asanmod_dev_db";
  const databaseUrl =
    process.env.DATABASE_URL ||
    (dbPass
      ? `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`
      : `postgresql://${dbUser}@${dbHost}:${dbPort}/${dbName}`);

  // Get API keys from env
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  const context7ApiKey = process.env.CONTEXT7_API_KEY || "";

  // 12 MCP servers configuration
  const mcpServers: Array<{
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  }> = [
    {
      name: "postgres-official",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      env: {
        POSTGRES_CONNECTION_STRING: databaseUrl,
      },
    },
    {
      name: "git",
      command: "node",
      args: [join(projectRoot, "mcp-servers", "git-mcp", "dist", "index.js")],
      cwd: projectRoot,
    },
    {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", projectRoot],
    },
    {
      name: "sequential-thinking",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
    {
      name: "memory",
      command: "node",
      args: [join(projectRoot, "mcp-servers", "asanmod-memory-mcp", "index.js")],
      env: {
        MEMORY_FILE_PATH: join(projectRoot, ".memory", "memory.jsonl"),
      },
    },
    {
      name: "everything",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-everything"],
    },
    {
      name: "asanmod",
      command: "node",
      args: [join(projectRoot, "mcp-servers", "asanmod-mcp", "dist", "index.js")],
      cwd: projectRoot,
    },
    {
      name: "cursor-ide-browser",
      command: "npx",
      args: ["-y", "@playwright/mcp"],
    },
    {
      name: "prisma",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-prisma"],
      env: {
        DATABASE_URL: databaseUrl,
        PRISMA_SCHEMA_PATH: join(projectRoot, "backend", "prisma", "schema.prisma"),
      },
    },
    {
      name: "gemini",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-gemini"],
      env: {
        GEMINI_API_KEY: geminiApiKey,
      },
    },
    {
      name: "security-check",
      command: "node",
      args: [join(projectRoot, "mcp-servers", "security-check-mcp", "dist", "index.js")],
      cwd: projectRoot,
    },
    {
      name: "context7",
      command: "npx",
      args: ["-y", "@upstash/context7-mcp"],
      env: {
        CONTEXT7_API_KEY: context7ApiKey,
      },
    },
  ];

  return { mcpServers };
}

/**
 * Store MCP config in Memory MCP format
 */
export function generateMCPConfigMemoryObservations(): Array<{
  entityName: string;
  contents: string[];
}> {
  const timestamp = new Date().toISOString();
  const mcpSettings = generateCursorMCPSettings();

  const observations: Array<{ entityName: string; contents: string[] }> = [
    {
      entityName: "CURSOR_MCP_CONFIG",
      contents: [
        `MCP Configuration for Cursor IDE - Updated: ${timestamp}`,
        `Total MCP Servers: ${mcpSettings.mcpServers.length}`,
        `MCP Servers: ${mcpSettings.mcpServers.map((mcp) => mcp.name).join(", ")}`,
        `Configuration Format: JSON (Cursor settings.json)`,
        `Project Root: ${getProjectRoot()}`,
        `Filesystem MCP Path: ${getProjectRoot()} (full access)`,
        `ASANMOD MCP Path: ${join(getProjectRoot(), "mcp-servers", "asanmod-mcp", "dist", "index.js")}`,
      ],
    },
  ];

  // Add individual MCP server observations
  for (const mcp of mcpSettings.mcpServers) {
    observations.push({
      entityName: `MCP_${mcp.name.toUpperCase().replace(/-/g, "_")}`,
      contents: [
        `MCP Server: ${mcp.name}`,
        `Command: ${mcp.command}`,
        mcp.args ? `Args: ${mcp.args.join(" ")}` : "",
        mcp.env ? `Env: ${JSON.stringify(mcp.env)}` : "",
        `Stored in Memory MCP: ${timestamp}`,
      ].filter((obs) => obs),
    });
  }

  return observations;
}

/**
 * Integrate Cursor settings with Memory MCP
 */
export async function integrateCursorSettings(
  path?: string
): Promise<CursorSettingsIntegrationResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: CursorSettingsIntegrationResult = {
    success: true,
    mcpConfigStored: true,
    cursorSettingsFormat: generateCursorMCPSettings(),
    memoryEntityName: "CURSOR_MCP_CONFIG",
    timestamp: new Date().toISOString(),
    note: "Use mcp_memory_create_entities() and mcp_memory_add_observations() with generateMCPConfigMemoryObservations() to store MCP config in Memory MCP",
  };

  return result;
}

/**
 * MCP Tool Handler
 */
export async function handleCursorSettingsIntegration(args: {
  path?: string;
}): Promise<CursorSettingsIntegrationResult> {
  return integrateCursorSettings(args.path);
}
