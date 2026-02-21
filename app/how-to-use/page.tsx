'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Sparkles, CheckCircle, Map, Smartphone, Star } from 'lucide-react';
import Image from 'next/image';

export default function HowToUsePage() {
  const router = useRouter();

  const steps = [
    {
      icon: Upload,
      title: '1. 이미지 업로드',
      description: '인스타그램이나 블로그에서 여행 정보 스크린샷을 찍어 업로드하세요',
      tips: ['여러 장 한번에 업로드 가능', '드래그앤드롭으로 간편하게'],
    },
    {
      icon: Sparkles,
      title: '2. AI 자동 분석',
      description: 'AI가 이미지에서 장소명, 주소, 설명을 자동으로 추출합니다',
      tips: ['한 이미지에 여러 장소도 OK', '카테고리 자동 분류 (맛집/관광지/숙소 등)'],
    },
    {
      icon: CheckCircle,
      title: '3. 확인 & 수정',
      description: 'AI가 추출한 정보를 확인하고 필요하면 수정하세요',
      tips: ['개인 메모 추가 가능', '중요도 별표로 표시', 'Day별로 일정 분류'],
    },
    {
      icon: Map,
      title: '4. 지도에서 확인',
      description: '모든 장소가 지도에 자동으로 표시됩니다',
      tips: ['카테고리별 색상 구분', '방문 완료 체크 가능', '드래그로 순서 변경'],
    },
    {
      icon: Smartphone,
      title: '5. Google Maps 연동',
      description: '여행 중 버튼 하나로 Google Maps 앱에서 바로 길찾기!',
      tips: ['모바일에서 앱 자동 실행', '모든 장소 링크 한번에 복사', '친구들과 공유 가능'],
    },
  ];

  const features = [
    {
      icon: Star,
      title: '중요도 표시',
      description: '별 3단계로 꼭 가야 할 곳 표시',
    },
    {
      icon: CheckCircle,
      title: '체크리스트',
      description: '방문 완료한 곳 체크하며 여행',
    },
    {
      icon: Map,
      title: '스마트 지도',
      description: '카테고리별 색상, 중요도 표시',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
            <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
            >
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
            </Button>

            {/* 헤더 */}
            <Card className="mb-8">
            <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                <Image
                    src="/witty-logo.png"
                    alt="Witty"
                    width={80}
                    height={80}
                />
                </div>
                <CardTitle className="text-3xl mb-2">Witty 사용 방법</CardTitle>
                <p className="text-gray-600">
                3분 안에 여행 계획 완성! 간단한 5단계만 따라하세요 ✨
                </p>
            </CardHeader>
            </Card>

            {/* 단계별 가이드 */}
            <div className="space-y-6 mb-8">
            {steps.map((step, index) => (
                <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                        {step.description}
                        </p>
                    </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <ul className="space-y-2">
                    {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{tip}</span>
                        </li>
                    ))}
                    </ul>
                </CardContent>
                </Card>
            ))}
            </div>

            {/* 주요 기능 */}
            <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-2xl">주요 기능</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                {features.map((feature, index) => (
                    <div key={index} className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                ))}
                </div>
            </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardContent className="py-8 text-center">
                <h2 className="text-2xl font-bold mb-4">
                준비됐나요? 지금 바로 시작하세요! 🚀
                </h2>
                <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push('/trips/new')}
                className="text-lg h-14 px-8"
                >
                첫 여행 만들기
                </Button>
            </CardContent>
            </Card>
      </div>
    </div>
  );
}