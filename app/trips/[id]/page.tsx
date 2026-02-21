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
import { ArrowLeft, Upload, Plus, Map, ExternalLink, Star, Check, Copy } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';
import { getGoogleMapsUrl, generateAllPlacesLinks } from '@/lib/maps';
import TripMap from '@/components/trip/TripMap';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [infos, setInfos] = useState<TripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMap, setShowMap] = useState(false);
  const [completionFilter, setCompletionFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, [tripId]);

  async function loadData() {
    try {
      // 여행 정보 가져오기
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // 여행 정보들 가져오기
      const infosData = await getTripInfos(tripId);
      setInfos(infosData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 카테고리 + 완료 여부 필터링
  const filteredInfos = infos.filter((info) => {
    // 카테고리 필터
    const categoryMatch = selectedCategory === 'all' || info.category === selectedCategory;
    
    // 완료 여부 필터
    const completionMatch = 
      completionFilter === 'all' ||
      (completionFilter === 'pending' && !info.is_completed) ||
      (completionFilter === 'completed' && info.is_completed);
    
    return categoryMatch && completionMatch;
  });
  
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

        {/* 이미지 업로드 버튼 */}
        <div className="flex gap-3 mb-6">
          <Button
            size="lg"
            className="flex-1 h-16 text-lg"
            onClick={() => router.push(`/trips/${tripId}/upload`)}
          >
            <Upload className="w-6 h-6 mr-2" />
            이미지 업로드하고 정보 추가하기
          </Button>

          {/* 지도 버튼(디버깅 추가) */}
          <Button
            size="lg"
            variant={showMap ? 'default' : 'outline'}
            className="h-16"
            onClick={() => {
              console.log('지도 버튼 클릭!');
              console.log('현재 showMap:', showMap);
              console.log('infos 개수:', infos.length);
              console.log('좌표 있는 infos:', infos.filter(i => i.latitude && i.longitude).length);
              setShowMap(!showMap);
            }}
          >
            <Map className="w-6 h-6" />
          </Button>

          {/* 링크 복사 버튼 */}
          {infos.length > 0 && (
            <Button
              size="lg"
              variant="outline"
              className="h-16"
              onClick={() => {
                const links = generateAllPlacesLinks(infos);
                navigator.clipboard.writeText(links);
                alert('📋 모든 장소 링크가 복사되었습니다!\n메모앱이나 카톡에 붙여넣기 하세요.');
              }}
            >
              <Copy className="w-6 h-6" />
            </Button>
          )}  

        </div>

        {/* 지도 표시 */}
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

        {/* 카테고리 탭 */}
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
                {filteredInfos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-2">아직 정보가 없어요</p>
                    <p className="text-sm">
                      위 버튼을 눌러 이미지를 업로드해보세요!
                    </p>
                  </div>
                ) : (
                  filteredInfos.map((info) => (
                    <Card 
                      key={info.id}
                      className="hover:shadow-md transition-shadow"
                      onClick={() => {
                        console.log('카드 클릭! info.id:', info.id);
                        router.push(`/trips/${tripId}/info/${info.id}`)
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={CATEGORIES[info.category].color}>
                                {CATEGORIES[info.category].emoji}{' '}
                                {CATEGORIES[info.category].label}
                              </Badge>

                              {/* 중요도 표시 */}
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
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const { error } = await supabase
                                  .from('trip_infos')
                                  .update({ is_completed: !info.is_completed})
                                  .eq('id', info.id);
                                
                                if (error) throw error;
                                
                                // 상태 업데이트
                                setInfos(prev => 
                                  prev.map(i => 
                                    i.id === info.id 
                                      ? { ...i, is_completed: !i.is_completed }
                                      : i
                                  )
                                );
                              } catch (error) {
                                console.error('체크 업데이트 실패:', error);
                              }
                            }}
                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              info.is_completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {info.is_completed && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-2">
                        {info.address && (
                          <p className="text-sm text-gray-600">
                            📍 {info.address}
                          </p>
                        )}
                        {info.description && (
                          <p className="text-sm text-gray-700">
                            {info.description}
                          </p>
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
                        {(info.place_id || (info.latitude && info.longitude)) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
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
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}