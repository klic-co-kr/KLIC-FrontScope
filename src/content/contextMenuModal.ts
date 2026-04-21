/// <reference types="chrome" />

import {
  MODAL_MESSAGE_TYPES,
  type ModalMessage,
  type ModalMessageType,
} from '@/constants/messages';

import { isContextValid } from './utils/safeMessage';

const MODAL_TIMEOUT_MS = 1000;
const MODAL_Z_INDEX = 2147483647;
const MODAL_LAST_TOOL_STORAGE_KEY_PREFIX = 'klic:modal:last-tool:';
const MODAL_MIN_MARGIN_PX = 12;
const MODAL_ANCHOR_OFFSET_PX = 12;
const MODAL_DEFAULT_WIDTH_PX = 420;
const MODAL_DEFAULT_HEIGHT_PX = 640;
const MINIMIZED_BUTTON_SIZE_PX = 44;
const MINIMIZED_BUTTON_MARGIN_PX = 16;
const MODAL_CONTAINER_ID = 'klic-context-menu-modal-container';
const MODAL_HEADER_ID = 'klic-context-menu-modal-header';
const MODAL_CLOSE_BUTTON_ID = 'klic-context-menu-modal-close';
const MODAL_MINIMIZE_BUTTON_ID = 'klic-context-menu-modal-minimize';
const MODAL_MINIMIZED_BUTTON_ID = 'klic-context-menu-modal-minimized';

interface ContextMenuModalOptions {
  toolId?: string | null;
  tabId?: number | null;
  nonce: string;
}

interface ModalMessageData {
  type?: string;
  nonce?: string;
  tool?: string | null;
}

let modalRoot: HTMLDivElement | null = null;
let modalContainer: HTMLDivElement | null = null;
let modalIframe: HTMLIFrameElement | null = null;
let modalMinimizedButton: HTMLButtonElement | null = null;
let modalIsMinimized = false;
let previousBodyOverflow: string | null = null;
let previousHtmlOverflow: string | null = null;
let onReadyTimeout: ReturnType<typeof setTimeout> | null = null;
let openResolver: ((value: boolean) => void) | null = null;
let cleanupHandlers: Array<() => void> = [];
let activeNonce: string | null = null;
let activeToolId: string | null = null;
let activeTabId: number | null = null;
const rememberedToolsByTab = new Map<number, string>();

type Point = { x: number; y: number };

let lastContextMenuPoint: Point | null = null;
let lastMousePoint: Point | null = null;

let minimizedButtonPosition: Point | null = null;
let suppressMinimizedButtonClick = false;

if (typeof window !== 'undefined') {
  window.addEventListener(
    'contextmenu',
    (event) => {
      lastContextMenuPoint = { x: event.clientX, y: event.clientY };
      lastMousePoint = lastContextMenuPoint;
    },
    true
  );

  window.addEventListener(
    'mousemove',
    (event) => {
      lastMousePoint = { x: event.clientX, y: event.clientY };
    },
    true
  );
}

function isValidToolId(toolId: string | null | undefined): toolId is string {
  return typeof toolId === 'string' && toolId.trim().length > 0;
}

function isValidModalTool(toolId: string | null | undefined): toolId is string {
  return isValidToolId(toolId);
}

function isValidTabId(tabId: number | null | undefined): tabId is number {
  return typeof tabId === 'number' && Number.isInteger(tabId) && tabId > 0;
}

function getRememberedToolStorageKey(tabId: number): string {
  return `${MODAL_LAST_TOOL_STORAGE_KEY_PREFIX}${tabId}`;
}

