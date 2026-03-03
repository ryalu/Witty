import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/share') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/witty-logo.png'
  ) {
    return NextResponse.next();
  }

  const cookieStore = request.cookies;
  const hasSession = cookieStore.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|witty-logo.png).*)'],
};