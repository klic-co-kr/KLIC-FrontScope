/**
 * Screenshot Content Script
 *
 * 스크린샷 캡처를 담당하는 Content Script
 */

import type {
  CaptureOptions,
  CaptureResult,
  CaptureMode,
  Screenshot,
  ImageFormat,
} from '../types/screenshot';
import {
  SCREENSHOT_ACTIONS,
  ScreenshotMessage,
} from '../constants/screenshotMessages';
import { safeSendMessage } from './utils/safeMessage';
import { SCREENSHOT_ERRORS } from '../constants/screenshotErrors';
import { captureElement, captureArea, captureFullPage } from '../utils/screenshot/chromeCapture';
import {
  startSelection,
  updateSelection,
  endSelection,
  cancelSelection,
  highlightElement,
  dimScreen,
} from '../utils/screenshot/areaSelector';

/**
 * 스크린샷 상태
 */
interface ScreenshotState {
  isCapturing: boolean;
  mode: CaptureMode | null;
  options: CaptureOptions | null;
  overlay: HTMLElement | null;
}

let state: ScreenshotState = {
  isCapturing: false,
  mode: null,
  options: null,
  overlay: null,
};

/**
 * 스크린샷 메시지 핸들러
 */
export function handleScreenshotMessage(message: ScreenshotMessage): void {
  switch (message.action) {
    case SCREENSHOT_ACTIONS.START_CAPTURE:
      startCapture(message.mode as CaptureMode, message.format as ImageFormat, message.quality, (message as ScreenshotMessage & { enableAnnotations?: boolean }).enableAnnotations);
      break;

    case SCREENSHOT_ACTIONS.CANCEL_CAPTURE:
      cancelCapture();
      break;

    case SCREENSHOT_ACTIONS.SAVE_SCREENSHOT:
      saveScreenshot(message.screenshot as Screenshot);
      break;

    default:
      break;
  }
}

/**
 * 캡처 시작
 */
async function startCapture(
  mode: CaptureMode,
  format: ImageFormat = 'png',
  quality: number = 0.92,
  enableAnnotations: boolean = true
): Promise<void> {
  if (state.isCapturing) {
    return;
  }

  state = {
    isCapturing: true,
    mode,
    options: { mode, format, quality, includeAnnotations: enableAnnotations },
    overlay: null,
  };

  try {
    let result: CaptureResult;

    switch (mode) {
      case 'element':
        result = await captureElementMode();
        break;

      case 'area':
        result = await captureAreaMode();
        break;

      case 'full-page':
        result = await captureFullPageMode();
        break;

      default:
        throw new Error(SCREENSHOT_ERRORS.INVALID_FORMAT);
    }

    if (result.success && result.screenshot) {
      sendCaptureComplete(result.screenshot);
    } else {
      sendCaptureError(result.error || SCREENSHOT_ERRORS.CAPTURE_FAILED);
    }
  } catch (error) {
    sendCaptureError(error instanceof Error ? error.message : SCREENSHOT_ERRORS.CAPTURE_FAILED);
  } finally {
    cleanup();
  }
}

/**
 * 요소 캡처 모드
 */
async function captureElementMode(): Promise<CaptureResult> {
  const undim = dimScreen();

  return new Promise((resolve) => {
    let highlightedElement: HTMLElement | null = null;
    let unhighlight: (() => void) | null = null;

    // 호버 이벤트로 요소 하이라이트
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target && highlightedElement !== target) {
        if (unhighlight) {
          unhighlight();
        }

        highlightedElement = target;
        unhighlight = highlightElement(target);
      }
    };

    // 클릭 이벤트로 요소 캡처
    const handleClick = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      cleanupElementCapture();

      const element = e.target as HTMLElement;
      if (!element) {
        resolve({
          success: false,
          error: SCREENSHOT_ERRORS.ELEMENT_NOT_FOUND,
        });
        return;
      }

      if (unhighlight) {
        unhighlight();
      }
      undim();

      const result = await captureElement(element, state.options!);
      resolve(result);
    };

    // 취소 이벤트
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupElementCapture();
        if (unhighlight) {
          unhighlight();
        }
        undim();
        resolve({
          success: false,
          error: SCREENSHOT_ERRORS.USER_CANCELLED,
        });
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleEscape);

    // 정리 함수
    const cleanupElementCapture = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEscape);
    };
  });
}

