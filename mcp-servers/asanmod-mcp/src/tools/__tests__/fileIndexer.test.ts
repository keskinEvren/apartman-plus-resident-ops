/**
 * File Indexer Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  indexFile,
  getFileIndex,
  findFunctionInIndex,
  findClassInIndex,
  getFileDependencies,
  getIndexStats,
  clearIndex,
} from "../fileIndexer.js";
import * as fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  statSync: jest.fn(),
}));

// Mock fileHash
jest.mock("../../utils/fileHash.js", () => ({
  calculateFileHash: jest.fn(() => ({
    hash: "test-hash",
    size: 1000,
    mtime: Date.now(),
  })),
}));

// Mock astParser
jest.mock("../../utils/astParser.js", () => ({
  parseAST: jest.fn(() => ({
    functions: [
      { name: "testFunction", startLine: 10, endLine: 20, type: "function" },
    ],
    classes: [
      {
        name: "TestClass",
        startLine: 30,
        endLine: 50,
        methods: [
          { name: "testMethod", startLine: 35, endLine: 40, type: "method" },
        ],
      },
    ],
    imports: ["import1", "import2"],
  })),
}));

describe("fileIndexer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearIndex();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ mtimeMs: Date.now() });
    (fs.readFileSync as jest.Mock).mockReturnValue("test content");
  });

  describe("indexFile", () => {
    it("should index a file successfully", async () => {
      const result = await indexFile("test.ts");

      expect(result.path).toBe("test.ts");
      expect(result.functions.length).toBe(1);
      expect(result.classes.length).toBe(1);
      expect(result.imports.length).toBe(2);
      expect(result.hash).toBe("test-hash");
    });

    it("should return cached index if file unchanged", async () => {
      await indexFile("test.ts");
      const result = await indexFile("test.ts");

      // Should use cached version (same hash)
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it("should throw error if file not found", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(indexFile("nonexistent.ts")).rejects.toThrow();
    });
  });

  describe("getFileIndex", () => {
    it("should return null for unindexed file", () => {
      const result = getFileIndex("unindexed.ts");
      expect(result).toBeNull();
    });

    it("should return index for indexed file", async () => {
      await indexFile("test.ts");
      const result = getFileIndex("test.ts");

      expect(result).not.toBeNull();
      expect(result?.path).toBe("test.ts");
    });
  });

  describe("findFunctionInIndex", () => {
    it("should find function in indexed file", async () => {
      await indexFile("test.ts");
      const result = findFunctionInIndex("test.ts", "testFunction");

      expect(result).not.toBeNull();
      expect(result?.startLine).toBe(10);
      expect(result?.endLine).toBe(20);
    });

    it("should return null for non-existent function", async () => {
      await indexFile("test.ts");
      const result = findFunctionInIndex("test.ts", "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findClassInIndex", () => {
    it("should find class in indexed file", async () => {
      await indexFile("test.ts");
      const result = findClassInIndex("test.ts", "TestClass");

      expect(result).not.toBeNull();
      expect(result?.startLine).toBe(30);
      expect(result?.endLine).toBe(50);
    });
  });

  describe("getFileDependencies", () => {
    it("should return imports for indexed file", async () => {
      await indexFile("test.ts");
      const result = getFileDependencies("test.ts");

      expect(result).toEqual(["import1", "import2"]);
    });

    it("should return empty array for unindexed file", () => {
      const result = getFileDependencies("unindexed.ts");
      expect(result).toEqual([]);
    });
  });

  describe("getIndexStats", () => {
    it("should return correct statistics", async () => {
      await indexFile("test.ts");
      const stats = getIndexStats();

      expect(stats.totalFiles).toBe(1);
      expect(stats.totalFunctions).toBe(1);
      expect(stats.totalClasses).toBe(1);
      expect(stats.totalImports).toBe(2);
    });
  });
});
