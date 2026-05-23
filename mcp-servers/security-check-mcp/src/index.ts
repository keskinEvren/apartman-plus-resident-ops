#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, existsSync } from "fs";

const execAsync = promisify(exec);

const server = new Server(
  {
    name: "security-check-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Security patterns to check
const SECURITY_PATTERNS = [
  { pattern: /password\s*=\s*["'][^"']+["']/gi, name: "Hardcoded password" },
  { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi, name: "Hardcoded API key" },
  { pattern: /secret\s*=\s*["'][^"']+["']/gi, name: "Hardcoded secret" },
  { pattern: /eval\s*\(/gi, name: "Eval usage" },
  { pattern: /dangerouslySetInnerHTML/gi, name: "Dangerous HTML" },
  { pattern: /innerHTML\s*=/gi, name: "innerHTML usage" },
  { pattern: /sql\s*\+\s*["']/gi, name: "SQL injection risk" },
  { pattern: /\.exec\s*\(/gi, name: "Command execution" },
];

// Tool listesi
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "security_scan",
      description:
        "Scan code for security vulnerabilities (Semgrep alternatifi)",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to scan",
          },
        },
      },
    },
  ],
}));

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const path = (args as any)?.path || process.cwd();

  try {
    if (name === "security_scan") {
      const issues: any[] = [];

      // Find all code files
      const { stdout } = await execAsync(
        `find ${path} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      const files = stdout
        .trim()
        .split("\n")
        .filter((f) => f);

      for (const file of files) {
        if (!existsSync(file)) continue;

        try {
          const content = readFileSync(file, "utf-8");

          for (const { pattern, name: issueName } of SECURITY_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
              const lineNumber = content
                .substring(0, match.index)
                .split("\n").length;
              issues.push({
                file,
                line: lineNumber,
                issue: issueName,
                code: match[0].substring(0, 100),
              });
            }
          }
        } catch (error) {
          // Skip file if can't read
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                issues,
                count: issues.length,
                scanned: files.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Don't output to stderr - Cursor Agent may parse this incorrectly
  // console.error("Security Check MCP server running on stdio");
}

main().catch((error) => {
  // Don't output to stderr - Cursor Agent may parse this incorrectly
  // console.error("Fatal error:", error);
  process.exit(1);
});