/**
 * 영역 캡처 모드
 */
async function captureAreaMode(): Promise<CaptureResult> {
  const undim = dimScreen();

  return new Promise((resolve) => {
    let overlay: HTMLElement | null = null;

    // 마우스 다운으로 선택 시작
    const handleMouseDown = (e: MouseEvent) => {
      overlay = startSelection(e.clientX, e.clientY);
    };

    // 마우스 이동으로 선택 영역 업데이트
    const handleMouseMove = (e: MouseEvent) => {
      if (overlay) {
        updateSelection(e.clientX, e.clientY);
      }
    };

    // 마우스 업으로 선택 완료
    const handleMouseUp = async () => {
      const area = endSelection();

      if (overlay) {
        overlay.remove();
      }
      undim();

      cleanupAreaCapture();

      if (!area) {
        resolve({
          success: false,
          error: SCREENSHOT_ERRORS.USER_CANCELLED,
        });
        return;
      }

      // 캡처 실행
      const result = await captureArea(area, state.options!);
      resolve(result);
    };

    // 취소 이벤트
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelSelection();
        if (overlay) {
          overlay.remove();
        }
        undim();
        cleanupAreaCapture();
        resolve({
          success: false,
          error: SCREENSHOT_ERRORS.USER_CANCELLED,
        });
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleEscape);

    // 정리 함수
    const cleanupAreaCapture = () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleEscape);
    };
  });
}

/**
 * 전체 페이지 캡처 모드
 */
async function captureFullPageMode(): Promise<CaptureResult> {
  const undim = dimScreen();

  try {
    const result = await captureFullPage(state.options!);
    undim();
    return result;
  } catch (error) {
    undim();
    return {
      success: false,
      error: error instanceof Error ? error.message : SCREENSHOT_ERRORS.CAPTURE_FAILED,
    };
  }
}

/**
 * 캡처 완료 메시지 전송
 */
function sendCaptureComplete(screenshot: Screenshot): void {
  safeSendMessage({
    action: SCREENSHOT_ACTIONS.CAPTURE_COMPLETE,
    screenshot,
  } as ScreenshotMessage);
}

/**
 * 캡처 에러 메시지 전송
 */
function sendCaptureError(error: string): void {
  safeSendMessage({
    action: SCREENSHOT_ACTIONS.CAPTURE_ERROR,
    error,
  } as ScreenshotMessage);
}

/**
 * 캡처 취소
 */
function cancelCapture(): void {
  cancelSelection();
  cleanup();
}

/**
 * 스크린샷 저장
 */
async function saveScreenshot(screenshot: Screenshot): Promise<void> {
  // Chrome Storage에 저장
  const result = await chrome.storage.local.get('screenshots');
  const screenshots = (result.screenshots as Screenshot[]) || [];
  screenshots.push(screenshot);

  // 최대 100개 제한
  if (screenshots.length > 100) {
    screenshots.shift();
  }

  await chrome.storage.local.set({ screenshots });
}

/**
 * 정리
 */
function cleanup(): void {
  if (state.overlay) {
    state.overlay.remove();
  }

  state = {
    isCapturing: false,
    mode: null,
    options: null,
    overlay: null,
  };

  // CSS 클래스 제거
  document.body.classList.remove('klic-capturing', 'klic-screenshot-capturing');
}

/**
 * 초기화
 */
export function initScreenshotContentScript(): void {
  // 메시지 리스너 등록
  chrome.runtime.onMessage.addListener((message: ScreenshotMessage) => {
    handleScreenshotMessage(message);
  });
}

// Content script 로드 시 자동 초기화
if (typeof document !== 'undefined') {
  initScreenshotContentScript();
}
