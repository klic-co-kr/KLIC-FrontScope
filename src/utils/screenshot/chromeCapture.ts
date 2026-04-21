/**
 * Chrome Native Screenshot Utilities
 *
 * chrome.tabs.captureVisibleTab API를 사용한 스크린샷 유틸리티
 */

import type { CaptureOptions, CaptureResult, CaptureMode } from '../../types/screenshot';

const DEFAULT_OPTIONS: CaptureOptions = {
  mode: 'element',
  format: 'png',
  quality: 1,
  includeAnnotations: false,
};

/**
 * 현재 보이는 탭 캡처
 */
export async function captureVisibleTab(): Promise<CaptureResult> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'CAPTURE_VISIBLE_TAB',
    });

    if (response.success) {
      return {
        success: true,
        screenshot: {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          mode: 'area' as CaptureMode,
          format: 'png',
          quality: 1,
          dimensions: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          size: 0,
          dataUrl: response.dataUrl,
        },
      };
    } else {
      return {
        success: false,
        error: response.error || 'Capture failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 요소 캡처 (크롭 방식)
 */
export async function captureElement(
  element: HTMLElement,
  options: Partial<CaptureOptions> = {}
): Promise<CaptureResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const rect = element.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const bounds = {
      x: Math.max(0, Math.floor(rect.left * dpr)),
      y: Math.max(0, Math.floor(rect.top * dpr)),
      width: Math.max(1, Math.floor(rect.width * dpr)),
      height: Math.max(1, Math.floor(rect.height * dpr)),
    };

    const response = await chrome.runtime.sendMessage({
      action: 'CAPTURE_ELEMENT',
      bounds,
    });

    if (response.success) {
      return {
        success: true,
        screenshot: {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          mode: 'element',
          format: opts.format,
          quality: opts.quality,
          dimensions: {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          size: 0,
          dataUrl: response.dataUrl,
        },
      };
    } else {
      return {
        success: false,
        error: response.error || 'Element capture failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 전체 페이지 캡처
 * 스크롤하며 여러 번 캡처 후 합치는 방식
 */
export async function captureFullPage(
  options: Partial<CaptureOptions> = {}
): Promise<CaptureResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 페이지 크기 정보 가져오기
    const dimensionsResponse = await chrome.runtime.sendMessage({
      action: 'GET_PAGE_DIMENSIONS',
    });

    if (!dimensionsResponse.success) {
      throw new Error('Failed to get page dimensions');
    }

    const { dimensions } = dimensionsResponse;
    const { width, height, viewportWidth, viewportHeight } = dimensions;

    // 스크롤 위치 계산
    const scrollPositions: Array<{ x: number; y: number }> = [];
    let currentY = 0;
    const overlap = 50; // 중복 영역 픽셀

    while (currentY < height) {
      let currentX = 0;
      while (currentX < width) {
        scrollPositions.push({ x: currentX, y: currentY });
        currentX += viewportWidth;
      }
      currentY += viewportHeight - overlap;
    }

    // 백그라운드 스크립트에서 연속 캡처 요청
    const capturesResponse = await chrome.runtime.sendMessage({
      action: 'CAPTURE_FULL_PAGE',
      tabId: await getCurrentTabId(),
      scrollPositions,
    });

    if (!capturesResponse.success) {
      throw new Error(capturesResponse.error || 'Full page capture failed');
    }

    const { captures } = capturesResponse;

    // 캡처된 이미지들을 합치기
    const finalCanvas = await stitchImages(
      captures,
      width,
      height,
      viewportWidth,
      viewportHeight
    );

    const dataUrl = finalCanvas.toDataURL(`image/${opts.format}`, opts.quality);

    return {
      success: true,
      screenshot: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mode: 'full-page',
        format: opts.format,
        quality: opts.quality,
        dimensions: {
          width,
          height,
        },
        size: 0,
        dataUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 현재 탭 ID 가져오기
 */
async function getCurrentTabId(): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        resolve(tabs[0].id);
      } else {
        reject(new Error('No active tab found'));
      }
    });
  });
}

/**
 * 여러 이미지를 하나로 합치기
 */
async function stitchImages(
  dataUrls: string[],
  pageWidth: number,
  pageHeight: number,
  viewportWidth: number,
  viewportHeight: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const loadPromises = dataUrls.map((dataUrl) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  });

  const images = await Promise.all(loadPromises);

  // 이미지 배치 (격자 형태)
  let imageIndex = 0;
  let currentY = 0;
  const overlap = 50;

  while (currentY < pageHeight && imageIndex < images.length) {
    let currentX = 0;
    while (currentX < pageWidth && imageIndex < images.length) {
      const img = images[imageIndex];
      const drawHeight = Math.min(viewportHeight, pageHeight - currentY);
      const drawWidth = Math.min(viewportWidth, pageWidth - currentX);

      ctx.drawImage(img, currentX, currentY, drawWidth, drawHeight);

      currentX += viewportWidth;
      imageIndex++;
    }
    currentY += viewportHeight - overlap;
  }

  return canvas;
}

/**
 * 영역 캡처
 */
export async function captureArea(
  area: { x: number; y: number; width: number; height: number },
  options: Partial<CaptureOptions> = {}
): Promise<CaptureResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const dpr = window.devicePixelRatio || 1;
  const bounds = {
    x: Math.max(0, Math.floor(area.x * dpr)),
    y: Math.max(0, Math.floor(area.y * dpr)),
    width: Math.max(1, Math.floor(area.width * dpr)),
    height: Math.max(1, Math.floor(area.height * dpr)),
  };

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'CAPTURE_ELEMENT',
      bounds,
    });

    if (response.success) {
      return {
        success: true,
        screenshot: {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          mode: 'area',
          format: opts.format,
          quality: opts.quality,
          dimensions: {
            width: Math.round(area.width),
            height: Math.round(area.height),
          },
          size: 0,
          dataUrl: response.dataUrl,
        },
      };
    } else {
      return {
        success: false,
        error: response.error || 'Area capture failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
