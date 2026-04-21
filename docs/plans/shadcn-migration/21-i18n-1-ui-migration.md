# Phase i18n-1: UI 텍스트 번역

> Duration: 1일
> Goal: 모든 UI 컴포넌트의 하드코딩된 텍스트를 i18n으로 교체

## Overview

이 Phase에서는 모든 UI 컴포넌트, 패널, 에러 메시지의 하드코딩된 텍스트를 `useTranslation()` 훅을 사용한 다국어 텍스트로 교체합니다.

## Steps

### Step i18n-1-1: Sidepanel App.tsx i18n 적용

**파일:** `src/sidepanel/App.tsx`

1. **I18nextProvider 추가:**

```tsx
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/i18n/react';

function App() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          {/* ... 기존 코드 */}
        </ThemeProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}
```

2. **훅 사용 및 텍스트 교체:**

```tsx
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  // ... 기존 코드

  return (
    <ThemeProvider>
      <div className="w-full h-screen bg-background flex flex-col font-sans text-foreground relative">
        {/* Header */}
        <header className="px-4 py-3 bg-card border-b border-border flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/icons/icon48.png" alt="Logo" className="w-6 h-6" />
            <h1 className="font-bold text-sm">{t('app.name')}</h1>
            {activeCount > 0 && (
              <span className="text-xs text-primary font-medium">
                {t('app.activeCount', { count: activeCount })}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            aria-label={t('common.settings')}
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Tool Grid */}
        {ALL_TOOLS.map(tool => (
          <button
            key={tool.id}
            aria-label={`${t(`tools.${tool.id}.name`)} ${state.tools[tool.id].isActive ? t('common.disable') : t('common.enable')}`}
          >
            <tool.icon className="w-6 h-6 mb-2" />
            <span className="text-xs font-bold">{t(`tools.${tool.id}.name`)}</span>
            <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
              {t(`tools.${tool.id}.description`)}
            </span>
          </button>
        ))}
      </div>
    </ThemeProvider>
  );
}
```

3. **confirm 메시지 교체:**

```tsx
const handleToolClick = useCallback(async (toolId: ToolType) => {
  const currentState = state.tools[toolId];
  const newState = !currentState.isActive;

  if (currentState.isActive && currentState.hasUnsavedChanges) {
    const confirmed = window.confirm(t('common.unsavedChanges'));
    if (!confirmed) return;
  }
  // ... 나머지 코드
}, [state, switchTool, t]); // t 추가
```

---

### Step i18n-1-2: SettingsPanel i18n 적용

**파일:** `src/sidepanel/components/SettingsPanel.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/react';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  // 언어 변경 핸들러
  const handleLanguageChange = async (lang: 'ko' | 'en') => {
    setLanguage(lang);
    await changeLanguage(lang);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 언어 선택 */}
          <div>
            <Label>{t('settings.language.label')}</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">{t('settings.language.ko')}</SelectItem>
                <SelectItem value="en">{t('settings.language.en')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 테마 설정 (기존 유지) */}
          <div>
            <Label>{t('settings.theme.label')}</Label>
            {/* ... */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step i18n-1-3: 도구 패널 i18n 적용

각 도구 패널 컴포넌트에 `useTranslation()` 추가:

**예시: ScreenshotPanel.tsx**

```tsx
import { useTranslation } from 'react-i18next';

