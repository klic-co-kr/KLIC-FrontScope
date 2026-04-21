/**
 * Log Grouping Utilities
 *
 * 유사 로그 그룹화 및 중복 제거
 */

import { ConsoleLog } from '../../types/console';

/**
 * 유사 로그 감지
 */
export function areSimilarLogs(log1: ConsoleLog, log2: ConsoleLog): boolean {
  // 레벨이 다르면 다른 로그
  if (log1.level !== log2.level) {
    return false;
  }

  // 메시지가 같으면 같은 로그
  if (log1.message === log2.message) {
    return true;
  }

  // 패턴 기반 유사도 체크
  const similarity = calculateMessageSimilarity(log1.message, log2.message);
  return similarity > 0.8;
}

/**
 * 메시지 유사도 계산 (Levenshtein 거리 기반)
 */
export function calculateMessageSimilarity(msg1: string, msg2: string): number {
  const distance = levenshteinDistance(msg1, msg2);
  const maxLength = Math.max(msg1.length, msg2.length);

  if (maxLength === 0) {
    return 1;
  }

  return 1 - distance / maxLength;
}

/**
 * Levenshtein 거리 계산
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 삭제
        matrix[i][j - 1] + 1,      // 삽입
        matrix[i - 1][j - 1] + cost // 교체
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 로그 그룹화
 */
export function groupLogs(logs: ConsoleLog[]): ConsoleLog[] {
  const grouped: ConsoleLog[] = [];
  const seen = new Set<string>();

  for (const log of logs) {
    if (seen.has(log.id)) {
      continue;
    }

    // 유사한 로그 찾기
    const similarLogs = logs.filter(
      (otherLog) =>
        otherLog.id !== log.id &&
        !seen.has(otherLog.id) &&
        areSimilarLogs(log, otherLog)
    );

    if (similarLogs.length > 0) {
      // 그룹화된 로그 생성
      const groupedLog: ConsoleLog = {
        ...log,
        count: similarLogs.length + 1,
      };

      grouped.push(groupedLog);

      // 처리된 로그 표시
      seen.add(log.id);
      similarLogs.forEach((similarLog) => seen.add(similarLog.id));
    } else {
      grouped.push(log);
      seen.add(log.id);
    }
  }

  return grouped;
}
