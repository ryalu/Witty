import { supabase, TEMP_USER_ID } from './supabase';
import type { Trip, TripInfo } from '@/types/trip';

// 여행 목록 가져오기
export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', TEMP_USER_ID)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((trip: any) => ({
    ...trip,
    is_archived: trip.is_archived ?? false
  })) as Trip[];
}

// 여행 생성
export async function createTrip(
  trip: Omit<Trip, 'id' | 'created_at' | 'user_id'>
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert([{ ...trip, user_id: TEMP_USER_ID,
      is_archived: trip.is_archived ?? false,
     }])
    .select()
    .single();

  if (error) throw error;
  return {
    ...(data as any),
    is_archived: (data as any).is_archived ?? false
  } as Trip;
}

// 여행 정보 가져오기
export async function getTripInfos(tripId: string): Promise<TripInfo[]> {
  const { data, error } = await supabase
    .from('trip_infos')
    .select('*')
    .eq('trip_id', tripId)
    .order('order', { ascending: true });

  if (error) throw error;
  return (data || []) as TripInfo[];
}

// 여행 정보 추가
export async function createTripInfo(
  info: Omit<TripInfo, 'id' | 'created_at'>
): Promise<TripInfo> {
  const { data, error } = await supabase
    .from('trip_infos')
    .insert(info)
    .select()
    .single();

  if (error) throw error;
  return data as TripInfo;
}