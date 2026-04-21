# 컬러피커 프로페셔널 버전 - 설계 문서

**작성일**: 2026-02-09
**버전**: Professional v1.0
**예상 구현 시간**: 1-2일
**목표**: 실무에서 사용 가능한 고급 컬러피커 도구 구현

---

## 1. 개요

현재 Side Panel의 기본 `picker` 도구를 프로페셔널 수준의 컬러피커로 업그레이드합니다. 단순 색상 추출을 넘어 히스토리 관리, 포맷 변환, 팔레트 생성, 접근성 체크 등의 기능을 포함한 완성도 높은 도구를 만듭니다.

### 핵심 기능
- ✅ EyeDropper API를 사용한 픽셀 단위 색상 추출
- ✅ 무제한 색상 히스토리 (chrome.storage 활용)
- ✅ 전체 포맷 지원 (HEX, RGB, RGBA, HSL, HSLA, CSS variable)
- ✅ 자동 팔레트 생성 (유사색, 보색, 3색 조합)
- ✅ 즐겨찾기/컬렉션 기능
- ✅ Contrast ratio 계산 (WCAG 접근성 체크)
- ✅ 드래그 앤 드롭으로 색상 순서 변경
- ✅ 부드러운 애니메이션 UI

---

## 2. 아키텍처 및 파일 구조

### 새로 생성할 파일

```
src/
├── components/
│   ├── ColorPicker/
│   │   ├── ColorPickerPanel.tsx        # 메인 UI 컴포넌트
│   │   ├── ColorHistoryItem.tsx        # 색상 히스토리 아이템
│   │   ├── ColorFormatSelector.tsx     # 포맷 선택기 (HEX/RGB/HSL...)
│   │   ├── ColorPalette.tsx            # 자동 생성 팔레트
│   │   ├── ContrastChecker.tsx         # 접근성 체크
│   │   └── CollectionManager.tsx       # 즐겨찾기/컬렉션
│   └── ...
├── hooks/
│   ├── useColorPicker.ts               # 색상 추출 로직
│   ├── useColorHistory.ts              # 히스토리 관리
│   └── useColorStorage.ts              # chrome.storage 연동
├── utils/
│   ├── colorConverter.ts               # 색상 포맷 변환
│   ├── colorPalette.ts                 # 팔레트 생성 알고리즘
│   └── contrastRatio.ts                # WCAG 대비 계산
└── types/
    └── color.ts                        # 색상 타입 정의
```

### 통합 방식
- 기존 `sidepanel/App.tsx`의 `picker` 도구 클릭 시 `ColorPickerPanel` 표시
- Content script는 그대로 사용하되 메시지 통신 개선
- 독립적인 모듈로 만들어서 나중에 재사용 가능

---

## 3. UI/UX 설계

### 메인 화면 구성

```
┌─────────────────────────────────┐
│  🎨 컬러피커                      │
├─────────────────────────────────┤
│  [🎯 색상 추출하기] ← 큰 버튼      │
│                                 │
│  포맷: [HEX ▼] [자동복사 ✓]       │
│                                 │
│  📌 현재 색상                     │
│  ┌─────────────────────────┐    │
│  │   #3B82F6                │    │
│  │   ████████████████       │    │
│  │   RGB(59, 130, 246)      │    │
│  │   HSL(217, 91%, 60%)     │    │
│  │   [복사] [저장] [팔레트]  │    │
│  └─────────────────────────┘    │
│                                 │
│  ⚡ 빠른 팔레트                    │
│  [🔵][🔷][🔹][💙][🌀]              │
│  (유사색, 보색 자동 생성)          │
│                                 │
│  🕐 히스토리 (최근 20개)           │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐         │
│  │▀│▀│▀│▀│▀│▀│▀│▀│▀│▀│         │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘         │
│                                 │
│  ⭐ 저장된 컬렉션                  │
│  › 프로젝트 A (5색)               │
│  › UI 디자인 (12색)               │
│  › 브랜드 색상 (3색)               │
│                                 │
│  ♿ 대비 체크                      │
│  전경: #3B82F6  배경: #FFFFFF    │
│  대비: 4.5:1 [AA ✓] [AAA ✗]     │
└─────────────────────────────────┘
```

### 인터랙션
- **색상 추출하기 버튼**: 클릭 시 EyeDropper 활성화, 페이지의 픽셀 선택
- **히스토리 아이템**: 클릭으로 색상 선택, 길게 눌러 삭제
- **팔레트 생성**: 현재 색상 기반으로 조화로운 색상 5개 자동 생성
- **드래그 앤 드롭**: 컬렉션 내에서 색상 순서 변경
- **자동 복사**: 토글 ON이면 색상 선택 시 자동으로 클립보드에 복사

