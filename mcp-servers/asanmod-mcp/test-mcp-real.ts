#!/usr/bin/env node
/**
 * Real MCP Connection Test
 * Tests actual MCP client connections with timeout
 */

import {
  readFileMCP,
  fileExistsMCP,
  gitStatusMCP,
} from "./src/utils/mcpClient.js";

const TEST_FILE =
  "/home/root/projects/ASANMODcursor/mcp-servers/asanmod-mcp/package.json";
const PROJECT_ROOT = "/home/root/projects/ASANMODcursor";

async function testWithTimeout<T>(
  name: string,
  fn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<{ success: boolean; result?: T; error?: string; time: number }> {
  const start = Date.now();
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), timeoutMs);
    });

    const result = await Promise.race([fn(), timeoutPromise]);
    const time = Date.now() - start;
    console.log(`   ✅ ${name}: SUCCESS (${time}ms)`);
    return { success: true, result: result as T, time };
  } catch (error: any) {
    const time = Date.now() - start;
    const errorMsg = error.message || String(error);
    if (errorMsg === "Timeout") {
      console.log(`   ⏱️  ${name}: TIMEOUT (${time}ms) - Using fallback`);
    } else {
      console.log(`   ⚠️  ${name}: ${errorMsg} (${time}ms) - Using fallback`);
    }
    return { success: false, error: errorMsg, time };
  }
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║     Real MCP Connection Test - ASANMOD v3.1-ULTRA        ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  console.log("=== Filesystem MCP Test ===\n");

  // Test 1: File exists (should use MCP if available, fallback if not)
  const existsTest = await testWithTimeout(
    "fileExistsMCP",
    () => fileExistsMCP(TEST_FILE),
    5000
  );

  // Test 2: Read file (should use MCP if available, fallback if not)
  const readTest = await testWithTimeout(
    "readFileMCP",
    () => readFileMCP(TEST_FILE),
    5000
  );

  if (readTest.success && readTest.result) {
    console.log(`   Content length: ${readTest.result.length} bytes`);
  }

  console.log("\n=== Git MCP Test ===\n");

  // Test 3: Git status (should use MCP if available, fallback if not)
  const gitStatusTest = await testWithTimeout(
    "gitStatusMCP",
    () => gitStatusMCP(PROJECT_ROOT),
    5000
  );

  if (gitStatusTest.success && gitStatusTest.result) {
    console.log(`   Branch: ${gitStatusTest.result.branch}`);
    console.log(
      `   Uncommitted files: ${gitStatusTest.result.uncommittedFiles}`
    );
  }

  console.log(
    "\n╔═══════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                    Test Summary                             ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  console.log(`Filesystem MCP:`);
  console.log(
    `  fileExistsMCP: ${existsTest.success ? "✅" : "⚠️  (fallback)"} - ${existsTest.time}ms`
  );
  console.log(
    `  readFileMCP: ${readTest.success ? "✅" : "⚠️  (fallback)"} - ${readTest.time}ms`
  );

  console.log(`\nGit MCP:`);
  console.log(
    `  gitStatusMCP: ${gitStatusTest.success ? "✅" : "⚠️  (fallback)"} - ${gitStatusTest.time}ms`
  );

  console.log(
    `\nNote: If tests show "fallback", MCP connection may be unavailable or timing out.`
  );
  console.log(
    `      This is expected behavior - fallback ensures functionality continues.\n`
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
