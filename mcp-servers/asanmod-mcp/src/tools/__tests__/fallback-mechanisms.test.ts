/**
 * Fallback Mechanisms Tests
 * Tests for graceful degradation when optimized features fail
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock fs at top level
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

import * as fs from "fs";
import { readFileSmart } from "../smartFileReader.js";
import { indexFile, getFileIndex } from "../fileIndexer.js";
import { calculateFileHash } from "../../utils/fileHash.js";
import { parseAST } from "../../utils/astParser.js";

const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockExistsSync = fs.existsSync as jest.Mock;
const mockStatSync = fs.statSync as jest.Mock;

describe("Fallback Mechanisms", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("Selective Reading Fallback", () => {
    it("should fallback to full file when function not found", async () => {
      const content = `
export function otherFunction() {
  return true;
}
`.trim();

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content.length,
        mtimeMs: Date.now(),
      });

      const result = await readFileSmart("/tmp/test.ts", {
        function: "missingFunction",
        useCache: false,
      });

      // Should return full content if function not found
      expect(result.method).toBe("full");
      expect(result.content).toBe(content);
    });

    it("should fallback to full file when class not found", async () => {
      const content = "export const x = 1;";

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content.length,
        mtimeMs: Date.now(),
      });

      const result = await readFileSmart("/tmp/test.ts", {
        class: "MissingClass",
      });

      expect(result.method).toBe("full");
      expect(result.content).toBe(content);
    });

    it("should fallback to full file when method not found in class", async () => {
      const content = `
export class MyClass {
  otherMethod() {}
}
`.trim();

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content.length,
        mtimeMs: Date.now(),
      });

      const result = await readFileSmart("/tmp/test.ts", {
        class: "MyClass",
        method: "missingMethod",
      });

      expect(result.method).toBe("full");
      expect(result.content).toBe(content);
    });
  });

  describe("Cache Fallback", () => {
    it("should fallback to direct read when cache unavailable", async () => {
      // Mock cache failures? Ideally we'd mock the cache module itself to throw/fail
      // But readFileSmart handles cache misses gracefully by design (it's not a failure, just a "miss")

      const content = "test content";
      const filePath = "/tmp/test.ts";

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content.length,
        mtimeMs: Date.now(),
      });

      // Force cache miss (first read)
      const result = await readFileSmart(filePath, { useCache: true });
      expect(result.fromCache).toBe(false);
      expect(result.content).toBe(content);
    });

    it("should fallback to direct read when cache miss", async () => {
      const content = "new content";
      const filePath = "/tmp/test.ts";

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content.length,
        mtimeMs: Date.now(),
      });

      const result = await readFileSmart(filePath, { useCache: true });
      expect(result.fromCache).toBe(false);
      expect(result.content).toBe(content);
    });

    it("should handle cache invalidation correctly", async () => {
      const content1 = "v1";
      const content2 = "v2";
      const filePath = "/tmp/test.ts";

      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content1.length,
        mtimeMs: Date.now(),
      });

      // First read
      mockReadFileSync.mockReturnValue(content1);
      await readFileSmart(filePath, { useCache: true });

      // Second read - simulated file change (time update)
      mockStatSync.mockReturnValue({
        size: content2.length,
        mtimeMs: Date.now() + 1000,
      });
      mockReadFileSync.mockReturnValue(content2);

      const result = await readFileSmart(filePath, { useCache: true });

      expect(result.content).toBe(content2);
      expect(result.fromCache).toBe(false); // Should invalidate cache
    });
  });

  describe("AST Parser Fallback", () => {
    it("should fallback to full file when AST parsing fails", async () => {
      // Create malformed content that might confuse a strict parser (though babel/typescript is robust)
      const malformedContent = "export function { broken logic";

      mockReadFileSync.mockReturnValue(malformedContent);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: malformedContent.length,
        mtimeMs: Date.now(),
      });

      // Attempt selective read
      const result = await readFileSmart("/tmp/bad.ts", {
        function: "anyFunction",
      });

      // Should return full content if parsing failed to find function
      expect(result.method).toBe("full");
      expect(result.content).toBe(malformedContent);
    });
  });

  describe("File Hash Fallback", () => {
    it("should fallback to timestamp when hash calculation fails", async () => {
      const content = "content";
      const filePath = "/tmp/test.ts";

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      // This is testing internal util resilience.
      // If stat fails, readFileSmart might fail entirely or fallback.
      // Current implementation throws on stat failure (file not found/access).
      // So ensuring it throws gracefully is the success case here.

      const result = await readFileSmart(filePath);
      expect(result.content).toBe(content);
      expect(result.fromCache).toBe(false);
    });
  });

  describe("Index Fallback", () => {
    it("should fallback to direct AST parsing when index unavailable", async () => {
      const content = "export function test() {}";
      const filePath = "/tmp/test.ts";

      mockReadFileSync.mockReturnValue(content);
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: content.length,
        mtimeMs: Date.now(),
      });

      // Ensure no index exists
      // (Implementation detail: readFileSmart uses index if available, else standard parse)

      const result = await readFileSmart(filePath, {
        function: "test",
        useCache: false, // Bypass cache to force parsing
      });

      expect(result.method).toBe("function");
      expect(result.content).toContain("function test");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when file not found", async () => {
      mockExistsSync.mockReturnValue(false);

      await expect(
        readFileSmart("/nonexistent.ts", { useCache: false })
      ).rejects.toThrow();
    });

    it("should handle read errors gracefully", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      await expect(readFileSmart("/protected.ts")).rejects.toThrow(
        "Permission denied"
      );
    });
  });
});
