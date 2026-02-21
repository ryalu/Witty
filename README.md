# 📍 Witty (위티)

> **"재미있고 똑똑하게 여행 계획!"**  
> 흩어진 인스타 릴스, 블로그 캡처를 AI가 자동으로 정리해주는 스마트 여행 플래너

<div align="center">
  <img src="public/witty-logo.png" alt="Witty Logo" width="200"/>
  
  [![Deploy with Vercel](https://vercel.com/button)](https://trip-witty.vercel.app)
</div>

---

## 🚀 서비스 개요

친구들과 여행 계획을 세울 때, 인스타 DM이나 카톡으로 공유되는 수많은 맛집과 꿀팁 정보를 찾느라 고생한 경험이 있으신가요?

**Witty**는 여행 정보 스크린샷을 AI가 자동으로 분석하여 장소, 주소, 설명을 추출하고, Google Maps와 연동하여 실제 여행에서 바로 사용할 수 있는 스마트 여행 플래너입니다.

**🔗 [지금 바로 사용해보기](https://witty-trip.vercel.app)**

---

## ✨ 주요 기능

### 🤖 1. AI 자동 정보 추출
- **이미지 업로드:** 인스타그램 릴스나 블로그 스크린샷 드래그앤드롭
- **AI 분석:** Claude 4.5 Sonnet이 이미지에서 장소명, 주소, 설명 자동 추출
- **한 이미지에 여러 장소 인식:** 한 번에 여러 곳의 정보를 동시에 추출
- **자동 카테고리 분류:** 맛집 🍽️ / 관광지 🗼 / 숙소 🏨 / 교통 🚗 / 기타 📌

### 🗺️ 2. Google Maps 완전 통합
- **자동 주소 검색:** AI가 추출한 장소명으로 정확한 위치 자동 검색
- **Place ID 저장:** Google의 공식 장소 정보와 연결
- **지도 시각화:** 모든 장소를 카테고리별 색상으로 지도에 표시
- **원클릭 길찾기:** "Google Maps에서 보기" 버튼으로 모바일 앱 바로 실행
- **링크 모음 복사:** 모든 장소 링크를 한번에 복사하여 친구들과 공유

### 📅 3. 스마트 일정 관리
- **Day 태그:** 여행 일자별로 장소 분류 (Day 1, Day 2...)
- **중요도 표시:** 별 3단계로 꼭 가야 할 곳 표시 ⭐⭐⭐
- **체크리스트:** 방문 완료한 곳 체크하며 여행
- **드래그앤드롭 순서 변경:** 동선대로 자유롭게 순서 조정
- **개인 메모:** 각 장소마다 예약 정보, 특이사항 메모

### 🔍 4. 스마트 필터링
- **카테고리별 필터:** 맛집만, 관광지만 골라보기
- **완료/미방문 필터:** 아직 안 간 곳만 모아보기
- **Day별 필터:** 특정 날짜 일정만 확인
- **자동 완료 처리:** 여행 종료일 지나면 자동으로 "완료된 여행"으로 분류

### 🎨 5. 세련된 UI/UX
- **브랜드 아이덴티티:** 로고 기반 일관된 색상 디자인
- **로딩 애니메이션:** 부드러운 로고 애니메이션
- **사용 가이드:** 5단계 간단한 사용법 안내
- **반응형 디자인:** 모바일/태블릿/PC 모두 최적화

---

## 🛠 Tech Stack

| 구분 | 기술 스택 |
|------|----------|
| **Frontend** | Next.js 16, TypeScript, React |
| **UI Library** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Storage, Auth) |
| **AI Engine** | Claude 4.5 Sonnet (Anthropic) |
| **Maps** | Google Maps JavaScript API, Geocoding API, Places API |
| **Image Analysis** | Claude Vision API |
| **Deployment** | Vercel |
| **Drag & Drop** | @dnd-kit |

---

## 📱 사용 방법

### 1️⃣ 여행 만들기
```
홈 → "새 여행 만들기" → 여행 이름, 국가, 날짜 입력
```

### 2️⃣ 이미지 업로드
```
여행 상세 → "이미지 업로드" → 인스타/블로그 캡처 드래그앤드롭
```

### 3️⃣ AI 자동 분석
```
자동으로 장소명, 주소, 설명 추출 → Google Maps 주소 검색
```

### 4️⃣ 확인 & 수정
```
정보 확인 → 필요시 장소명 수정 → "위치 찾기"로 재검색
→ 중요도 설정 → Day 태그 설정 → 메모 추가
```

### 5️⃣ 여행 중 사용
```
지도에서 확인 → "Google Maps에서 보기" → 길찾기 시작!
```

---

## 🎯 핵심 차별점

### vs. 노션
- ✅ **AI 자동 추출** (vs 수동 복붙)
- ✅ **Google Maps 자동 연동** (vs 링크 수동 입력)
- ✅ **모바일 최적화** (vs PC 중심)

### vs. 인스타 저장
- ✅ **통합 관리** (vs 흩어진 저장함)
- ✅ **카테고리 자동 분류** (vs 무작위 저장)
- ✅ **지도 시각화** (vs 리스트만)

### vs. 기존 여행 앱
- ✅ **개인화된 정보** (vs 광고성 추천)
- ✅ **AI 자동화** (vs 수동 입력)
- ✅ **친구들 정보 취합** (vs 개인만)

---

## 📈 주요 지표
```
✅ AI 분석 속도: 평균 3-5초
✅ 정확도: 장소명 95% / 주소 90%
✅ Google Maps 연동률: 85%
✅ 모바일 반응 속도: <1초
```

---

## 🗺️ Roadmap

### ✅ Phase 1 - MVP 완성 (2주)
- [x] AI 이미지 분석 엔진
- [x] Google Maps 통합
- [x] 기본 CRUD
- [x] 지도 시각화

### ✅ Phase 2 - 핵심 기능 (2주)
- [x] 체크리스트 & 중요도
- [x] Day 태그 & 일정 관리
- [x] 드래그앤드롭 순서 변경
- [x] 필터링 & 정렬

### ✅ Phase 3 - UI/UX 개선 (1주)
- [x] 브랜드 아이덴티티
- [x] 로딩 애니메이션
- [x] 사용 가이드
- [x] 반응형 디자인

### 🔄 Phase 4 - 협업 기능 (예정)
- [ ] 사용자 로그인 (Supabase Auth)
- [ ] 친구 초대 & 공유
- [ ] 실시간 협업 편집
- [ ] 댓글 & 투표

### 💡 Phase 5 - 고도화 (예정)
- [ ] 크롬 확장 프로그램
- [ ] URL 직접 입력
- [ ] 자동 동선 최적화
- [ ] 예산 관리
- [ ] Google My Maps 내보내기

---

## 💻 로컬 실행 방법

### 1. Clone
```bash
git clone https://github.com/ryalu/Witty.git
cd trip-organizer
```

### 2. 환경 변수 설정
`.env.local` 파일 생성:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. 패키지 설치 & 실행
```bash
npm install
npm run dev
```

### 4. 브라우저 접속
```
http://localhost:3000
```

---

## 📊 데이터베이스 스키마

### trips 테이블
```sql
- id: uuid (PK)
- name: text
- country: text
- start_date: date
- end_date: date
- user_id: text
```

### trip_infos 테이블
```sql
- id: uuid (PK)
- trip_id: uuid (FK)
- category: text
- name: text
- address: text
- description: text
- memo: text
- image_url: text
- latitude: float
- longitude: float
- place_id: text
- importance: int (0-3)
- is_completed: boolean
- day_number: int
- order: int
```

---

## 🎨 브랜드 컬러
```
Primary: #DFF4FC (하늘색)
Secondary: #FFFFFF (흰색)
Accent: #2A7C9E (청록색)
```

---

## 💡 개발 배경

**"여행 정보가 카톡/DM에 흩어져 스크롤 올리다가 포기했던 경험에서 시작."**

많은 정보를 공유받은 탓에 정작 여행 당일에 정보를 찾지 못하는 문제를 해결하고자 했습니다. 
AI 자동화로 3분 정리를 5초로 단축하고, 여행 자체에만 집중할 수 있는 환경을 만들었습니다.

---

## 📄 License

MIT License

---

## 🔗 Links

- **Live Demo:** [https://witty-trip.vercel.app](https://witty-trip.vercel.app)
- **GitHub:** [https://github.com/ryalu/Witty.git]

---

<div align="center">
  <p>Made with ❤️ by Witty Team</p>
  <p>재미있고 똑똑하게 여행 계획! ✈️</p>
</div>