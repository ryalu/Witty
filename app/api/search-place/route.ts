import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    console.log('🔍 Places API (New) 검색:', query);

    // ⭐ Places API (New) - Text Search
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id',
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: 'ko',
        }),
      }
    );

    const data = await response.json();

    console.log('응답 상태:', response.status);

    if (!response.ok) {
      console.error('API 오류:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Search failed' },
        { status: response.status }
      );
    }

    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      
      console.log('✅ 장소 찾음:', place.displayName?.text);

      return NextResponse.json({
        place: {
          name: place.displayName?.text || query,
          formatted_address: place.formattedAddress || '',
          place_id: place.id || '',
          geometry: {
            location: {
              lat: place.location?.latitude || null,
              lng: place.location?.longitude || null,
            },
          },
        },
      });
    } else {
      console.log('⚠️ 검색 결과 없음');
      return NextResponse.json({ place: null });
    }
  } catch (error: any) {
    console.error('Place search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}