async function getRememberedTool(tabId: number): Promise<string | null> {
  const fallback = rememberedToolsByTab.get(tabId) ?? null;

  try {
    const key = getRememberedToolStorageKey(tabId);
    const result = await chrome.storage.session.get(key);
    const value = (result as Record<string, unknown>)[key];

    if (typeof value === 'string' && isValidModalTool(value)) {
      rememberedToolsByTab.set(tabId, value);
      return value;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

async function setRememberedTool(tabId: number, toolId: string): Promise<void> {
  rememberedToolsByTab.set(tabId, toolId);

  try {
    const key = getRememberedToolStorageKey(tabId);
    await chrome.storage.session.set({ [key]: toolId });
  } catch {
    return;
  }
}

async function resolveModalOptions(options: ContextMenuModalOptions): Promise<ContextMenuModalOptions> {
  const normalizedTabId = isValidTabId(options.tabId) ? options.tabId : null;
  const providedTool = isValidModalTool(options.toolId) ? options.toolId : null;

  let resolvedTool = providedTool;
  if (!resolvedTool && normalizedTabId !== null) {
    resolvedTool = await getRememberedTool(normalizedTabId);
  }

  if (normalizedTabId !== null && providedTool) {
    await setRememberedTool(normalizedTabId, providedTool);
  }

  return {
    ...options,
    tabId: normalizedTabId,
    toolId: resolvedTool,
  };
}

function getExpectedOrigin(): string {
  return new URL(chrome.runtime.getURL('')).origin;
}

function restorePageState() {
  if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = null;
  }

  if (previousHtmlOverflow !== null) {
    document.documentElement.style.overflow = previousHtmlOverflow;
    previousHtmlOverflow = null;
  }
}

function removeNodeSafely(node: Element | null) {
  if (node && node.parentElement) {
    node.remove();
  }
}

function clearTimeoutIfActive() {
  if (onReadyTimeout !== null) {
    clearTimeout(onReadyTimeout);
    onReadyTimeout = null;
  }
}

function resolveModalOpen(result: boolean) {
  if (!openResolver) {
    return;
  }

  clearTimeoutIfActive();
  const currentResolver = openResolver;
  openResolver = null;
  currentResolver(result);
}

function teardownModal() {
  if (!modalRoot) {
    return;
  }

  if (onReadyTimeout !== null) {
    clearTimeoutIfActive();
  }

  cleanupHandlers.forEach((cleanup) => {
    try {
      cleanup();
    } catch (error) {
      console.error('Modal cleanup error:', error);
    }
  });
  cleanupHandlers = [];

  removeNodeSafely(modalRoot);
  removeNodeSafely(modalMinimizedButton);

  modalRoot = null;
  modalContainer = null;
  modalIframe = null;
  modalMinimizedButton = null;
  modalIsMinimized = false;
  activeNonce = null;
  activeToolId = null;
  activeTabId = null;

  restorePageState();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampMinimizedButtonPosition(position: Point): Point {
  const margin = MINIMIZED_BUTTON_MARGIN_PX;
  const size = MINIMIZED_BUTTON_SIZE_PX;
  const maxX = Math.max(margin, window.innerWidth - margin - size);
  const maxY = Math.max(margin, window.innerHeight - margin - size);
  return {
    x: clamp(position.x, margin, maxX),
    y: clamp(position.y, margin, maxY),
  };
}

function applyMinimizedButtonPosition(button: HTMLButtonElement, position: Point) {
  const clamped = clampMinimizedButtonPosition(position);
  minimizedButtonPosition = clamped;
  button.style.left = `${Math.floor(clamped.x)}px`;
  button.style.top = `${Math.floor(clamped.y)}px`;
}

function resolveAnchorPoint(): Point {
  if (lastContextMenuPoint) {
    return lastContextMenuPoint;
  }

  if (lastMousePoint) {
    return lastMousePoint;
  }

  return {
    x: Math.floor(window.innerWidth / 2),
    y: Math.floor(window.innerHeight / 2),
  };
}

function computePanelDimensions(): { width: number; height: number } {
  const maxWidth = Math.max(0, window.innerWidth - MODAL_MIN_MARGIN_PX * 2);
  const maxHeight = Math.max(0, window.innerHeight - MODAL_MIN_MARGIN_PX * 2);
  return {
    width: Math.floor(Math.min(MODAL_DEFAULT_WIDTH_PX, maxWidth)),
    height: Math.floor(Math.min(MODAL_DEFAULT_HEIGHT_PX, maxHeight)),
  };
}

function getViewportBoundsForPanel(): { maxWidth: number; maxHeight: number } {
  return {
    maxWidth: Math.max(0, window.innerWidth - MODAL_MIN_MARGIN_PX * 2),
    maxHeight: Math.max(0, window.innerHeight - MODAL_MIN_MARGIN_PX * 2),
  };
}

function clampPanelSize(container: HTMLDivElement) {
  const bounds = getViewportBoundsForPanel();
  const nextWidth = clamp(container.offsetWidth, 280, Math.max(280, bounds.maxWidth));
  const nextHeight = clamp(container.offsetHeight, 220, Math.max(220, bounds.maxHeight));

  if (Math.abs(nextWidth - container.offsetWidth) > 1) {
    container.style.width = `${Math.floor(nextWidth)}px`;
  }
  if (Math.abs(nextHeight - container.offsetHeight) > 1) {
    container.style.height = `${Math.floor(nextHeight)}px`;
  }
}

function clampPanelPosition(container: HTMLDivElement) {
  const rect = container.getBoundingClientRect();
  const margin = MODAL_MIN_MARGIN_PX;
  const maxLeft = Math.max(margin, window.innerWidth - margin - rect.width);
  const maxTop = Math.max(margin, window.innerHeight - margin - rect.height);
  const left = clamp(rect.left, margin, maxLeft);
  const top = clamp(rect.top, margin, maxTop);
  container.style.left = `${Math.floor(left)}px`;
  container.style.top = `${Math.floor(top)}px`;
}

function positionPanel(container: HTMLDivElement) {
  const anchor = resolveAnchorPoint();
  const { width, height } = computePanelDimensions();

  const margin = MODAL_MIN_MARGIN_PX;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchor.x + MODAL_ANCHOR_OFFSET_PX;
  let top = anchor.y + MODAL_ANCHOR_OFFSET_PX;

  if (left + width + margin > viewportWidth) {
    left = anchor.x - MODAL_ANCHOR_OFFSET_PX - width;
  }

  if (top + height + margin > viewportHeight) {
    top = anchor.y - MODAL_ANCHOR_OFFSET_PX - height;
  }

  left = clamp(left, margin, Math.max(margin, viewportWidth - margin - width));
  top = clamp(top, margin, Math.max(margin, viewportHeight - margin - height));

  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
}

function createModalRoot(): HTMLDivElement {
  const root = document.createElement('div');
  root.id = 'klic-context-menu-modal';
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.zIndex = String(MODAL_Z_INDEX);
  root.style.background = 'transparent';
  root.style.pointerEvents = 'none';

  const container = document.createElement('div');
  container.id = MODAL_CONTAINER_ID;
  container.style.position = 'fixed';
  container.style.boxSizing = 'border-box';
  container.style.pointerEvents = 'auto';
  container.style.borderRadius = '12px';
  container.style.overflow = 'hidden';
  container.style.boxShadow = '0 24px 70px rgba(0, 0, 0, 0.35)';
  container.style.background = '#0b0b0c';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.resize = 'both';
  container.style.minWidth = '280px';
  container.style.minHeight = '220px';
  container.style.maxWidth = `calc(100vw - ${MODAL_MIN_MARGIN_PX * 2}px)`;
  container.style.maxHeight = `calc(100vh - ${MODAL_MIN_MARGIN_PX * 2}px)`;

  const header = document.createElement('div');
  header.id = MODAL_HEADER_ID;
  header.style.height = '40px';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'flex-end';
  header.style.gap = '8px';
  header.style.padding = '0 10px';
  header.style.boxSizing = 'border-box';
  header.style.background = 'rgba(17, 17, 19, 0.92)';
  header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
  header.style.cursor = 'grab';
  header.style.userSelect = 'none';

  const minimizeButton = document.createElement('button');
  minimizeButton.id = MODAL_MINIMIZE_BUTTON_ID;
  minimizeButton.type = 'button';
  minimizeButton.setAttribute('aria-label', 'Minimize');
  minimizeButton.textContent = '—';
  minimizeButton.style.width = '28px';
  minimizeButton.style.height = '28px';
  minimizeButton.style.borderRadius = '8px';
  minimizeButton.style.border = '1px solid rgba(255, 255, 255, 0.12)';
  minimizeButton.style.background = 'rgba(255, 255, 255, 0.06)';
  minimizeButton.style.color = 'rgba(255, 255, 255, 0.9)';
  minimizeButton.style.fontSize = '16px';
  minimizeButton.style.lineHeight = '1';
  minimizeButton.style.cursor = 'pointer';

  const closeButton = document.createElement('button');
  closeButton.id = MODAL_CLOSE_BUTTON_ID;
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '×';
  closeButton.style.width = '28px';
  closeButton.style.height = '28px';
  closeButton.style.borderRadius = '8px';
  closeButton.style.border = '1px solid rgba(255, 255, 255, 0.12)';
  closeButton.style.background = 'rgba(255, 255, 255, 0.06)';
  closeButton.style.color = 'rgba(255, 255, 255, 0.9)';
  closeButton.style.fontSize = '18px';
  closeButton.style.lineHeight = '1';
  closeButton.style.cursor = 'pointer';

  header.appendChild(minimizeButton);
  header.appendChild(closeButton);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('id', 'klic-context-menu-modal-frame');
  iframe.setAttribute('scrolling', 'yes');
  iframe.tabIndex = 0;
  iframe.style.width = '100%';
  iframe.style.flex = '1';
  iframe.style.height = 'calc(100% - 40px)';
  iframe.style.overflow = 'auto';
  iframe.style.pointerEvents = 'auto';
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  iframe.setAttribute('referrerpolicy', 'no-referrer');

  container.appendChild(header);
  container.appendChild(iframe);
  root.appendChild(container);
  return root;
}

function buildModalUrl(options: ContextMenuModalOptions): string {
  const sidepanelUrl = new URL(chrome.runtime.getURL('sidepanel.html'));
  sidepanelUrl.searchParams.set('mode', 'modal');
  sidepanelUrl.searchParams.set('nonce', options.nonce);

  if (isValidModalTool(options.toolId)) {
    sidepanelUrl.searchParams.set('tool', options.toolId);
  } else {
    sidepanelUrl.searchParams.delete('tool');
  }

  if (typeof options.tabId === 'number' && Number.isInteger(options.tabId) && options.tabId > 0) {
    sidepanelUrl.searchParams.set('tabId', String(options.tabId));
  } else {
    sidepanelUrl.searchParams.delete('tabId');
  }

  return sidepanelUrl.href;
}

function updateModalSource(options: ContextMenuModalOptions) {
  if (!modalIframe) {
    return;
  }

  modalIframe.src = buildModalUrl(options);
  activeNonce = options.nonce;
  activeToolId = isValidModalTool(options.toolId) ? options.toolId : null;
  activeTabId = isValidTabId(options.tabId) ? options.tabId : null;
}

function addEscapeCloseHandler() {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeContextMenuModal();
    }
  };

  window.addEventListener('keydown', handleEscape, true);
  cleanupHandlers.push(() => window.removeEventListener('keydown', handleEscape, true));
}

function ensureMinimizedButton(): HTMLButtonElement {
  if (modalMinimizedButton) {
    return modalMinimizedButton;
  }

  const button = document.createElement('button');
  button.id = MODAL_MINIMIZED_BUTTON_ID;
  button.type = 'button';
  button.setAttribute('aria-label', 'Restore KLIC panel');
  button.textContent = 'K';
  button.style.position = 'fixed';
  button.style.left = '0px';
  button.style.top = '0px';
  button.style.width = '44px';
  button.style.height = '44px';
  button.style.borderRadius = '14px';
  button.style.border = '1px solid rgba(255, 255, 255, 0.14)';
  button.style.background = 'rgba(17, 17, 19, 0.92)';
  button.style.color = 'rgba(255, 255, 255, 0.92)';
  button.style.fontWeight = '700';
  button.style.fontSize = '16px';
  button.style.cursor = 'grab';
  button.style.boxShadow = '0 18px 55px rgba(0, 0, 0, 0.4)';
  button.style.zIndex = String(MODAL_Z_INDEX);
  button.style.display = 'none';
  button.style.pointerEvents = 'auto';

  if (!minimizedButtonPosition) {
    minimizedButtonPosition = {
      x: window.innerWidth - MINIMIZED_BUTTON_MARGIN_PX - MINIMIZED_BUTTON_SIZE_PX,
      y: window.innerHeight - MINIMIZED_BUTTON_MARGIN_PX - MINIMIZED_BUTTON_SIZE_PX,
    };
  }
  applyMinimizedButtonPosition(button, minimizedButtonPosition);

  document.documentElement.appendChild(button);
  modalMinimizedButton = button;
  cleanupHandlers.push(() => removeNodeSafely(button));

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    button.style.cursor = 'grabbing';

    const rect = button.getBoundingClientRect();
    const dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      didDrag: false,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== dragState.pointerId) {
        return;
      }

      const dx = moveEvent.clientX - dragState.startX;
      const dy = moveEvent.clientY - dragState.startY;
      if (!dragState.didDrag && Math.hypot(dx, dy) >= 4) {
        dragState.didDrag = true;
      }

      applyMinimizedButtonPosition(button, {
        x: dragState.originLeft + dx,
        y: dragState.originTop + dy,
      });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== dragState.pointerId) {
        return;
      }

      button.removeEventListener('pointermove', handlePointerMove);
      button.removeEventListener('pointerup', handlePointerUp);
      button.removeEventListener('pointercancel', handlePointerUp);

      button.style.cursor = 'grab';

      if (dragState.didDrag) {
        suppressMinimizedButtonClick = true;
        setTimeout(() => {
          suppressMinimizedButtonClick = false;
        }, 0);
      }

      try {
        button.releasePointerCapture(upEvent.pointerId);
      } catch {
        void 0;
      }
    };

    button.addEventListener('pointermove', handlePointerMove);
    button.addEventListener('pointerup', handlePointerUp);
    button.addEventListener('pointercancel', handlePointerUp);

    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      void 0;
    }

    event.preventDefault();
  };

  button.addEventListener('pointerdown', handlePointerDown);
  cleanupHandlers.push(() => button.removeEventListener('pointerdown', handlePointerDown));

  const handleMinimizedResize = () => {
    if (!modalMinimizedButton || !minimizedButtonPosition) {
      return;
    }

    applyMinimizedButtonPosition(modalMinimizedButton, minimizedButtonPosition);
  };
  window.addEventListener('resize', handleMinimizedResize);
  cleanupHandlers.push(() => window.removeEventListener('resize', handleMinimizedResize));

  return button;
}

