import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function will be called for every request that matches the config
export function middleware(request: NextRequest) {
  // Get the session cookie from the request
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/admin/login'];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(publicPath => pathname.startsWith(publicPath));

  // If there's no session cookie and the user is trying to access a protected page
  if (!sessionCookie && !isPublicPath) {
    // Redirect them to the login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is logged in (has a session cookie) and tries to access a login page
  if (sessionCookie && isPublicPath) {
    // Redirect them to the dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If none of the above, allow the request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};