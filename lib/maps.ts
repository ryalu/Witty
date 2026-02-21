import type { TripInfo, Category } from "@/types/trip";

// 장소명으로 좌표 & 주소 & Place ID 검색
export async function searchPlace(placeName: string, country?: string) {
  try {
    const query = country ? `${placeName}, ${country}` : placeName;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    console.log('🔍 검색 쿼리:', query);

    if (!apiKey) {
      console.error('❌ API Key 없음!');
      throw new Error('Google Maps API key가 없습니다.');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const response = await fetch(url);

    console.log('📨 응답 상태:', response.status);

    if (!response.ok) {
      console.error('❌ HTTP 에러:', response.status);
      throw new Error('주소 검색 실패');
    }

    const data = await response.json();

    console.log('📦 응답 상태:', data.status);

    if (data.status !== 'OK') {
      console.error('❌ API 상태:', data.status);
      if (data.error_message) {
        console.error('에러 메시지:', data.error_message);
      }
      return null;
    }

    if (!data.results || data.results.length === 0) {
      console.log('⚠️ 검색 결과 없음');
      return null;
    }

    const result = data.results[0];

    console.log('✅ 검색 성공:', result.formatted_address);
    console.log('📍 Place ID:', result.place_id);

    return {
      address: result.formatted_address,
      coords: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      placeId: result.place_id,
    };
  } catch (error) {
    console.error('💥 Place search error:', error);
    return null;
  }
}

// 클라이언트에서 위치 재검색
export async function searchPlaceClient(placeName: string, country?: string) {
  try {
    const query = country ? `${placeName}, ${country}` : placeName;
    
    // NEXT_PUBLIC_ 키 사용 (클라이언트용)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key가 없습니다.');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const response = await fetch(url);

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
      placeId: result.place_id,
    };
  } catch (error) {
    console.error('Place search error:', error);
    return null;
  }
}

// 모든 장소 링크 생성
export function generateAllPlacesLinks(infos: TripInfo[]): string {
  let result = '📍 여행 장소 모음\n\n';
  
  const categories = {
    restaurant: '🍽️ 맛집',
    attraction: '🗼 관광지',
    accommodation: '🏨 숙소',
    transport: '🚗 교통',
    other: '📌 기타',
  };
  
  Object.entries(categories).forEach(([key, label]) => {
    const categoryInfos = infos.filter(i => i.category === key);
    
    if (categoryInfos.length > 0) {
      result += `${label}\n`;
      categoryInfos.forEach((info, index) => {
        const url = getGoogleMapsUrl(
          info.name,
          info.place_id,
          info.latitude,
          info.longitude
        );
        const stars = info.importance > 0 
          ? ' ' + '⭐'.repeat(info.importance) 
          : '';
        const completed = info.is_completed ? ' ✅' : '';
        
        result += `${index + 1}. ${info.name}${stars}${completed}\n`;
        result += `   ${url}\n`;
      });
      result += '\n';
    }
  });
  
  return result;
}


// Google Maps URL 생성 헬퍼 함수
export function getGoogleMapsUrl(
    placeName?: string | null,
    placeId?: string | null,
    lat?: number | null,
    lng?: number | null
): string {
  // 1순위: Place ID 검색  
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  }
  // 2순위: 장소명 검색
  if (placeName) {
    return `https://www.google.com/maps/search/${encodeURIComponent(placeName)}`;
  }
  // 3순위: 좌표
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return '';
}

// 카테고리별 마커 색상
export const MARKER_COLORS = {
  restaurant: '#FF6B6B',
  attraction: '#4ECDC4',
  accommodation: '#95E1D3',
  transport: '#FFD93D',
  other: '#9B9B9B',
} as const;

// 카테고리별 마커 이모지
export const MARKER_ICONS = {
  restaurant: '🍽️',
  attraction: '🗼',
  accommodation: '🏨',
  transport: '🚗',
  other: '📌',
} as const;