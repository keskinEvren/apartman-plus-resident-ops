#!/usr/bin/env node
/**
 * Simple MCP Client Test - Config & Fallback Only
 */

import * as fs from "fs";
import { join } from "path";

// Test 1: Config loading
console.log("=== Test 1: MCP Config Loading ===\n");
try {
  const configPath = join(process.env.HOME || "/root", ".cursor", "mcp.json");
  console.log(`Config path: ${configPath}`);

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(content);
    console.log("✅ Config loaded successfully");
    console.log(
      `   Filesystem MCP: ${config.mcpServers?.filesystem ? "✅ Found" : "❌ Not found"}`
    );
    console.log(
      `   Git MCP: ${config.mcpServers?.git ? "✅ Found" : "❌ Not found"}`
    );

    if (config.mcpServers?.filesystem) {
      console.log(
        `   Filesystem command: ${config.mcpServers.filesystem.command}`
      );
      console.log(
        `   Filesystem args: ${JSON.stringify(config.mcpServers.filesystem.args)}`
      );
    }
    if (config.mcpServers?.git) {
      console.log(`   Git command: ${config.mcpServers.git.command}`);
      console.log(`   Git args: ${JSON.stringify(config.mcpServers.git.args)}`);
    }
  } else {
    console.log("❌ Config file not found");
  }
} catch (error: any) {
  console.log(`❌ Config loading failed: ${error.message}`);
}

// Test 2: Module import (without initialization)
console.log("\n=== Test 2: Module Import ===\n");
try {
  const mcpClient = await import("./src/utils/mcpClient.js");
  console.log("✅ Module imported successfully");
  console.log(
    `   Exported functions: ${Object.keys(mcpClient)
      .filter((k) => k.includes("MCP"))
      .join(", ")}`
  );
} catch (error: any) {
  console.log(`❌ Module import failed: ${error.message}`);
  console.log(`   Stack: ${error.stack?.split("\n")[1]}`);
}

// Test 3: Fallback mechanism (read file without MCP)
console.log("\n=== Test 3: Fallback Mechanism ===\n");
try {
  const testFile =
    "/home/root/projects/ASANMODcursor/mcp-servers/asanmod-mcp/package.json";
  if (fs.existsSync(testFile)) {
    const content = fs.readFileSync(testFile, "utf-8");
    console.log(`✅ Fallback fs.readFileSync works (${content.length} bytes)`);
  } else {
    console.log("❌ Test file not found");
  }
} catch (error: any) {
  console.log(`❌ Fallback test failed: ${error.message}`);
}

console.log("\n=== Test Complete ===\n");
