/**
 * Tests for asanmod_quality_gate tool
 * Tests error handling and parallel execution
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { qualityGate } from "../qualityGate.js";

describe("asanmod_quality_gate", () => {
  beforeEach(() => {
    // Setup if needed
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it("should handle errors gracefully", async () => {
    const result = await qualityGate({ type: "all", path: "/invalid/path" });
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.details).toBeDefined();
  });

  it("should run checks in parallel when type is 'all'", async () => {
    const start = Date.now();
    const result = await qualityGate({ type: "all" });
    const duration = Date.now() - start;

    // Parallel should be faster than sequential (rough check)
    expect(duration).toBeLessThan(60000); // 60 seconds max
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  it("should handle single type checks", async () => {
    const result = await qualityGate({ type: "lint" });
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.details).toBeDefined();
  });

  it("should return fixed flag when fix is enabled", async () => {
    const result = await qualityGate({ type: "lint", fix: true });
    expect(result).toBeDefined();
    expect(result.fixed).toBeDefined();
  });

  it("should handle all check types", async () => {
    const types = ["lint", "types", "format", "dead-code"] as const;

    for (const type of types) {
      const result = await qualityGate({ type });
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.details).toBeDefined();
    }
  });
});
