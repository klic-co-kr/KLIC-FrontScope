// src/content/recording/areaSelector.ts
// Drag area selection + element selection for GIF recording

import type { CropBounds } from '../../types/recording';

let overlayEl: HTMLElement | null = null;
let selectionEl: HTMLElement | null = null;
let sizeLabel: HTMLElement | null = null;
let styleEl: HTMLStyleElement | null = null;
let cleanupFn: (() => void) | null = null;

const MIN_SIZE = 50; // minimum selection size in px

export function startAreaSelection(): Promise<CropBounds | null> {
  return new Promise((resolve) => {
    cleanup();

    // Fullscreen overlay
    overlayEl = document.createElement('div');
    Object.assign(overlayEl.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '2147483646',
      cursor: 'crosshair',
      background: 'rgba(0, 0, 0, 0.3)',
    });

    // Selection rectangle
    selectionEl = document.createElement('div');
    Object.assign(selectionEl.style, {
      position: 'fixed',
      border: '2px dashed #3B82F6',
      background: 'rgba(59, 130, 246, 0.1)',
      zIndex: '2147483647',
      pointerEvents: 'none',
      display: 'none',
    });

    // Size label
    sizeLabel = document.createElement('div');
    Object.assign(sizeLabel.style, {
      position: 'fixed',
      background: 'rgba(0, 0, 0, 0.75)',
      color: '#fff',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'system-ui, -apple-system, monospace',
      zIndex: '2147483647',
      pointerEvents: 'none',
      display: 'none',
    });

    // Instruction text
    styleEl = document.createElement('style');
    styleEl.dataset.klicAreaSelector = '';
    styleEl.textContent = `
      [data-klic-area-instruction] {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        font-family: system-ui, -apple-system, sans-serif;
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        pointer-events: none;
        z-index: 2147483647;
      }
    `;

    const instruction = document.createElement('div');
    instruction.dataset.klicAreaInstruction = '';
    instruction.textContent = '녹화할 영역을 드래그하세요 (ESC 취소)';

    document.head.appendChild(styleEl);
    document.body.appendChild(overlayEl);
    document.body.appendChild(selectionEl);
    document.body.appendChild(sizeLabel);
    overlayEl.appendChild(instruction);

    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
      instruction.remove();
      if (selectionEl) selectionEl.style.display = 'block';
      if (sizeLabel) sizeLabel.style.display = 'block';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectionEl || !sizeLabel) return;
      e.preventDefault();

      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);

      Object.assign(selectionEl.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
      });

      Object.assign(sizeLabel.style, {
        left: `${x}px`,
        top: `${y + h + 4}px`,
      });
      sizeLabel.textContent = `${w} x ${h}`;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);

      // Synchronously remove overlay before resolving (M5)
      cleanup();

      if (w < MIN_SIZE || h < MIN_SIZE) {
        resolve(null);
        return;
      }

      resolve({ x, y, width: w, height: h });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };

    overlayEl.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('keydown', onKeyDown, true);

    cleanupFn = () => {
      overlayEl?.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onMouseUp, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  });
}

export function startElementSelection(): Promise<CropBounds | null> {
  return new Promise((resolve) => {
    cleanup();

    let hoveredEl: HTMLElement | null = null;
    const originalOutlines = new WeakMap<HTMLElement, string>();

    const onMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === hoveredEl) return;

      // Restore previous element
      if (hoveredEl) {
        hoveredEl.style.outline = originalOutlines.get(hoveredEl) ?? '';
      }

      hoveredEl = target;
      originalOutlines.set(target, target.style.outline);
      target.style.outline = '2px dashed #f59e0b';
    };

    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();

      // Restore outline
      if (hoveredEl) {
        hoveredEl.style.outline = originalOutlines.get(hoveredEl) ?? '';
      }

      // Remove listeners
      cleanupListeners();

      // Validate bounds (M4)
      if (rect.width < 1 || rect.height < 1) {
        resolve(null);
        return;
      }

      resolve({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hoveredEl) {
          hoveredEl.style.outline = originalOutlines.get(hoveredEl) ?? '';
        }
        cleanupListeners();
        resolve(null);
      }
    };

    const cleanupListeners = () => {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.cursor = '';
    };

    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);

    cleanupFn = cleanupListeners;
  });
}

export function cancelSelection(): void {
  cleanup();
}

function cleanup(): void {
  cleanupFn?.();
  cleanupFn = null;
  overlayEl?.remove();
  overlayEl = null;
  selectionEl?.remove();
  selectionEl = null;
  sizeLabel?.remove();
  sizeLabel = null;
  styleEl?.remove();
  styleEl = null;
}
