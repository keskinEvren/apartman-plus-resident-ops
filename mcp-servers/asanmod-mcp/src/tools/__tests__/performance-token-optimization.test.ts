/**
 * Performance Tests: Token Optimization
 * Before/After comparison tests for token usage
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock fs at the top level BEFORE imports
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
import { indexFile } from "../fileIndexer.js";
import { analyzeContext } from "../contextAnalyzer.js";
import { tokenMetrics } from "../../utils/tokenMetrics.js";

const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockExistsSync = fs.existsSync as jest.Mock;
const mockStatSync = fs.statSync as jest.Mock;

describe("Performance: Token Optimization Before/After", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    tokenMetrics.clear();
  });

  describe("Compact Output Performance", () => {
    it("should reduce token usage significantly", () => {
      const verboseOutput = {
        type: "verification",
        success: true,
        message: "The operation completed successfully without any errors",
        errors: [],
        warnings: [],
        files: 10,
        commits: 5,
        checks: {
          lint: {
            passed: true,
            errors: 0,
            warnings: 0,
            details: {
              files: ["a.ts", "b.ts", "c.ts"],
              time: "1.2s",
              rules: ["rule1", "rule2"],
            },
          },
          typescript: {
            passed: true,
            errors: 0,
            details: {
              files: ["a.ts", "b.ts"],
              time: "0.8s",
            },
          },
        },
        summary: {
          totalChecks: 2,
          passedChecks: 2,
          failedChecks: 0,
          allPassed: true,
        },
        timestamp: new Date().toISOString(),
        metadata: {
          workerId: "w1",
          taskId: "t1",
          duration: 1234,
        },
      };

      const beforeSize = JSON.stringify(verboseOutput).length;
      const beforeTokens = Math.ceil(beforeSize / 4); // Rough estimate

      const compact = compactify(verboseOutput);
      const afterSize = JSON.stringify(compact).length;
      const afterTokens = Math.ceil(afterSize / 4);

      const reduction = ((beforeTokens - afterTokens) / beforeTokens) * 100;

      expect(reduction).toBeGreaterThan(50); // At least 50% reduction
      expect(afterTokens).toBeLessThan(beforeTokens * 0.6); // Less than 60% of original
    });
  });

  describe("Selective Reading Performance", () => {
    it("should reduce tokens for large files", async () => {
      // Create a large mock file
      const largeContent = Array.from(
        { length: 5000 },
        (_, i) => `export function func${i}() { return ${i}; }`
      ).join("\n");
      const filePath = "/tmp/test-large.ts";

      // Setup mock
      mockReadFileSync.mockReturnValue(largeContent);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: largeContent.length,
        mtimeMs: Date.now(),
      });

      // Before: Full file read
      const beforeTokens = Math.ceil(largeContent.length / 4);

      // After: Function-based read
      const result = await readFileSmart(filePath, {
        function: "func100",
        useCache: false,
      });

      const afterTokens = Math.ceil(result.content.length / 4);
      const reduction = ((beforeTokens - afterTokens) / beforeTokens) * 100;

      expect(reduction).toBeGreaterThan(90); // At least 90% reduction for large files
      expect(result.linesRead).toBeLessThan(100); // Should read much less
    });
  });

  describe("Cache Performance", () => {
    it("should eliminate token usage on cache hit", async () => {
      const content = "test content\n".repeat(100);
      const filePath = "/tmp/test-cache.ts";

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content.length,
        mtimeMs: Date.now(),
      });

      // First read (cache miss)
      const result1 = await readFileSmart(filePath, { useCache: true });
      expect(result1.fromCache).toBe(false);
      const tokens1 = Math.ceil(result1.content.length / 4);

      // Second read (cache hit)
      const result2 = await readFileSmart(filePath, { useCache: true });
      expect(result2.fromCache).toBe(true);
      const tokens2 = 0; // Cache hit = 0 tokens

      expect(tokens2).toBe(0);
      expect(tokens1).toBeGreaterThan(0);
    });
  });

  describe("Context Loading Performance", () => {
    it("should respect token limits", async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ size: 4000 }); // ~1000 tokens per file
      mockReadFileSync.mockReturnValue("content");

      const analysis = await analyzeContext({
        filePath: "test.ts",
        maxTokens: 5000, // Limit to 5K tokens
        maxDepth: 3,
      });

      // Should recommend selective loading if over limit
      if (analysis.totalSize > 5000) {
        expect(analysis.recommendation).not.toBe("load_all");
      }
    });
  });

  describe("End-to-End Performance", () => {
    it("should show overall token reduction", async () => {
      const largeContent = Array.from(
        { length: 2000 },
        (_, i) => `export function func${i}() { return ${i}; }`
      ).join("\n");
      const filePath = "/tmp/test-e2e.ts";

      mockReadFileSync.mockReturnValue(largeContent);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: largeContent.length,
        mtimeMs: Date.now(),
      });

      // Simulate workflow:
      // 1. Index file
      await indexFile(filePath);

      // 2. Read function selectively
      const readResult = await readFileSmart(filePath, {
        function: "func100",
        useCache: true,
      });

      // 3. Use compact output
      const verificationResult = {
        type: "verification",
        errors: [],
        files: 1,
        commits: 1,
      };
      const compact = compactify(verificationResult);

      // Verify optimizations
      expect(readResult.method).toBe("function");
      expect(readResult.linesRead).toBeLessThan(100);
      expect(compact.f).toBe(1);

      // Calculate token savings
      const fullFileTokens = Math.ceil(largeContent.length / 4);
      const selectiveTokens = Math.ceil(readResult.content.length / 4);
      const savings =
        ((fullFileTokens - selectiveTokens) / fullFileTokens) * 100;

      expect(savings).toBeGreaterThan(90);
    });
  });
});