function setMinimized(nextMinimized: boolean) {
  if (!modalContainer) {
    return;
  }

  const minimizedButton = ensureMinimizedButton();

  modalIsMinimized = nextMinimized;
  if (nextMinimized) {
    modalContainer.style.display = 'none';
    minimizedButton.style.display = 'block';
  } else {
    modalContainer.style.display = 'flex';
    minimizedButton.style.display = 'none';
  }
}

function minimizeContextMenuModal() {
  if (!modalRoot) {
    return;
  }

  setMinimized(true);
}

function restoreContextMenuModal() {
  if (!modalRoot || !modalContainer) {
    return;
  }

  setMinimized(false);
  positionPanel(modalContainer);
}

function addRestoreHandler() {
  const button = ensureMinimizedButton();
  const handleClick = (event: MouseEvent) => {
    if (suppressMinimizedButtonClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    restoreContextMenuModal();
  };
  button.addEventListener('click', handleClick);
  cleanupHandlers.push(() => button.removeEventListener('click', handleClick));
}

function addControlButtonHandlers(container: HTMLDivElement) {
  const closeButton = container.querySelector(`#${MODAL_CLOSE_BUTTON_ID}`) as HTMLButtonElement | null;
  const minimizeButton = container.querySelector(`#${MODAL_MINIMIZE_BUTTON_ID}`) as HTMLButtonElement | null;

  if (closeButton) {
    const handleClose = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      closeContextMenuModal();
    };
    closeButton.addEventListener('click', handleClose);
    cleanupHandlers.push(() => closeButton.removeEventListener('click', handleClose));
  }

  if (minimizeButton) {
    const handleMinimize = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      minimizeContextMenuModal();
    };
    minimizeButton.addEventListener('click', handleMinimize);
    cleanupHandlers.push(() => minimizeButton.removeEventListener('click', handleMinimize));
  }
}

