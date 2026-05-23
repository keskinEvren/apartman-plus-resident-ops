import { router } from "../trpc";
import { userRouter } from "./user";

/**
 * Root tRPC Router
 * Register all sub-routers here
 */
export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
