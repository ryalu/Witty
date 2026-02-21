'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import type { TripInfo, Category } from '@/types/trip';
import { CATEGORIES } from '@/constants/categories';
import { getGoogleMapsUrl } from '@/lib/maps';

interface TripMapProps {
  infos: TripInfo[];
}

const MARKER_COLORS = {
  restaurant: '#FF6B6B',
  attraction: '#4ECDC4',
  accommodation: '#95E1D3',
  transport: '#FFD93D',
  other: '#9B9B9B',
} as const;

export default function TripMap({ infos }: TripMapProps) {
  const [selectedInfo, setSelectedInfo] = useState<TripInfo | null>(null);

  // LoadScript 대신 useLoadScript 사용
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const validInfos = useMemo(
    () => infos.filter((info) => info.latitude && info.longitude),
    [infos]
  );

  const center = useMemo(() => {
    if (validInfos.length === 0) {
      return { lat: 37.5665, lng: 126.978 };
    }

    const avgLat =
      validInfos.reduce((sum, info) => sum + (info.latitude || 0), 0) /
      validInfos.length;
    const avgLng =
      validInfos.reduce((sum, info) => sum + (info.longitude || 0), 0) /
      validInfos.length;

    return { lat: avgLat, lng: avgLng };
  }, [validInfos]);

  const mapContainerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '8px',
  };

  const options = {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  // 로딩 에러
  if (loadError) {
    return (
      <div className="bg-red-100 rounded-lg p-12 text-center">
        <p className="text-red-600">지도를 불러올 수 없습니다.</p>
        <p className="text-sm text-red-500 mt-2">
          {loadError.message}
        </p>
      </div>
    );
  }

  // 로딩 중
  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg p-12 text-center">
        <p className="text-gray-500">지도 로딩 중...</p>
      </div>
    );
  }

  // 좌표 없음
  if (validInfos.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-12 text-center">
        <p className="text-gray-500">
          지도에 표시할 위치 정보가 없습니다.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          이미지를 업로드하면 자동으로 위치가 추가됩니다.
        </p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
      options={options}
    >
      {validInfos.map((info) => (
        <Marker
          key={info.id}
          position={{
            lat: info.latitude!,
            lng: info.longitude!,
          }}
          onClick={() => setSelectedInfo(info)}
          icon={{
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="${MARKER_COLORS[info.category as Category]}" stroke="white" stroke-width="2"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(24, 24),
          }}
        />
      ))}

      {selectedInfo && (
        <InfoWindow
          position={{
            lat: selectedInfo.latitude!,
            lng: selectedInfo.longitude!,
          }}
          onCloseClick={() => setSelectedInfo(null)}
        >
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {CATEGORIES[selectedInfo.category as Category].emoji}
              </span>
              <h3 className="font-semibold">{selectedInfo.name}</h3>
            </div>
            {selectedInfo.address && (
              <p className="text-xs text-gray-600 mb-1">
                📍 {selectedInfo.address}
              </p>
            )}
            {selectedInfo.description && (
              <p className="text-xs text-gray-700">
                {selectedInfo.description.substring(0, 100)}
                {selectedInfo.description.length > 100 && '...'}
              </p>
            )}

            {/* Google Maps 버튼 */}
            {(selectedInfo.place_id || (selectedInfo.latitude && selectedInfo.longitude)) && (
                <button
                onClick={() => {
                    const url = getGoogleMapsUrl(
                    selectedInfo.name,
                    selectedInfo.place_id, 
                    selectedInfo.latitude, 
                    selectedInfo.longitude
                    );
                    window.open(url, '_blank');
                }}
                className="w-full mt-2 px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                >
                <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                    />
                </svg>
                Google Maps에서 보기
                </button>
            )}

          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}