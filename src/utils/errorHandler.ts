/**
 * Error Handler
 *
 * 통합 에러 처리 및 사용자 피드백
 */

import { toast } from '../sidepanel/components/ToastContainer';

/**
 * 커스텀 에러 클래스
 */
export class KlicError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'KlicError';
  }
}

/**
 * 에러 타입
 */
export enum ErrorType {
  PERMISSION = 'PERMISSION',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  RUNTIME = 'RUNTIME',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 에러 정보 인터페이스
 */
export interface ErrorInfo {
  type: ErrorType;
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
  timestamp: number;
}

/**
 * Error Handler 클래스
 */
export class ErrorHandler {
  private static errorHistory: ErrorInfo[] = [];
  private static maxHistorySize = 50;

  /**
   * 에러 처리
   */
  static handle(error: unknown, context?: string): void {
    console.error('[ErrorHandler]', context, error);

    const errorInfo = this.parseError(error);
    this.addToHistory(errorInfo);

    // 사용자에게 표시
    this.showErrorToUser(errorInfo);
  }

  /**
   * 에러 래핑 (async 함수용)
   */
  static async wrap<T>(
    fn: () => T | Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  /**
   * 에러 파싱
   */
  private static parseError(error: unknown): ErrorInfo {
    if (error instanceof KlicError) {
      return {
        type: ErrorType.RUNTIME,
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: Date.now(),
      };
    }

    if (error instanceof Error) {
      return {
        type: ErrorType.RUNTIME,
        code: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      };
    }

    if (typeof error === 'string') {
      return {
        type: ErrorType.UNKNOWN,
        code: 'STRING_ERROR',
        message: error,
        timestamp: Date.now(),
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      code: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다.',
      details: error,
      timestamp: Date.now(),
    };
  }

  /**
   * 사용자에게 에러 표시
   */
  private static showErrorToUser(errorInfo: ErrorInfo): void {
    const title = this.getErrorTitle(errorInfo);
    const message = errorInfo.message;

    // Toast 표시 (Toast 시스템이 있는 경우)
    if (typeof toast !== 'undefined') {
      toast.error(title, message);
    } else {
      // Fallback: 콘솔
      console.error(`[${title}]`, message);
    }
  }

  /**
   * 에러 타이틀 가져오기
   */
  private static getErrorTitle(errorInfo: ErrorInfo): string {
    switch (errorInfo.type) {
      case ErrorType.PERMISSION:
        return '권한 오류';
      case ErrorType.NETWORK:
        return '네트워크 오류';
      case ErrorType.STORAGE:
        return '저장소 오류';
      case ErrorType.VALIDATION:
        return '입력 오류';
      case ErrorType.RUNTIME:
        return '실행 오류';
      default:
        return '오류';
    }
  }

  /**
   * 에러 기록에 추가
   */
  private static addToHistory(errorInfo: ErrorInfo): void {
    this.errorHistory.push(errorInfo);

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Storage에도 저장
    this.saveToStorage();
  }

  /**
   * 에러 기록을 Storage에 저장
   */
  private static async saveToStorage(): Promise<void> {
    try {
      await chrome.storage.local.set({
        'klic:error_history': this.errorHistory.slice(-20), // 최근 20개만 저장
      });
    } catch (error) {
      console.error('Failed to save error history:', error);
    }
  }

  /**
   * 에러 기록 가져오기
   */
  static async getErrorHistory(): Promise<ErrorInfo[]> {
    try {
      const result = await chrome.storage.local.get('klic:error_history');
      return (result['klic:error_history'] as ErrorInfo[]) || [];
    } catch (error) {
      console.error('Failed to get error history:', error);
      return [];
    }
  }

  /**
   * 에러 기록 초기화
   */
  static async clearErrorHistory(): Promise<void> {
    this.errorHistory = [];
    try {
      await chrome.storage.local.remove('klic:error_history');
    } catch (error) {
      console.error('Failed to clear error history:', error);
    }
  }

  /**
   * 특정 타입의 에러만 필터링
   */
  static async getErrorsByType(type: ErrorType): Promise<ErrorInfo[]> {
    const history = await this.getErrorHistory();
    return history.filter(error => error.type === type);
  }

  /**
   * 최근 에러 확인
   */
  static getLastError(): ErrorInfo | null {
    return this.errorHistory[this.errorHistory.length - 1] || null;
  }
}

/**
 * 에러 처리 래퍼 함수
 */
export function withErrorHandling<T>(
  fn: () => T | Promise<T>,
  context?: string
): Promise<T | null> {
  return ErrorHandler.wrap(fn, context);
}

/**
 * 에러 핸들러 생성기
 */
export function createErrorHandler(context: string) {
  return (error: unknown) => ErrorHandler.handle(error, context);
}

/**
 * 에러 타입 확인
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isKlicError(error: unknown): error is KlicError {
  return error instanceof KlicError;
}

/**
 * 예외 throw 헬퍼
 */
export function throwError(code: string, message: string, details?: unknown): never {
  throw new KlicError(code, message, details);
}

/**
 * 조건부 에러 throw
 */
export function throwErrorIf(
  condition: boolean,
  code: string,
  message: string,
  details?: unknown
): void {
  if (condition) {
    throwError(code, message, details);
  }
}

/**
 * Promise 에러 처리
 */
export function handlePromiseError<T>(
  promise: Promise<T>,
  context?: string
): Promise<T | null> {
  return promise.catch(error => {
    ErrorHandler.handle(error, context);
    return null;
  });
}
