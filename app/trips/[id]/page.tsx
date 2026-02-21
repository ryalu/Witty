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
import { ArrowLeft, Upload, Plus, Map } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';
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

  // 카테고리별 필터링
  const filteredInfos =
    selectedCategory === 'all'
      ? infos
      : infos.filter((info) => info.category === selectedCategory);

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
            className="w-full mb-6 h-16 text-lg"
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
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge className={CATEGORIES[info.category].color}>
                              {CATEGORIES[info.category].emoji}{' '}
                              {CATEGORIES[info.category].label}
                            </Badge>
                            <CardTitle className="text-xl mt-2">
                              {info.name}
                            </CardTitle>
                          </div>
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