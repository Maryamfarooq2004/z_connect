import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for the presence of the refresh token cookie set by our BFF
  const hasRefreshToken = request.cookies.has("zconnect_refresh_token");

  // Determine path categories
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = 
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname === "/forgot-password" || 
    pathname === "/verify-otp" || 
    pathname === "/reset-password";

  // Case 1: Route is protected (e.g. dashboard) but there is no session cookie
  if (isDashboardRoute && !hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Route is an auth page (login/signup) but the user is already authenticated
  if (isAuthRoute && hasRefreshToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/ (BFF route handlers which need direct execution)
     * - _next/static/ (static files)
     * - _next/image/ (image optimization)
     * - favicon.ico (site icon)
     * - verify-email (requires public access even when session is active or inactive)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|verify-email).*)",
  ],
};
