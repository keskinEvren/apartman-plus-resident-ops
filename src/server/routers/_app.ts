import { router } from "../trpc";
import { userRouter } from "./user";
import { siteRouter } from "./site";
import { notificationRouter } from "./notification";
import { announcementRouter } from "./announcement";

/**
 * Root tRPC Router
 * Register all sub-routers here
 */
export const appRouter = router({
  user: userRouter,
  site: siteRouter,
  notification: notificationRouter,
  announcement: announcementRouter,
});

export type AppRouter = typeof appRouter;
