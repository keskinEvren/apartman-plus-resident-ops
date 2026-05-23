import { router } from "../trpc";
import { userRouter } from "./user";
import { siteRouter } from "./site";
import { notificationRouter } from "./notification";
import { announcementRouter } from "./announcement";
import { ticketRouter } from "./ticket";
import { visitorRouter } from "./visitor";
import { packageRouter } from "./package";

/**
 * Root tRPC Router
 * Register all sub-routers here
 */
export const appRouter = router({
  user: userRouter,
  site: siteRouter,
  notification: notificationRouter,
  announcement: announcementRouter,
  ticket: ticketRouter,
  visitor: visitorRouter,
  package: packageRouter,
});

export type AppRouter = typeof appRouter;
