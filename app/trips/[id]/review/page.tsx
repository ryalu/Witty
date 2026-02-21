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
  memo?: string;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params.id as string;

  const [infos, setInfos] = useState<AnalyzedInfo[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get('data');

    if (dataParam) {
      try {
        const decoded = decodeURIComponent(dataParam);
        const data = JSON.parse(decoded);
        setInfos(data);
      } catch (error) {
        console.error('데이터 파싱 실패:', error);
        alert('데이터를 불러올 수 없습니다.');
        router.push(`/trips/${tripId}`);
      }
    } else {
      const stored = localStorage.getItem('analyzedResults');
      if (stored) {
        setInfos(JSON.parse(stored));
        localStorage.removeItem('analyzedResults');
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
      for (const info of infos) {
        await createTripInfo({
          trip_id: tripId,
          category: info.category,
          name: info.name,
          address: info.address,
          description: info.description,
          memo: info.memo || null,
          image_url: info.imageUrl,
          order: 0,
          latitude: info.latitude || null,
          longitude: info.longitude || null,
          place_id: info.place_id || null,
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
                {info.imageUrl && (
                  <img
                    src={info.imageUrl}
                    alt={`분석 ${index + 1}`}
                    className="w-full h-48 object-cover rounded"
                  />
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    장소/가게 이름
                  </label>
                  <Input
                    value={info.name}
                    onChange={(e) => updateInfo(index, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">주소</label>
                  <Input
                    value={info.address || ''}
                    onChange={(e) =>
                      updateInfo(index, 'address', e.target.value)
                    }
                    placeholder="주소 (선택사항)"
                  />
                  {info.latitude && info.longitude && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ 위치 정보 자동 추가됨 ({info.latitude.toFixed(4)}, {info.longitude.toFixed(4)})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">설명</label>
                  <Textarea
                    value={info.description || ''}
                    onChange={(e) =>
                      updateInfo(index, 'description', e.target.value)
                    }
                    placeholder="영업시간, 가격, 특징 등"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    💭 내 메모
                  </label>
                  <Textarea
                    value={info.memo || ''}
                    onChange={(e) => updateInfo(index, 'memo', e.target.value)}
                    placeholder="여기 꼭 가보기!, 예약 완료, 친구 추천 등"
                    rows={2}
                    className="bg-yellow-50 border-yellow-200"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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