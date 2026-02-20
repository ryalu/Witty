'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { TripInfo, Category } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';

export default function EditInfoPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const infoId = params.infoId as string;

  const [info, setInfo] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        })
        .eq('id', infoId);

      if (error) throw error;

      alert('저장 완료! ✅');
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

      alert('삭제 완료! 🗑️');
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

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                장소/가게 이름 *
              </label>
              <Input
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                required
              />
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium mb-2">주소</label>
              <Input
                value={info.address || ''}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                placeholder="주소 (선택사항)"
              />
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