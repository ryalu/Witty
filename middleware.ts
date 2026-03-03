import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 불필요 경로
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

  // Supabase v2 세션 쿠키 확인
  const cookies = request.cookies.getAll();
  console.log('쿠키 목록:', cookies.map(c => c.name)); // 배포 후 Vercel 로그에서 확인용

  const hasSession = cookies.some(
    (cookie) =>
      cookie.name.includes('auth-token') ||
      cookie.name.includes('sb-') 
  );

  if (!hasSession) {
    console.log('세션 없음, /auth로 리다이렉트');
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|witty-logo.png).*)'],
};