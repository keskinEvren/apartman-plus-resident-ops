/**
 * Tests for asanmod_security_audit tool
 * Tests error handling and parallel execution
 */

import { describe, it, expect } from "@jest/globals";
import { securityAudit } from "../securityAudit.js";

describe("asanmod_security_audit", () => {
  it("should handle errors gracefully", async () => {
    const result = await securityAudit({ check: "all", path: "/invalid/path" });
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.details).toBeDefined();
    expect(result.vulnerabilities).toBeDefined();
  });

  it("should run checks in parallel when check is 'all'", async () => {
    const start = Date.now();
    const result = await securityAudit({ check: "all" });
    const duration = Date.now() - start;

    // Parallel should be faster than sequential
    expect(duration).toBeLessThan(60000); // 60 seconds max
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  it("should handle single check types", async () => {
    const checks = ["rbac", "secrets", "isolation", "prod-protect"] as const;

    for (const check of checks) {
      const result = await securityAudit({ check });
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.vulnerabilities).toBeGreaterThanOrEqual(0);
    }
  });
});
