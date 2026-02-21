'use client';

import { useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';
import type { TripInfo, Category } from '@/types/trip';
import { CATEGORIES } from '@/constants/categories';

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

  // 좌표가 있는 정보만 필터링
  const validInfos = useMemo(
    () => infos.filter((info) => info.latitude && info.longitude),
    [infos]
  );

  // 지도 중심점 계산 (모든 마커의 평균)
  const center = useMemo(() => {
    if (validInfos.length === 0) {
      return { lat: 37.5665, lng: 126.978 }; // 서울 기본값
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
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
    >
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
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: MARKER_COLORS[info.category as Category],
              fillOpacity: 0.8,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 10,
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
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}