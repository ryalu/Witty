'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { HelpCircle, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  return (
    <nav className="bg-[#DFF4FC]/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-blue-200/50 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-[64px]">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image src="/witty-logo.png" alt="Witty" width={40} height={40} className="drop-shadow-sm" />
            <span className="text-xl font-bold text-gray-700 dark:text-gray-200">Witty</span>
          </button>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/how-to-use')}
              className="dark:text-gray-200"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              사용 방법
            </Button>
            {userEmail && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="dark:text-gray-200 text-gray-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}