'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { searchPlaceClient, getGoogleMapsUrl } from '@/lib/maps';
import type { TripInfo, Category } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Trash2, Search, MapPin, ExternalLink, Star } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';

export default function EditInfoPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const infoId = params.infoId as string;

  const [info, setInfo] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadInfo();
  }, [infoId]);

  async function loadInfo() {
    try {
      const { data, error } = await supabase
        .from('trip_infos')
        .select('*')
        .eq('id', infoId)
        .single();

      if (error) throw error;
      setInfo(data as TripInfo);
    } catch (error) {
      console.error('Error loading info:', error);
      alert('정보를 불러올 수 없습니다.');
      router.push(`/trips/${tripId}`);
    } finally {
      setLoading(false);
    }
  }

  // 위치 재검색
  async function handleSearchLocation() {
    if (!info || !info.name.trim()) {
      alert('장소 이름을 먼저 입력해주세요.');
      return;
    }

    setSearching(true);

    try {
      // 여행 국가 정보 가져오기
      const { data: tripData } = await supabase
        .from('trips')
        .select('country')
        .eq('id', tripId)
        .single();

      const country = tripData?.country;

      console.log('🔍 위치 검색 중:', info.name, country);

      const result = await searchPlaceClient(info.name, country);

      if (result) {
        console.log('✅ 검색 성공:', result);
        
        setInfo({
          ...info,
          address: result.address,
          latitude: result.coords.lat,
          longitude: result.coords.lng,
          place_id: result.placeId,
        });

        alert('✅ 위치를 찾았어요!\n저장 버튼을 눌러 적용하세요.');
      } else {
        alert('❌ 위치를 찾을 수 없습니다.\n장소명을 더 정확하게 입력해보세요.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  }

  async function handleSave() {
    if (!info) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('trip_infos')
        .update({
          category: info.category,
          name: info.name,
          address: info.address,
          description: info.description,
          memo: info.memo,
          latitude: info.latitude,
          longitude: info.longitude,
          place_id: info.place_id,
          importance: info.importance,
          is_completed: info.is_completed,
          day_number: info.day_number,
        })
        .eq('id', infoId);

      if (error) throw error;

      alert('저장 완료!');
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('trip_infos')
        .delete()
        .eq('id', infoId);

      if (error) throw error;

      alert('삭제 완료');
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 실패');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">로딩중...</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/trips/${tripId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">정보 수정 ✏️</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 이미지 */}
            {info.image_url && (
              <img
                src={info.image_url}
                alt={info.name}
                className="w-full h-48 object-cover rounded"
              />
            )}

            {/* Google Maps 버튼 */}
            {(info.place_id || (info.latitude && info.longitude)) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const url = getGoogleMapsUrl(
                    info.name,
                    info.place_id,
                    info.latitude,
                    info.longitude);
                  window.open(url, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Google Maps에서 보기
              </Button>
            )}

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                카테고리
              </label>
              <Select
                value={info.category}
                onValueChange={(value: Category) =>
                  setInfo({ ...info, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.emoji} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 중요도 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                중요도
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setInfo({ ...info, importance: level })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      info.importance === level
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-0.5">
                        {level === 0 ? (
                          <span className="text-sm text-gray-500">없음</span>
                        ) : (
                          Array.from({ length: level }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                info.importance === level
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-300 text-gray-300'
                              }`}
                            />
                          ))
                        )}
                      </div>
                      {level > 0 && (
                        <span className="text-xs text-gray-600">
                          {level === 1 && '보통'}
                          {level === 2 && '중요'}
                          {level === 3 && '필수'}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 꼭 가야 할 곳은 별표로 표시하세요
              </p>
            </div>

            {/* Day 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                여행 일자 (Day)
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setInfo({ ...info, day_number: null })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    info.day_number === null
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  미정
                </button>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setInfo({ ...info, day_number: day })}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      info.day_number === day
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 여행 일자별로 장소를 구분하세요
              </p>
            </div>

            {/* 이름 + 재검색 버튼 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                장소/가게 이름 *
              </label>
              <div className="flex gap-2">
                <Input
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                  required
                  className="flex-1"
                  placeholder="예: Chamcha Market"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchLocation}
                  disabled={searching || !info.name.trim()}
                >
                  {searching ? (
                    <>검색 중...</>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      위치 찾기
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 장소명을 수정했다면 "위치 찾기"를 눌러 정확한 위치를 검색하세요
              </p>
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium mb-2">주소</label>
              <Input
                value={info.address || ''}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                placeholder="주소 (선택사항)"
              />
              {/* 위치 정보 표시 */}
              {info.latitude && info.longitude && (
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    위치: {info.latitude.toFixed(4)}, {info.longitude.toFixed(4)}
                  </span>
                  {info.place_id && (
                    <span className="text-blue-600">• Place ID 있음</span>
                  )}
                </div>
              )}
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium mb-2">설명</label>
              <Textarea
                value={info.description || ''}
                onChange={(e) =>
                  setInfo({ ...info, description: e.target.value })
                }
                placeholder="영업시간, 가격, 특징 등"
                rows={4}
              />
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                💭 내 메모
              </label>
              <Textarea
                value={info.memo || ''}
                onChange={(e) => setInfo({ ...info, memo: e.target.value })}
                placeholder="개인 메모"
                rows={2}
                className="bg-yellow-50 border-yellow-200"
              />
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? '저장 중...' : '저장'}
              </Button>

              <Button
                onClick={handleDelete}
                variant="destructive"
                size="lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}