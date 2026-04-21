/**
 * Text Diff Utilities
 *
 * 텍스트 차이를 계산하는 유틸리티 함수들
 */

import type { TextDiff } from '../../types/textEdit';


/**
 * 두 텍스트의 차이 계산
 *
 * @param before - 변경 전 텍스트
 * @param after - 변경 후 텍스트
 * @returns 텍스트 차이 정보
 */
export function calculateDiff(before: string, after: string): TextDiff {
  const beforeWords = tokenize(before);
  const afterWords = tokenize(after);

  const lcs = longestCommonSubsequence(beforeWords, afterWords);

  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  // 추가된 단어
  afterWords.forEach((word: string) => {
    if (!lcs.includes(word)) {
      added.push(word);
    } else if (!unchanged.includes(word)) {
      unchanged.push(word);
    }
  });

  // 제거된 단어
  beforeWords.forEach((word: string) => {
    if (!lcs.includes(word)) {
      removed.push(word);
    }
  });

  const charDiff = after.length - before.length;
  const wordDiff = afterWords.length - beforeWords.length;

  // 유사도 계산 (Levenshtein distance 기반)
  const similarity = calculateSimilarity(before, after);

  return {
    added,
    removed,
    unchanged,
    charDiff,
    wordDiff,
    similarity,
  };
}

/**
 * 텍스트를 단어로 토큰화
 *
 * @param text - 텍스트
 * @returns 단어 배열
 */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * LCS (Longest Common Subsequence) 알고리즘
 *
 * @param arr1 - 배열 1
 * @param arr2 - 배열 2
 * @returns LCS 결과
 */
function longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: string[] = [];
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      result.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/**
 * Levenshtein distance 기반 유사도 (0-1)
 *
 * @param str1 - 문자열 1
 * @param str2 - 문자열 2
 * @returns 유사도 (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1;

  return 1 - distance / maxLength;
}

/**
 * Levenshtein distance 계산
 *
 * @param str1 - 문자열 1
 * @param str2 - 문자열 2
 * @returns 거리
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // 삭제
          dp[i][j - 1] + 1, // 삽입
          dp[i - 1][j - 1] + 1 // 대체
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * HTML diff 생성 (하이라이트용)
 *
 * @param before - 변경 전
 * @param after - 변경 후
 * @returns HTML 문자열
 */
export function generateHTMLDiff(before: string, after: string): string {
  const diff = calculateDiff(before, after);

  let html = '';

  // 제거된 단어
  diff.removed.forEach((word: string) => {
    html += `<span class="removed">${escapeHTML(word)}</span> `;
  });

  // 추가된 단어
  diff.added.forEach((word: string) => {
    html += `<span class="added">${escapeHTML(word)}</span> `;
  });

  // 변경되지 않은 단어
  diff.unchanged.forEach((word: string) => {
    html += `${escapeHTML(word)} `;
  });

  return html.trim();
}

/**
 * HTML 이스케이프
 *
 * @param text - 텍스트
 * @returns 이스케이프된 문자열
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 텍스트 변경 비율 계산
 *
 * @param before - 변경 전
 * @param after - 변경 후
 * @returns 변경 비율 (0-1)
 */
export function calculateChangeRatio(before: string, after: string): number {
  const diff = calculateDiff(before, after);
  const totalWords = before.split(/\s+/).length;

  if (totalWords === 0) return 0;

  const changedWords = diff.added.length + diff.removed.length;
  return changedWords / totalWords;
}
