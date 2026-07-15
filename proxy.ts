import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/forgot-password(.*)',
  '/verify-otp(.*)',
  '/reset-password(.*)',
  '/verify-email(.*)',
  '/api/(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|verify-email).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Clerk auto-proxy path
    '/__clerk/:path*',
  ],
};
