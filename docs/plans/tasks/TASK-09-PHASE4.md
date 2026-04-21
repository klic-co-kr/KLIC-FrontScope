# Phase 4: Config 추출

**태스크**: 4개
**예상 시간**: 2시간
**의존성**: Phase 1-3 완료

---

### Task #9.25: Tailwind 설정 추출

- **파일**: `src/utils/tailwind/extractTailwindConfig.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**:
```typescript
import { TailwindConfig } from '../../types/tailwindScanner';

/**
 * 페이지에서 Tailwind 설정 추출
 */
export function extractTailwindConfig(): TailwindConfig | null {
  // 1. script 태그에서 설정 찾기
  const scriptConfig = findConfigInScripts();
  if (scriptConfig) {
    return scriptConfig;
  }

  // 2. 외인 설정 파일에서 찾기
  const externalConfig = findExternalConfig();
  if (externalConfig) {
    return externalConfig;
  }

  // 3. 사용된 클래스에서 설정 추론
  const inferredConfig = inferConfigFromClasses();
  return inferredConfig;
}

/**
 * Script 태그에서 설정 찾기
 */
function findConfigInScripts(): TailwindConfig | null {
  const scripts = Array.from(document.querySelectorAll('script'));

  for (const script of scripts) {
    const content = script.textContent || '';

    // tailwind.config 찾기
    const configMatch = content.match(/tailwind\.config\s*=\s*({[\s\S]*?});/);
    if (configMatch) {
      try {
        const config = eval(`(${configMatch[1]})`);
        return normalizeConfig(config);
      } catch (error) {
        console.error('Failed to parse tailwind config:', error);
      }
    }
  }

  return null;
}

/**
 * 외부 설정 파일 찾기
 */
function findExternalConfig(): TailwindConfig | null {
  // tailwind.config.js를 찾기 위한 시도
  // 실제로는 CSP 제약으로 직접 읽기 어려움
  // 대신 사용자에게 파일 내용을 요청할 수 있음

  // 현재는 null 반환
  return null;
}

/**
 * 사용된 클래스에서 설정 추론
 */
function inferConfigFromClasses(): TailwindConfig {
  const config: TailwindConfig = {
    theme: {},
  };

  // 색상 추론
  config.theme.colors = extractColors();

  // 스페이싱 추론
  config.theme.spacing = extractSpacing();

  // 폰트 크기 추론
  config.theme.fontSize = extractFontSizes();

  // 보더 반경 추론
  config.theme.borderRadius = extractBorderRadius();

  return config;
}

/**
 * 설정 정규화
 */
function normalizeConfig(config: any): TailwindConfig {
  return {
    theme: {
      colors: config.theme?.colors || {},
      spacing: config.theme?.spacing || {},
      fontSize: config.theme?.fontSize || {},
      borderRadius: config.theme?.borderRadius || {},
      screens: config.theme?.screens || {},
    },
    plugins: config.plugins || [],
    presets: config.presets || [],
  };
}
```
- **완료 조건**: 설정 추출 정상 동작

---

### Task #9.26: 색상 추출

- **파일**: `src/utils/tailwind/extractColors.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 페이지에서 사용자 정의 색상 추출
 */
export function extractColors(): Record<string, string | Record<string, string>> {
  const colors: Record<string, string | Record<string, string>> = {};
  const colorUsage = new Map<string, string[]>();

  // 모든 요소의 색상 클래스 수집
  const elements = document.querySelectorAll('[class]');

  for (const el of elements) {
    const classes = el.className?.split(/\s+/) || [];

    for (const cls of classes) {
      // 커스텀 색상 클래스 패턴 (예: text-primary, bg-custom-500)
      const colorMatch = cls.match(/^(text|bg)-([\w-]+)-(\d+)$/);
      if (colorMatch) {
        const [, type, colorName, shade] = colorMatch;
        const key = `${colorName}-${shade}`;

        if (!colorUsage.has(key)) {
          colorUsage.set(key, []);
        }
        colorUsage.get(key)!.push(cls);
      }
    }
  }

  // 색상 그룹화
  const colorGroups = new Map<string, Set<string>>();

  for (const [key, classes] of colorUsage.entries()) {
    const colorName = key.split('-')[0];

    if (!colorGroups.has(colorName)) {
      colorGroups.set(colorName, new Set());
    }
    colorGroups.get(colorName)!.add(key);
  }

  // Tailwind 형식으로 변환
  for (const [colorName, shades] of colorGroups.entries()) {
    const shadeMap: Record<string, string> = {};

    for (const shade of shades) {
      // 실제 색상 값 찾기
      const actualColor = findColorValue(shade);
      if (actualColor) {
        shadeMap[shade.split('-')[1]] = actualColor;
      }
    }

    if (Object.keys(shadeMap).length > 0) {
      colors[colorName] = shadeMap;
    }
  }

  return colors;
}

