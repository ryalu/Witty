// 장소명으로 좌표 & 주소 검색
export async function searchPlace(placeName: string, country?: string) {
  try {
    const query = country ? `${placeName}, ${country}` : placeName;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key가 없습니다.');
    }

    // Geocoding API로 검색
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('주소 검색 실패');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];

    return {
      address: result.formatted_address,
      coords: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    };
  } catch (error) {
    console.error('Place search error:', error);
    return null;
  }
}

// 카테고리별 마커 색상
export const MARKER_COLORS = {
  restaurant: '#FF6B6B', // 빨강
  attraction: '#4ECDC4', // 청록
  accommodation: '#95E1D3', // 연두
  transport: '#FFD93D', // 노랑
  other: '#9B9B9B', // 회색
} as const;

// 카테고리별 마커 이모지
export const MARKER_ICONS = {
  restaurant: '🍽️',
  attraction: '🗼',
  accommodation: '🏨',
  transport: '🚗',
  other: '📌',
} as const;