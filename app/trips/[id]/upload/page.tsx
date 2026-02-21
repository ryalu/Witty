'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { analyzeImage } from '@/lib/ai';
import { uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Category } from '@/types/trip';

interface UploadedImage {
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
}

interface AnalyzedResult {
  imageUrl: string;
  category: Category;
  name: String;
  address: string | null;
  description: string | null;
  latitude?: number;
  longitude?: number;
}

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [country, setCountry] = useState<string>('');

  useEffect(() => {
    async function loadTrip() {
      const { data } = await supabase
        .from('trips')
        .select('country')
        .eq('id', tripId)
        .single();
      
      if (data) {
        setCountry(data.country);
      }
    }
    loadTrip();    
  }, [tripId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
      }));
      setImages((prev) => [...prev, ...newImages]);
    },
  });

  function removeImage(index: number) {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }

async function handleUpload() {
  if (images.length === 0) {
    alert('이미지를 먼저 선택해주세요!');
    return;
  }

  setUploading(true);

  try {
    const analyzedResults: AnalyzedResult[] = [];

    for (let i = 0; i < images.length; i++) {
      console.log(`=== 이미지 ${i + 1} 처리 시작 ===`);

      setImages((prev) => {
        const updated = [...prev];
        updated[i].uploading = true;
        return updated;
      });

      // 1. 이미지 업로드
      console.log('1. Supabase에 업로드 중...');
      const url = await uploadImage(images[i].file);
      console.log('업로드 완료:', url);

      setImages((prev) => {
        const updated = [...prev];
        updated[i].url = url;
        return updated;
      });

      // 2. AI 분석
      console.log('2. AI 분석 시작...');
      const analyzeResult = await analyzeImage(url);

      if (!analyzeResult.success) {
        throw new Error(analyzeResult.error || 'AI 분석 실패');
      }

      if (!analyzeResult.data || analyzeResult.data.length === 0) {
        console.log('⚠️ 이미지에서 여행 정보를 찾을 수 없습니다.');
        // 빈 배열이면 건너뛰기
        setImages((prev) => {
          const updated = [...prev];
          updated[i].uploading = false;
          return updated;
        });
        continue;
      }

      console.log(`AI 분석 결과: ${analyzeResult.data.length}개 발견`);

      // ⭐ 배열로 받은 결과 모두 추가
      for (const place of analyzeResult.data) {
        analyzedResults.push({
          imageUrl: url,
          category: place.category as Category,
          name: place.name,
          address: place.address,
          description: place.description,
        });
      }

      setImages((prev) => {
        const updated = [...prev];
        updated[i].uploading = false;
        return updated;
      });

      console.log(`=== 이미지 ${i + 1} 처리 완료 ===`);
    }

    if (analyzedResults.length === 0) {
      alert('이미지에서 여행 정보를 찾을 수 없습니다.');
      setUploading(false);
      return;
    }

    console.log(`모든 분석 완료: 총 ${analyzedResults.length}개 정보`);

    // localStorage 저장
    try {
      localStorage.setItem('analyzedResults', JSON.stringify(analyzedResults));
      console.log('✅ localStorage 저장 완료');
    } catch (e) {
      console.error('❌ localStorage 저장 실패:', e);
      throw new Error('데이터 저장 실패');
    }

    setUploading(false);

    alert(
      `${images.length}개 이미지 분석 완료!\n총 ${analyzedResults.length}개 정보를 찾았어요 🎉`
    );

    // URL 파라미터로 전달
    const encodedData = encodeURIComponent(JSON.stringify(analyzedResults));
    setTimeout(() => {
      router.push(`/trips/${tripId}/review?data=${encodedData}`);
    }, 100);
  } catch (error: any) {
    console.error('Upload error:', error);
    alert(`오류: ${error.message}`);
    setUploading(false);
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/trips/${tripId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">이미지 업로드 📸</CardTitle>
            <p className="text-sm text-gray-600">
              인스타 스크린샷, 블로그 캡처 등을 업로드하면 AI가 자동으로
              정보를 추출해요!
            </p>
          </CardHeader>
          <CardContent>
            {/* 드래그앤드롭 영역 */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors
                ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-lg text-blue-600">이미지를 놓아주세요!</p>
              ) : (
                <>
                  <p className="text-lg mb-2">
                    이미지를 드래그하거나 클릭해서 선택하세요
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, GIF 등 이미지 파일
                  </p>
                </>
              )}
            </div>

            {/* 업로드된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  선택된 이미지 ({images.length}개)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <p className="text-white text-sm">
                            {image.url ? 'AI 분석 중...' : '업로드 중...'}
                          </p>
                        </div>
                      )}
                      {!uploading && (
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 업로드 버튼 */}
            {images.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                size="lg"
                className="w-full mt-6"
              >
                {uploading ? (
                  '처리 중...'
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    {images.length}개 이미지 업로드하고 AI 분석하기
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}