function addDragHandler(container: HTMLDivElement) {
  const header = container.querySelector(`#${MODAL_HEADER_ID}`) as HTMLDivElement | null;
  if (!header) {
    return;
  }

  let dragState: {
    pointerId: number;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
  } | null = null;

  const clampToViewport = (left: number, top: number) => {
    const margin = MODAL_MIN_MARGIN_PX;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const maxLeft = Math.max(margin, window.innerWidth - margin - width);
    const maxTop = Math.max(margin, window.innerHeight - margin - height);
    return {
      left: clamp(left, margin, maxLeft),
      top: clamp(top, margin, maxTop),
    };
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }

    header.style.cursor = 'grabbing';

    const rect = container.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
    };

    try {
      header.setPointerCapture(event.pointerId);
    } catch {
      void 0;
    }

    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const nextLeft = dragState.originLeft + (event.clientX - dragState.startX);
    const nextTop = dragState.originTop + (event.clientY - dragState.startY);
    const clamped = clampToViewport(nextLeft, nextTop);
    container.style.left = `${clamped.left}px`;
    container.style.top = `${clamped.top}px`;
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    dragState = null;
    header.style.cursor = 'grab';
    try {
      header.releasePointerCapture(event.pointerId);
    } catch {
      void 0;
    }
  };

  header.addEventListener('pointerdown', handlePointerDown);
  header.addEventListener('pointermove', handlePointerMove);
  header.addEventListener('pointerup', handlePointerUp);
  header.addEventListener('pointercancel', handlePointerUp);

  cleanupHandlers.push(() => header.removeEventListener('pointerdown', handlePointerDown));
  cleanupHandlers.push(() => header.removeEventListener('pointermove', handlePointerMove));
  cleanupHandlers.push(() => header.removeEventListener('pointerup', handlePointerUp));
  cleanupHandlers.push(() => header.removeEventListener('pointercancel', handlePointerUp));
}