/**
 * 실제 색상 값 찾기
 */
function findColorValue(shadeKey: string): string | null {
  // 계산된 스타일에서 색상 값 찾기
  const testSelector = `[class*="${shadeKey}"]`;
  const element = document.querySelector(testSelector);

  if (element) {
    const styles = window.getComputedStyle(element);

    // 텍스트 색상인지 배경색인지 확인
    if (shadeKey.startsWith('text-')) {
      return styles.color;
    } else if (shadeKey.startsWith('bg-')) {
      return styles.backgroundColor;
    }
  }

  return null;
}
```
- **완료 조건**: 정확한 색상 추출

---

### Task #9.27: 스페이싱 추출

- **파일**: `src/utils/tailwind/extractSpacing.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 사용자 정의 스페이싱 추출
 */
export function extractSpacing(): Record<string, string> {
  const spacing: Record<string, string> = {};
  const spacingUsage = new Map<string, number>();

  // 모든 요소의 스페이싱 클래스 수집
  const elements = document.querySelectorAll('[class]');

  for (const el of elements) {
    const classes = el.className?.split(/\s+/) || [];

    for (const cls of classes) {
      // 스페이싱 클래스 패턴 (예: p-custom-4, m-spacing-lg)
      const spacingMatch = cls.match(/^[pm][trblxy]?-([\w-]+)$/);
      if (spacingMatch) {
        const spacingName = spacingMatch[1];

        // 표준 Tailwind 스페이싱이 아닌 경우
        if (!isStandardSpacing(spacingName)) {
          spacingUsage.set(spacingName, (spacingUsage.get(spacingName) || 0) + 1);
        }
      }
    }
  }

  // 실제 값 추출
  for (const [spacingName, count] of spacingUsage.entries()) {
    if (count >= 3) { // 3회 이상 사용된 경우
      const value = findSpacingValue(spacingName);
      if (value) {
        spacing[spacingName] = value;
      }
    }
  }

  return spacing;
}

/**
 * 표준 Tailwind 스페이싱인지 확인
 */
function isStandardSpacing(name: string): boolean {
  const standard = ['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96'];
  return standard.includes(name);
}

/**
 * 스페이싱 값 찾기
 */
function findSpacingValue(spacingName: string): string | null {
  // 해당 클래스를 사용하는 요소 찾기
  const selector = `[class*="-${spacingName}"]`;
  const element = document.querySelector(selector);

  if (element) {
    const styles = window.getComputedStyle(element);

    // 해당하는 속성 값 찾기
    if (spacingName.includes('p')) {
      return styles.paddingTop || styles.padding;
    } else if (spacingName.includes('m')) {
      return styles.marginTop || styles.margin;
    }
  }

  return null;
}
```
- **완료 조건**: 정확한 스페이싱 추출

---

### Task #9.28: 폰트 크기 추출

- **파일**: `src/utils/tailwind/extractFontSizes.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 사용자 정의 폰트 크기 추출
 */
export function extractFontSizes(): Record<string, string | [string, object]> {
  const fontSizes: Record<string, string | [string, object]> = {};
  const fontSizeUsage = new Map<string, number>();

  // 모든 요소의 폰트 크기 클래스 수집
  const elements = document.querySelectorAll('[class]');

  for (const el of elements) {
    const classes = el.className?.split(/\s+/) || [];

    for (const cls of classes) {
      // 폰트 크기 클래스 패턴
      const fontSizeMatch = cls.match(/^text-([\w-]+)$/);
      if (fontSizeMatch) {
        const sizeName = fontSizeMatch[1];

        // 표준 Tailwind 폰트 크기가 아닌 경우
        if (!isStandardFontSize(sizeName)) {
          fontSizeUsage.set(sizeName, (fontSizeUsage.get(sizeName) || 0) + 1);
        }
      }
    }
  }

  // 실제 값 추출
  for (const [sizeName, count] of fontSizeUsage.entries()) {
    if (count >= 3) {
      const value = findFontSizeValue(sizeName);
      if (value) {
        fontSizes[sizeName] = value;
      }
    }
  }

  return fontSizes;
}

/**
 * 표준 Tailwind 폰트 크기인지 확인
 */
function isStandardFontSize(name: string): boolean {
  const standard = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
  return standard.includes(name);
}

/**
 * 폰트 크기 값 찾기
 */
function findFontSizeValue(sizeName: string): string | null {
  const selector = `[class*="text-${sizeName}"]`;
  const element = document.querySelector(selector);

  if (element) {
    const styles = window.getComputedStyle(element);
    return styles.fontSize;
  }

  return null;
}
```
- **완료 조건**: 정확한 폰트 크기 추출

---

[Phase 5: Storage](./TASK-09-PHASE5.md) 로 계속
