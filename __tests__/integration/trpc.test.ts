import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

describe("tRPC Integration Tests", () => {
  it("should create context successfully", async () => {
    const ctx = await createContext({});
    expect(ctx).toBeDefined();
    expect(ctx.db).toBeDefined();
  });

  it("should have user router mounted", () => {
    expect(appRouter.user).toBeDefined();
  });

  it("should have correct router type", () => {
    expect(typeof appRouter.createCaller).toBe("function");
  });
});
