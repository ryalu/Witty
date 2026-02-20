import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🚀 API 라우트 호출됨!');
  
  try {
    const body = await request.json();
    console.log('📦 받은 데이터:', body);
    
    const { imageUrl } = body;

    if (!imageUrl) {
      console.error('❌ imageUrl 없음');
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log('🖼️ 이미지 URL:', imageUrl);

    // API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY 없음');
      return NextResponse.json(
        { error: 'API Key가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ API Key 확인 완료');

    // 이미지 다운로드
    console.log('⬇️ 이미지 다운로드 중...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('❌ 이미지 다운로드 실패:', imageResponse.status);
      throw new Error('이미지를 가져올 수 없습니다.');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    console.log('✅ 이미지 변환 완료');
    console.log('📡 Claude API 호출 중...');

    // Claude API 호출
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
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

    console.log('📨 Claude 응답 상태:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.error('❌ Claude API 에러:', error);
      return NextResponse.json(
        { error: 'AI 분석 실패' },
        { status: claudeResponse.status }
      );
    }

    const data = await claudeResponse.json();
    console.log('✅ Claude 응답 받음');

    // 텍스트 추출
    const textContent = data.content.find((c: any) => c.type === 'text');
    if (!textContent) {
      console.error('❌ 텍스트 컨텐츠 없음');
      return NextResponse.json(
        { error: '응답 형식 오류' },
        { status: 500 }
      );
    }

    // JSON 파싱
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonText);
    console.log('✅ 분석 결과:', result);

    return NextResponse.json({
      success: true,
      data: result,
    });
    
  } catch (error: any) {
    console.error('💥 에러 발생:', error);
    return NextResponse.json(
      { error: error.message || 'AI 분석 중 오류 발생' },
      { status: 500 }
    );
  }
}