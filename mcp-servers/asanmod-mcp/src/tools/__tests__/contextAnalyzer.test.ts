/**
 * Context Analyzer Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  analyzeContext,
  loadContextSmart,
  getMinimalContext,
} from "../contextAnalyzer.js";
import * as fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Mock dependencyAnalyzer
jest.mock("../../utils/dependencyAnalyzer.js", () => ({
  getContextFiles: jest.fn((filePath, maxDepth) => [
    filePath,
    `${filePath}.dep1`,
    `${filePath}.dep2`,
  ]),
  prioritizeFiles: jest.fn((files) => files),
  buildDependencyGraph: jest.fn(() => ({
    nodes: new Map(),
    roots: [],
    leaves: [],
  })),
}));

// Mock smartFileReader
jest.mock("../smartFileReader.js", () => ({
  readFileSmart: jest.fn(async (filePath, options: any) => ({
    content: `content of ${filePath}`,
    fromCache: false,
    linesRead: 10,
    totalLines: 100,
    method: options?.limit ? "range" : "full",
  })),
}));

describe("contextAnalyzer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 4000 }); // ~1000 tokens
  });

  describe("analyzeContext", () => {
    it("should analyze context requirements", async () => {
      const result = await analyzeContext({
        filePath: "test.ts",
        maxTokens: 100000,
        maxDepth: 3,
      });

      expect(result.files.length).toBeGreaterThan(0);
      expect(result.totalSize).toBeGreaterThan(0);
      expect(result.prioritized.length).toBeGreaterThan(0);
      expect(result.recommendation).toBeDefined();
    });

    it("should recommend load_all when under token limit", async () => {
      const result = await analyzeContext({
        filePath: "test.ts",
        maxTokens: 100000,
      });

      expect(result.recommendation).toBe("load_all");
    });

    it("should recommend load_selective when over token limit", async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 500000 }); // ~125K tokens
      const result = await analyzeContext({
        filePath: "test.ts",
        maxTokens: 100000,
        selective: true,
      });

      expect(result.recommendation).toBe("load_selective");
    });
  });

  describe("loadContextSmart", () => {
    it("should load context respecting token limits", async () => {
      const context = await loadContextSmart({
        filePath: "test.ts",
        maxTokens: 5000,
      });

      expect(context.size).toBeGreaterThan(0);
      // Should not exceed token limit significantly
    });

    it("should use selective reading for large files", async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 50000 }); // Large file
      const { readFileSmart } = await import("../smartFileReader.js");

      await loadContextSmart({
        filePath: "test.ts",
        maxTokens: 10000,
        selective: true,
      });

      // Should use selective reading
      expect(readFileSmart).toHaveBeenCalled();
    });
  });

  describe("getMinimalContext", () => {
    it("should return minimal context files", () => {
      const files = getMinimalContext("test.ts", 5);

      expect(files.length).toBeLessThanOrEqual(5);
    });
  });
});
