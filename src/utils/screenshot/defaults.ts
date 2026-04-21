/**
 * Screenshot Default Options
 *
 * 스크린샷 기본 설정값
 */

import type { CaptureOptions } from '../../types/screenshot';

/**
 * 기본 캡처 옵션
 */
export function getDefaultCaptureOptions(): CaptureOptions {
  return {
    mode: 'element',
    format: 'png',
    quality: 1,
    includeAnnotations: false,
  };
}
