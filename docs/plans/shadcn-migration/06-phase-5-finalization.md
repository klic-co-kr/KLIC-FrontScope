# Phase 5: 마무리

> Duration: 1일
> Prerequisite: [Phase 4 완료](./05-phase-4-tabbed-panels.md)
> Goal: Content script 처리 및 최종 테스트, 문서화

## Overview

이 Phase에서는 Content script의 토스트/오버레이 스타일을 처리하고, 전체 빌드 및 테마 전환 테스트를 수행합니다. 마지막으로 CLAUDE.md를 업데이트합니다.

## Steps

### Step 5-1: Content script 토스트/오버레이 처리

**대상 파일:** `src/content/utils/detectTheme.ts` (신규 생성)

#### 문제 상황
Content script는 웹 페이지에 주입되므로 확장 프로그램의 CSS 변수에 접근할 수 없습니다. 인라인 스타일로 다크/라이트 모드를 분기해야 합니다.

#### 해결책: 웹 페이지 배경 luminance 감지

```typescript
// src/content/utils/detectTheme.ts (신규 파일)
export function detectPageTheme(): 'light' | 'dark' {
  const body = document.body
  const bgColor = window.getComputedStyle(body).backgroundColor

  // RGB 추출
  const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return 'light'

  const [, r, g, b] = match.map(Number)

  // Relative luminance 계산 (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? 'light' : 'dark'
}

// 테마별 색상 맵
export const getToastColors = (theme: 'light' | 'dark') => {
  return {
    background: theme === 'light' ? '#ffffff' : '#1a1a1a',
    foreground: theme === 'light' ? '#0a0a0a' : '#f5f5f5',
    border: theme === 'light' ? '#e5e5e5' : '#333333',
    primary: theme === 'light' ? '#3b82f6' : '#60a5fa',
  }
}
```

> **Note:** `src/content/utils/` 디렉토리가 없으면 먼저 생성하세요.

#### 사용 예시
```typescript
import { detectPageTheme, getToastColors } from './utils/detectTheme'

// 토스트 생성
function showToast(message: string) {
  const theme = detectPageTheme()
  const colors = getToastColors(theme)

  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${colors.background};
    color: ${colors.foreground};
    border: 1px solid ${colors.border};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}
```

### 확인사항
- [ ] 밝은 페이지에서 라이트 토스트 표시
- [ ] 어두운 페이지에서 다크 토스트 표시
- [ ] 토스트 제거 작동

---

### Step 5-2: 전체 빌드

```bash
npm run build
```

#### 확인사항
- [ ] 빌드 성공 (에러 없음)
- [ ] `dist/` 디렉토리 생성 확인
- [ ] 모든 엔트리 포인트 번들 확인:
  - `dist/assets/background.js`
  - `dist/assets/content.js`
  - `dist/assets/sidepanel.js`
  - `dist/assets/popup.js`

---

### Step 5-3: 다크/라이트 모드 전환 테스트

#### 테스트 환경 설정
1. Chrome에서 `chrome://extensions/` 열기
2. KLIC-Tool 확장 프로그램 로드
3. Side Panel 열기

#### 테스트 케이스

| # | 테스트 | 예상 결과 | 통과 |
|---|--------|----------|------|
| 1 | Light 모드 선택 | 밝은 배경, 어두운 텍스트 | |
| 2 | Dark 모드 선택 | 어두운 배경, 밝은 텍스트 | |
| 3 | System 모드 선택 | OS 설정 따름 | |
| 4 | 모드 전환 시 FOUC 없음 | 즉시 전환, 깜빡임 없음 | |
| 5 | 새로고침 후 모드 유지 | 저장된 모드로 로드 | |
| 6 | Popup과 Sidepanel 동기화 | 한쪽에서 변경 시 다른 쪽도 변경 | |

#### shadcn 컴포넌트별 확인

| 컴포넌트 | Light 모드 | Dark 모드 |
|----------|-----------|-----------|
| Button (default) | primary bg, light fg | primary bg, dark fg |
| Button (outline) | transparent, border | transparent, border |
| Card | white bg | dark gray bg |
| Input | white bg, border | dark gray bg, border |
| Dialog | white bg | dark gray bg |
| Tabs | gray bg, active underline | dark gray bg, active underline |

---

### Step 5-4: 5가지 액센트 테마 전환 테스트

#### 테스트 케이스

