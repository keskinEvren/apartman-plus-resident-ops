#!/usr/bin/env node

/**
 * ASANMOD v1.1.1: DOCS SYNC
 *
 * Purpose: Automatically syncs MCP Tool definitions from source code (index.ts)
 * to the documentation source of truth (MCP-INVENTORY.json and markdown tables).
 *
 * Usage: node scripts/mod-tools/sync-docs.js
 */

const fs = require("fs");
const path = require("path");

// CONFIGURATION
const SOURCE_PATH = path.join(
  __dirname,
  "../../mcp-servers/asanmod-mcp/src/index.ts",
);
const INVENTORY_PATH = path.join(
  __dirname,
  "../../docs/mcp/MCP-INVENTORY.json",
);
const GENERATED_DOC_PATH = path.join(
  __dirname,
  "../../docs/mcp/GENERATED_TOOLS.md",
);

function extractTools(sourceCode) {
  const tools = [];
  // Regex to capture tool definitions inside ListToolsRequestSchema handler
  // Looks for objects with name, description, inputSchema
  // Note: This is a robust heuristic, but relies on standard formatting.

  // Fallback Strategy: Find the start index by comment and search for the closing bracket
  // We know it starts after "// List Tools" and "server.setRequestHandler(ListToolsRequestSchema"

  const startIndex = sourceCode.indexOf(
    "server.setRequestHandler(ListToolsRequestSchema",
  );
  if (startIndex === -1) {
    console.error(
      "❌ Critical Code Pattern Mismatch: Could not find ListToolsRequestSchema handler start.",
    );
    return [];
  }

  // Find the tools array start "tools: ["
  const toolsArrayStart = sourceCode.indexOf("tools: [", startIndex);
  if (toolsArrayStart === -1) {
    console.error(
      "❌ Critical Code Pattern Mismatch: Could not find 'tools: [' array start.",
    );
    return [];
  }

  // Find the matching closing bracket for "tools: ["
  let openBrackets = 1;
  let cursor = toolsArrayStart + 8; // length of "tools: ["
  let toolsArrayEnd = -1;

  while (cursor < sourceCode.length) {
    if (sourceCode[cursor] === "[") openBrackets++;
    else if (sourceCode[cursor] === "]") openBrackets--;

    if (openBrackets === 0) {
      toolsArrayEnd = cursor;
      break;
    }
    cursor++;
  }

  if (toolsArrayEnd === -1) {
    console.error(
      "❌ Critical Code Pattern Mismatch: Could not find matching closing bracket for tools array.",
    );
    return [];
  }

  const listToolsBlockMatch = [
    "dummy",
    sourceCode.substring(toolsArrayStart + 8, toolsArrayEnd),
  ];

  if (!listToolsBlockMatch) {
    console.error(
      "❌ Critical Code Pattern Mismatch: Could not find ListToolsRequestSchema handler in index.ts",
    );
    return [];
  }

  const toolsContent = listToolsBlockMatch[1];

  // Extract individual tool objects
  // This is tricky with Regex alone for nested objects without a parser,
  // but we can look for 'name: "..."' blocks.

  const toolNameRegex = /name:\s*"([^"]+)"/g;
  let match;

  while ((match = toolNameRegex.exec(toolsContent)) !== null) {
    const name = match[1];

    // Find description
    const descRegex = new RegExp(
      `name:\\s*"${name}"[\\s\\S]*?description:\\s*("[^"]*"|'[^']*'|\`[^\`]*\`)`,
    );
    const descMatch = toolsContent.match(descRegex);
    let description = "No description found";

    if (descMatch) {
      // Clean quotes
      description = descMatch[1].slice(1, -1).replace(/\\"/g, '"');
    }

    // Determine category based on naming convention
    let category = "other";
    if (
      name.includes("_core_") ||
      name.includes("quality_gate") ||
      name.includes("security_audit") ||
      name.includes("infrastructure")
    )
      category = "core_big_5";
    else if (name.includes("run_")) category = "sentinel";
    else if (name.includes("brain")) category = "brain";
    else if (name.includes("get_") || name.includes("add_"))
      category = "utility";

    tools.push({
      name,
      description,
      category,
      status: "active", // If it's in index.ts, it's active
    });
  }

  return tools;
}

function generateMarkdown(tools) {
  let md = "# ASANMOD MCP Tool Inventory (Auto-Generated)\n\n";
  md += `> **Last Updated:** ${new Date().toISOString()}\n`;
  md += "> **Source:** `mcp-servers/asanmod-mcp/src/index.ts`\n\n";

  const categories = [...new Set(tools.map((t) => t.category))].sort();

  categories.forEach((cat) => {
    md += `## ${cat.toUpperCase().replace(/_/g, " ")}\n`;
    md += "| Tool Name | Description |\n";
    md += "|-----------|-------------|\n";

    tools
      .filter((t) => t.category === cat)
      .forEach((tool) => {
        md += `| \`${tool.name}\` | ${tool.description} |\n`;
      });
    md += "\n";
  });

  return md;
}

async function main() {
  console.log("🔄 Starting ASANMOD Docs Sync...");

  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`❌ Source not found: ${SOURCE_PATH}`);
    process.exit(1);
  }

  const sourceCode = fs.readFileSync(SOURCE_PATH, "utf8");
  console.log(`📖 Read ${sourceCode.length} bytes from source.`);

  const tools = extractTools(sourceCode);
  console.log(`✅ Extracted ${tools.length} active tools.`);

  if (tools.length === 0) {
    console.warn("⚠️ No tools found!");
    process.exit(1);
  }

  // Write JSON Inventory (The Machine Truth)
  const inventory = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceFile: "src/index.ts",
      totalTools: tools.length,
      version: "5.0.0",
    },
    tools: tools,
  };

  fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2));
  console.log(`💾 Saved Inventory to: ${INVENTORY_PATH}`);

  // Write Markdown Reference (The Human Truth)
  const markdown = generateMarkdown(tools);
  fs.writeFileSync(GENERATED_DOC_PATH, markdown);
  console.log(`📝 Saved Markdown to: ${GENERATED_DOC_PATH}`);

  console.log("✨ Sync Complete!");
}

main();
