/**
 * Date Format Utilities
 *
 * 날짜 포맷 유틸리티 함수
 */

/**
 * 상대적 시간 포맷 (예: "5분 전", "2시간 전")
 *
 * @param timestamp - 타임스탬프
 * @returns 포맷된 문자열
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '방금 전';
  } else if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else if (days < 7) {
    return `${days}일 전`;
  } else if (days < 30) {
    return `${Math.floor(days / 7)}주 전`;
  } else if (days < 365) {
    return `${Math.floor(days / 30)}개월 전`;
  } else {
    return `${Math.floor(days / 365)}년 전`;
  }
}

/**
 * 날짜 포맷 (YYYY-MM-DD HH:mm:ss)
 *
 * @param timestamp - 타임스탬프
 * @returns 포맷된 문자열
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 시간 포맷 (HH:mm:ss)
 *
 * @param timestamp - 타임스탬프
 * @returns 포맷된 문자열
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 오늘 날짜인지 확인
 *
 * @param timestamp - 타임스탬프
 * @returns 오늘 날짜 여부
 */
export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * 이번 주인지 확인
 *
 * @param timestamp - 타임스탬프
 * @returns 이번 주 여부
 */
export function isThisWeek(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  return date >= weekAgo && date <= today;
}

/**
 * 날짜로부터 상대적 거리 포맷 (date-fns style)
 *
 * @param date - 날짜 객체
 * @returns 포맷된 문자열
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return '방금 전';
  } else if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else if (days < 30) {
    return `${days}일 전`;
  } else if (months < 12) {
    return `${months}개월 전`;
  } else {
    return `${years}년 전`;
  }
}