export function ScreenshotPanel({ /* ... */ }: ScreenshotPanelProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tools.screenshot.name')}</CardTitle>
        <CardDescription>{t('tools.screenshot.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* ... */}
        <Button>{t('common.save')}</Button>
        <Button variant="outline">{t('common.cancel')}</Button>
      </CardContent>
    </Card>
  );
}
```

**적용 대상 패널:**
- `src/components/Screenshot/ScreenshotPanel.tsx`
- `src/components/ColorPicker/ColorPickerPanel.tsx`
- `src/components/CSSScan/CSSScanPanel.tsx`
- `src/components/Ruler/RulerPanel.tsx`
- `src/components/GridLayout/GridLayoutPanel.tsx`
- `src/components/TailwindScanner/TailwindScannerPanel.tsx`
- `src/components/TextEditor/TextEditorPanel.tsx`
- `src/components/FontAnalyzer/FontAnalyzerPanel.tsx`
- `src/components/Palette/PalettePanel.tsx`
- `src/components/AssetManager/AssetManagerPanel.tsx`
- `src/components/Console/ConsolePanel.tsx`
- `src/components/ResourceNetwork/ResourceNetworkPanel.tsx`

---

### Step i18n-1-4: 에러 메시지 i18n 적용

**파일:** `src/sidepanel/App.tsx` (sendToolMessage 함수)

```tsx
const sendToolMessage = useCallback(async (toolId: ToolType, enabled: boolean): Promise<void> => {
  try {
    // ... 기존 코드

    if (!contentScriptReady) {
      console.error(t('errors.contentScriptTimeout'));
      toast.error(t('errors.contentScriptTimeout'));
      return;
    }

    // ...

    if (response && !response.success) {
      console.error(t('errors.captureFailed'), response.error);
      toast.error(t('errors.captureFailed'));
    }
  } catch (error) {
    console.error(t('errors.injectionFailed'), error);
    toast.error(t('errors.injectionFailed'));
  }
}, [t]);
```

---

### Step i18n-1-5: Popup i18n 적용

**파일:** `src/popup/App.tsx` (존재하는 경우)

Sidepanel과 동일하게 `I18nextProvider`와 `useTranslation()` 적용.

---

### Step i18n-1-6: Content Script i18n 적용

**파일:** `src/content/index.ts`

```typescript
import { t } from '@/i18n/core';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TOGGLE_TOOL') {
    // ...
    sendResponse({
      success: false,
      error: t('errors.injectionFailed'),
    });
  }
  return true;
});
```

---

### Step i18n-1-7: Background Script i18n 적용

**파일:** `src/background/index.ts`

```typescript
import { t } from '@/i18n/core';

// Context 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  TOOLS.forEach(tool => {
    chrome.contextMenus.create({
      id: tool.id,
      title: t(`tools.${tool.id}.name`),
      contexts: ['all'],
    });
  });
});

// 메시지 핸들러
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_ELEMENT') {
    // ...
    if (error) {
      sendResponse({
        success: false,
        error: t('errors.captureFailed'),
      });
    }
  }
  return true;
});
```

---

### Step i18n-1-8: 번역 파일 업데이트

필요한 경우 `src/i18n/locales/ko.json`, `en.json`에 누락된 키 추가:

```json
{
  "common": {
    "unsavedChanges": "저장되지 않은 변경사항이 있습니다. 계속하시겠습니까?"
  },
  "tools": {
    "screenshot": {
      "actions": {
        "capture": "캡처",
        "save": "저장",
        "copy": "복사",
        "download": "다운로드"
      }
    }
    // ... 다른 도구들도 필요에 따라 추가
  }
}
```

---

### Step i18n-1-9: TypeScript 타입 재생성

```bash
npm run i18n:generate
```

---

### Step i18n-1-10: 빌드 및 테스트

```bash
npm run build
```

**Chrome Extension 테스트:**
1. `dist/`를 Chrome에 로드
2. Sidepanel 열기
3. Settings 패널에서 언어 변경 (ko ↔ en)
4. 모든 텍스트가 올바르게 번역되는지 확인

**확인사항:**
- [ ] Header 텍스트 번역
- [ ] 도구 이름/설명 번역
- [ ] 설정 패널 번역
- [ ] 버튼 텍스트 번역
- [ ] 에러 메시지 번역
- [ ] 언어 변경 시 즉시 반영
- [ ] Chrome Storage에 언어 저장

---

## Completion Criteria

- [ ] Sidepanel App.tsx i18n 적용 완료
- [ ] SettingsPanel i18n 적용 완료
- [ ] 모든 도구 패널 i18n 적용 완료 (12개)
- [ ] 에러 메시지 i18n 적용 완료
- [ ] Popup i18n 적용 완료
- [ ] Content Script i18n 적용 완료
- [ ] Background Script i18n 적용 완료
- [ ] 언어 변경 기능 동작 확인
- [ ] 빌드 성공 및 테스트 통과

---

## Next Phase

[Phase i18n-2: 마무리 및 테스트](./22-i18n-2-finalization.md)
