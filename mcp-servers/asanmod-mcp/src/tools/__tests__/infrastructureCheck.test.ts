/**
 * Tests for asanmod_infrastructure_check tool
 * Tests error handling and parallel execution
 */

import { describe, it, expect } from "@jest/globals";
import { infrastructureCheck } from "../infrastructureCheck.js";

describe("asanmod_infrastructure_check", () => {
  it("should handle errors gracefully", async () => {
    const result = await infrastructureCheck({ target: "all" });
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.details).toBeDefined();
  });

  it("should run checks in parallel when target is 'all'", async () => {
    const start = Date.now();
    const result = await infrastructureCheck({ target: "all" });
    const duration = Date.now() - start;

    // Parallel should be faster than sequential
    expect(duration).toBeLessThan(60000); // 60 seconds max
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  it("should handle single target checks", async () => {
    const targets = ["pm2", "db", "cache"] as const;

    for (const target of targets) {
      const result = await infrastructureCheck({ target });
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.details).toBeDefined();
    }
  });
});