### 애니메이션
- 색상 추출 시 부드러운 fade-in
- 히스토리 추가 시 slide-in 애니메이션
- 호버 시 scale up (1.05x)
- 복사 완료 시 체크마크 bounce

---

## 4. 데이터 모델

### 타입 정의 (src/types/color.ts)

```typescript
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'css-var';

export interface Color {
  id: string;                    // UUID
  hex: string;                   // #3B82F6
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  alpha: number;                 // 0-1
  timestamp: number;             // Date.now()
  source?: 'picker' | 'palette' | 'manual';
}

export interface ColorCollection {
  id: string;
  name: string;
  colors: Color[];
  createdAt: number;
  updatedAt: number;
}

export interface ColorPickerSettings {
  defaultFormat: ColorFormat;
  autoCopy: boolean;
  historyLimit: number;          // 기본 20
  showPalette: boolean;
  showContrast: boolean;
}
```

### Chrome Storage 구조

```typescript
{
  'colorPicker:history': Color[],           // 최근 20개
  'colorPicker:collections': ColorCollection[],
  'colorPicker:settings': ColorPickerSettings,
  'colorPicker:favorites': string[]         // Color IDs
}
```

### 상태 관리
- `useColorHistory`: 히스토리 CRUD (Create, Read, Update, Delete)
- `useColorStorage`: chrome.storage.local과 동기화
- 로컬 상태(useState)와 storage 자동 동기화
- Debounce로 과도한 storage 쓰기 방지

### 데이터 흐름
1. 사용자가 EyeDropper로 색상 선택
2. RGB 값을 받아서 Color 객체 생성 (모든 포맷으로 변환)
3. 히스토리 배열 맨 앞에 추가 (20개 초과 시 오래된 것 삭제)
4. chrome.storage에 저장
5. UI 자동 업데이트

---

## 5. 핵심 기능 구현

### A. 색상 추출 (EyeDropper API + Fallback)

```typescript
// hooks/useColorPicker.ts
async function pickColor(): Promise<Color> {
  if ('EyeDropper' in window) {
    // Chrome 95+ 지원
    const eyeDropper = new EyeDropper();
    const result = await eyeDropper.open();
    return createColorFromHex(result.sRGBHex);
  } else {
    // Fallback: Content script에서 클릭한 요소의 색상 추출
    const color = await getColorFromElement();
    return createColorFromRGB(color);
  }
}
```

### B. 색상 포맷 변환

```typescript
// utils/colorConverter.ts
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  // HSL 변환 알고리즘 구현
}

export function formatColor(color: Color, format: ColorFormat): string {
  switch(format) {
    case 'hex': return color.hex;
    case 'rgb': return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
    case 'hsl': return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
    // ...
  }
}
```

### C. 자동 팔레트 생성

```typescript
// utils/colorPalette.ts
export function generatePalette(baseColor: Color): Color[] {
  return [
    baseColor,                              // 원본
    generateAnalogous(baseColor, 30),       // 유사색 +30°
    generateAnalogous(baseColor, -30),      // 유사색 -30°
    generateComplementary(baseColor),       // 보색 (180°)
    generateTriadic(baseColor, 120)         // 3색 조합
  ];
}

function generateAnalogous(color: Color, degrees: number): Color {
  const newHue = (color.hsl.h + degrees + 360) % 360;
  return createColorFromHSL(newHue, color.hsl.s, color.hsl.l);
}
```

### D. 대비율 계산 (WCAG)

```typescript
// utils/contrastRatio.ts
export function getContrastRatio(fg: Color, bg: Color): number {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function checkWCAG(ratio: number): {
  aa: boolean;    // 4.5:1
  aaa: boolean;   // 7:1
} {
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7.0
  };
}
```

### E. 클립보드 복사

```typescript
async function copyToClipboard(color: Color, format: ColorFormat) {
  const text = formatColor(color, format);
  await navigator.clipboard.writeText(text);
  showToast(`${text} 복사됨`, color.hex);
}
```

---

## 6. 에러 처리 및 Fallback

### A. EyeDropper API 미지원 브라우저

```typescript
// Chrome 95 미만, Firefox, Safari 등
const hasEyeDropper = 'EyeDropper' in window;

if (!hasEyeDropper) {
  // Fallback 1: Canvas를 사용한 수동 픽셀 추출
  // Content script에서 마우스 커서 위치의 색상 샘플링

  // Fallback 2: 요소의 computed style에서 색상 추출
  const style = getComputedStyle(element);
  const color = style.backgroundColor || style.color;
}
```

### B. 권한 거부 처리

```typescript
try {
  const result = await eyeDropper.open();
} catch (error) {
  if (error.name === 'NotAllowedError') {
    showToast('색상 추출 권한이 필요합니다', '#EF4444');
  } else if (error.name === 'AbortError') {
    // 사용자가 ESC로 취소
    return null;
  }
}
```

