/**
 * Smart File Reader Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { readFileSmart, readFileRange } from "../smartFileReader.js";
import { cache } from "../../cache.js";
import * as fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Mock cache
jest.mock("../../cache.js", () => ({
  cache: {
    getFile: jest.fn(),
    setFile: jest.fn(),
  },
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
  findFunction: jest.fn((ast, name) =>
    name === "testFunction" ? { startLine: 10, endLine: 20 } : null
  ),
  findClass: jest.fn((ast, name) =>
    name === "TestClass" ? { startLine: 30, endLine: 50, methods: [] } : null
  ),
  findMethod: jest.fn((classInfo, name) =>
    name === "testMethod" ? { startLine: 35, endLine: 40 } : null
  ),
}));

describe("smartFileReader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("readFileSmart", () => {
    it("should read from cache if available", async () => {
      const mockCache = cache as jest.Mocked<typeof cache>;
      mockCache.getFile.mockReturnValue("cached content");

      const result = await readFileSmart("test.ts", { useCache: true });

      expect(result.fromCache).toBe(true);
      expect(result.content).toBe("cached content");
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it("should read full file when no options provided", async () => {
      const mockCache = cache as jest.Mocked<typeof cache>;
      mockCache.getFile.mockReturnValue(null);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        "file content\nline 2\nline 3"
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await readFileSmart("test.ts");

      expect(result.fromCache).toBe(false);
      expect(result.method).toBe("full");
      expect(result.content).toBe("file content\nline 2\nline 3");
    });

    it("should read function when function name provided", async () => {
      const mockCache = cache as jest.Mocked<typeof cache>;
      mockCache.getFile.mockReturnValue(null);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join("\n")
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await readFileSmart("test.ts", {
        function: "testFunction",
      });

      expect(result.method).toBe("function");
      expect(result.linesRead).toBeLessThan(50);
    });

    it("should read range when offset/limit provided", async () => {
      const mockCache = cache as jest.Mocked<typeof cache>;
      mockCache.getFile.mockReturnValue(null);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join("\n")
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await readFileSmart("test.ts", { offset: 10, limit: 20 });

      expect(result.method).toBe("range");
      expect(result.linesRead).toBe(20);
    });

    it("should cache result after reading", async () => {
      const mockCache = cache as jest.Mocked<typeof cache>;
      mockCache.getFile.mockReturnValue(null);
      (fs.readFileSync as jest.Mock).mockReturnValue("file content");
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await readFileSmart("test.ts", { useCache: true });

      expect(mockCache.setFile).toHaveBeenCalled();
    });
  });

  describe("readFileRange", () => {
    it("should read specified line range", () => {
      const content = Array.from(
        { length: 100 },
        (_, i) => `line ${i + 1}`
      ).join("\n");
      const result = readFileRange(content, 10, 19);

      const lines = result.split("\n");
      expect(lines.length).toBe(10);
      expect(lines[0]).toBe("line 10");
      expect(lines[9]).toBe("line 19");
    });

    it("should handle out of bounds", () => {
      const content = Array.from(
        { length: 10 },
        (_, i) => `line ${i + 1}`
      ).join("\n");
      const result = readFileRange(content, 5, 20);

      const lines = result.split("\n");
      expect(lines.length).toBe(6);
    });
  });
});
