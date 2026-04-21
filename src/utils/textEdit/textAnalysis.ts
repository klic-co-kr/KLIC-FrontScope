/**
 * Text Analysis Utilities
 *
 * 텍스트를 분석하는 유틸리티 함수들
 */

import type { TextAnalysis } from '../../types/textEdit';

/**
 * 단어 수 계산 (다국어 지원)
 *
 * @param text - 텍스트
 * @param language - 언어 (선택사항)
 * @returns 단어 수
 */
export function countWords(text: string, language?: string): number {
  if (!text || text.trim().length === 0) return 0;

  // CJK 문자 (중국어, 일본어, 한국어)는 글자 수로 계산
  if (language === 'ja' || language === 'zh' || language === 'ko') {
    return text.replace(/\s+/g, '').length;
  }

  // 영어 등은 공백 기준으로 단어 분리
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * 글자 수 계산
 *
 * @param text - 텍스트
 * @param options - 옵션
 * @returns 글자 수
 */
export function countChars(
  text: string,
  options?: {
    includeSpaces?: boolean;
    includeNewlines?: boolean;
  }
): number {
  const { includeSpaces = true, includeNewlines = true } = options || {};

  let result = text;

  if (!includeSpaces) {
    result = result.replace(/ /g, '');
  }

  if (!includeNewlines) {
    result = result.replace(/\n/g, '');
  }

  return result.length;
}

/**
 * 언어 감지
 *
 * @param text - 텍스트
 * @returns 감지된 언어
 */
export function detectLanguage(text: string): 'ko' | 'ja' | 'zh' | 'en' | 'other' {
  if (!text || text.trim().length === 0) return 'other';

  const korean = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
  const japanese = /[\u3040-\u309F\u30A0-\u30FF]/;
  const chinese = /[\u4E00-\u9FFF]/;
  const english = /[a-zA-Z]/;

  const koreanCount = (text.match(korean) || []).length;
  const japaneseCount = (text.match(japanese) || []).length;
  const chineseCount = (text.match(chinese) || []).length;
  const englishCount = (text.match(english) || []).length;

  const total = koreanCount + japaneseCount + chineseCount + englishCount;
  if (total === 0) return 'other';

  // 비율로 판단
  if (koreanCount / total > 0.3) return 'ko';
  if (japaneseCount / total > 0.3) return 'ja';
  if (chineseCount / total > 0.3) return 'zh';
  if (englishCount / total > 0.3) return 'en';

  return 'other';
}

/**
 * 줄 수 계산
 *
 * @param text - 텍스트
 * @returns 줄 수
 */
export function countLines(text: string): number {
  return text.split(/\n/).length;
}

/**
 * 문장 수 계산
 *
 * @param text - 텍스트
 * @param language - 언어 (선택사항)
 * @returns 문장 수
 */
export function countSentences(text: string, language?: string): number {
  if (!text || text.trim().length === 0) return 0;

  // 한국어, 일본어, 중국어
  if (language === 'ko' || language === 'ja' || language === 'zh') {
    const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
    return sentences.length;
  }

  // 영어 등
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * 텍스트 통계 생성
 *
 * @param text - 텍스트
 * @returns 텍스트 분석 결과
 */
export function getTextStats(text: string): TextAnalysis {
  const language = detectLanguage(text);

  return {
    chars: countChars(text, { includeSpaces: true }),
    charsNoSpaces: countChars(text, { includeSpaces: false }),
    words: countWords(text, language),
    lines: countLines(text),
    sentences: countSentences(text, language),
    language,
  };
}

/**
 * 텍스트 요약
 *
 * @param text - 텍스트
 * @param maxLength - 최대 길이
 * @returns 요약된 텍스트
 */
export function summarizeText(text: string, maxLength: number = 100): string {
  const stripped = text.trim();
  if (stripped.length <= maxLength) return stripped;

  return stripped.substring(0, maxLength - 3) + '...';
}
