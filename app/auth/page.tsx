'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleGoogle() {
  setLoading(true);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    setError(error.message);
    setLoading(false);
  }
}

  async function handleEmailAuth() {
    setLoading(true);
    setError('');
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않아요.');
        setLoading(false);
      } else {
        router.push('/');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setMessage('인증 이메일을 보냈어요! 이메일을 확인해주세요 📧');
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Image src="/witty-logo.png" alt="Witty" width={64} height={64} />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? '로그인' : '회원가입'}
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            재미있고 똑똑하게 여행 계획! ✈️
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Google 로그인 */}
          <Button
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="w-full h-11 flex items-center gap-3 border-gray-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 {isLogin ? '로그인' : '가입'}
          </Button>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-400">또는</span>
            </div>
          </div>

          {/* 이메일/비밀번호 */}
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            />
            <Input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {message && <p className="text-sm text-green-600 text-center">{message}</p>}

          <Button
            onClick={handleEmailAuth}
            disabled={loading || !email || !password}
            className="w-full h-11"
          >
            {loading ? '처리 중...' : isLogin ? '이메일로 로그인' : '이메일로 가입'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
              className="text-blue-500 hover:underline font-medium"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}