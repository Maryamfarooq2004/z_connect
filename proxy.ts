import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

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
