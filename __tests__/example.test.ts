/**
 * Example Test
 * Shows testing patterns for this project
 */

describe("Example Tests", () => {
  describe("Basic assertions", () => {
    it("should pass a simple test", () => {
      expect(1 + 1).toBe(2);
    });

    it("should work with async operations", async () => {
      const result = await Promise.resolve("hello");
      expect(result).toBe("hello");
    });
  });

  describe("Object matching", () => {
    it("should match object properties", () => {
      const user = { id: "1", name: "Test User", email: "test@example.com" };
      expect(user).toMatchObject({
        name: "Test User",
        email: "test@example.com",
      });
    });
  });
});

// Example: Testing a utility function
// import { formatDate } from "@/lib/utils";
//
// describe("formatDate", () => {
//   it("should format date correctly", () => {
//     const date = new Date("2026-01-15");
//     expect(formatDate(date)).toContain("2026");
//   });
// });
