const DEFAULT_MAX_DEPTH = 20;
const DEFAULT_DRAG_STEP_PX = 24;

function safeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function clampDepth(depth: number, maxDepth = DEFAULT_MAX_DEPTH): number {
  const safeMax = Math.max(0, Math.trunc(safeNumber(maxDepth, DEFAULT_MAX_DEPTH)));
  const safeDepth = Math.trunc(safeNumber(depth, 0));

  if (safeDepth < 0) {
    return 0;
  }

  if (safeDepth > safeMax) {
    return safeMax;
  }

  return safeDepth;
}

export function getAncestorAtDepth(
  element: HTMLElement,
  depth: number,
  maxDepth = DEFAULT_MAX_DEPTH
): HTMLElement {
  const clamped = clampDepth(depth, maxDepth);
  let current: HTMLElement = element;

  for (let i = 0; i < clamped; i += 1) {
    const parent = current.parentElement;
    if (!parent) {
      break;
    }
    current = parent;
  }

  return current;
}

export function depthDeltaFromDrag(deltaY: number, stepPx = DEFAULT_DRAG_STEP_PX): number {
  const safeStep = Math.max(1, Math.trunc(safeNumber(stepPx, DEFAULT_DRAG_STEP_PX)));
  const safeDelta = safeNumber(deltaY, 0);

  const delta = -Math.trunc(safeDelta / safeStep);
  return Object.is(delta, -0) ? 0 : delta;
}

export function depthDeltaFromWheel(deltaY: number): number {
  const safeDelta = safeNumber(deltaY, 0);
  if (safeDelta === 0) {
    return 0;
  }

  return safeDelta > 0 ? 1 : -1;
}

export const JS_INSPECTOR_DEPTH_DEFAULTS = {
  maxDepth: DEFAULT_MAX_DEPTH,
  dragStepPx: DEFAULT_DRAG_STEP_PX,
} as const;
