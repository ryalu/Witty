'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { TripInfo, Category } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Star, 
  MapPin, 
  Trash2, 
  Upload,
  X,
  Plus,
  GripVertical,
  ZoomIn,
} from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 정렬 가능한 이미지 컴포넌트
function SortableImage({
  image,
  index,
  onRemove,
  onView,
}: {
  image: string;
  index: number;
  onRemove: (index: number) => void;
  onView: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* 이미지 */}
      <img
        src={image}
        alt={`Image ${index + 1}`}
        className="w-full h-24 object-cover rounded border-2 border-gray-200 dark:border-gray-600 cursor-pointer"
        onClick={() => onView(index)}
      />

      {/* 확대 아이콘 */}
      <button
        onClick={() => onView(index)}
        className="absolute bottom-1 left-1 w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 순서 번호 */}
      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
        {index + 1}
      </div>
    </div>
  );
}

// 이미지 확대 모달
function ImageModal({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 이미지 */}
      <img
        src={images[currentIndex]}
        alt="Full size"
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 이전 버튼 */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('prev');
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
        >
          ‹
        </button>
      )}

      {/* 다음 버튼 */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('next');
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
        >
          ›
        </button>
      )}

      {/* 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 text-white text-sm rounded">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

export default function EditInfoPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const infoId = params.infoId as string;

  const [info, setInfo] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // 확대 보기 상태
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      
      const loadedInfo = {
        ...(data as any),
        images: (data as any).images || ((data as any).image_url ? [(data as any).image_url] : [])
      } as TripInfo;
      
      setInfo(loadedInfo);
    } catch (error) {
      console.error('Error loading info:', error);
      alert('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 파일 처리 함수
  async function processFiles(files: FileList) {
    if (!info) return;

    setUploading(true);

    try {
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 이미지 파일만
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newImages.push(base64);
      }

      setInfo({
        ...info,
        images: [...(info.images || []), ...newImages]
      });

      alert(`${newImages.length}개 이미지가 추가되었습니다!`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  }

  // 드래그앤드롭 업로드
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  }

  // 파일 선택 업로드
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFiles(files);
  }

  // 이미지 순서 변경
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !info || !info.images) return;

    const oldIndex = info.images.findIndex((_, i) => (active.id as string).endsWith(String(i)));
    const newIndex = info.images.findIndex((_, i) => (over.id as string).endsWith(String(i)));

    if (oldIndex !== newIndex) {
      const newImages = arrayMove(info.images, oldIndex, newIndex);
      setInfo({ ...info, images: newImages });
    }
  }

  // 이미지 삭제
  function handleRemoveImage(index: number) {
    if (!info || !info.images) return;
    
    const newImages = info.images.filter((_, i) => i !== index);
    setInfo({ ...info, images: newImages });
  }

  // 이미지 확대 보기
  function handleViewImage(index: number) {
    setViewingImageIndex(index);
  }

  function handleNavigateImage(direction: 'prev' | 'next') {
    if (viewingImageIndex === null || !info?.images) return;

    if (direction === 'prev' && viewingImageIndex > 0) {
      setViewingImageIndex(viewingImageIndex - 1);
    } else if (direction === 'next' && viewingImageIndex < info.images.length - 1) {
      setViewingImageIndex(viewingImageIndex + 1);
    }
  }

  // Google Maps에서 장소 검색
  async function handleSearchPlace() {
    if (!info?.name) {
      alert('장소 이름을 입력해주세요!');
      return;
    }

    setSearching(true);

    try {
      console.log('🔍 검색 시작:', info.name);

      const response = await fetch(
        `/api/search-place?query=${encodeURIComponent(info.name)}`
      );

      console.log('응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '장소 검색 실패');
      }

      const data = await response.json();
      console.log('검색 결과:', data);

      if (data.place) {
        // 새로운 정보
        const updatedInfo = {
          ...info,
          address: data.place.formatted_address || info.address,
          latitude: data.place.geometry?.location?.lat || info.latitude,
          longitude: data.place.geometry?.location?.lng || info.longitude,
          place_id: data.place.place_id || info.place_id,
        };

        // State 업데이트
        setInfo(updatedInfo);

        console.log('💾 DB에 저장 중...');

        // DB에 바로 저장
        const { error } = await supabase
          .from('trip_infos')
          .update({
            address: updatedInfo.address,
            latitude: updatedInfo.latitude,
            longitude: updatedInfo.longitude,
            place_id: updatedInfo.place_id,
          } as any)
          .eq('id', infoId);

        if (error) {
          console.error('저장 오류:', error);
          throw new Error('DB 저장 실패');
        }

        console.log('✅ 저장 완료!');

        alert(`✅ 위치 정보가 저장되었습니다!\n📍 ${data.place.formatted_address}`);
      } else {
        alert('⚠️ 장소를 찾을 수 없습니다.\n장소 이름을 더 구체적으로 입력하거나\n주소를 직접 입력해주세요.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      alert(`오류: ${error.message}`);
    } finally {
      setSearching(false);
    }
  }

  // 저장
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
          images: info.images,
          importance: info.importance,
          day_number: info.day_number,
        } as any)
        .eq('id', infoId);

      if (error) throw error;

      alert('저장되었습니다! ✅');
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  // 정보 삭제
  async function handleDelete() {
    if (!confirm('이 정보를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trip_infos')
        .delete()
        .eq('id', infoId);

      if (error) throw error;

      alert('삭제되었습니다! ✅');
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
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
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push(`/trips/${tripId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="card-enhanced mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              정보 수정 ✏️
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 이미지 갤러리 (드래그앤드롭 영역) */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                사진 ({info.images?.length || 0})
              </label>
              
              {/* 드래그앤드롭 영역 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {isDragging && (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                    <p className="text-blue-600 dark:text-blue-400">여기에 이미지를 놓으세요</p>
                  </div>
                )}

                {!isDragging && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={(info.images || []).map((img, i) => img + i)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="grid grid-cols-3 gap-2">
                        {info.images?.map((img, idx) => (
                          <SortableImage
                            key={img + idx}
                            image={img}
                            index={idx}
                            onRemove={handleRemoveImage}
                            onView={handleViewImage}
                          />
                        ))}
                        
                        {/* 추가 버튼 */}
                        <label className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                          {uploading ? (
                            <p className="text-xs text-gray-500">업로드 중...</p>
                          ) : (
                            <>
                              <Plus className="w-6 h-6 text-gray-400 mb-1" />
                              <p className="text-xs text-gray-500 dark:text-gray-400">추가</p>
                            </>
                          )}
                        </label>
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {!isDragging && (info.images?.length === 0 || !info.images) && (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      이미지를 드래그하거나 클릭하여 추가
                    </p>
                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                        파일 선택
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 드래그하여 순서 변경 | 클릭하여 확대 보기 | 호버하여 삭제
              </p>
            </div>

            {/* 장소 이름 */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                장소/가게 이름
              </label>
              <div className="flex gap-2">
                <Input
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                  placeholder="예: 에펠탑"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchPlace}
                  disabled={searching || !info.name}
                  className="shrink-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {searching ? (
                    <>
                      <MapPin className="w-4 h-4 mr-2 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      위치 조회
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 검색 결과 미리보기 */}
            {info.address && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                📍 {info.address}
              </p>
            )}

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                카테고리
              </label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <Badge
                    key={key}
                    className={`cursor-pointer ${
                      info.category === key
                        ? cat.color
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => setInfo({ ...info, category: key as Category })}
                  >
                    {cat.emoji} {cat.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                주소
              </label>
              <Input
                value={info.address || ''}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                placeholder="예: 파리, 프랑스"
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                설명
              </label>
              <Textarea
                value={info.description || ''}
                onChange={(e) => setInfo({ ...info, description: e.target.value })}
                placeholder="영업시간, 가격, 특징 등"
                rows={4}
              />
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                💭 내 메모
              </label>
              <Textarea
                value={info.memo || ''}
                onChange={(e) => setInfo({ ...info, memo: e.target.value })}
                placeholder="여기 꼭 가보기!, 예약 완료, 친구 추천 등"
                rows={3}
                className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              />
            </div>

            {/* 중요도 */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                중요도
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setInfo({ ...info, importance: level })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      info.importance === level
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-600'
                        : 'border-gray-200 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-yellow-500 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-0.5">
                        {level === 0 ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400">없음</span>
                        ) : (
                          Array.from({ length: level }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                info.importance === level
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-300 text-gray-300 dark:fill-gray-500 dark:text-gray-500'
                              }`}
                            />
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

            {/* 여행 일자 */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                여행 일자 (Day)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setInfo({ ...info, day_number: null })}
                  className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                    info.day_number === null
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:border-blue-300'
                  }`}
                >
                  미정
                </button>
                
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setInfo({ ...info, day_number: day })}
                    className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                      info.day_number === day
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:border-blue-300'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="flex-1"
              >
                {saving ? '저장 중...' : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    저장하기
                  </>
                )}
              </Button>

              <Button
                onClick={handleDelete}
                disabled={saving}
                size="lg"
                variant="destructive"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이미지 확대 모달 */}
      {viewingImageIndex !== null && info.images && (
        <ImageModal
          images={info.images}
          currentIndex={viewingImageIndex}
          onClose={() => setViewingImageIndex(null)}
          onNavigate={handleNavigateImage}
        />
      )}
    </div>
  );
}