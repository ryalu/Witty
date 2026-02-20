'use client';

import { useEffect, useState } from 'react';
import { getTrips, createTrip } from '@/lib/db';
import type { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
      alert('여행 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTrip() {
    try {
      await createTrip({
        name: '테스트 여행 ' + new Date().getTime(),
        country: '일본',
        start_date: '2025-03-01',
        end_date: '2025-03-05',
      });
      loadTrips(); // 새로고침
      alert('여행이 생성되었습니다!');
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('여행 생성에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Supabase 연결 테스트</h1>

      <Button onClick={handleCreateTrip} className="mb-6">
        테스트 여행 만들기 ✨
      </Button>

      <div className="grid gap-4">
        {trips.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">
                아직 여행이 없습니다. 버튼을 눌러 테스트 여행을 만들어보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <CardTitle>{trip.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-2">📍 {trip.country}</p>
                <p className="text-sm text-gray-600">
                  {trip.start_date} ~ {trip.end_date}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  ID: {trip.id}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}