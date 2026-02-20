'use server';

export async function analyzeImage(imageUrl: string) {
  try {
    console.log('🚀 AI 분석 시작:', imageUrl);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API Key가 설정되지 않았습니다.');
    }

    console.log('⬇️ 이미지 다운로드 중...');
    
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('이미지를 가져올 수 없습니다.');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('📡 Claude API 호출 중...');

    // Claude API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: contentType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `이 이미지에서 여행 관련 정보를 추출해주세요.

다음 JSON 형식으로만 응답해주세요:
{
  "category": "restaurant | attraction | accommodation | transport | other",
  "name": "장소 이름",
  "address": "주소 (없으면 null)",
  "description": "설명 (없으면 null)"
}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Claude API 에러:', error);
      throw new Error('AI 분석 실패');
    }

    const data = await response.json();
    console.log('✅ Claude 응답 받음');

    // 텍스트 추출
    const textContent = data.content.find((c: any) => c.type === 'text');
    if (!textContent) {
      throw new Error('응답 형식 오류');
    }

    // JSON 파싱
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonText);
    console.log('✅ 분석 완료:', result);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('💥 에러:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}