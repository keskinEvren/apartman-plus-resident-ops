import { router } from "../trpc";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { siteRouter } from "./site";
import { notificationRouter } from "./notification";
import { announcementRouter } from "./announcement";
import { ticketRouter } from "./ticket";
import { visitorRouter } from "./visitor";
import { packageRouter } from "./package";
import { bookingRouter } from "./booking";
import { amenityRouter } from "./amenity";
import { invitationRouter } from "./invitation";
import { onboardingRouter } from "./onboarding";

/**
 * Root tRPC Router
 * Register all sub-routers here
 */
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  site: siteRouter,
  notification: notificationRouter,
  announcement: announcementRouter,
  ticket: ticketRouter,
  visitor: visitorRouter,
  package: packageRouter,
  booking: bookingRouter,
  amenity: amenityRouter,
  invitation: invitationRouter,
  onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
