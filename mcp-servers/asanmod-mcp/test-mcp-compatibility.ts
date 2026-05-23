#!/usr/bin/env node
/**
 * MCP Compatibility & Real Connection Test
 * Tests all MCP integrations and verifies real connections
 */

import {
  readFileMCP,
  fileExistsMCP,
  gitStatusMCP,
  isMCPAvailable,
} from "./src/utils/mcpClient.js";
import * as fs from "fs";
import { join } from "path";

const PROJECT_ROOT = "/home/root/projects/ASANMODcursor";
const TEST_FILE = join(PROJECT_ROOT, "mcp-servers/asanmod-mcp/package.json");

interface MCPTestResult {
  name: string;
  status: "✅" | "❌" | "⚠️";
  realConnection: boolean;
  fallbackUsed: boolean;
  error?: string;
  details?: string;
}

async function testMCPConnection(
  name: string,
  testFn: () => Promise<any>
): Promise<MCPTestResult> {
  try {
    const start = Date.now();
    const result = await Promise.race([
      testFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      ),
    ]);
    const time = Date.now() - start;

    // Check if MCP is available
    const mcpStatus = isMCPAvailable();
    const realConnection = mcpStatus.filesystem || mcpStatus.git;

    return {
      name,
      status: "✅",
      realConnection,
      fallbackUsed: !realConnection,
      details: `Success (${time}ms)`,
    };
  } catch (error: any) {
    const mcpStatus = isMCPAvailable();
    return {
      name,
      status: error.message === "Timeout" ? "⚠️" : "❌",
      realConnection: false,
      fallbackUsed: true,
      error: error.message,
      details: error.message === "Timeout" ? "Timeout (5s)" : error.message,
    };
  }
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║     MCP Compatibility & Real Connection Test              ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  const results: MCPTestResult[] = [];

  // Test 1: MCP Config Loading
  console.log("=== Test 1: MCP Config Loading ===\n");
  try {
    const configPath = join(process.env.HOME || "/root", ".cursor", "mcp.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const mcpCount = Object.keys(config.mcpServers || {}).length;
      console.log(`✅ Config loaded: ${mcpCount} MCP servers configured`);
      console.log(
        `   Filesystem: ${config.mcpServers?.filesystem ? "✅" : "❌"}`
      );
      console.log(`   Git: ${config.mcpServers?.git ? "✅" : "❌"}`);
      results.push({
        name: "MCP Config",
        status: "✅",
        realConnection: true,
        fallbackUsed: false,
        details: `${mcpCount} servers configured`,
      });
    } else {
      console.log("❌ Config file not found");
      results.push({
        name: "MCP Config",
        status: "❌",
        realConnection: false,
        fallbackUsed: true,
        error: "Config file not found",
      });
    }
  } catch (error: any) {
    console.log(`❌ Config loading failed: ${error.message}`);
    results.push({
      name: "MCP Config",
      status: "❌",
      realConnection: false,
      fallbackUsed: true,
      error: error.message,
    });
  }

  // Test 2: Filesystem MCP
  console.log("\n=== Test 2: Filesystem MCP ===\n");
  const fsTest1 = await testMCPConnection("Filesystem MCP - fileExists", () =>
    fileExistsMCP(TEST_FILE)
  );
  results.push(fsTest1);
  console.log(
    `${fsTest1.status} ${fsTest1.name}: ${fsTest1.details || fsTest1.error}`
  );
  console.log(
    `   Real Connection: ${fsTest1.realConnection ? "✅" : "❌ (using fallback)"}`
  );

  const fsTest2 = await testMCPConnection("Filesystem MCP - readFile", () =>
    readFileMCP(TEST_FILE)
  );
  results.push(fsTest2);
  console.log(
    `${fsTest2.status} ${fsTest2.name}: ${fsTest2.details || fsTest2.error}`
  );
  console.log(
    `   Real Connection: ${fsTest2.realConnection ? "✅" : "❌ (using fallback)"}`
  );

  // Test 3: Git MCP
  console.log("\n=== Test 3: Git MCP ===\n");
  const gitTest = await testMCPConnection("Git MCP - gitStatus", () =>
    gitStatusMCP(PROJECT_ROOT)
  );
  results.push(gitTest);
  console.log(
    `${gitTest.status} ${gitTest.name}: ${gitTest.details || gitTest.error}`
  );
  console.log(
    `   Real Connection: ${gitTest.realConnection ? "✅" : "❌ (using fallback)"}`
  );

  // Test 4: MCP Availability Check
  console.log("\n=== Test 4: MCP Availability ===\n");
  const mcpStatus = isMCPAvailable();
  console.log(
    `Filesystem MCP: ${mcpStatus.filesystem ? "✅ Available" : "❌ Unavailable"}`
  );
  console.log(`Git MCP: ${mcpStatus.git ? "✅ Available" : "❌ Unavailable"}`);
  results.push({
    name: "MCP Availability",
    status: mcpStatus.filesystem && mcpStatus.git ? "✅" : "⚠️",
    realConnection: mcpStatus.filesystem && mcpStatus.git,
    fallbackUsed: !(mcpStatus.filesystem && mcpStatus.git),
    details: `Filesystem: ${mcpStatus.filesystem}, Git: ${mcpStatus.git}`,
  });

  // Summary
  console.log(
    "\n╔═══════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                    Test Summary                             ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  const passed = results.filter((r) => r.status === "✅").length;
  const failed = results.filter((r) => r.status === "❌").length;
  const warnings = results.filter((r) => r.status === "⚠️").length;
  const realConnections = results.filter((r) => r.realConnection).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`\nReal MCP Connections: ${realConnections}/${results.length}`);

  console.log("\nDetailed Results:");
  results.forEach((r) => {
    const connStatus = r.realConnection ? "✅ REAL" : "⚠️  FALLBACK";
    console.log(
      `  ${r.status} ${r.name}: ${connStatus} - ${r.details || r.error || "OK"}`
    );
  });

  // Compatibility Check
  console.log(
    "\n╔═══════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║              Compatibility Assessment                       ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  const allReal = results.every(
    (r) => r.realConnection || r.name === "MCP Config"
  );
  const allPassed = results.every((r) => r.status === "✅");

  if (allReal && allPassed) {
    console.log("✅ ALL SYSTEMS OPERATIONAL");
    console.log("   - Real MCP connections: ✅");
    console.log("   - All tests passed: ✅");
    console.log("   - Compatibility: ✅");
  } else if (allPassed) {
    console.log("⚠️  FUNCTIONAL BUT USING FALLBACK");
    console.log("   - Real MCP connections: ❌ (using fallback)");
    console.log("   - All tests passed: ✅");
    console.log("   - Compatibility: ⚠️  (fallback mode)");
  } else {
    console.log("❌ ISSUES DETECTED");
    console.log("   - Real MCP connections: ❌");
    console.log("   - Some tests failed: ❌");
    console.log("   - Compatibility: ❌");
  }

  console.log("\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
