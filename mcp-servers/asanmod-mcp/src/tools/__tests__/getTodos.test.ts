/**
 * Tests for asanmod_get_todos tool
 * Tests error handling
 */

import { describe, it, expect } from "@jest/globals";
import { getTodos } from "../getTodos.js";

describe("asanmod_get_todos", () => {
  it("should handle errors gracefully", async () => {
    const result = await getTodos("/invalid/path");
    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(Array.isArray(result.todos)).toBe(true);
    expect(result.count).toBeGreaterThanOrEqual(0);
    expect(result.countsByType).toBeDefined();
  });

  it("should return empty result on invalid path", async () => {
    const result = await getTodos("/nonexistent/path");
    expect(result.todos).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.countsByType.TODO).toBe(0);
    expect(result.countsByType.FIXME).toBe(0);
  });

  it("should scan current directory", async () => {
    const result = await getTodos(".");
    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(Array.isArray(result.todos)).toBe(true);
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
