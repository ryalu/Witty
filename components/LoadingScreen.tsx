'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#DFF4FC] to-white transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 로고 */}
      <div className="animate-bounce-slow">
        <Image
          src="/witty-logo.png"
          alt="Witty"
          width={200}
          height={200}
          priority
        />
      </div>

      {/* 텍스트 */}
      <div className="mt-8 space-y-2 text-center">
        <h1 className="text-5xl font-bold text-gray-800 animate-fade-in">
          Witty
        </h1>
        <p className="text-xl text-gray-600 animate-fade-in-delay">
          재미있고 똑똑하게 여행 계획하기!
        </p>
      </div>

      {/* 로딩 도트 */}
      <div className="mt-8 flex gap-2">
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-100"></div>
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  );
}