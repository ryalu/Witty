'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createTripInfo } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Sparkles, MapPin, Star, Plus, X, Upload } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';
import type { Category } from '@/types/trip';

interface AnalyzedInfo {
  images: string[];
  category: Category;
  name: string;
  address: string | null;
  description: string | null;
  memo: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  importance: number;
  day_number: number | null;
  searching?: boolean;
}

// 클라이언트 이미지 압축
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const maxSize = 1200;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [infos, setInfos] = useState<AnalyzedInfo[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('reviewData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = parsed.map((item: any) => ({
          ...item,
          images: item.images || (item.imageUrl ? [item.imageUrl] : []),
          memo: item.memo || '',
          importance: item.importance ?? 0,
          day_number: item.day_number ?? null,
          latitude: item.latitude ?? null,
          longitude: item.longitude ?? null,
          place_id: item.place_id ?? null,
        }));
        setInfos(normalized);
        sessionStorage.removeItem('reviewData');
      } catch (error) {
        console.error('데이터 파싱 실패:', error);
        alert('데이터를 불러올 수 없습니다.');
        router.push(`/trips/${tripId}`);
      }
    } else {
      alert('분석 결과가 없습니다.');
      router.push(`/trips/${tripId}`);
    }
  }, [tripId, router]);

  // 필드 업데이트
  function updateInfo(index: number, field: string, value: any) {
    setInfos(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  }

  // 이미지 추가
  async function handleAddImages(index: number, files: FileList) {
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/')) continue;
      const compressed = await compressImage(files[i]);
      newImages.push(compressed);
    }
    setInfos(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        images: [...(updated[index].images || []), ...newImages],
      };
      return updated;
    });
  }

  // 이미지 삭제
  function handleRemoveImage(infoIndex: number, imgIndex: number) {
    setInfos(prev => {
      const updated = [...prev];
      updated[infoIndex] = {
        ...updated[infoIndex],
        images: updated[infoIndex].images.filter((_, i) => i !== imgIndex),
      };
      return updated;
    });
  }

  // 위치 검색
  async function handleSearchPlace(index: number) {
    const info = infos[index];
    if (!info.name) return;

    updateInfo(index, 'searching', true);
    try {
      const res = await fetch(`/api/search-place?query=${encodeURIComponent(info.name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.place) {
          setInfos(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              address: data.place.formatted_address || updated[index].address,
              latitude: data.place.geometry?.location?.lat || null,
              longitude: data.place.geometry?.location?.lng || null,
              place_id: data.place.place_id || null,
              searching: false,
            };
            return updated;
          });
        } else {
          alert('장소를 찾을 수 없습니다.');
          updateInfo(index, 'searching', false);
        }
      }
    } catch (e) {
      console.error('위치 검색 실패:', e);
      updateInfo(index, 'searching', false);
    }
  }

  // 저장
  async function handleSave() {
    setSaving(true);
    try {
      for (const info of infos) {
        // 위치 없으면 자동 검색 시도
        let { latitude, longitude, place_id, address } = info;
        if (!latitude && !longitude && info.name) {
          try {
            const res = await fetch(`/api/search-place?query=${encodeURIComponent(info.name)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.place) {
                latitude = data.place.geometry?.location?.lat || null;
                longitude = data.place.geometry?.location?.lng || null;
                place_id = data.place.place_id || null;
                address = address || data.place.formatted_address || null;
              }
            }
          } catch (e) {
            console.log('위치 자동 검색 실패, 건너뜀');
          }
        }

        await createTripInfo({
          trip_id: tripId,
          category: info.category,
          name: info.name,
          address,
          description: info.description,
          memo: info.memo || null,
          image_url: info.images?.[0] || null,
          images: info.images || [],
          order: 0,
          latitude,
          longitude,
          place_id,
          is_completed: false,
          importance: info.importance,
          day_number: info.day_number,
        });
      }

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
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.push(`/trips/${tripId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="mb-6 card-enhanced">
          <CardHeader>
            <CardTitle className="text-2xl">AI 분석 결과 확인 ✨</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              저장 전에 정보를 확인하고 수정하세요!
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {infos.map((info, index) => (
            <Card key={index} className="card-enhanced">
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <Badge
                      key={key}
                      className={`cursor-pointer ${
                        info.category === key
                          ? cat.color
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => updateInfo(index, 'category', key)}
                    >
                      {cat.emoji} {cat.label}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">

                {/* 이미지 갤러리 + 추가 */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    사진 ({info.images?.length || 0})
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {info.images?.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative group">
                        <img
                          src={img}
                          alt={`이미지 ${imgIdx + 1}`}
                          className="w-full h-24 object-cover rounded border dark:border-gray-600"
                        />
                        <button
                          onClick={() => handleRemoveImage(index, imgIdx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                          {imgIdx + 1}
                        </div>
                      </div>
                    ))}
                    {/* 추가 버튼 */}
                    <label className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleAddImages(index, e.target.files)}
                      />
                      <Plus className="w-6 h-6 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">추가</p>
                    </label>
                  </div>
                </div>

                {/* 장소 이름 + 위치 조회 */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    장소/가게 이름
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={info.name}
                      onChange={(e) => updateInfo(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSearchPlace(index)}
                      disabled={info.searching || !info.name}
                      className="shrink-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      {info.searching ? (
                        <><MapPin className="w-4 h-4 mr-1 animate-spin" />검색 중</>
                      ) : (
                        <><MapPin className="w-4 h-4 mr-1" />위치 조회</>
                      )}
                    </Button>
                  </div>
                  {info.latitude && info.longitude && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ 위치 확인됨 ({info.latitude.toFixed(4)}, {info.longitude.toFixed(4)})
                    </p>
                  )}
                </div>

                {/* 주소 */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">주소</label>
                  <Input
                    value={info.address || ''}
                    onChange={(e) => updateInfo(index, 'address', e.target.value)}
                    placeholder="주소 (선택사항)"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">설명</label>
                  <Textarea
                    value={info.description || ''}
                    onChange={(e) => updateInfo(index, 'description', e.target.value)}
                    placeholder="영업시간, 가격, 특징 등"
                    rows={3}
                  />
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">💭 내 메모</label>
                  <Textarea
                    value={info.memo || ''}
                    onChange={(e) => updateInfo(index, 'memo', e.target.value)}
                    placeholder="여기 꼭 가보기!, 예약 완료, 친구 추천 등"
                    rows={2}
                    className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  />
                </div>

                {/* 중요도 */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">중요도</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateInfo(index, 'importance', level)}
                        className={`py-3 px-4 rounded-lg border-2 transition-all ${
                          info.importance === level
                            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-600'
                            : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex gap-0.5">
                            {level === 0 ? (
                              <span className="text-sm text-gray-500 dark:text-gray-400">없음</span>
                            ) : (
                              Array.from({ length: level }).map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${
                                  info.importance === level
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-300 text-gray-300 dark:fill-gray-500'
                                }`} />
                              ))
                            )}
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {level === 0 && '선택 안함'}
                            {level === 1 && '보통'}
                            {level === 2 && '중요'}
                            {level === 3 && '필수'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">여행 일자 (Day)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => updateInfo(index, 'day_number', null)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                        info.day_number === null
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      미정
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => updateInfo(index, 'day_number', day)}
                        className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                          info.day_number === day
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Day {day}
                      </button>
                    ))}
                  </div>
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
            <><Sparkles className="w-5 h-5 mr-2 animate-spin" />저장 중...</>
          ) : (
            <><Save className="w-5 h-5 mr-2" />{infos.length}개 정보 저장하기</>
          )}
        </Button>
      </div>
    </div>
  );
}