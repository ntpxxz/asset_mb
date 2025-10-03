import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Only the main login page is public now
  const isPublicPath = pathname === '/login';

  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionCookie && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};