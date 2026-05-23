/**
 * Unit tests for verifyTypeScript tool
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { verifyTypeScript, TypeScriptResult } from "../verifyTypeScript.js";
import { execSync } from "child_process";
import { join } from "path";

// Mock execSync
jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

// Mock fs.existsSync
jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

// Mock paths utility
jest.mock("../../utils/paths.js", () => ({
  getWorkspaceRoot: jest.fn(() => "/tmp/workspace"),
}));

// Import mocked fs after mock setup
import { existsSync } from "fs";

describe("verifyTypeScript", () => {
  let testDir: string;
  let frontendDir: string;
  let backendDir: string;

  beforeEach(() => {
    testDir = "/tmp/asanmod-ts-test";
    frontendDir = join(testDir, "frontend");
    backendDir = join(testDir, "backend");

    // Default: both directories exist
    (existsSync as jest.Mock).mockImplementation((path: unknown) => {
      const pathStr = String(path);
      if (pathStr.includes("frontend") || pathStr.includes("backend")) {
        return true;
      }
      if (pathStr.includes("tsconfig.json")) {
        return true;
      }
      return false;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("clean project", () => {
    it("should return success=true for valid TypeScript", async () => {
      (execSync as jest.Mock).mockReturnValue("");

      const result = await verifyTypeScript(testDir);

      expect(result.success).toBe(true);
      expect(result.errors).toBe(0);
      expect(result.frontend.success).toBe(true);
      expect(result.backend.success).toBe(true);
    });

    it("should check frontend when frontend directory exists", async () => {
      (execSync as jest.Mock).mockReturnValue("");

      await verifyTypeScript(testDir);

      expect(execSync).toHaveBeenCalled();
    });
  });

  describe("project with errors", () => {
    it("should detect frontend TypeScript errors", async () => {
      (execSync as jest.Mock).mockReturnValue(
        "error TS2322: Type 'string' is not assignable to type 'number'.\nFound 1 error."
      );

      const result = await verifyTypeScript(testDir);

      expect(result.success).toBe(false);
      expect(result.frontend.success).toBe(false);
      expect(result.frontend.errors).toBe(1);
    });

    it("should detect backend TypeScript errors", async () => {
      (execSync as jest.Mock)
        .mockReturnValueOnce("")
        .mockReturnValueOnce(
          "error TS2304: Cannot find name 'undefinedVar'.\nFound 1 error."
        );

      const result = await verifyTypeScript(testDir);

      expect(result.success).toBe(false);
      expect(result.backend.success).toBe(false);
      expect(result.backend.errors).toBe(1);
    });

    it("should aggregate errors from both frontend and backend", async () => {
      (execSync as jest.Mock)
        .mockReturnValueOnce("error TS2322: Type error.\nFound 2 errors.")
        .mockReturnValueOnce("error TS2304: Cannot find name.\nFound 1 error.");

      const result = await verifyTypeScript(testDir);

      expect(result.success).toBe(false);
      expect(result.errors).toBe(3);
      expect(result.frontend.errors).toBe(2);
      expect(result.backend.errors).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should handle missing frontend directory", async () => {
      (existsSync as jest.Mock).mockImplementation((path: unknown) => {
        const pathStr = String(path);
        if (pathStr.includes("frontend")) return false;
        if (pathStr.includes("backend")) return true;
        if (pathStr.includes("tsconfig.json")) return true;
        return false;
      });
      (execSync as jest.Mock).mockReturnValue("");

      const result = await verifyTypeScript(testDir);

      expect(result.frontend.success).toBe(true);
      expect(result.frontend.errors).toBe(0);
    });

    it("should handle missing backend directory", async () => {
      (existsSync as jest.Mock).mockImplementation((path: unknown) => {
        const pathStr = String(path);
        if (pathStr.includes("frontend")) return true;
        if (pathStr.includes("backend")) return false;
        return false;
      });
      (execSync as jest.Mock).mockReturnValue("");

      const result = await verifyTypeScript(testDir);

      expect(result.backend.success).toBe(true);
      expect(result.backend.errors).toBe(0);
    });

    it("should handle execSync errors gracefully", async () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error("TypeScript check failed");
      });

      const result = await verifyTypeScript(testDir);

      expect(result.success).toBe(false);
      expect(result.frontend.success).toBe(false);
      expect(result.frontend.errors).toBeGreaterThanOrEqual(1);
    });

    it("should handle output without error count", async () => {
      (execSync as jest.Mock).mockReturnValue(
        "Some output without error count"
      );

      const result = await verifyTypeScript(testDir);

      expect(result.frontend.errors).toBe(0);
    });

    it("should use default path when path is not provided", async () => {
      (existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue("");

      const result = await verifyTypeScript();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
