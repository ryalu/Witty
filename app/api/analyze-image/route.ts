import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60; // Vercel 실행 시간 60초로 확장

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
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';

    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mediaType = matches[1] as typeof mediaType;
        base64Data = matches[2];
      } else {
        base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      }
    }

    // 서버에서 받은 크기 체크 (클라이언트 압축 후 2MB 이상이면 경고)
    const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
    console.log(`📦 수신된 이미지 크기: ${sizeInMB.toFixed(2)}MB`);

    if (sizeInMB > 8) {
      return NextResponse.json(
        { error: '이미지가 너무 큽니다. 8MB 이하로 줄여주세요.' },
        { status: 413 }
      );
    }

    console.log('AI 분석 시작...');

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
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `이 이미지에서 여행/관광 관련 정보를 추출해주세요.

**중요: 이미지에 텍스트가 많이 있다면, 모든 텍스트를 꼼꼼히 읽고 분석하세요!**
하나의 이미지에 여러 개의 장소가 있을 수도 있습니다.

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

**추출 규칙:**
1. 이미지에 모든 텍스트를 세심하게 읽으세요
2. 장소명이 명확하지 않으면 건너뛰세요
3. 하나의 이미지에 여러 장소가 있으면 모두 추출하세요
4. 주소가 길어도 전부 포함하세요
5. 메뉴, 가격표, 영업시간 등 텍스트 정보를 빠짐없이 읽으세요
6. 한국어, 영어, 일본어 등 모든 언어 지원
7. 반드시 JSON만 반환 (다른 텍스트 없이)
8. 정보가 없으면 빈 배열: {"locations": []}`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('예상치 못한 응답 형식');
    }

    let jsonText = content.text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const result = JSON.parse(jsonText);
    console.log('추출된 장소:', result.locations?.length || 0, '개');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI 분석 오류:', error);
    return NextResponse.json(
      { error: error.message || 'AI 분석 실패' },
      { status: 500 }
    );
  }
}