### C. Storage 용량 제한

```typescript
// chrome.storage.local은 10MB 제한
const HISTORY_LIMIT = 20;
const COLLECTION_LIMIT = 50;

async function addToHistory(color: Color) {
  const history = await getHistory();
  const newHistory = [color, ...history].slice(0, HISTORY_LIMIT);

  try {
    await chrome.storage.local.set({ 'colorPicker:history': newHistory });
  } catch (error) {
    if (error.message.includes('QUOTA_BYTES')) {
      // 가장 오래된 항목 삭제 후 재시도
      await chrome.storage.local.set({
        'colorPicker:history': newHistory.slice(0, 10)
      });
    }
  }
}
```

### D. 잘못된 색상 값 처리

```typescript
function createColorFromHex(hex: string): Color | null {
  const cleaned = hex.replace(/^#/, '');

  if (!/^[0-9A-F]{6}$/i.test(cleaned)) {
    console.error('Invalid hex color:', hex);
    return null;
  }

  const rgb = hexToRgb('#' + cleaned);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    id: crypto.randomUUID(),
    hex: '#' + cleaned.toUpperCase(),
    rgb,
    hsl,
    alpha: 1,
    timestamp: Date.now(),
    source: 'picker'
  };
}
```

### E. 사용자 피드백

모든 작업에 명확한 피드백을 제공합니다:

- 색상 추출 시작: "화면에서 색상을 선택하세요"
- 추출 성공: "#3B82F6 복사됨" (토스트 + 색상 배경)
- 추출 취소: 조용히 처리 (알림 없음)
- 저장 성공: "컬렉션에 저장됨" ✓
- 에러 발생: "다시 시도해주세요" (재시도 버튼 제공)

---

## 7. 구현 순서

### Phase 1: 기본 인프라 (2-3시간)
1. 타입 정의 생성 (`src/types/color.ts`)
2. 색상 변환 유틸리티 (`src/utils/colorConverter.ts`)
3. Storage 훅 구현 (`src/hooks/useColorStorage.ts`)

### Phase 2: 핵심 기능 (3-4시간)
4. 색상 추출 훅 (`src/hooks/useColorPicker.ts`)
5. 히스토리 관리 훅 (`src/hooks/useColorHistory.ts`)
6. 메인 패널 컴포넌트 (`src/components/ColorPicker/ColorPickerPanel.tsx`)

### Phase 3: 고급 기능 (2-3시간)
7. 팔레트 생성 (`src/utils/colorPalette.ts`)
8. 대비율 계산 (`src/utils/contrastRatio.ts`)
9. 컬렉션 관리 컴포넌트

### Phase 4: UI/UX 완성 (2-3시간)
10. 애니메이션 추가
11. 드래그 앤 드롭 구현
12. 접근성 개선 (키보드 네비게이션)

### Phase 5: 테스트 및 최적화 (1-2시간)
13. 에러 케이스 테스트
14. 퍼포먼스 최적화
15. 크로스 브라우저 테스트

**총 예상 시간**: 10-15시간 (1-2일)

---

## 8. 성공 기준

### 필수 기능
- ✅ EyeDropper로 픽셀 단위 색상 추출 가능
- ✅ 추출한 색상이 히스토리에 자동 저장
- ✅ HEX, RGB, HSL 포맷 변환 정상 작동
- ✅ 클립보드 복사 기능 정상 작동
- ✅ Storage 동기화 정상 작동

### 고급 기능
- ✅ 팔레트 자동 생성이 조화로운 색상 제공
- ✅ 대비율 계산이 WCAG 기준에 맞게 동작
- ✅ 컬렉션 저장/불러오기 정상 작동
- ✅ 모든 에러 케이스에 적절한 피드백 제공

### UX 품질
- ✅ 모든 인터랙션이 0.3초 이내 반응
- ✅ 애니메이션이 부드럽고 자연스러움
- ✅ 모바일/데스크톱 모두에서 사용 가능
- ✅ 키보드만으로도 모든 기능 사용 가능

---

## 9. 향후 확장 가능성

이번 구현 후 추가 가능한 기능들:

1. **이미지 색상 추출**: 드래그 앤 드롭으로 이미지 업로드, 주요 색상 자동 추출
2. **그라디언트 생성**: 두 색상 사이의 그라디언트 CSS 코드 자동 생성
3. **Export/Import**: JSON, CSS, Tailwind config 형식으로 내보내기
4. **AI 색상 추천**: 브랜드나 분위기에 맞는 색상 조합 제안
5. **색맹 시뮬레이션**: 다양한 색맹 타입에서 어떻게 보이는지 확인

---

**문서 종료**
