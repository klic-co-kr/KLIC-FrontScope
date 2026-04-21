/**
 * System Font Utilities
 *
 * 시스템 폰트 관련 유틸리티
 */

import type { SystemFont } from '../../types/fontAnalyzer';
import { SYSTEM_FONTS, MOBILE_SYSTEM_FONTS } from '../../constants/fontAnalyzerDefaults';

/**
 * 시스템 폰트 사용 가능 여부 확인
 */
/**
 * 폰트 사용 가능 여부 확인 (Helper)
 */
function isFontAvailable(fontFamily: string): boolean {
  return document.fonts.check(`12px "${fontFamily}"`);
}

/**
 * 시스템 폰트 사용 가능 여부 확인
 */
export function getSystemFonts(): SystemFont[] {
  const systemFonts: SystemFont[] = [];

  // 플랫폼 확인
  const platform = detectPlatform();

  let fonts: readonly string[] = [];
  if (platform === 'android' || platform === 'ios') {
    const mobileFonts = MOBILE_SYSTEM_FONTS[platform];
    fonts = mobileFonts || [];
  } else if (platform === 'windows' || platform === 'mac' || platform === 'linux') {
    const systemFontList = SYSTEM_FONTS[platform];
    fonts = systemFontList || [];
  }

  // 각 폰트 사용 가능 여부 확인
  for (const family of fonts) {
    systemFonts.push({
      family,
      available: isFontAvailable(family),
      platform,
    });
  }

  return systemFonts;
}

/**
 * 플랫폼 감지
 */
function detectPlatform(): 'windows' | 'mac' | 'linux' | 'android' | 'ios' {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('android')) return 'android';
  if (
    userAgent.includes('iphone') ||
    userAgent.includes('ipad') ||
    userAgent.includes('ipod')
  ) {
    return 'ios';
  }
  if (userAgent.includes('mac')) return 'mac';
  if (userAgent.includes('linux')) return 'linux';
  return 'windows';
}

/**
 * 특정 플랫폼의 기본 폰트 목록 반환
 */
export function getDefaultSystemFonts(
  platform: 'windows' | 'mac' | 'linux' | 'android' | 'ios'
): string[] {
  return [...(SYSTEM_FONTS[platform] || [])];
}

/**
 * 모바일 기본 폰트 목록 반환
 */
export function getMobileSystemFonts(
  platform: 'android' | 'ios'
): string[] {
  const fonts = MOBILE_SYSTEM_FONTS[platform];
  return fonts ? [...fonts] : [];
}

/**
 * 기본 보디(body) 폰트 반환
 */
