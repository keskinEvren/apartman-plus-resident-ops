/**
 * Tests for verifyMCPOnly tool
 * v8.0: MCP-only enforcement verification
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { verifyMCPOnly } from "../verifyMCPOnly.js";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../../utils/paths.js";

describe("verifyMCPOnly", () => {
  const workspaceRoot = getWorkspaceRoot(import.meta.url);
  const testDir = join(
    workspaceRoot,
    "mcp-servers/asanmod-mcp/src/tools/__tests__/temp"
  );

  beforeEach(() => {
    // Create temp directory for tests
    try {
      execSync(`mkdir -p "${testDir}"`, { cwd: workspaceRoot });
    } catch {
      // Directory might already exist
    }
  });

  afterEach(() => {
    // Cleanup temp files
    try {
      execSync(`rm -rf "${testDir}"`, { cwd: workspaceRoot });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should pass when no fs imports are found", async () => {
    // Create a test file without fs imports
    const testFile = join(testDir, "test-no-fs.ts");
    writeFileSync(
      testFile,
      `import { something } from "./other.js";
export function test() {
  return "test";
}`
    );

    const result = await verifyMCPOnly(testDir);
    expect(result.success).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("should detect fs import violations", async () => {
    // Create a test file with fs import
    const testFile = join(testDir, "test-with-fs.ts");
    writeFileSync(
      testFile,
      `import fs from "fs";
import { readFileSync } from "fs";
export function test() {
  return fs.readFileSync("test.txt");
}`
    );

    const result = await verifyMCPOnly(testDir);
    expect(result.success).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].file).toContain("test-with-fs.ts");
  });

  it("should allow mcpClient.ts to use fs (fallback)", async () => {
    // Check that mcpClient.ts is in allowed files
    const result = await verifyMCPOnly(
      join(workspaceRoot, "mcp-servers/asanmod-mcp/src/utils")
    );

    // mcpClient.ts should not be flagged even if it uses fs
    const mcpClientViolations = result.violations.filter((v) =>
      v.file.includes("mcpClient.ts")
    );
    expect(mcpClientViolations).toHaveLength(0);
  });

  it("should return correct structure", async () => {
    const result = await verifyMCPOnly();
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("violations");
    expect(result).toHaveProperty("allowedFiles");
    expect(Array.isArray(result.violations)).toBe(true);
    expect(Array.isArray(result.allowedFiles)).toBe(true);
  });

  it("should handle non-existent path gracefully", async () => {
    const result = await verifyMCPOnly("/non/existent/path");
    // Should return result (empty violations) or error
    expect(result).toHaveProperty("success");
  });
});
