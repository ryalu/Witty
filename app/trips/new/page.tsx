'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTrip } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function NewTripPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.country) {
      alert('여행 이름과 국가는 필수입니다!');
      return;
    }

    try {
      setLoading(true);
      const trip = await createTrip(formData);
      alert('여행이 생성되었습니다! 🎉');
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('여행 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DFF4FC] to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 뒤로가기 */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        {/* 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">새 여행 만들기 ✈️</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  여행 이름 *
                </label>
                <Input
                  placeholder="예: 도쿄 여행"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  국가 *
                </label>
                <Input
                  placeholder="예: 일본"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    시작일
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    종료일
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? '생성 중...' : '여행 만들기 🎉'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}