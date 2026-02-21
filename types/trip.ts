// import type { Database } from './supabase';

// export type Trip = Database['public']['Tables']['trips']['Row'];
// export type TripInsert = Database['public']['Tables']['trips']['Insert'];
// export type TripUpdate = Database['public']['Tables']['trips']['Update'];

// export type TripInfo = Database['public']['Tables']['trip_infos']['Row'];
// export type TripInfoInsert = Database['public']['Tables']['trip_infos']['Insert'];
// export type TripInfoUpdate = Database['public']['Tables']['trip_infos']['Update'];

// export type Category = 'restaurant' | 'attraction' | 'accommodation' | 'transport' | 'other';

export interface Trip {
  id: string;
  created_at: string;
  name: string;
  country: string;
  start_date: string | null;
  end_date: string | null;
  user_id: string;
}

export interface TripInfo {
  id: string;
  created_at: string;
  trip_id: string;
  category: 'restaurant' | 'attraction' | 'accommodation' | 'transport' | 'other';
  name: string;
  address: string | null;
  description: string | null;
  memo: string | null;
  image_url: string | null;
  order: number;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  is_completed: boolean;
  importance: number;
}

export type Category = TripInfo['category'];

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface TripInfoWithCoord extends TripInfo {
  coords?: LocationCoords;
}