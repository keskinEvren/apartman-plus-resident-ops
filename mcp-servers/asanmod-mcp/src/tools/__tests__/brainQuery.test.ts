/**
 * Tests for asanmod_brain_query tool
 * Tests null result handling and error handling
 */

import { describe, it, expect } from "@jest/globals";
import { brainQuery } from "../brainQuery.js";

describe("asanmod_brain_query", () => {
  it("should handle null results gracefully", async () => {
    const result = await brainQuery("nonexistent query that returns null");
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    // Should not throw even if Brain returns null
    expect(result.entities).toBeDefined();
    expect(result.patterns).toBeDefined();
    expect(result.solutions).toBeDefined();
  });

  it("should handle errors gracefully", async () => {
    // Test with invalid query
    const result = await brainQuery("");
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  it("should return valid structure", async () => {
    const result = await brainQuery("ASANMOD");
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.entities).toBeDefined();
    expect(result.patterns).toBeDefined();
    expect(result.solutions).toBeDefined();
  });
});
