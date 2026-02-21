// 장소명으로 좌표 & 주소 검색
export async function searchPlace(placeName: string, country?: string) {
  try {
    const query = country ? `${placeName}, ${country}` : placeName;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('🔍 검색 쿼리:', query);
    console.log('🔑 API Key 존재:', !!apiKey);

    if (!apiKey) {
      console.error('❌ API Key 없음!');
      throw new Error('Google Maps API key가 없습니다.');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    console.log('📡 API 호출 URL:', url.replace(apiKey, 'API_KEY'));

    const response = await fetch(url);

    console.log('📨 응답 상태:', response.status);

    if (!response.ok) {
      console.error('❌ HTTP 에러:', response.status);
      throw new Error('주소 검색 실패');
    }

    const data = await response.json();

    console.log('📦 응답 데이터:', data);

    if (data.status !== 'OK') {
      console.error('❌ API 상태:', data.status);
      console.error('에러 메시지:', data.error_message);
      return null;
    }

    if (!data.results || data.results.length === 0) {
      console.log('⚠️ 검색 결과 없음');
      return null;
    }

    const result = data.results[0];

    console.log('✅ 검색 성공:', result.formatted_address);

    return {
      address: result.formatted_address,
      coords: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    };
  } catch (error) {
    console.error('💥 Place search error:', error);
    return null;
  }
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