function addIframeFocusHandler(container: HTMLDivElement, iframe: HTMLIFrameElement) {
  const handlePointerDown = (event: PointerEvent) => {
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }

    try {
      iframe.focus();
    } catch {
      void 0;
    }
  };

  container.addEventListener('pointerdown', handlePointerDown, true);
  cleanupHandlers.push(() => container.removeEventListener('pointerdown', handlePointerDown, true));
}

function isAllowedModalMessage(data: unknown): data is ModalMessage {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const typed = data as ModalMessageData;
  if (typeof typed.type !== 'string') {
    return false;
  }

  const allowedTypes = new Set<ModalMessageType>(Object.values(MODAL_MESSAGE_TYPES));
  if (!allowedTypes.has(typed.type as ModalMessageType)) {
    return false;
  }

  return typeof typed.nonce === 'string' && typed.nonce.length > 0;
}

function addFrameMessageHandler(expectedOrigin: string) {
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== modalIframe?.contentWindow) {
      return;
    }

    if (event.origin !== expectedOrigin) {
      return;
    }

    if (!isAllowedModalMessage(event.data)) {
      return;
    }

    const data = event.data as ModalMessageData;
    if (data.nonce !== activeNonce) {
      return;
    }

    if (data.type === MODAL_MESSAGE_TYPES.READY) {
      resolveModalOpen(true);
      return;
    }

    if (data.type === MODAL_MESSAGE_TYPES.CLOSE_REQUEST || data.type === MODAL_MESSAGE_TYPES.CLOSE) {
      closeContextMenuModal();
      return;
    }

    if (data.type === MODAL_MESSAGE_TYPES.SET_TOOL && isValidModalTool(data.tool)) {
      const requestedTool = data.tool;
      if (requestedTool !== activeToolId) {
        activeToolId = requestedTool;
      }

      if (activeTabId !== null) {
        void setRememberedTool(activeTabId, requestedTool);
      }
    }
  };

  window.addEventListener('message', handleMessage);
  cleanupHandlers.push(() => window.removeEventListener('message', handleMessage));
}

