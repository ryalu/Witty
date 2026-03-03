import { supabase } from './supabase';
import type { Trip, TripInfo } from '@/types/trip';

export async function getTrips(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((trip: any) => ({
    ...trip,
    is_archived: trip.is_archived ?? false,
  })) as Trip[];
}

export async function createTrip(
  trip: Omit<Trip, 'id' | 'created_at' | 'user_id'>,
  userId: string
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert([{ ...trip, user_id: userId, is_archived: trip.is_archived ?? false }])
    .select()
    .single();

  if (error) throw error;
  return { ...(data as any), is_archived: (data as any).is_archived ?? false } as Trip;
}

export async function getTripInfos(tripId: string): Promise<TripInfo[]> {
  const { data, error } = await supabase
    .from('trip_infos')
    .select('*')
    .eq('trip_id', tripId)
    .order('order', { ascending: true });

  if (error) throw error;
  return (data || []) as TripInfo[];
}

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