/**
 * Unit tests for verifyLint tool
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { verifyLint, LintResult } from "../verifyLint.js";
import { execSync } from "child_process";
import { join } from "path";

// Mock execSync
jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

// Mock fs functions
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock cache
jest.mock("../../cache.js", () => ({
  cache: {
    get: jest.fn(() => null),
    set: jest.fn(),
    getLintKey: jest.fn((path: string, hash: string) => `lint:${path}:${hash}`),
  },
}));

// Mock paths utility
jest.mock("../../utils/paths.js", () => ({
  getWorkspaceRoot: jest.fn(() => "/tmp/workspace"),
}));

// Import mocked fs after mock setup
import { existsSync, readFileSync } from "fs";

describe("verifyLint", () => {
  let testDir: string;
  let frontendDir: string;
  let backendDir: string;

  beforeEach(() => {
    testDir = "/tmp/asanmod-lint-test";
    frontendDir = join(testDir, "frontend");
    backendDir = join(testDir, "backend");

    // Default: both directories exist
    (existsSync as jest.Mock).mockImplementation((path: unknown) => {
      const pathStr = String(path);
      if (pathStr.includes("frontend") || pathStr.includes("backend")) {
        return true;
      }
      if (pathStr.includes("package.json")) {
        return true;
      }
      return false;
    });

    // Default: return valid package.json
    (readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        scripts: { lint: "eslint ." },
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("clean project", () => {
    it("should return errors=0 for valid code", async () => {
      (execSync as jest.Mock).mockReturnValue("✓ No linting errors found\n");

      const result = await verifyLint(testDir);

      expect(result.success).toBe(true);
      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
    });

    it("should return success=true when no errors or warnings", async () => {
      (execSync as jest.Mock).mockReturnValue("✓ All files pass linting\n");

      const result = await verifyLint(testDir);

      expect(result.success).toBe(true);
      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
    });
  });

  describe("project with errors", () => {
    it("should detect eslint errors", async () => {
      (execSync as jest.Mock).mockReturnValue(`
        /test/file.ts
          1:5  error  'x' is assigned a value but never used  @typescript-eslint/no-unused-vars
          2:10 error  Missing return type annotation           @typescript-eslint/explicit-function-return-type
        
        ✖ 2 errors found
      `);

      const result = await verifyLint(testDir);

      expect(result.success).toBe(false);
      expect(result.errors).toBeGreaterThan(0);
    });

    it("should detect warnings", async () => {
      (execSync as jest.Mock).mockReturnValue(`
        /test/file.ts
          1:5  warning  'console.log' should not be used  no-console
        
        ✖ 0 errors, 1 warning found
      `);

      const result = await verifyLint(testDir);

      expect(result.success).toBe(false);
      expect(result.warnings).toBeGreaterThan(0);
    });

    it("should parse errors and warnings from output", async () => {
      (execSync as jest.Mock).mockReturnValue(`
        /test/file.ts
          1:5  error    'x' is unused  @typescript-eslint/no-unused-vars
          2:10 warning  console.log    no-console
        
        ✖ 1 error, 1 warning
      `);

      const result = await verifyLint(testDir);

      expect(result.success).toBe(false);
      expect(result.errors).toBeGreaterThanOrEqual(1);
      expect(result.warnings).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    it("should handle missing directories gracefully", async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      const result = await verifyLint(testDir);

      expect(result.success).toBe(true);
      expect(result.errors).toBe(0);
    });

    it("should handle execSync errors", async () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error("Command failed");
      });

      const result = await verifyLint(testDir);

      expect(result.success).toBe(false);
      expect(result.errors).toBeGreaterThanOrEqual(1);
    });

    it("should use default path when path is not provided", async () => {
      (existsSync as jest.Mock).mockReturnValue(true);
      (execSync as jest.Mock).mockReturnValue("✓ No linting errors\n");

      const result = await verifyLint();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should handle output without error/warning counts", async () => {
      (execSync as jest.Mock).mockReturnValue("Some output without counts");

      const result = await verifyLint(testDir);

      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
      expect(result.success).toBe(true);
    });
  });

  describe("caching", () => {
    it("should return cached result when available", async () => {
      const { cache } = await import("../../cache.js");
      const cachedResult: LintResult = {
        success: true,
        errors: 0,
        warnings: 0,
      };

      (cache.get as jest.Mock).mockReturnValue(cachedResult);

      const result = await verifyLint(testDir);

      expect(result.success).toBe(true);
      expect(result.errors).toBe(0);
    });
  });
});
