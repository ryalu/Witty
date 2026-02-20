'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTrips } from '@/lib/db';
import type { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Plane } from 'lucide-react';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Plane className="w-12 h-12 mx-auto mb-4 animate-bounce text-blue-500" />
          <p className="text-lg text-gray-600">여행 목록 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Plane className="w-10 h-10 text-blue-600" />
            여행 정리
          </h1>
          <p className="text-gray-600">
            AI가 여행 정보를 자동으로 정리해드려요 ✨
          </p>
        </div>

        {/* 새 여행 만들기 버튼 */}
        <Button
          onClick={() => router.push('/trips/new')}
          size="lg"
          className="w-full mb-6 h-14 text-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          새 여행 만들기
        </Button>

        {/* 여행 목록 */}
        <div className="grid gap-4">
          {trips.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <Plane className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">
                  아직 여행이 없어요
                </p>
                <p className="text-gray-400 text-sm">
                  위 버튼을 눌러 첫 여행을 만들어보세요!
                </p>
              </CardContent>
            </Card>
          ) : (
            trips.map((trip) => (
              <Card
                key={trip.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/trips/${trip.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    🗺️ {trip.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-700 mb-2">
                    📍 {trip.country}
                  </p>
                  {trip.start_date && trip.end_date && (
                    <p className="text-sm text-gray-500">
                      {trip.start_date} ~ {trip.end_date}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}