'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createTripInfo } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';
import type { Category } from '@/types/trip';

interface AnalyzedInfo {
  imageUrl: string;
  category: Category;
  name: string;
  address: string | null;
  description: string | null;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params.id as string;

  const [infos, setInfos] = useState<AnalyzedInfo[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // URL 파라미터에서 데이터 가져오기
    const dataParam = searchParams.get('data');

    if (dataParam) {
      try {
        const decoded = decodeURIComponent(dataParam);
        const data = JSON.parse(decoded);
        console.log('URL에서 데이터 받음:', data);
        setInfos(data);
      } catch (error) {
        console.error('데이터 파싱 실패:', error);
        alert('데이터를 불러올 수 없습니다.');
        router.push(`/trips/${tripId}`);
      }
    } else {
      // localStorage에서 확인(백업)
      const stored = localStorage.getItem('analyzedResults');
      if (stored) {
        setInfos(JSON.parse(stored));
        localStorage.removeItem('analyzedResults'); // 사용 후 삭제
      } else {
        alert('분석 결과가 없습니다.');
        router.push(`/trips/${tripId}`);
      }
    }
  }, [searchParams, tripId, router]);

  function updateInfo(index: number, field: string, value: string) {
    setInfos((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);

    try {
      // 각 정보를 DB에 저장
      for (const info of infos) {
        await createTripInfo({
          trip_id: tripId,
          category: info.category,
          name: info.name,
          address: info.address,
          description: info.description,
          memo: null,
          image_url: info.imageUrl,
          order: 0,
        });
      }

      alert('모든 정보가 저장되었습니다! 🎉');
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (infos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/trips/${tripId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">AI 분석 결과 확인 ✨</CardTitle>
            <p className="text-sm text-gray-600">
              AI가 추출한 정보를 확인하고 수정하세요!
            </p>
          </CardHeader>
        </Card>

        {/* 분석 결과 카드들 */}
        <div className="space-y-6">
          {infos.map((info, index) => (
            <Card key={index}>
              <CardHeader>
                <Badge className={CATEGORIES[info.category].color}>
                  {CATEGORIES[info.category].emoji}{' '}
                  {CATEGORIES[info.category].label}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 이미지 */}
                <img
                  src={info.imageUrl}
                  alt={`분석 ${index + 1}`}
                  className="w-full h-48 object-cover rounded"
                />

                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    장소/가게 이름
                  </label>
                  <Input
                    value={info.name}
                    onChange={(e) => updateInfo(index, 'name', e.target.value)}
                  />
                </div>

                {/* 주소 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    주소
                  </label>
                  <Input
                    value={info.address || ''}
                    onChange={(e) =>
                      updateInfo(index, 'address', e.target.value)
                    }
                    placeholder="주소 (선택사항)"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    설명
                  </label>
                  <Textarea
                    value={info.description || ''}
                    onChange={(e) =>
                      updateInfo(index, 'description', e.target.value)
                    }
                    placeholder="영업시간, 가격, 특징 등"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 저장 버튼 */}
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full mt-6"
        >
          {saving ? (
            '저장 중...'
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {infos.length}개 정보 저장하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}