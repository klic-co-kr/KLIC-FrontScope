/**
 * Text Edit Overlay Styles
 *
 * 텍스트 편집 기능을 위한 CSS 오버레이 스타일
 */

export const TEXT_EDIT_OVERLAY_STYLES = `
/* 텍스트 편집 하이라이트 스타일 */
.klic-text-edit-hover {
  outline: 2px dashed #f59e0b !important;
  outline-offset: 2px !important;
  cursor: text !important;
  transition: all 0.2s ease;
}

.klic-text-edit-editing {
  outline: 2px solid #3b82f6 !important;
  outline-offset: 2px !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
  cursor: text !important;
}

.klic-text-edit-edited {
  outline: 2px solid #10b981 !important;
  outline-offset: 2px !important;
  animation: edit-pulse 0.5s ease;
}

/* 편집 완료 애니메이션 */
@keyframes edit-pulse {
  0%, 100% {
    outline-color: #10b981;
  }
  50% {
    outline-color: #059669;
  }
}

/* 편집 중 텍스트 선택 스타일 */
[contenteditable="true"] {
  caret-color: #3b82f6;
}

[contenteditable="true"]::selection {
  background-color: rgba(59, 130, 246, 0.2);
}

/* 툴팁 스타일 */
.klic-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  z-index: 2147483647;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.klic-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: rgba(0, 0, 0, 0.9);
}

/* 로딩 스피너 */
.klic-loading {
  position: relative;
  pointer-events: none;
}

.klic-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 숨김 클래스 */
.klic-hidden {
  display: none !important;
}

/* 공통 오버레이 */
.klic-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2147483646;
  pointer-events: none;
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .klic-text-edit-hover {
    outline-color: #fbbf24 !important;
  }

  .klic-text-edit-editing {
    background-color: rgba(59, 130, 246, 0.1) !important;
  }
}
`;

/**
 * 오버레이 스타일 주입
 */
export function injectTextEditStyles(): void {
  // 이미 주입되어 있는지 확인
  if (document.getElementById('klic-text-edit-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'klic-text-edit-styles';
  style.textContent = TEXT_EDIT_OVERLAY_STYLES;
  document.head.appendChild(style);
}

/**
 * 오버레이 스타일 제거
 */
export function removeTextEditStyles(): void {
  const style = document.getElementById('klic-text-edit-styles');
  if (style) {
    style.remove();
  }
}

/**
 * 요소에 임시 스타일 적용
 */
export function applyTemporaryStyles(
  element: HTMLElement,
  styles: Record<string, string>
): void {
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value, 'important');
  });
}

/**
 * 임시 스타일 제거
 */
export function removeTemporaryStyles(
  element: HTMLElement,
  properties: string[]
): void {
  properties.forEach(property => {
    element.style.removeProperty(property);
  });
}
