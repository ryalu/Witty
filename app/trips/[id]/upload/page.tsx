'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, Sparkles, Link as LinkIcon, X } from 'lucide-react';

async function compressImageClient(file: File): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const maxSize = 1200;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.8);
      console.log(`🗜️ ${(file.size/1024/1024).toFixed(1)}MB → ${(compressed.length*0.75/1024/1024).toFixed(1)}MB`);
      URL.revokeObjectURL(img.src);
      resolve(compressed);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };

    img.src = URL.createObjectURL(file);
  });
}

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  // 파일 업로드용 상태
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState('');
  
  // URL 입력용 상태
  const [imageUrls, setImageUrls] = useState('');
  
  // 공통 상태
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  // 파일 선택
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  }

  // 파일 제거
  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  // 파일 업로드 분석
  async function handleFileAnalyze() {
    if (selectedFiles.length === 0) {
      alert('이미지를 선택해주세요!');
      return;
    }

    setAnalyzing(true);

    try {
      const analyzedResults: any[] = [];

      for (let i = 0; i< selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress(`이미지 압축 중... (${i + 1}/${selectedFiles.length})`);
        const base64 = await compressImageClient(file);
        setProgress(`AI 분석 중... (${i + 1}/${selectedFiles.length})`);

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });

        if (!response.ok) {
          console.error('분석 실패:', file.name);
          continue;
        }

        const data = await response.json();
        
        if (data.locations && data.locations.length > 0) {
          data.locations.forEach((loc: any) => {
            analyzedResults.push({
              imageUrl: base64,
              ...loc,
            });
          });
        }
      }

      if (analyzedResults.length === 0) {
        alert('추출된 정보가 없습니다. 다른 이미지를 시도해보세요.');
        setAnalyzing(false);
        return;
      }

      // 결과를 review 페이지로 전달
      sessionStorage.setItem('reviewData', JSON.stringify(analyzedResults));
      router.push(`/trips/${tripId}/review`);
    } catch (error) {
      console.error('분석 실패:', error);
      alert('이미지 분석 중 오류가 발생했습니다.');
      setAnalyzing(false);
    }
  }

  // URL 분석
  async function handleUrlAnalyze() {
    const urls = imageUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      alert('URL을 입력해주세요!');
      return;
    }

    setAnalyzing(true);

    try {
      const analyzedResults: any[] = [];

      for (const url of urls) {
        // URL을 base64로 변환
        const response = await fetch('/api/url-to-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          console.error(`URL 로드 실패: ${url}`);
          continue;
        }

        const { base64 } = await response.json();

        // AI 분석
        const analyzeResponse = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });

        if (!analyzeResponse.ok) {
          console.error(`분석 실패: ${url}`);
          continue;
        }

        const data = await analyzeResponse.json();
        
        if (data.locations && data.locations.length > 0) {
          data.locations.forEach((loc: any) => {
            analyzedResults.push({
              imageUrl: base64,
              ...loc,
            });
          });
        }
      }

      if (analyzedResults.length === 0) {
        alert('추출된 정보가 없습니다. 다른 URL을 시도해보세요.');
        setAnalyzing(false);
        return;
      }

      // 결과를 review 페이지로 전달
      sessionStorage.setItem('reviewData', JSON.stringify(analyzedResults));
      router.push(`/trips/${tripId}/review`);
    } catch (error) {
      console.error('분석 실패:', error);
      alert('URL 분석 중 오류가 발생했습니다.');
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push(`/trips/${tripId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="text-2xl">이미지 업로드 및 분석 📸</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              여행 정보가 담긴 이미지를 업로드하면 AI가 자동으로 분석해줘요!
            </p>
          </CardHeader>
          <CardContent>
            {/* 탭 */}
            <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'url')}>
              <TabsList className="grid w-full grid-cols-2 mb-6 dark:bg-gray-700">
                <TabsTrigger value="file" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-300">
                  <Upload className="w-4 h-4 mr-2" />
                  파일 업로드
                </TabsTrigger>
                <TabsTrigger value="url" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-300">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  URL 입력
                </TabsTrigger>
              </TabsList>

              {/* 파일 업로드 탭 */}
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2 dark:text-gray-200">
                      클릭하거나 파일을 드래그하세요
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      여러 장을 한번에 업로드할 수 있어요
                    </p>
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium dark:text-gray-200">
                      선택된 파일 ({selectedFiles.length}개):
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded border dark:border-gray-600"
                          />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleFileAnalyze}
                  disabled={analyzing || selectedFiles.length === 0}
                  size="lg"
                  className="w-full"
                >
                  {analyzing ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      {progress || 'AI 분석 중...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      AI로 정보 추출하기
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* URL 입력 탭 */}
              <TabsContent value="url" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    이미지 URL (줄바꿈으로 여러 개 입력 가능)
                  </label>
                  <Textarea
                    value={imageUrls}
                    onChange={(e) => setImageUrls(e.target.value)}
                    placeholder={`                 https://example.com/image1.jpg
                 https://example.com/image2.png
                 https://example.com/image3.jpeg`}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 인스타그램, 블로그 등의 이미지 URL을 붙여넣으세요
                  </p>
                </div>

                {imageUrls.trim() && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {imageUrls.split('\n').filter(url => url.trim()).length}개 URL 입력됨
                  </p>
                )}

                <Button
                  onClick={handleUrlAnalyze}
                  disabled={analyzing || !imageUrls.trim()}
                  size="lg"
                  className="w-full"
                >
                  {analyzing ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      AI로 정보 추출하기
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {/* 안내사항 */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                💡 분석 팁
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• 텍스트가 선명한 이미지일수록 정확도가 높아요</li>
                <li>• 한 이미지에 여러 장소가 있어도 모두 추출돼요</li>
                <li>• 장소명, 주소, 설명이 포함된 스크린샷이 좋아요</li>
                <li>• URL은 직접 접근 가능한 이미지 링크여야 해요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}