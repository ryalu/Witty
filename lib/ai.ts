'use server';

import Anthropic from '@anthropic-ai/sdk';

export async function analyzeImage(imageUrl: string) {
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

[중요: 이미지에 여러 장소가 있다면 모두 추출해주세요!]

각 장소마다 다음 정보를 추출:
- category: "restaurant" | "attraction" | "accommodation" | "transport" | "other"
- name: 장소 이름
- address: 주소 (없으면 null)
- description: 간단한 설명 (영업시간, 가격, 특징 등)

[응답 형식]:
- 장소가 1개면: [{ 정보 }]
- 장소가 여러개면: [{ 정보1 }, { 정보2 }, ...]

JSON 배열로만 응답해주세요:
[
  {
    "category": "restaurant",
    "name": "장소1 이름",
    "address": "주소1",
    "description": "설명1"
  },
  {
    "category": "attraction",
    "name": "장소2 이름",
    "address": "주소2",
    "description": "설명2"
  }
]

여행 정보가 없으면:
[
  {
    "category": "other",
    "name": "정보 없음",
    "address": null,
    "description": "여행 정보를 찾을 수 없습니다."
  }
]`,
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

    const result = JSON.parse(jsonText);
    
    // 배열인지 확인, 아니면 배열로 감싸기
    const results = Array.isArray(result) ? result : [result];
    
    console.log('✅ 분석 완료:', results);

    return {
      success: true,
      data: results,  // 배열로 반환
    };
  } catch (error: any) {
    console.error('💥 에러:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}