'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MapPin, Calendar, Trash2, Check, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    // 로딩 화면 표시
    const loadingTimer = setTimeout(() => {
      setShowLoading(false);
    }, 2500);

    loadTrips();

    return () => clearTimeout(loadingTimer);
  }, []);

  async function loadTrips() {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTrip(id: string, name: string) {
    if (!confirm(`"${name}" 여행을 삭제하시겠습니까?\n모든 정보가 함께 삭제됩니다.`)) {
      return;
    }

    try {
      // 여행 정보들 먼저 삭제
      await supabase.from('trip_infos').delete().eq('trip_id', id);
      
      // 여행 삭제
      const { error } = await supabase.from('trips').delete().eq('id', id);

      if (error) throw error;

      alert('삭제되었습니다! 🗑️');
      loadTrips();
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 실패');
    }
  }

  // 여행 완료 여부 판단 (end_date 지났는지)
  function isTripCompleted(trip: Trip): boolean {
    if (!trip.end_date) return false;
    const endDate = new Date(trip.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  }

  const activeTrips = trips.filter(trip => !isTripCompleted(trip));
  const completedTrips = trips.filter(trip => isTripCompleted(trip));

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white">
      {/* 히어로 섹션 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/witty-logo.png"
              alt="Witty"
              width={120}
              height={120}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Witty
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            재미있고 똑똑하게 여행 계획! ✈️
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => router.push('/trips/new')}
              className="text-lg h-14 px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 여행 만들기
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/how-to-use')}
              className="text-lg h-14 px-8"
            >
              <HelpCircle className="w-5 h-5 mr-2" />
              사용 방법 보기
            </Button>
          </div>
        </div>
      </div>

      {/* 여행 목록 */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">
              진행 중 ({activeTrips.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              완료됨 ({completedTrips.length})
            </TabsTrigger>
          </TabsList>

          {/* 진행 중 여행 */}
          <TabsContent value="active">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-500">로딩중...</p>
              </div>
            ) : activeTrips.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-lg text-gray-500 mb-4">
                    아직 여행 계획이 없어요
                  </p>
                  <Button onClick={() => router.push('/trips/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    첫 여행 만들기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <CardHeader onClick={() => router.push(`/trips/${trip.id}`)}>
                      <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors">
                        {trip.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <p className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {trip.country}
                        </p>
                        {trip.start_date && trip.end_date && (
                          <p className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {trip.start_date} ~ {trip.end_date}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                          보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrip(trip.id, trip.name);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 완료된 여행 */}
          <TabsContent value="completed">
            {completedTrips.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-lg text-gray-500">
                    아직 완료된 여행이 없어요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer opacity-75 group"
                  >
                    <CardHeader onClick={() => router.push(`/trips/${trip.id}`)}>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors">
                          {trip.name}
                        </CardTitle>
                        <Check className="w-6 h-6 text-green-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <p className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {trip.country}
                        </p>
                        {trip.start_date && trip.end_date && (
                          <p className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {trip.start_date} ~ {trip.end_date}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                          추억 보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrip(trip.id, trip.name);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}