function addFrameLoadHandler(iframe: HTMLIFrameElement, expectedOrigin: string) {
  const handleLoad = () => {
    if (!iframe.contentWindow) {
      return;
    }

    try {
      iframe.contentWindow.postMessage({ type: MODAL_MESSAGE_TYPES.PARENT_READY, nonce: activeNonce }, expectedOrigin);
    } catch {
      // ignore cross-origin postMessage failures during loading
    }
  };

  iframe.addEventListener('load', handleLoad);
  cleanupHandlers.push(() => iframe.removeEventListener('load', handleLoad));
}

function addFrameErrorHandler(iframe: HTMLIFrameElement) {
  const handleError = () => {
    resolveModalOpen(false);
    closeContextMenuModal();
  };

  iframe.addEventListener('error', handleError);
  cleanupHandlers.push(() => iframe.removeEventListener('error', handleError));
}

function addNavigationCleanup() {
  const handleNavigation = () => {
    closeContextMenuModal();
  };

  window.addEventListener('pagehide', handleNavigation);
  cleanupHandlers.push(() => window.removeEventListener('pagehide', handleNavigation));
}

function addReadyTimeout() {
  onReadyTimeout = setTimeout(() => {
    resolveModalOpen(false);
    closeContextMenuModal();
  }, MODAL_TIMEOUT_MS);
}

