import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth guard middleware.
 * Protects /dashboard/* routes by checking for auth-token cookie or header.
 * Since the app uses localStorage for token storage (client-side),
 * we check for a custom cookie that gets set on login.
 *
 * For now, this is a lightweight client-side redirect approach:
 * The middleware checks the cookie. If missing, redirect to /login.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  // If no auth cookie, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
