/**
 * Unit tests for checkProductionReady tool
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { checkProductionReady } from "../checkProductionReady.js";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

jest.mock("../../rules.js", () => ({
  getRule: jest.fn(() => ({
    forbiddenWords: ["TODO", "FIXME", "MOCK", "PLACEHOLDER", "STUB"],
  })),
}));

describe("checkProductionReady", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(join(tmpdir(), "asanmod-prod-test-"));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should return success=true when no forbidden words found", async () => {
    await fs.writeFile(
      join(testDir, "clean.ts"),
      "export const x = 1;\n",
      "utf-8"
    );

    const result = await checkProductionReady(testDir);

    expect(result.success).toBe(true);
    expect(result.found).toEqual([]);
    expect(result.count).toBe(0);
  });

  it("should detect TODO", async () => {
    await fs.writeFile(
      join(testDir, "a.ts"),
      "// TODO: implement\nexport const a = 1;\n",
      "utf-8"
    );

    const result = await checkProductionReady(testDir);

    expect(result.success).toBe(false);
    expect(result.found).toContain("TODO");
    expect(result.count).toBeGreaterThan(0);
  });

  it("should detect FIXME", async () => {
    await fs.writeFile(
      join(testDir, "b.ts"),
      "// FIXME: fix this\nexport const b = 1;\n",
      "utf-8"
    );

    const result = await checkProductionReady(testDir);

    expect(result.success).toBe(false);
    expect(result.found).toContain("FIXME");
  });

  it("should detect MOCK", async () => {
    await fs.writeFile(
      join(testDir, "c.ts"),
      "const mockData = {};\nexport default mockData;\n",
      "utf-8"
    );

    const result = await checkProductionReady(testDir);

    expect(result.success).toBe(false);
    expect(result.found).toContain("MOCK");
  });

  it("should detect multiple forbidden words", async () => {
    await fs.writeFile(
      join(testDir, "d.ts"),
      "// TODO: one\n// FIXME: two\nconst stub = 1;\n",
      "utf-8"
    );

    const result = await checkProductionReady(testDir);

    expect(result.success).toBe(false);
    expect(result.count).toBeGreaterThanOrEqual(2);
  });

  it("should handle missing rule gracefully", async () => {
    const { getRule } = await import("../../rules.js");
    (getRule as unknown as jest.Mock).mockReturnValue(null);

    await fs.writeFile(join(testDir, "a.ts"), "// TODO: implement\n", "utf-8");

    const result = await checkProductionReady(testDir);

    expect(result.success).toBe(true);
    expect(result.found).toEqual([]);
  });
});
