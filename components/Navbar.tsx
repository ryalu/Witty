'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-[64px]">
          {/* 로고 (홈 버튼) */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/witty-logo.png"
              alt="Witty"
              width={40}
              height={40}
              className="drop-shadow-sm"
            />
            <span className="text-xl font-bold text-gray-800">
              Witty
            </span>
          </button>

          {/* 오른쪽 메뉴 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/how-to-use')}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              사용 방법
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}