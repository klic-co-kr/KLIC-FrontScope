# Contributing to KLIC-FrontScope

KLIC-FrontScope에 기여해주셔서 감사합니다!

## 개발 환경 설정

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser (for extension testing)

### 설치

```bash
# Clone repository
git clone git@github.com:klic-co-kr/KLIC-FrontScope.git
cd KLIC-FrontScope

# Install dependencies
npm install
```

## 개발

```bash
# Development server with HMR
npm run dev

# Type check
tsc -b

# Lint
npm run lint

# Build for production
npm run build

# Generate i18n types
npm run i18n:generate

# Check missing translations
npm run i18n:check
```

## Chrome Extension 테스트

1. `npm run build` 실행
2. Chrome에서 `chrome://extensions/` 열기
3. Developer mode 활성화
4. "Load unpacked" 클릭
5. `dist/` 디렉토리 선택

코드 변경 후:
1. `npm run build` 재실행
2. extension 카드에서 reload 아이콘 클릭

## 코드 스타일

### TypeScript

- Strict mode 활성화
- 타입 단언(`as`)보다 타입 가드 사용
- `any` 타입 지양

### React

- 함수 컴포넌트 사용
- Hooks 규칙 준수
- shadcn/ui 컴포넌트 우선 사용

### CSS

- Tailwind CSS 유틸리티 사용
- shadcn/ui 테마 변수 사용
- 인라인 스타일 지양

## i18n (다국어)

### 번역 추가

1. `src/i18n/locales/ko.json`에 한국어 추가
2. `src/i18n/locales/en.json`에 영어 추가
3. `npm run i18n:check`로 동기화 확인

### 번역 사용

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('common.save')}</button>;
}
```

## 새 도구 추가

1. `src/sidepanel/constants/tools.ts`에 도구 등록
2. `src/content/index.ts`에 핸들러 추가
3. `src/sidepanel/components/ToolRouter.tsx`에 라우팅 추가
4. `src/background/index.ts`에 컨텍스트 메뉴 추가
5. i18n 번역 파일에 이름/설명 추가

## Pull Request

1. Fork repository
2. Feature branch 생성 (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Pull Request 생성

### Commit Message Convention

- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 리팩토링
- `docs:` 문서
- `test:` 테스트
- `chore:` 기타

## 라이선스

Contributions은 MIT 라이선스 하에 라이선스됩니다.
