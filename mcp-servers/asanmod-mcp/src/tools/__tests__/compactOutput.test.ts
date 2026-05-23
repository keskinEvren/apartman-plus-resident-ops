/**
 * Compact Output Tests
 */

import { describe, it, expect } from "@jest/globals";
import {
  compactify,
  compactifyCheck,
  compactifyChecks,
  expand,
} from "../compactOutput.js";

describe("compactOutput", () => {
  describe("compactify", () => {
    it("should create compact output with minimal data", () => {
      const result = compactify({
        type: "verification",
        errors: [],
        files: 5,
        commits: 2,
      });

      expect(result.v).toBe("1.0");
      expect(result.t).toBe("verification");
      expect(result.s).toBe(0);
      expect(result.e).toEqual([]);
      expect(result.f).toBe(5);
      expect(result.c).toBe(2);
    });

    it("should handle errors correctly", () => {
      const result = compactify({
        type: "verification",
        errors: ["Error 1", "Error 2"],
        files: 0,
        commits: 0,
      });

      expect(result.s).toBe(1);
      expect(result.e).toEqual(["Error 1", "Error 2"]);
    });

    it("should handle warnings", () => {
      const result = compactify({
        type: "verification",
        warnings: ["Warning 1"],
        files: 0,
        commits: 0,
      });

      expect(result.s).toBe(2);
      expect(result.w).toEqual(["Warning 1"]);
    });

    it("should limit errors to 10", () => {
      const errors = Array.from({ length: 15 }, (_, i) => `Error ${i + 1}`);
      const result = compactify({
        type: "verification",
        errors,
        files: 0,
        commits: 0,
      });

      expect(result.e.length).toBe(10);
    });

    it("should include metadata", () => {
      const result = compactify({
        type: "verification",
        errors: [],
        files: 0,
        commits: 0,
        metadata: { workerId: "w1", taskId: "t1" },
      });

      expect(result.m).toBeDefined();
      expect(result.m?.ts).toBeDefined();
    });
  });

  describe("compactifyCheck", () => {
    it("should create compact check for passed check", () => {
      const result = compactifyCheck({
        passed: true,
        errorCount: 0,
      });

      expect(result.s).toBe(0);
      expect(result.e).toBe(0);
    });

    it("should create compact check for failed check", () => {
      const result = compactifyCheck({
        passed: false,
        errorCount: 5,
      });

      expect(result.s).toBe(1);
      expect(result.e).toBe(5);
    });

    it("should include error message for failed checks", () => {
      const result = compactifyCheck({
        passed: false,
        error: "Test error message",
      });

      expect(result.s).toBe(1);
      expect(result.d?.err).toBe("Test error message");
    });

    it("should truncate long error messages", () => {
      const longError = "a".repeat(200);
      const result = compactifyCheck({
        passed: false,
        error: longError,
      });

      expect(result.d?.err.length).toBeLessThanOrEqual(100);
    });
  });

  describe("compactifyChecks", () => {
    it("should compactify multiple checks", () => {
      const checks = {
        lint: { passed: true, errorCount: 0 },
        typescript: { passed: false, errorCount: 5 },
      };

      const result = compactifyChecks(checks);

      expect(result.lint.s).toBe(0);
      expect(result.typescript.s).toBe(1);
      expect(result.typescript.e).toBe(5);
    });
  });

  describe("expand", () => {
    it("should expand compact output to readable format", () => {
      const compact = {
        v: "1.0",
        t: "verification",
        s: 0,
        e: [],
        f: 5,
        c: 2,
      };

      const expanded = expand(compact);

      expect(expanded.version).toBe("1.0");
      expect(expanded.type).toBe("verification");
      expect(expanded.status).toBe("ok");
      expect(expanded.files).toBe(5);
      expect(expanded.commits).toBe(2);
    });

    it("should handle error status", () => {
      const compact = {
        v: "1.0",
        t: "verification",
        s: 1,
        e: ["Error 1"],
        f: 0,
        c: 0,
      };

      const expanded = expand(compact);

      expect(expanded.status).toBe("error");
      expect(expanded.errors).toEqual(["Error 1"]);
    });
  });
});
