'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Trip, TripInfo, Category } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ExternalLink, Copy, LogIn } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';
import { getGoogleMapsUrl } from '@/lib/maps';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [infos, setInfos] = useState<TripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadSharedTrip();
    checkUser();
  }, [token]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  async function loadSharedTrip() {
    try {
      const { data: tripData, error } = await supabase
        .from('trips')
        .select('*')
        .eq('share_token', token)
        .eq('is_public', true)
        .single();

      if (error || !tripData) {
        setTrip(null);
        setLoading(false);
        return;
      }

      setTrip({ ...(tripData as any), is_archived: (tripData as any).is_archived ?? false } as Trip);

      const { data: infosData } = await supabase
        .from('trip_infos')
        .select('*')
        .eq('trip_id', (tripData as any).id)
        .order('order', { ascending: true });

      setInfos((infosData || []) as TripInfo[]);
    } catch (error) {
      console.error('공유 여행 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyTrip() {
    if (!user) {
      // 로그인 후 현재 페이지로 돌아오도록 URL 저장
      sessionStorage.setItem('redirect_after_login', window.location.href);
      router.push('/auth');
      return;
    }

    setCopying(true);
    try {
      // 여행 복사
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert({
          name: `${trip!.name} (복사본)`,
          country: trip!.country,
          start_date: trip!.start_date,
          end_date: trip!.end_date,
          user_id: user.id,
          is_archived: false,
          is_public: false,
        } as any)
        .select()
        .single();

      if (tripError) throw tripError;

      // trip_infos 복사
      if (infos.length > 0) {
        const newInfos = infos.map(({ id, created_at, trip_id, ...rest }) => ({
          ...rest,
          trip_id: (newTrip as any).id,
          is_completed: false,
        }));

        const { error: infosError } = await supabase
          .from('trip_infos')
          .insert(newInfos as any);

        if (infosError) throw infosError;
      }

      alert('내 저장소에 복사되었어요!');
      router.push(`/trips/${(newTrip as any).id}`);
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다.');
    } finally {
      setCopying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로딩중...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white dark:from-gray-900 dark:to-gray-800">
        <Card className="p-8 text-center">
          <p className="text-xl mb-2">공유가 종료된 여행이에요</p>
          <p className="text-gray-500 text-sm">링크가 만료되었거나 공유가 비활성화되었습니다.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* 헤더 */}
        <Card className="card-enhanced mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-blue-500 mb-1">공유된 여행 ✈️</p>
                <CardTitle className="text-3xl">{trip.name}</CardTitle>
                <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">📍 {trip.country}</p>
                {trip.start_date && trip.end_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {trip.start_date} ~ {trip.end_date}
                  </p>
                )}
              </div>

              {/* 복사 버튼 */}
              <Button
                onClick={handleCopyTrip}
                disabled={copying}
                className="flex-shrink-0"
              >
                {user ? (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    {copying ? '복사 중...' : '내 저장소에 복사'}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    로그인 후 복사
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* 여행 정보 목록 */}
        <div className="space-y-3">
          {infos.length === 0 ? (
            <Card className="card-enhanced">
              <CardContent className="py-12 text-center text-gray-500">
                아직 등록된 여행 정보가 없어요
              </CardContent>
            </Card>
          ) : (
            infos.map((info) => (
              <Card key={info.id} className="card-enhanced">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={CATEGORIES[info.category as Category].color}>
                          {CATEGORIES[info.category as Category].emoji}{' '}
                          {CATEGORIES[info.category as Category].label}
                        </Badge>
                        {info.day_number && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Day {info.day_number}
                          </Badge>
                        )}
                        {info.importance > 0 && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: info.importance }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-base">{info.name}</h3>
                      {info.address && (
                        <p className="text-sm text-gray-500 mt-1">📍 {info.address}</p>
                      )}
                      {info.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{info.description}</p>
                      )}
                    </div>

                    {/* 이미지 */}
                    {(info.images?.[0] || info.image_url) && (
                      <img
                        src={info.images?.[0] || info.image_url!}
                        alt={info.name}
                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                      />
                    )}
                  </div>

                  {/* Maps 버튼 */}
                  {(info.place_id || info.name) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => window.open(getGoogleMapsUrl(info.name, info.place_id, info.latitude, info.longitude), '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Google Maps에서 보기
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 하단 로그인 유도 */}
        {!user && (
          <Card className="card-enhanced mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardContent className="py-4 text-center">
              <p className="text-blue-700 dark:text-blue-300 font-medium mb-2">
                이 여행이 마음에 드셨나요?
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                로그인하면 내 저장소에 복사하거나 직접 여행을 만들 수 있어요!
              </p>
              <Button onClick={() => {
                sessionStorage.setItem('redirect_after_login', window.location.href);
                router.push('/auth');
              }}>
                <LogIn className="w-4 h-4 mr-2" />
                로그인 / 회원가입
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}