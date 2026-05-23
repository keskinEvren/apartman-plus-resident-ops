import { router } from "../trpc";
import { userRouter } from "./user";
import { siteRouter } from "./site";

/**
 * Root tRPC Router
 * Register all sub-routers here
 */
export const appRouter = router({
  user: userRouter,
  site: siteRouter,
});

export type AppRouter = typeof appRouter;