| 액센트 | Primary (Light) | Primary (Dark) | 대비 확인 |
|--------|-----------------|----------------|----------|
| Blue | oklch(0.55 0.22 264) | oklch(0.65 0.24 264) | |
| Amber | oklch(0.70 0.19 70) | oklch(0.75 0.17 70) | **전경색 어두움 확인** |
| Green | oklch(0.58 0.19 149) | oklch(0.68 0.18 149) | |
| Violet | oklch(0.56 0.24 292) | oklch(0.66 0.23 292) | |
| Rose | oklch(0.60 0.23 16) | oklch(0.70 0.22 16) | |

#### Amber 특별 확인
Amber는 밝은 색상이므로 Light 모드에서 전경색이 어두워야 합니다:
- Light mode: `--primary-foreground: oklch(0.20 0 0)` (어두운 전경)
- Dark mode: `--primary-foreground: oklch(0.15 0.01 275)` (어두운 전경)

#### 시각적 확인
- [ ] Blue: Button 가독성 양호
- [ ] Amber: Button 가독성 양호 (전경색 확인)
- [ ] Green: Button 가독성 양호
- [ ] Violet: Button 가독성 양호
- [ ] Rose: Button 가독성 양호

---

### Step 5-5: CLAUDE.md 업데이트

**추가할 내용:**

```markdown
## Theme System

KLIC-Tool은 shadcn/ui 기반 테마 시스템을 사용합니다.

### Mode Selection

- **Light**: 밝은 배경
- **Dark**: 어두운 배경
- **System**: OS 설정 따름

### Accent Themes

5가지 액센트 테마를 제공합니다:

- **Blue** (기본): oklch(0.55 0.22 264)
- **Amber**: oklch(0.70 0.19 70)
- **Green**: oklch(0.58 0.19 149)
- **Violet**: oklch(0.56 0.24 292)
- **Rose**: oklch(0.60 0.23 16)

### Theme Storage

테마 설정은 `chrome.storage.local`에 저장됩니다:
- `theme:mode`: 'light' | 'dark' | 'system'
- `theme:accent`: 'blue' | 'amber' | 'green' | 'violet' | 'rose'

### CSS Variables

모든 색상은 `src/index.css`에 정의된 CSS 변수를 사용합니다.
Primary 색상은 `[data-theme]` 속성으로 제어됩니다.

### Content Script Theme

Content script는 웹 페이지 배경 luminance를 감지하여
light/dark 테마를 자동으로 결정합니다.
```

---

### Step 5-6: Git 커밋

```bash
# 변경 사항 확인
git status

# 커밋
git add .
git commit -m "feat: Add shadcn/ui theme system with multi-accent support

- Implement shadcn/ui component system
- Add light/dark/system mode support
- Add 5 accent themes (blue, amber, green, violet, rose)
- Add ThemeProvider with Chrome Storage sync
- Add FOUC prevention with external script (MV3 CSP compliant)
- Migrate all panels to shadcn/ui components
- Add content script theme detection based on page luminance

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Completion Criteria

- [ ] `src/content/utils/detectTheme.ts` 생성 완료 (detectPageTheme, getToastColors)
- [ ] Content script 토스트/오버레이 테마 분기 완료
- [ ] 전체 빌드 성공
- [ ] 다크/라이트 모드 전환 테스트 통과
- [ ] 5가지 액센트 테마 전환 테스트 통과
- [ ] Amber 대비 확인 완료
- [ ] CLAUDE.md 업데이트 완료
- [ ] Git 커밋 완료

---

## Merge to Main

```bash
# 1. main 브랜치로 이동
git checkout main
git pull

# 2. feature 브랜치 병합
git merge feature/shadcn-migration

# 3. 최종 빌드 테스트
npm run build

# 4. Push
git push

# 5. (선택) feature 브랜치 삭제
git branch -d feature/shadcn-migration
```

---

## Project Status Update

```markdown
# shadcn/ui + Dark Mode + Multi-Theme Migration

> Status: ✅ Complete
> Completed: 2026-02-XX
```

---

## Rollback Plan (비상시)

문제가 발생할 경우:

```bash
# main으로 되돌리기
git checkout main
git reset --hard HEAD~1

# 또는 특정 커밋으로 되돌리기
git checkout main
git reset --hard <commit-hash-before-migration>
```

---

## 축하합니다!

모든 Phase가 완료되었습니다. KLIC-Tool은 이제 shadcn/ui 기반의 아름다운 테마 시스템을 갖추게 되었습니다.

🎉 **Migration Complete!**
