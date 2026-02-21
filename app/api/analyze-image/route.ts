import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 이미지 압축 함수
async function compressImage(base64Data: string): Promise<{ data: string; mediaType: string }> {
  try {
    // Base64를 Buffer로 변환
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log('원본 크기:', buffer.length, 'bytes');

    // Sharp로 리사이즈 + 압축
    const compressed = await sharp(buffer)
      .resize(1200, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    console.log('압축 후 크기:', compressed.length, 'bytes');
    console.log('압축률:', ((1 - compressed.length / buffer.length) * 100).toFixed(1) + '%');

    // Base64로 다시 인코딩
    const compressedBase64 = compressed.toString('base64');

    return {
      data: compressedBase64,
      mediaType: 'image/jpeg',
    };
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    // 압축 실패 시 원본 반환
    return {
      data: base64Data,
      mediaType: 'image/jpeg',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
 
    if (!image) {
      return NextResponse.json(
        { error: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    // Base64 데이터 추출
    let base64Data = image;
    let mediaType = 'image/jpeg';

    // data URL 형식인 경우 파싱
    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mediaType = matches[1];
        base64Data = matches[2];
      } else {
        base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      }
    }

    console.log('원본 Media Type:', mediaType);
    console.log('원본 Base64 길이:', base64Data.length);

    // 이미지 압축 (100KB 이상일 때만)
    if (base64Data.length > 100000) {
      console.log('🗜️ 이미지 압축 시작...');
      const compressed = await compressImage(base64Data);
      base64Data = compressed.data;
      mediaType = compressed.mediaType;
      console.log('✅ 압축 완료!');
    }

    console.log('최종 Base64 길이:', base64Data.length);

    // Base64 유효성 검증
    try {
      Buffer.from(base64Data, 'base64');
    } catch (e) {
      return NextResponse.json(
        { error: 'Base64 데이터가 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    console.log('🤖 AI 분석 시작...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `이 이미지에서 여행/관광 관련 정보를 추출해주세요.

**중요: 이미지에 텍스트가 많이 있다면, 모든 텍스트를 꼼꼼히 읽고 분석하세요!**
하나의 이미지에 여러 개의 장소가 있을 수도 있습니다.
하나의 이미지에 하나의 장소가 있고, 그 곳에 대한 다양한 꿀팁 정보들이 있을 수 있습니다.

다음 정보를 JSON 배열로 반환하세요:

{
  "locations": [
    {
      "category": "restaurant" | "attraction" | "accommodation" | "transport" | "other",
      "name": "장소/가게 이름 (필수)",
      "address": "주소 (있으면)",
      "description": "영업시간, 가격, 특징 등 상세 설명 (있으면)",
      "latitude": 위도 (알 수 있으면),
      "longitude": 경도 (알 수 있으면),
      "placeId": "Google Place ID (알 수 있으면)"
    }
  ]
}

**카테고리 선택 기준:**
- restaurant: 식당, 카페, 바, 음식점
- attraction: 관광지, 박물관, 랜드마크, 명소
- accommodation: 호텔, 숙소, 에어비앤비
- transport: 교통편, 공항, 역
- other: 그 외 (쇼핑몰, 편의점, 로드샵 등)

**추출 규칙:**
1. 이미지에 **모든 텍스트를 세심하게 읽으세요**
2. 장소명이 명확하지 않으면 건너뛰세요
3. 하나의 이미지에 여러 장소가 있으면 모두 추출하세요
4. 주소가 길어도 **전부 포함**하세요
5. 설명이 길다면 꼼꼼하게 읽고 여행자에게 필요할 핵심 정보를 정리하세요
6. 한국어, 영어, 일본어 등 모든 언어 지원
7. 이미지에 지도가 있다면 지도 정보도 활용하세요
8. **메뉴, 가격표, 영업시간 등 텍스트 정보를 빠짐없이 읽으세요**

**응답 형식:**
- 반드시 JSON만 반환 (다른 텍스트 없이)
- 정보가 없으면 빈 배열: {"locations": []}`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('예상치 못한 응답 형식');
    }

    // JSON 파싱
    let jsonText = content.text.trim();
    
    // Markdown 코드 블록 제거
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const result = JSON.parse(jsonText);

    console.log('📍 추출된 장소:', result.locations?.length || 0, '개');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI 분석 오류:', error);
    return NextResponse.json(
      { error: error.message || 'AI 분석 실패' },
      { status: 500 }
    );
  }
}