import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 불필요 경로
  if (pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // 쿠키에서 세션 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const token = request.cookies.get('sb-access-token')?.value
    || request.cookies.get(`sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|witty-logo.png|api|share).*)'],
};