export function closeContextMenuModal() {
  if (!modalRoot) {
    return;
  }

  resolveModalOpen(false);

  teardownModal();
}

export function isContextMenuModalOpen(): boolean {
  return modalRoot !== null;
}

export async function openContextMenuModal(options: ContextMenuModalOptions): Promise<boolean> {
  if (!isContextValid()) {
    return false;
  }

  if (!options.nonce || options.nonce.trim().length === 0) {
    return false;
  }

  const resolvedOptions = await resolveModalOptions(options);

  if (modalRoot) {
    updateModalSource(resolvedOptions);
    if (modalIsMinimized) {
      restoreContextMenuModal();
    }
    return true;
  }

  return new Promise<boolean>((resolve) => {
    if (openResolver) {
      resolve(false);
      return;
    }

    openResolver = resolve;

    const root = createModalRoot();
    const container = root.querySelector(`div#${MODAL_CONTAINER_ID}`) as HTMLDivElement | null;
    const iframe = root.querySelector('iframe#klic-context-menu-modal-frame') as HTMLIFrameElement | null;
    if (!iframe) {
      resolve(false);
      teardownModal();
      return;
    }

    if (!container) {
      resolve(false);
      teardownModal();
      return;
    }

    modalRoot = root;
    modalContainer = container;
    modalIframe = iframe;
    document.documentElement.appendChild(root);

    positionPanel(container);
    clampPanelSize(container);
    clampPanelPosition(container);

    const resizeObserver = new ResizeObserver(() => {
      if (!modalContainer || modalIsMinimized) {
        return;
      }

      clampPanelSize(modalContainer);
      clampPanelPosition(modalContainer);
    });
    resizeObserver.observe(container);
    cleanupHandlers.push(() => resizeObserver.disconnect());

    activeNonce = resolvedOptions.nonce;
    activeToolId = isValidModalTool(resolvedOptions.toolId) ? resolvedOptions.toolId : null;
    activeTabId = isValidTabId(resolvedOptions.tabId) ? resolvedOptions.tabId : null;

    const expectedOrigin = getExpectedOrigin();

    addEscapeCloseHandler();
    addRestoreHandler();
    addControlButtonHandlers(container);
    addDragHandler(container);
    addIframeFocusHandler(container, iframe);
    addFrameMessageHandler(expectedOrigin);
    addFrameLoadHandler(iframe, expectedOrigin);
    addFrameErrorHandler(iframe);
    addNavigationCleanup();

    const handleResize = () => {
      if (modalContainer) {
        if (!modalIsMinimized) {
          clampPanelSize(modalContainer);
          clampPanelPosition(modalContainer);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    cleanupHandlers.push(() => window.removeEventListener('resize', handleResize));

    addReadyTimeout();
    updateModalSource(resolvedOptions);
  });
}
