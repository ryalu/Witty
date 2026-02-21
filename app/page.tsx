'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MapPin, Calendar, Trash2, Check, LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from '@/components/LoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
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
      
      const tripsWithArchived = (data || []).map(trip => ({
        ...trip,
        is_archived: (trip as any).is_archived ?? false
      }));
      
      setTrips(tripsWithArchived as Trip[]);
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
      await supabase.from('trip_infos').delete().eq('trip_id', id);
      const { error } = await supabase.from('trips').delete().eq('id', id);

      if (error) throw error;

      alert('삭제되었습니다! 🗑️');
      loadTrips();
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 실패');
    }
  }

  async function toggleArchive(trip: Trip) {
    try {
      const newArchiveState = !trip.is_archived;
      const { error } = await supabase
        .from('trips')
        .update({ is_archived: newArchiveState } as any)
        .eq('id', trip.id);

      if (error) throw error;

      alert(newArchiveState ? '완료됨 탭으로 이동했습니다! ✅' : '진행 중 탭으로 복원했습니다! 🔄');
      loadTrips();
    } catch (error) {
      console.error('Archive toggle error:', error);
      alert('변경 실패');
    }
  }

  function isTripCompleted(trip: Trip): boolean {
    if (trip.is_archived) return true;

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
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white dark:from-gray-900 dark:to-gray-800">
      {/* 간단한 인사 */}
      <div className="container mx-auto px-4 pt-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-600 mb-2 dark:from-gray-300 dark:to-indigo-100">
              내 여행 계획 ✈️
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI가 자동으로 정리해주는 스마트 여행 플래너
            </p>
          </div>

          {/* 새 여행 버튼 */}
          <Button
            size="lg"
            onClick={() => router.push('/trips/new')}
          >
            <Plus className="w-5 h-5 mr-2" />
            새 여행
          </Button>
        </div>
      </div>

      {/* 여행 목록 */}
      <div className="container mx-auto px-4 pb-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          {/* 탭 헤더 + 뷰 모드 토글 */}
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid w-auto grid-cols-2 dark:bg-gray-700">
              <TabsTrigger value="active" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-300">
                진행 중 ({activeTrips.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-300">
                완료됨 ({completedTrips.length})
              </TabsTrigger>
            </TabsList>

            {/* 뷰 모드 버튼 */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="dark:text-gray-500"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="dark:text-gray-500"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 진행 중 여행 */}
          <TabsContent value="active">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-500">로딩중...</p>
              </div>
            ) : activeTrips.length === 0 ? (
              <Card className="card-enhanced">
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
              <div className={
                viewMode === 'grid'
                  ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-3'
              }>
                {activeTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {viewMode === 'grid' ? (
                      // 그리드 카드
                      <Card className="card-enhanced-clickable group">
                        <CardHeader onClick={() => router.push(`/trips/${trip.id}`)}>
                          <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors dark:text-white">
                            {trip.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4 h-[100px]">
                            <p className="flex items-center text-gray-600 dark:text-gray-300">
                              <MapPin className="w-4 h-4 mr-2" />
                              {trip.country}
                            </p>
                            {trip.start_date && trip.end_date && (
                              <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
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
                                toggleArchive(trip);
                              }}
                              className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTrip(trip.id, trip.name);
                              }}
                              className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      // 리스트 카드
                      <Card className="card-enhanced-clickable">
                        <CardContent className="py-4 px-6">
                          <div className="flex items-center justify-between">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => router.push(`/trips/${trip.id}`)}
                            >
                              <h3 className="text-lg font-semibold mb-1">{trip.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {trip.country}
                                </span>
                                {trip.start_date && trip.end_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {trip.start_date} ~ {trip.end_date}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleArchive(trip);
                                }}
                                className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTrip(trip.id, trip.name);
                                }}
                                className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 완료된 여행 */}
          <TabsContent value="completed">
            {completedTrips.length === 0 ? (
              <Card className="card-enhanced">
                <CardContent className="py-12 text-center">
                  <p className="text-lg text-gray-500">
                    아직 완료된 여행이 없어요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-3'
              }>
                {completedTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {viewMode === 'grid' ? (
                      // 그리드 카드
                      <Card className="card-enhanced-clickable opacity-75 group">
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
                                toggleArchive(trip);
                              }}
                              className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                              복원
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTrip(trip.id, trip.name);
                              }}
                              className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      // 리스트 카드
                      <Card className="card-enhanced-clickable opacity-75">
                        <CardContent className="py-4 px-6">
                          <div className="flex items-center justify-between">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => router.push(`/trips/${trip.id}`)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold">{trip.name}</h3>
                                <Check className="w-5 h-5 text-green-500" />
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {trip.country}
                                </span>
                                {trip.start_date && trip.end_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {trip.start_date} ~ {trip.end_date}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleArchive(trip);
                                }}
                                className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                              >
                                복원
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTrip(trip.id, trip.name);
                                }}
                                className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}