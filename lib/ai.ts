'use server';

import Anthropic from '@anthropic-ai/sdk';
import { searchPlace } from './maps';

export async function analyzeImage(imageUrl: string, country?: string) {
  try {
    console.log('🚀 AI 분석 시작:', imageUrl);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API Key가 설정되지 않았습니다.');
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    console.log('⬇️ 이미지 다운로드 중...');

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('이미지를 가져올 수 없습니다.');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const contentType =
      imageResponse.headers.get('content-type') || 'image/jpeg';

    const mediaType = contentType.includes('png')
      ? 'image/png'
      : contentType.includes('gif')
      ? 'image/gif'
      : contentType.includes('webp')
      ? 'image/webp'
      : 'image/jpeg';

    console.log('📡 Claude API 호출 중...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `이 이미지에서 여행 관련 정보를 추출해주세요.

⭐ 중요: 이미지에 여러 장소가 있으면 모두 추출해주세요!

다음 JSON 배열 형식으로만 응답해주세요:
[
  {
    "category": "restaurant | attraction | accommodation | transport | other",
    "name": "장소 이름",
    "address": "주소 (없으면 null)",
    "description": "설명 (없으면 null)"
  }
]

반드시 JSON 배열 형식으로만 응답하세요.`,
            },
          ],
        },
      ],
    });

    console.log('✅ Claude 응답 받음');

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('응답 형식 오류');
    }

    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const results = JSON.parse(jsonText);

    if (!Array.isArray(results)) {
      console.log('✅ 분석 완료 (단일)');
      return {
        success: true,
        data: [results],
      };
    }

    // ⭐ 각 장소에 대해 Google Maps로 주소/좌표 검색
    console.log('🗺️ 주소 및 좌표 검색 중...');
    const enhancedResults = await Promise.all(
      results.map(async (place) => {
        try {
          const placeData = await searchPlace(place.name, country);

          if (placeData) {
            return {
              ...place,
              address: place.address || placeData.address,
              latitude: placeData.coords.lat,
              longitude: placeData.coords.lng,
            };
          }

          return place;
        } catch (error) {
          console.error('주소 검색 실패:', place.name, error);
          return place;
        }
      })
    );

    console.log('✅ 분석 완료 (여러 개):', enhancedResults);

    return {
      success: true,
      data: enhancedResults,
    };
  } catch (error: any) {
    console.error('💥 에러:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}