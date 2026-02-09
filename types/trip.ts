export interface Trip {
  id: string;
  name: string;
  country: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  userId: string;
}

export interface TripInfo {
  id: string;
  tripId: string;
  category: 'restaurant' | 'attraction' | 'accommodation' | 'transport' | 'other';
  name: string;
  address?: string;
  description?: string;
  memo?: string;
  imageUrl?: string;
  createdAt: string;
}

export type Category = TripInfo['category'];