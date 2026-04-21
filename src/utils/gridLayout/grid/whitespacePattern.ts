/**
 * Whitespace Pattern Utilities
 *
 * 화이트스페이스 패턴 생성 관련 유틸리티 함수들
 */

import type { WhitespaceSettings, WhitespacePattern } from '../../../types/gridLayout';

/**
 * 화이트스페이스 SVG 패턴 생성
 */
export function createWhitespaceSVG(settings: WhitespaceSettings): string {
  const size = settings.size;
  const color = settings.color;
  const opacity = settings.opacity;

  switch (settings.pattern) {
    case 'diagonal':
      return `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="whitespace-diagonal" patternUnits="userSpaceOnUse" width="${size}" height="${size}" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="${size}" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            </pattern>
          </defs>
        </svg>
      `;

    case 'crosshatch':
      return `
        <svg width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="whitespace-crosshatch" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
              <line x1="0" y1="${size / 2}" x2="${size}" y2="${size / 2}" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
              <line x1="${size / 2}" y1="0" x2="${size / 2}" y2="${size}" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
            </pattern>
          </defs>
        </svg>
      `;

    case 'solid':
    default:
      return `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${color}" opacity="${opacity}"/>
        </svg>
      `;
  }
}

/**
 * 화이트스페이스 CSS 생성
 */
export function createWhitespaceCSS(settings: WhitespaceSettings): string {
  const size = settings.size;
  const color = settings.color;
  const opacity = settings.opacity;

  switch (settings.pattern) {
    case 'diagonal':
      return `
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent ${size / 2}px,
          ${color} ${size / 2}px,
          ${color} ${size}px
        );
        opacity: ${opacity};
      `;

    case 'crosshatch':
      return `
        background-image:
          linear-gradient(${color} ${opacity}, ${color} ${opacity}),
          linear-gradient(90deg, ${color} ${opacity}, ${color} ${opacity});
        background-size: ${size}px ${size}px;
        background-position: 0 0, ${size / 2}px ${size / 2}px;
      `;

    case 'solid':
    default:
      return `
        background-color: ${color};
        opacity: ${opacity};
      `;
  }
}

/**
 * 화이트스페이스 CSS 생성 (개선된 버전)
 */
export function createWhitespaceCSSAdvanced(settings: WhitespaceSettings): string {
  const size = settings.size;
  const color = settings.color;
  const opacity = Math.round(settings.opacity * 255)
    .toString(16)
    .padStart(2, '0');
  const fillColor = `${color}${opacity}`;

  switch (settings.pattern) {
    case 'diagonal':
      return `
        background-image:
          linear-gradient(45deg, ${fillColor} 25%, transparent 25%),
          linear-gradient(-45deg, ${fillColor} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${fillColor} 75%),
          linear-gradient(-45deg, transparent 75%, ${fillColor} 75%);
        background-size: ${size}px ${size}px;
        background-position: 0 0, 0 ${size / 2}px, ${size / 2}px -${size / 2}px, -${size / 2}px 0px;
      `;

    case 'crosshatch':
      return `
        background-image:
          linear-gradient(${fillColor}, ${fillColor}),
          linear-gradient(90deg, ${fillColor}, ${fillColor});
        background-size: ${size}px ${size}px;
        background-position: 0 0, ${size / 2}px ${size / 2}px;
      `;

    case 'solid':
    default:
      return `background-color: ${fillColor};`;
  }
}

/**
 * 화이트스페이스 오버레이 생성
 */
export function createWhitespaceOverlay(settings: WhitespaceSettings): HTMLElement | null {
  // 기존 오버레이 제거
  removeWhitespaceOverlay();

  if (!settings.enabled) {
    return null;
  }

  const overlay = document.createElement('div');
  overlay.id = 'whitespace-overlay';
  overlay.className = 'klic-whitespace-overlay';

  const baseStyle = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9995;
  `;

  overlay.style.cssText = baseStyle + createWhitespaceCSSAdvanced(settings);

  document.body.appendChild(overlay);

  return overlay;
}

/**
 * 화이트스페이스 오버레이 업데이트
 */
export function updateWhitespaceOverlay(settings: WhitespaceSettings): void {
  removeWhitespaceOverlay();
  if (settings.enabled) {
    createWhitespaceOverlay(settings);
  }
}

/**
 * 화이트스페이스 오버레이 제거
 */
export function removeWhitespaceOverlay(): void {
  const overlay = document.getElementById('whitespace-overlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * 화이트스페이스 오버레이 토글
 */
export function toggleWhitespaceOverlay(settings: WhitespaceSettings): void {
  if (settings.enabled) {
    createWhitespaceOverlay(settings);
  } else {
    removeWhitespaceOverlay();
  }
}

/**
 * 화이트스페이스 오버레이 존재 여부 확인
 */
export function hasWhitespaceOverlay(): boolean {
  return document.getElementById('whitespace-overlay') !== null;
}

/**
 * 화이트스페이스 오버레이 상태 가져오기
 */
export function getWhitespaceOverlayState(): {
  exists: boolean;
  visible: boolean;
  pattern: WhitespacePattern | null;
} {
  const overlay = document.getElementById('whitespace-overlay');

  if (!overlay) {
    return { exists: false, visible: false, pattern: null };
  }

  // 현재 패턴 확인 (스타일에서 추론)
  const bgImage = overlay.style.backgroundImage;
  let pattern: WhitespacePattern = 'solid';

  if (bgImage.includes('45deg') || bgImage.includes('-45deg')) {
    pattern = 'diagonal';
  } else if (bgImage.includes('90deg')) {
    pattern = 'crosshatch';
  }

  return {
    exists: true,
    visible: overlay.style.display !== 'none',
    pattern,
  };
}

/**
 * 데이터 URL로 패턴 이미지 생성
 */
export function createPatternDataURL(settings: WhitespaceSettings): string {
  const svg = createWhitespaceSVG(settings);
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * 캔버스로 패턴 그리기
 */
export function drawPatternOnCanvas(
  canvas: HTMLCanvasElement,
  settings: WhitespaceSettings
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = settings.size;
  const color = settings.color;
  const opacity = settings.opacity;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = opacity;

  switch (settings.pattern) {
    case 'diagonal':
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      for (let i = -canvas.height; i < canvas.width; i += size) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + canvas.height, canvas.height);
        ctx.stroke();
      }
      break;

    case 'crosshatch':
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      break;

    case 'solid':
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
  }

  ctx.globalAlpha = 1;
}

/**
 * 화이트스페이스 오버레이 숨김/표시
 */
export function setWhitespaceOverlayVisibility(visible: boolean): void {
  const overlay = document.getElementById('whitespace-overlay');
  if (overlay) {
    overlay.style.display = visible ? 'block' : 'none';
  }
}

/**
 * 화이트스페이스 오버레이 생성 (별칭)
 */
export const generateWhitespaceOverlay = createWhitespaceOverlay;
