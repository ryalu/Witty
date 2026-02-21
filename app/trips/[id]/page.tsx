'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTripInfos } from '@/lib/db';
import type { Trip, TripInfo } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  Map, 
  ExternalLink, 
  Star, 
  Check, 
  Copy, 
  GripVertical 
} from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';
import { getGoogleMapsUrl, generateAllPlacesLinks } from '@/lib/maps';
import TripMap from '@/components/trip/TripMap';

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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ==================== 드래그 가능한 카드 컴포넌트 ====================
function SortableInfoCard({
  info,
  tripId,
  onCheckToggle,
  onOpenMaps,
}: {
  info: TripInfo;
  tripId: string;
  onCheckToggle: (id: string, isCompleted: boolean) => void;
  onOpenMaps: (info: TripInfo) => void;
}) {
  const router = useRouter();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: info.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`hover:shadow-md transition-shadow ${
          info.is_completed ? 'opacity-60 bg-gray-50' : ''
        }`}
      >
        <CardHeader>
          <div className="flex items-start gap-3">
            {/* 드래그 핸들 */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-5 h-5" />
            </button>

            {/* 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={CATEGORIES[info.category].color}>
                  {CATEGORIES[info.category].emoji}{' '}
                  {CATEGORIES[info.category].label}
                </Badge>

                {info.day_number && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Day {info.day_number}
                  </Badge>
                )}

                {info.importance > 0 && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: info.importance }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                )}
              </div>

              <CardTitle
                className={`text-xl cursor-pointer hover:text-blue-600 ${
                  info.is_completed ? 'line-through text-gray-500' : ''
                }`}
                onClick={() => router.push(`/trips/${tripId}/info/${info.id}`)}
              >
                {info.name}
              </CardTitle>
            </div>

            {/* 체크박스 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCheckToggle(info.id, info.is_completed);
              }}
              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                info.is_completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {info.is_completed && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {info.address && (
            <p className="text-sm text-gray-600">📍 {info.address}</p>
          )}
          {info.description && (
            <p className="text-sm text-gray-700">{info.description}</p>
          )}
          {info.memo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
              <p className="text-sm">📝 {info.memo}</p>
            </div>
          )}
          {info.image_url && (
            <img
              src={info.image_url}
              alt={info.name}
              className="w-full h-48 object-cover rounded mt-2"
            />
          )}

          {/* Google Maps 버튼 */}
          {(info.place_id || info.name || (info.latitude && info.longitude)) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMaps(info);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Google Maps에서 보기
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 메인 페이지 컴포넌트 ====================
export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  // State
  const [trip, setTrip] = useState<Trip | null>(null);
  const [infos, setInfos] = useState<TripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMap, setShowMap] = useState(false);
  const [completionFilter, setCompletionFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedDay, setSelectedDay] = useState<number | null | 'all'>('all');

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [tripId]);

  async function loadData() {
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      const infosData = await getTripInfos(tripId);
      setInfos(infosData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 필터링 & 정렬
  const filteredInfos = infos.filter((info) => {
    const categoryMatch = selectedCategory === 'all' || info.category === selectedCategory;
    const completionMatch = 
      completionFilter === 'all' ||
      (completionFilter === 'pending' && !info.is_completed) ||
      (completionFilter === 'completed' && info.is_completed);
    const dayMatch = 
      selectedDay === 'all' ||
      (selectedDay === null && info.day_number === null) ||
      info.day_number === selectedDay;

    return categoryMatch && completionMatch && dayMatch;
  });

  const sortedInfos = [...filteredInfos].sort((a, b) => {
    if (a.day_number === b.day_number) {
      return a.order - b.order;
    }
    if (a.day_number === null) return 1;
    if (b.day_number === null) return -1;
    return a.day_number - b.day_number;
  });

  // 드래그 종료 핸들러
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedInfos.findIndex((info) => info.id === active.id);
    const newIndex = sortedInfos.findIndex((info) => info.id === over.id);
    const newOrder = arrayMove(sortedInfos, oldIndex, newIndex);

    // UI 즉시 업데이트
    setInfos((prev) => {
      const updated = [...prev];
      const movedItem = updated.find((i) => i.id === active.id);
      if (movedItem) {
        const otherItems = updated.filter((i) => i.id !== active.id);
        const insertIndex = otherItems.findIndex((i) => i.id === over.id);
        otherItems.splice(insertIndex, 0, movedItem);
        return otherItems;
      }
      return prev;
    });

    // DB 업데이트
    try {
      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('trip_infos')
          .update({ order: i } as any)
          .eq('id', newOrder[i].id);
      }
      console.log('✅ 순서 저장 완료');
    } catch (error) {
      console.error('순서 저장 실패:', error);
      loadData();
    }
  }

  // 체크박스 토글
  async function handleCheckToggle(id: string, isCompleted: boolean) {
    try {
      const { error } = await supabase
        .from('trip_infos')
        .update({ is_completed: !isCompleted } as any)
        .eq('id', id);

      if (error) throw error;

      setInfos((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_completed: !i.is_completed } : i))
      );
    } catch (error) {
      console.error('체크 업데이트 실패:', error);
    }
  }

  // Google Maps 열기
  function handleOpenMaps(info: TripInfo) {
    const url = getGoogleMapsUrl(
      info.name,
      info.place_id,
      info.latitude,
      info.longitude
    );
    window.open(url, '_blank');
  }

  // 로딩 & 에러 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">로딩중...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">여행을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // ==================== 렌더링 ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        {/* 여행 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{trip.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-700 mb-2">📍 {trip.country}</p>
            {trip.start_date && trip.end_date && (
              <p className="text-sm text-gray-500">
                📅 {trip.start_date} ~ {trip.end_date}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 버튼들 */}
        <div className="flex gap-3 mb-6">
          <Button
            size="lg"
            className="flex-1 h-16 text-lg"
            onClick={() => router.push(`/trips/${tripId}/upload`)}
          >
            <Upload className="w-6 h-6 mr-2" />
            이미지 업로드하고 정보 추가하기
          </Button>

          <Button
            size="lg"
            variant={showMap ? 'default' : 'outline'}
            className="h-16"
            onClick={() => setShowMap(!showMap)}
          >
            <Map className="w-6 h-6" />
          </Button>

          {infos.length > 0 && (
            <Button
              size="lg"
              variant="outline"
              className="h-16"
              onClick={() => {
                const links = generateAllPlacesLinks(infos);
                navigator.clipboard.writeText(links);
                alert('📋 모든 장소 링크가 복사되었습니다!');
              }}
            >
              <Copy className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* 지도 */}
        {showMap && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>지도로 보기 🗺️</CardTitle>
            </CardHeader>
            <CardContent>
              <TripMap infos={infos} />
            </CardContent>
          </Card>
        )}

        {/* 완료 여부 필터 */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={completionFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('all')}
          >
            전체 ({infos.length})
          </Button>
          <Button
            variant={completionFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('pending')}
          >
            미방문 ({infos.filter(i => !i.is_completed).length})
          </Button>
          <Button
            variant={completionFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('completed')}
          >
            완료 ({infos.filter(i => i.is_completed).length})
          </Button>
        </div>

        {/* Day 필터 */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <Button
            variant={selectedDay === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay('all')}
          >
            전체 Day
          </Button>
          <Button
            variant={selectedDay === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay(null)}
          >
            미정 ({infos.filter(i => i.day_number === null).length})
          </Button>
          {Array.from(new Set(infos.map(i => i.day_number).filter(d => d !== null)))
            .sort((a, b) => (a || 0) - (b || 0))
            .map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(day)}
              >
                Day {day} ({infos.filter(i => i.day_number === day).length})
              </Button>
            ))}
        </div>

        {/* 카테고리 탭 & 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>여행 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full grid grid-cols-6 mb-4">
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="restaurant">🍽️</TabsTrigger>
                <TabsTrigger value="attraction">🗼</TabsTrigger>
                <TabsTrigger value="accommodation">🏨</TabsTrigger>
                <TabsTrigger value="transport">🚗</TabsTrigger>
                <TabsTrigger value="other">📌</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedCategory} className="space-y-4">
                {sortedInfos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-2">선택한 조건의 정보가 없어요</p>
                    <p className="text-sm">
                      위 버튼을 눌러 이미지를 업로드해보세요!
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sortedInfos.map((info) => info.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {sortedInfos.map((info) => (
                          <SortableInfoCard
                            key={info.id}
                            info={info}
                            tripId={tripId}
                            onCheckToggle={handleCheckToggle}
                            onOpenMaps={handleOpenMaps}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}