import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // URL에서 이미지 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`이미지 로드 실패: ${response.status}`);
    }

    // 이미지를 Buffer로 변환
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Base64로 인코딩
    const base64 = buffer.toString('base64');
    
    // Content-Type 확인
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Data URL 형식으로
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ base64: dataUrl });
  } catch (error: any) {
    console.error('URL to Base64 conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'URL 변환 실패' },
      { status: 500 }
    );
  }
}