'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        const redirect = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('redirect_after_login');
        router.push(redirect || '/');
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>로그인 처리 중...</p>
    </div>
  );
}