export function getDefaultBodyFont(): string {
  const testElement = document.createElement('div');
  testElement.style.visibility = 'hidden';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const fontFamily = computedStyle.getPropertyValue('font-family');

  document.body.removeChild(testElement);

  // 첫 번째 폰트 패밀리 반환
  return fontFamily.split(',')[0]?.replace(/['"]/g, '').trim() || 'sans-serif';
}

/**
 * 모노스페이스 폰트 감지
 */
export function getMonospaceFonts(): string[] {
  return [
    'Consolas',
    'Monaco',
    'Courier New',
    'Courier',
    'Lucida Console',
    'Menlo',
    'Menlo',
    'Ubuntu Mono',
    'Source Code Pro',
    'Fira Code',
    'Roboto Mono',
  ];
}

/**
 * 세리프 폰트 감지
 */
export function getSerifFonts(): string[] {
  return [
    'Georgia',
    'Times New Roman',
    'Times',
    'Palatino',
    'Palatino Linotype',
    'Book Antiqua',
    'Bookman Old Style',
    'Garamond',
    'American Typewriter',
  ];
}

/**
 * 산세리프(Sans-serif) 폰트 감지
 */
export function getSansSerifFonts(): string[] {
  return [
    'Arial',
    'Helvetica',
    'Helvetica Neue',
    'Verdana',
    'Geneva',
    'Lucida Grande',
    'Trebuchet MS',
    'Gill Sans',
    'Calibri',
    'Segoe UI',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Source Sans Pro',
  ];
}

/**
 * 디스플레이 폰트 감지
 */
export function getDisplayFonts(): string[] {
  return [
    'Impact',
    'Comic Sans MS',
    'Papyrus',
    'Brush Script MT',
    'Copperplate',
    'Bebas Neue',
    'Algerian',
    'Cooper Black',
    'Lobster',
  ];
}

/**
 * 시스템 폰트 설치 순서
 */
export function getFontInstallationOrder(): string[] {
  const platform = detectPlatform();

  switch (platform) {
    case 'windows':
      return ['Segoe UI', 'Arial', 'Times New Roman', 'Courier New'];
    case 'mac':
      return ['SF Pro Display', 'SF Pro Text', 'Helvetica', 'Arial', 'Times New Roman'];
    case 'linux':
      return ['Ubuntu', 'Liberation Sans', 'Liberation Serif', 'DejaVu Sans'];
    case 'android':
      return ['Roboto', 'Noto Sans', 'Droid Sans'];
    case 'ios':
      return ['San Francisco', 'Helvetica Neue', 'Helvetica', 'Arial', 'Times New Roman'];
    default:
      return ['Arial', 'Times New Roman', 'Courier New'];
  }
}

/**
 * 안전한 웹 폰트 (fallback) 체인
 */
export function getSafeWebFontFallbacks(): string[] {
  // 거의 모든 시스템에서 지원하는 기본 폰트
  return [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Times',
    'Courier New',
    'Courier',
    'Georgia',
    'Verdana',
    'Geneva',
  ];
}

/**
 * 특정 언어에 맞는 시스템 폰트 추천
 */
export function recommendSystemFontsForLanguage(
  language: string
): {
  primary: string;
  fallback: string[];
} {
  // 한국어
  if (language === 'ko' || language.startsWith('ko-')) {
    return {
      primary: 'Malgun Gothic', // 맑은 고딕
      fallback: ['Dotum', 'DotumChe', 'Arial', 'Helvetica'],
    };
  }

  // 일본어
  if (language === 'ja' || language.startsWith('ja-')) {
    return {
      primary: 'Hiragino Kaku Gothic ProN',
      fallback: ['Yu Gothic', 'Meiryo', 'MS PGothic', 'Helvetica'],
    };
  }

  // 중국어 (간체)
  if (language === 'zh-CN' || language.startsWith('zh-cn')) {
    return {
      primary: 'Microsoft YaHei',
      fallback: ['SimHei', 'Heiti SC', 'PingFang SC', 'Arial'],
    };
  }

  // 중국어 (번체)
  if (language === 'zh-TW' || language.startsWith('zh-tw')) {
    return {
      primary: 'Microsoft JhengHei',
      fallback: ['Heiti TC', 'PingFang TC', 'Arial'],
    };
  }

  // 아랍어
  if (language.startsWith('ar')) {
    return {
      primary: 'Arial',
      fallback: ['Tahoma', 'Times New Roman', 'Courier New'],
    };
  }

  // 타이어
  if (language === 'th' || language.startsWith('th-')) {
    return {
      primary: 'Sarabun',
      fallback: ['Tahoma', 'Arial', 'Lucida Grande'],
    };
  }

  // 기본
  return {
    primary: 'Arial',
    fallback: ['Helvetica', 'Times New Roman', 'Courier New'],
  };
}

/**
 * 한글 폰트 시스템 감지
 */
export function detectKoreanSystemFonts(): string[] {
  const koreanFonts = [
    'Malgun Gothic',
    'Dotum',
    'DotumChe',
    'Gulim',
    'Batang',
    'Gungsuh',
  ];

  const available: string[] = [];

  for (const font of koreanFonts) {
    if (isFontAvailable(font)) {
      available.push(font);
    }
  }

  return available;
}

/**
 * 한글 웹 폰트 추천
 */
export function recommendKoreanWebFonts(): {
  heading: string[];
  body: string[];
  display: string[];
  monospace: string[];
} {
  return {
    heading: ['Noto Sans KR', 'Noto Serif KR', 'Gothic A1', 'UhBee DD'], // 첫글/제목
    body: ['Noto Sans KR', 'Nanum Gothic', 'Malgun Gothic', 'Gothic'],
    display: ['Black Han Sans', 'Hanna', 'Seoul Hangang'],
    monospace: ['Nanum Gothic Coding', 'Gothic', 'D2 Coding'],
  };
}

/**
 * 일본어 웹 폰트 추천
 */
export function recommendJapaneseWebFonts(): {
  heading: string[];
  body: string[];
  display: string[];
  monospace: string[];
} {
  return {
    heading: ['Noto Sans JP', 'Noto Serif JP', 'Kozuka Gothic Pro', 'Sawarabi Mincho'],
    body: ['Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', 'Yu Gothic'],
    display: ['Zen Kaku Gothic New', 'Sawarabi Mincho', 'Klee One'],
    monospace: ['Noto Sans Mono JP', 'Kosugi Maru', 'BIZ UDGothic'],
  };
}

/**
 * 중국어 웹 폰트 추천
 */
export function recommendChineseWebFonts(): {
  heading: string[];
  body: string[];
  display: string[];
  monospace: string[];
} {
  return {
    heading: ['Noto Sans SC', 'Noto Serif SC', 'Zcool XiaoWei', 'ZCOOL'],
    body: ['Noto Sans SC', 'Microsoft YaHei', 'SimHei', 'PingFang SC'],
    display: ['ZCOOL KuaiLe', 'ZCOOL XiaoWei', 'STZhuan'],
    monospace: ['Noto Sans Mono SC', 'Source Han Sans CN'],
  };
}
