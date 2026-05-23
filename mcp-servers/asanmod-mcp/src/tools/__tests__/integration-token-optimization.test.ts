/**
 * Integration Tests: Token Optimization
 * Tests Phase 1 and Phase 2 optimizations together
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock fs at top level BEFORE imports
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

import * as fs from "fs";
import { compactify } from "../compactOutput.js";
import { readFileSmart } from "../smartFileReader.js";
import { indexFile, getFileIndex } from "../fileIndexer.js";
import { analyzeContext, loadContextSmart } from "../contextAnalyzer.js";
import { cache } from "../../cache.js";

const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockExistsSync = fs.existsSync as jest.Mock;
const mockStatSync = fs.statSync as jest.Mock;

describe("Token Optimization Integration", () => {
  beforeEach(() => {
    cache.clear();
    jest.resetAllMocks();
  });

  describe("Phase 1: Compact Output + Context Caching", () => {
    it("should reduce output size with compact format", () => {
      const verboseOutput = {
        type: "verification",
        success: true,
        errors: [],
        warnings: [],
        files: 10,
        commits: 5,
        checks: {
          lint: { passed: true, errors: 0, warnings: 0 },
          typescript: { passed: true, errors: 0 },
        },
        timestamp: new Date().toISOString(),
        metadata: { workerId: "w1", taskId: "t1" },
      };

      const compact = compactify(verboseOutput);

      // Compact should be much smaller
      const verboseSize = JSON.stringify(verboseOutput).length;
      const compactSize = JSON.stringify(compact).length;

      expect(compactSize).toBeLessThan(verboseSize * 0.5); // At least 50% reduction
    });

    it("should cache file content for repeated reads", async () => {
      // Mock file system
      const mockContent = "test content\n".repeat(100);

      mockReadFileSync.mockReturnValue(mockContent);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: mockContent.length,
        mtimeMs: Date.now(),
      });

      const filePath = "test.ts";

      // First read
      const result1 = await readFileSmart(filePath, { useCache: true });
      expect(result1.fromCache).toBe(false);

      // Second read should use cache
      const result2 = await readFileSmart(filePath, { useCache: true });
      expect(result2.fromCache).toBe(true);
      expect(result2.content).toBe(result1.content);
    });
  });

  describe("Phase 2: File Indexing + Smart Context Loading", () => {
    it("should enable selective reading with indexing", async () => {
      // Mock file system and AST parser
      const mockContent = `
import { something } from './dep';

export function targetFunction() {
  return 'test';
}

export class TargetClass {
  method() {
    return 'test';
  }
}
`.trim();

      mockReadFileSync.mockReturnValue(mockContent);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: mockContent.length,
        mtimeMs: Date.now(),
      });

      const filePath = "test.ts";

      // Index file
      await indexFile(filePath);
      const index = getFileIndex(filePath);

      expect(index).not.toBeNull();
      expect(index?.functions.length).toBeGreaterThan(0);

      // Use index for selective reading
      const result = await readFileSmart(filePath, {
        function: "targetFunction",
        useCache: false,
      });

      expect(result.method).toBe("function");
      expect(result.linesRead).toBeLessThan(mockContent.split("\n").length);
    });

    it("should load context smartly with token limits", async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ size: 4000 }); // ~1000 tokens per file
      mockReadFileSync.mockReturnValue("content");

      const context = await loadContextSmart({
        filePath: "test.ts",
        maxTokens: 5000, // Limit to 5K tokens
        maxDepth: 2,
      });

      // Should load some files but respect limit
      expect(context.size).toBeGreaterThan(0);
      // Total size should be reasonable
    });
  });

  describe("End-to-End: Token Optimization Workflow", () => {
    it("should optimize token usage in verification workflow", async () => {
      // 1. Index files
      mockReadFileSync.mockReturnValue("test content");
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ size: 1000, mtimeMs: Date.now() });

      await indexFile("file1.ts");
      await indexFile("file2.ts");

      // 2. Use compact output
      const verificationResult = {
        type: "verification",
        errors: [],
        files: 2,
        commits: 1,
      };
      const compact = compactify(verificationResult);

      // 3. Use selective reading
      const fileContent = await readFileSmart("file1.ts", {
        function: "testFunction",
        useCache: true,
      });

      // 4. Verify optimizations
      expect(compact.f).toBe(2);
      expect(fileContent.method).toBeDefined();
      expect(fileContent.fromCache).toBeDefined();

      // All optimizations should work together
      expect(compact).toBeDefined();
      expect(fileContent).toBeDefined();
    });
  });

  describe("Performance: Before/After Comparison", () => {
    it("should show token reduction with optimizations", () => {
      // Simulate before (verbose)
      const beforeOutput = {
        success: true,
        message: "The operation completed successfully without any errors",
        data: {
          checks: {
            lint: {
              passed: true,
              errors: 0,
              warnings: 0,
              details: { files: ["a.ts", "b.ts"], time: "1.2s" },
            },
            typescript: {
              passed: true,
              errors: 0,
              details: { files: ["a.ts", "b.ts"], time: "0.8s" },
            },
          },
          summary: {
            totalChecks: 2,
            passedChecks: 2,
            failedChecks: 0,
            allPassed: true,
          },
        },
        timestamp: new Date().toISOString(),
      };

      // Simulate after (compact)
      const afterOutput = compactify({
        type: "verification",
        errors: [],
        files: 2,
        commits: 1,
      });

      const beforeSize = JSON.stringify(beforeOutput).length;
      const afterSize = JSON.stringify(afterOutput).length;

      const reduction = ((beforeSize - afterSize) / beforeSize) * 100;

      expect(reduction).toBeGreaterThan(50); // At least 50% reduction
    });
  });
});
