/// <reference types="chrome" />

import { enableConsoleSpy, disableConsoleSpy, isConsoleSpyEnabled } from './consoleSpy/consoleSpyHandler';
import { showRecordingIndicator, hideRecordingIndicator } from './recording/recordingIndicator';
import { startAreaSelection, startElementSelection, cancelSelection } from './recording/areaSelector';
import { showCountdown } from './recording/countdown';
import { lockScroll, unlockScroll } from './recording/scrollLock';
import {
    handleAssetExtract,
    handleAssetDownloadMultiple,
    handleAssetDownloadZip,
    handleAssetCopyClipboard,
} from './assetManager/assetHandler';
import {
    handleTailwindScan,
    handleTailwindConvertCSS,
    handleTailwindConvertElement,
    handleTailwindConvertAllInline,
    handleTailwindExtractConfig,
    handleTailwindGetDetection,
} from './tailwind/tailwindHandler';
import { createHoverHandler } from './hover/hoverHandler';
import * as resourceNetworkModule from './resourceNetwork/index';
import { textEditManagerInstance } from './textEdit';
import type { AccessibilitySettings, AccessibilityReport, AccessibilityIssue } from '@/types/accessibility';
import { DEFAULT_A11Y_SETTINGS } from '@/types/accessibility';
import { runAccessibilityScan } from './accessibility/scanOrchestrator';
import { closeContextMenuModal, openContextMenuModal } from './contextMenuModal';
import { safeSendMessage, isContextValid } from './utils/safeMessage';
import { STORAGE_KEYS } from '@/constants/storage';
import type { ToolType } from '@/sidepanel/constants/tools';
import { SHORTCUT_TOOL_IDS } from '@/types/shortcuts';
import { normalizeShortcutStorageData } from '@/utils/shortcuts/shortcutInit';
import { normalizeShortcutCombo } from '@/utils/shortcuts/shortcutValidation';
import { MODAL_ACTIONS } from '@/constants/messages';
import { t as translate } from '../i18n/core';

import './fontAnalyzer';
import './screenshot';

// Grid Layout 모듈 (메시지 핸들러는 import 시 등록, 이벤트 핸들러는 activate 시 설정)
import { initialize as initGridLayout, cleanup as cleanupGridLayout } from './gridLayout/index';

// Component Inspector 모듈 (content script은 classic script이므로 dynamic import 불가)
import {
    activateComponentPicker,
    deactivateComponentPicker,
    performComponentScan,
} from './componentInspector/index';

type A11yIssuePayload = Pick<
  AccessibilityIssue,
  'category' | 'severity' | 'rule' | 'message' | 'suggestion' | 'wcagCriteria' | 'krdsCriteria' | 'element'
>;

type A11yElementMessageData = {
  selector?: string;
  issue?: A11yIssuePayload;
};

type HoverInfo = {
  title: string;
  description: string;
  target24Pass: boolean;
  target44Pass: boolean;
  target6mmPass: boolean;
};

type A11yHighlightSnapshot = {
  outline: string;
  outlineOffset: string;
  backgroundColor: string;
  boxShadow: string;
  transition: string;
  animation: string;
  transform: string;
};

const A11Y_HIGHLIGHT_ATTR = 'data-a11y-highlighted';
const A11Y_HOVER_ATTR = 'data-a11y-hover-target';
const A11Y_INSPECTOR_ID = 'klic-a11y-inspector-panel';
const A11Y_BEACON_ATTR = 'data-a11y-beacon';
const A11Y_STYLE_ID = 'klic-a11y-highlight-style';
const a11yHighlightSnapshots = new Map<HTMLElement, A11yHighlightSnapshot>();
const a11yBeacons: Array<{ target: HTMLElement; beacon: HTMLElement }> = [];
let a11yInspectorEscapeListener: ((event: KeyboardEvent) => void) | null = null;
let a11yInspectorPointerListener: ((event: MouseEvent) => void) | null = null;
let a11yBeaconViewportListener: (() => void) | null = null;
let a11yHoverMoveListener: ((event: MouseEvent) => void) | null = null;
let a11yInspectorRafId: number | null = null;
let a11yInspectorAnchorElement: HTMLElement | null = null;
let a11yHoverTargetElement: HTMLElement | null = null;

function ensureA11yHighlightStyles(): void {
  if (document.getElementById(A11Y_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = A11Y_STYLE_ID;
  style.textContent = `
    [${A11Y_HOVER_ATTR}="true"] {
      outline: 2px dashed #2563eb !important;
      outline-offset: 2px !important;
      background: rgba(37, 99, 235, 0.12) !important;
      cursor: crosshair !important;
    }

    @keyframes klicA11yPulse {
      0% { box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.28), 0 0 0 0 rgba(249, 115, 22, 0.42); }
      50% { box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.9), 0 0 0 8px rgba(249, 115, 22, 0.08); }
      100% { box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.28), 0 0 0 0 rgba(249, 115, 22, 0.12); }
    }
    @keyframes klicA11yBeaconPulse {
      0% { transform: scale(0.92); opacity: 0.88; }
      60% { transform: scale(1.08); opacity: 1; }
      100% { transform: scale(0.92); opacity: 0.88; }
    }
  `;
  document.head.appendChild(style);
}

function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function handleAccessibilityScan(
  settings: Partial<AccessibilitySettings> = {}
): Promise<AccessibilityReport> {
  const scanSettings: AccessibilitySettings = { ...DEFAULT_A11Y_SETTINGS, ...settings };
  return runAccessibilityScan(document, scanSettings);
}

function resolveIssueSelector(issue: A11yIssuePayload | undefined): string | undefined {
  if (!issue?.element) {
    return undefined;
  }

  if (typeof issue.element === 'string') {
    return issue.element;
  }

  return issue.element.selector;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildElementSelector(target: HTMLElement): string {
  const id = target.id?.trim();
  if (id) {
    const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id;
    return `#${escaped}`;
  }

  const tag = target.tagName.toLowerCase();
  const classes = Array.from(target.classList)
    .slice(0, 2)
    .map((className) => {
      const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(className) : className;
      return `.${escaped}`;
    })
    .join('');

  const parent = target.parentElement;
  if (!parent) {
    return `${tag}${classes}`;
  }

  const siblings = Array.from(parent.children).filter((el) => el.tagName === target.tagName);
  const index = siblings.indexOf(target) + 1;
  if (siblings.length > 1 && index > 0) {
    return `${tag}${classes}:nth-of-type(${index})`;
  }

  return `${tag}${classes}`;
}

function pxToMm(px: number): number {
  return (px * 25.4) / 96;
}

function getHoverSummary(target: HTMLElement): HoverInfo {
  const tag = target.tagName.toLowerCase();
  const idPart = target.id ? `#${target.id}` : '';
  const classPart = target.className && typeof target.className === 'string'
    ? `.${target.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.')}`
    : '';

  const rawText = (target.textContent || '').replace(/\s+/g, ' ').trim();
  const text = rawText.length > 60 ? `${rawText.slice(0, 60)}...` : rawText;

  const rect = target.getBoundingClientRect();
  const widthPx = Math.max(0, rect.width);
  const heightPx = Math.max(0, rect.height);
  const widthMm = pxToMm(widthPx);
  const heightMm = pxToMm(heightPx);
  const minSideMm = Math.min(widthMm, heightMm);

  return {
    title: `${tag}${idPart}${classPart}`,
    description: text.length > 0 ? text : '텍스트 없음',
    target24Pass: widthPx >= 24 && heightPx >= 24,
    target44Pass: widthPx >= 44 && heightPx >= 44,
    target6mmPass: minSideMm >= 6,
  };
}

function removeA11yInspectorPanel(): void {
  const panel = document.getElementById(A11Y_INSPECTOR_ID);
  panel?.remove();

  if (a11yInspectorPointerListener) {
    document.removeEventListener('mousemove', a11yInspectorPointerListener, true);
    a11yInspectorPointerListener = null;
  }

  if (a11yInspectorRafId !== null) {
    cancelAnimationFrame(a11yInspectorRafId);
    a11yInspectorRafId = null;
  }

  if (a11yInspectorEscapeListener) {
    document.removeEventListener('keydown', a11yInspectorEscapeListener, true);
    a11yInspectorEscapeListener = null;
  }
}

function clearA11yHoverTarget(): void {
  if (a11yHoverTargetElement && a11yHoverTargetElement.isConnected) {
    a11yHoverTargetElement.removeAttribute(A11Y_HOVER_ATTR);
  }
  a11yHoverTargetElement = null;

  const stale = document.querySelectorAll(`[${A11Y_HOVER_ATTR}]`);
  stale.forEach((node) => node.removeAttribute(A11Y_HOVER_ATTR));

  if (a11yHighlightSnapshots.size === 0) {
    a11yInspectorAnchorElement = null;
    removeA11yInspectorPanel();
  }
}

function setA11yHoverTarget(target: HTMLElement | null): void {
  if (a11yHoverTargetElement === target) {
    return;
  }

  clearA11yHoverTarget();

  if (!target) {
    return;
  }

  target.setAttribute(A11Y_HOVER_ATTR, 'true');
  a11yHoverTargetElement = target;

  const selector = buildElementSelector(target);
  const hoverInfo = getHoverSummary(target);
  renderA11yInspectorPanel({
    selector,
    issue: undefined,
    matchCount: 1,
    anchorElement: target,
    hoverInfo,
  });
}

function addA11ySelectionListeners(): void {
  if (a11yHoverMoveListener) {
    return;
  }

  ensureA11yHighlightStyles();

  a11yHoverMoveListener = (event: MouseEvent) => {
    if (activeTool !== 'accessibilityChecker') {
      return;
    }

    if (a11yHighlightSnapshots.size > 0) {
      clearA11yHoverTarget();
      return;
    }

    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    if (!(hovered instanceof HTMLElement)) {
      clearA11yHoverTarget();
      return;
    }

    const panel = document.getElementById(A11Y_INSPECTOR_ID);
    if ((panel && panel.contains(hovered)) || hovered.closest(`[${A11Y_BEACON_ATTR}]`)) {
      return;
    }

    const tag = hovered.tagName.toLowerCase();
    if (tag === 'html' || tag === 'body') {
      clearA11yHoverTarget();
      return;
    }

    setA11yHoverTarget(hovered);
  };

  document.addEventListener('mousemove', a11yHoverMoveListener, true);
}

function removeA11ySelectionListeners(): void {
  if (a11yHoverMoveListener) {
    document.removeEventListener('mousemove', a11yHoverMoveListener, true);
    a11yHoverMoveListener = null;
  }
  clearA11yHoverTarget();
}

function getPrimaryHighlightedElement(): HTMLElement | null {
  for (const el of a11yHighlightSnapshots.keys()) {
    if (el.isConnected) {
      return el;
    }
  }

  const fallback = document.querySelector(`[${A11Y_HIGHLIGHT_ATTR}]`);
  return fallback instanceof HTMLElement ? fallback : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function positionA11yInspectorPanel(panel: HTMLElement, anchor?: HTMLElement | null): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const panelRect = panel.getBoundingClientRect();
  const margin = 12;

  let targetX = 16;
  let targetY = 16;

  const targetAnchor = anchor ?? getPrimaryHighlightedElement();
  if (targetAnchor) {
    const rect = targetAnchor.getBoundingClientRect();
    targetX = rect.right + 12;
    targetY = rect.top + 12;

    if (targetX + panelRect.width + margin > viewportWidth) {
      targetX = rect.left - panelRect.width - 12;
    }
  }

  const maxLeft = Math.max(margin, viewportWidth - panelRect.width - margin);
  const maxTop = Math.max(margin, viewportHeight - panelRect.height - margin);

  const left = clamp(targetX, margin, maxLeft);
  const top = clamp(targetY, margin, maxTop);

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function removeA11yBeacons(): void {
  for (const entry of a11yBeacons) {
    entry.beacon.remove();
  }
  a11yBeacons.length = 0;

  const stale = document.querySelectorAll(`[${A11Y_BEACON_ATTR}]`);
  stale.forEach((node) => node.remove());

  if (a11yBeaconViewportListener) {
    window.removeEventListener('scroll', a11yBeaconViewportListener, true);
    window.removeEventListener('resize', a11yBeaconViewportListener, true);
    a11yBeaconViewportListener = null;
  }
}

function positionBeaconForTarget(target: HTMLElement, beacon: HTMLElement): void {
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    beacon.style.display = 'none';
    return;
  }

  beacon.style.display = 'block';

  const centerX = rect.left + (rect.width / 2);
  const centerY = rect.top + (rect.height / 2);
  const maxX = Math.max(8, window.innerWidth - 8);
  const maxY = Math.max(8, window.innerHeight - 8);
  const x = clamp(centerX, 8, maxX);
  const y = clamp(centerY, 8, maxY);

  beacon.style.left = `${x}px`;
  beacon.style.top = `${y}px`;
}

function updateA11yBeaconPositions(): void {
  for (const entry of a11yBeacons) {
    if (!entry.target.isConnected) {
      entry.beacon.remove();
      continue;
    }

    positionBeaconForTarget(entry.target, entry.beacon);
  }
}

function createA11yBeacons(targets: HTMLElement[]): void {
  removeA11yBeacons();

  const smallTargets = targets.filter((target) => {
    const rect = target.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width < 28 || rect.height < 28);
  });

  if (smallTargets.length === 0) {
    return;
  }

  const reduceMotion = shouldReduceMotion();

  for (const target of smallTargets.slice(0, 8)) {
    const beacon = document.createElement('div');
    beacon.setAttribute(A11Y_BEACON_ATTR, 'true');
    beacon.style.cssText = `
      position: fixed;
      width: 22px;
      height: 22px;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      border: 3px solid #f97316;
      background: rgba(249, 115, 22, 0.26);
      box-shadow: 0 0 0 8px rgba(249, 115, 22, 0.18);
      z-index: 2147483647;
      pointer-events: none;
      ${reduceMotion ? '' : 'animation: klicA11yBeaconPulse 0.95s ease-in-out 0s 6;'}
    `;

    document.body.appendChild(beacon);
    a11yBeacons.push({ target, beacon });
    positionBeaconForTarget(target, beacon);
  }

  a11yBeaconViewportListener = () => {
    updateA11yBeaconPositions();
  };
  window.addEventListener('scroll', a11yBeaconViewportListener, true);
  window.addEventListener('resize', a11yBeaconViewportListener, true);
}

function renderA11yInspectorPanel(data: {
  selector?: string;
  issue?: A11yIssuePayload;
  matchCount: number;
  anchorElement?: HTMLElement | null;
  hoverInfo?: HoverInfo;
}): void {
  removeA11yInspectorPanel();

  const colors = {
    border: '#1d4ed8',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#334155',
    surface: '#eff6ff',
  };
  const severity = data.issue?.severity ?? 'info';
  const severityColor = {
    critical: '#dc2626',
    high: '#f97316',
    medium: '#0ea5e9',
    low: '#64748b',
    info: '#64748b',
  }[severity];

  const selector = data.selector || resolveIssueSelector(data.issue) || '-';
  const statusMessage = data.issue
    ? (data.selector
      ? (data.matchCount > 0
        ? `선택자 일치 요소: ${data.matchCount}개`
        : '선택자와 일치하는 요소를 찾지 못했습니다')
      : '선택자 정보가 없습니다')
    : '마우스 요소 선택 모드';

  const criteriaTags: string[] = [];
  if (data.issue?.wcagCriteria) {
    criteriaTags.push(`<span style="padding:4px 10px;border-radius:999px;border:1px solid ${colors.border};font-size:12px;background:${colors.surface};">WCAG ${escapeHtml(data.issue.wcagCriteria)}</span>`);
  }
  if (data.issue?.krdsCriteria) {
    criteriaTags.push(`<span style="padding:4px 10px;border-radius:999px;border:1px solid ${colors.border};font-size:12px;background:${colors.surface};">KRDS ${escapeHtml(data.issue.krdsCriteria)}</span>`);
  }

  const panel = document.createElement('aside');
  panel.id = A11Y_INSPECTOR_ID;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '접근성 요소 상세');
  panel.style.cssText = `
    position: fixed;
    top: 16px;
    left: 16px;
    width: min(420px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    overflow: auto;
    z-index: 2147483647;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    background: ${colors.background};
    color: ${colors.foreground};
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.28), 0 0 0 2px rgba(29, 78, 216, 0.12);
    padding: 14px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.45;
  `;

  const resultBadge = (passed: boolean, label: string, threshold: string): string => {
    const icon = passed ? '✅' : '❌';
    const textColor = passed ? '#166534' : '#b91c1c';
    const bgColor = passed ? '#dcfce7' : '#fee2e2';
    const borderColor = passed ? '#86efac' : '#fecaca';

    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:10px;border:1px solid ${borderColor};background:${bgColor};">
      <span style="display:flex;align-items:center;gap:8px;color:${textColor};font-weight:700;font-size:12px;">${icon} ${label}</span>
      <span style="color:${textColor};font-size:12px;opacity:0.9;">${threshold}</span>
    </div>`;
  };

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">
      <strong style="font-size:15px;color:${colors.foreground};">Accessibility Inspector</strong>
      <button data-klic-a11y-close style="border:1px solid ${colors.border};background:#ffffff;color:${colors.foreground};border-radius:8px;padding:4px 10px;cursor:pointer;font-size:13px;font-weight:600;">닫기</button>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <span style="padding:4px 10px;border-radius:999px;background:${severityColor}22;color:${severityColor};font-weight:700;font-size:12px;letter-spacing:0.02em;">${escapeHtml(severity.toUpperCase())}</span>
      ${criteriaTags.join('')}
    </div>
    ${data.issue ? `<div style="margin-bottom:8px;"><strong style="display:block;margin-bottom:3px;">규칙</strong><span>${escapeHtml(data.issue.rule)}</span></div>` : ''}
    ${data.issue ? `<div style="margin-bottom:8px;"><strong style="display:block;margin-bottom:3px;">이슈</strong><span>${escapeHtml(data.issue.message)}</span></div>` : ''}
    ${data.issue ? `<div style="margin-bottom:8px;"><strong style="display:block;margin-bottom:3px;">개선 제안</strong><span>${escapeHtml(data.issue.suggestion)}</span></div>` : ''}
    ${!data.issue && data.hoverInfo ? `<div style="margin-bottom:8px;"><strong style="display:block;margin-bottom:3px;">요소</strong><span>${escapeHtml(data.hoverInfo.title)}</span></div>` : ''}
    ${!data.issue && data.hoverInfo ? `<div style="margin-bottom:8px;"><strong style="display:block;margin-bottom:3px;">텍스트</strong><span>${escapeHtml(data.hoverInfo.description)}</span></div>` : ''}
    ${!data.issue && data.hoverInfo ? `<div style="margin-top:10px;margin-bottom:6px;padding-top:10px;border-top:1px solid ${colors.border};"><strong style="display:block;margin-bottom:6px;">크기 검사</strong>
      <div style="display:grid;gap:6px;">
        ${resultBadge(data.hoverInfo.target24Pass, 'WCAG 2.5.8 (AA)', '>= 24x24px')}
        ${resultBadge(data.hoverInfo.target44Pass, 'WCAG 2.5.5 (AAA)', '>= 44x44px')}
        ${resultBadge(data.hoverInfo.target6mmPass, 'KWCAG 2.1.3', '>= 6.0mm')}
      </div>
    </div>` : ''}
    <div style="margin-bottom:8px;"><strong style="display:block;margin-bottom:3px;">선택자</strong><code style="display:block;padding:8px;border-radius:8px;border:1px solid ${colors.border};background:${colors.surface};font-size:12px;word-break:break-all;color:${colors.foreground};">${escapeHtml(selector)}</code></div>
    <div style="color:${colors.muted};font-size:12px;font-weight:600;">${escapeHtml(statusMessage)}</div>
  `;

  const closeButton = panel.querySelector<HTMLButtonElement>('[data-klic-a11y-close]');
  closeButton?.addEventListener('click', () => {
    clearHighlights();
  });

  document.body.appendChild(panel);
  a11yInspectorAnchorElement = data.anchorElement ?? getPrimaryHighlightedElement();
  positionA11yInspectorPanel(panel, a11yInspectorAnchorElement);

  a11yInspectorPointerListener = (event: MouseEvent) => {
    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    const currentPanel = document.getElementById(A11Y_INSPECTOR_ID);

    let nextAnchor: HTMLElement | null = null;
    if (hovered instanceof Element) {
      const insidePanel = currentPanel ? currentPanel.contains(hovered) : false;
      const insideBeacon = hovered.closest(`[${A11Y_BEACON_ATTR}]`) !== null;

      if (!insidePanel && !insideBeacon) {
        const highlighted = hovered.closest(`[${A11Y_HIGHLIGHT_ATTR}]`);
        if (highlighted instanceof HTMLElement) {
          nextAnchor = highlighted;
        } else if (a11yHighlightSnapshots.size === 0 && hovered instanceof HTMLElement) {
          const tag = hovered.tagName.toLowerCase();
          if (!['html', 'body'].includes(tag)) {
            nextAnchor = hovered;
          }
        }
      }
    }

    if (nextAnchor) {
      a11yInspectorAnchorElement = nextAnchor;
    }

    if (a11yInspectorRafId !== null) {
      return;
    }

    a11yInspectorRafId = window.requestAnimationFrame(() => {
      a11yInspectorRafId = null;
      const activePanel = document.getElementById(A11Y_INSPECTOR_ID);
      if (!(activePanel instanceof HTMLElement)) {
        return;
      }

      const anchor = a11yInspectorAnchorElement?.isConnected
        ? a11yInspectorAnchorElement
        : getPrimaryHighlightedElement();
      positionA11yInspectorPanel(activePanel, anchor);
    });
  };
  document.addEventListener('mousemove', a11yInspectorPointerListener, true);

  a11yInspectorEscapeListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearHighlights();
    }
  };
  document.addEventListener('keydown', a11yInspectorEscapeListener, true);
}

function handleElementHighlight(data: A11yElementMessageData | undefined): void {
  clearHighlights();
  clearA11yHoverTarget();
  ensureA11yHighlightStyles();

  const selector = data?.selector || resolveIssueSelector(data?.issue);
  if (!selector && !data?.issue) {
    return;
  }

  let matchCount = 0;

  if (selector) {
    try {
      const matched = Array.from(document.querySelectorAll(selector)).filter((el): el is HTMLElement => el instanceof HTMLElement);
      matchCount = matched.length;
      const reduceMotion = shouldReduceMotion();

      for (const el of matched) {
        a11yHighlightSnapshots.set(el, {
          outline: el.style.outline,
          outlineOffset: el.style.outlineOffset,
          backgroundColor: el.style.backgroundColor,
          boxShadow: el.style.boxShadow,
          transition: el.style.transition,
          animation: el.style.animation,
          transform: el.style.transform,
        });
        el.style.outline = '3px solid #f97316';
        el.style.outlineOffset = '2px';
        el.style.backgroundColor = 'rgba(249, 115, 22, 0.18)';
        el.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.42), 0 0 0 10px rgba(249, 115, 22, 0.12)';
        el.style.transition = 'outline-color 120ms ease-out, box-shadow 120ms ease-out, transform 120ms ease-out';
        if (reduceMotion) {
          el.style.animation = '';
          el.style.transform = '';
        } else {
          el.style.animation = 'klicA11yPulse 0.95s ease-in-out 0s 6';
          el.style.transform = 'translateZ(0)';
        }
        el.setAttribute(A11Y_HIGHLIGHT_ATTR, 'true');
      }

      createA11yBeacons(matched);

      const first = matched[0];
      if (first) {
        first.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
    } catch {
      matchCount = 0;
    }
  }

  renderA11yInspectorPanel({ selector, issue: data?.issue, matchCount });
}

function clearHighlights(): void {
  a11yInspectorAnchorElement = null;
  removeA11yBeacons();

  for (const [el, snapshot] of a11yHighlightSnapshots) {
    if (!el.isConnected) {
      continue;
    }

    el.style.outline = snapshot.outline;
    el.style.outlineOffset = snapshot.outlineOffset;
    el.style.backgroundColor = snapshot.backgroundColor;
    el.style.boxShadow = snapshot.boxShadow;
    el.style.transition = snapshot.transition;
    el.style.animation = snapshot.animation;
    el.style.transform = snapshot.transform;
    el.removeAttribute(A11Y_HIGHLIGHT_ATTR);
  }
  a11yHighlightSnapshots.clear();

  const stale = document.querySelectorAll(`[${A11Y_HIGHLIGHT_ATTR}]`);
  stale.forEach((el) => {
    if (!(el instanceof HTMLElement)) {
      return;
    }
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.style.backgroundColor = '';
    el.style.boxShadow = '';
    el.style.transition = '';
    el.style.animation = '';
    el.style.transform = '';
    el.removeAttribute(A11Y_HIGHLIGHT_ATTR);
  });

  removeA11yInspectorPanel();
}
import { initInteractiveRuler, clearAllRulerOverlays } from './ruler/interactiveOverlay';

// --- Toast Helper ---
function showToast(message: string, color: string = '#3B82F6') {
    const toast = document.createElement("div");
    toast.innerText = message;
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: color,
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "8px",
        zIndex: "2147483647",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        pointerEvents: "none",
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        maxWidth: 'calc(100vw - 40px)',
        textAlign: 'center',
    });
    (document.documentElement || document.body).appendChild(toast);

    requestAnimationFrame(() => toast.style.opacity = '1');

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function translateMessage(
  key: string,
  fallback: string,
  options?: Record<string, unknown>
): Promise<string> {
  try {
    const value = await translate(key, options);
    return value && value !== key ? value : fallback;
  } catch {
    return fallback;
  }
}

function showTranslatedToast(
  key: string,
  fallback: string,
  color: string = '#3B82F6',
  options?: Record<string, unknown>
) {
  void translateMessage(key, fallback, options).then((message) => {
    showToast(message, color);
  });
}

// --- State ---
let activeTool: string | null = null;
const hoverOverlayRef = { current: null as HTMLElement | null };
let cleanupRuler: (() => void) | null = null;
let shortcutToolByCombo = new Map<string, ToolType>();
let deactivateShortcutCombos = new Set<string>();
let shortcutsEnabled = true;

const TOOL_ID_SET = new Set<ToolType>(SHORTCUT_TOOL_IDS);
const DEACTIVATE_SHORTCUT_ACTION_IDS = ['shortcut-deactivate-active-tool', 'deactivateActiveTool'] as const;

const SYMBOL_KEY_MAP: Record<string, string> = {
    '+': 'Plus',
    '-': 'Minus',
    '=': 'Equal',
    '/': 'Slash',
    '\\': 'Backslash',
    '.': 'Period',
    ',': 'Comma',
    ';': 'Semicolon',
    "'": 'Quote',
    '`': 'Backtick',
    '[': 'BracketLeft',
    ']': 'BracketRight',
};

// --- Text Edit State ---
let textEditActive = false;

// --- Hover Handler Setup ---
const { handleHover, handleClick, resetJsInspectorDepth, ensureJsInspectorDepthControls } = createHoverHandler({
    getActiveTool: () => activeTool,
    hoverOverlay: hoverOverlayRef,
    deactivateTool: () => deactivateTool(),
    showToast,
});

function normalizeMainShortcutKey(key: string): string | null {
    if (key === ' ' || key === 'Spacebar' || key === 'Space') {
        return 'Space';
    }

    if (key === 'Dead' || key === 'Unidentified') {
        return null;
    }

    if (key.startsWith('Arrow')) {
        return key.slice('Arrow'.length);
    }

    if (Object.prototype.hasOwnProperty.call(SYMBOL_KEY_MAP, key)) {
        return SYMBOL_KEY_MAP[key];
    }

    if (key.length === 1) {
        return key.toUpperCase();
    }

    return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getShortcutComboFromEvent(event: KeyboardEvent): string | null {
    const modifierOnlyKey =
        event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta';

    if (modifierOnlyKey) {
        return null;
    }

    const mainKey = normalizeMainShortcutKey(event.key);
    if (!mainKey) {
        return null;
    }

    const parts: string[] = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    parts.push(mainKey);

    return normalizeShortcutCombo(parts.join('+'));
}

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
        return false;
    }

    if (target.closest('input, textarea, select')) {
        return true;
    }

    if (target.closest('[contenteditable="true"], [contenteditable="plaintext-only"], [contenteditable=""]')) {
        return true;
    }

    return target instanceof HTMLElement && target.isContentEditable;
}

function applyShortcutStorage(rawStorageData: unknown): void {
    const normalizedData = normalizeShortcutStorageData(rawStorageData);

    const nextShortcutToolByCombo = new Map<string, ToolType>();
    for (const [rawToolId, rawShortcut] of Object.entries(normalizedData.tools)) {
        if (!TOOL_ID_SET.has(rawToolId as ToolType)) {
            continue;
        }

        if (typeof rawShortcut !== 'string' || rawShortcut.trim().length === 0) {
            continue;
        }

        const normalizedCombo = normalizeShortcutCombo(rawShortcut);
        if (normalizedCombo.length === 0) {
            continue;
        }

        nextShortcutToolByCombo.set(normalizedCombo, rawToolId as ToolType);
    }

    const nextDeactivateShortcutCombos = new Set<string>();
    for (const actionId of DEACTIVATE_SHORTCUT_ACTION_IDS) {
        const rawActionShortcut = normalizedData.actions[actionId];
        if (typeof rawActionShortcut !== 'string' || rawActionShortcut.trim().length === 0) {
            continue;
        }

        const normalizedActionShortcut = normalizeShortcutCombo(rawActionShortcut);
        if (normalizedActionShortcut.length > 0) {
            nextDeactivateShortcutCombos.add(normalizedActionShortcut);
        }
    }

    shortcutToolByCombo = nextShortcutToolByCombo;
    deactivateShortcutCombos = nextDeactivateShortcutCombos;
}

function applyShortcutEnabledSetting(rawAppSettings: unknown): void {
    if (!isRecord(rawAppSettings)) {
        shortcutsEnabled = true;
        return;
    }

    const keyboardShortcuts = rawAppSettings.keyboardShortcuts;
    shortcutsEnabled = typeof keyboardShortcuts === 'boolean' ? keyboardShortcuts : true;
}

function loadShortcutStorage(): void {
    if (!isContextValid()) {
        return;
    }

    chrome.storage.local.get([STORAGE_KEYS.SHORTCUTS_DATA, STORAGE_KEYS.APP_SETTINGS], (result) => {
        if (chrome.runtime.lastError) {
            applyShortcutStorage(null);
            applyShortcutEnabledSetting(null);
            return;
        }

        applyShortcutStorage(result?.[STORAGE_KEYS.SHORTCUTS_DATA]);
        applyShortcutEnabledSetting(result?.[STORAGE_KEYS.APP_SETTINGS]);
    });
}

function handleShortcutStorageChanged(
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: 'sync' | 'local' | 'managed' | 'session'
): void {
    if (areaName !== 'local') {
        return;
    }

    const shortcutChange = changes[STORAGE_KEYS.SHORTCUTS_DATA];
    if (shortcutChange) {
        applyShortcutStorage(shortcutChange.newValue);
    }

    const appSettingsChange = changes[STORAGE_KEYS.APP_SETTINGS];
    if (appSettingsChange) {
        applyShortcutEnabledSetting(appSettingsChange.newValue);
    }
}

function handleShortcutKeydown(event: KeyboardEvent): void {
    if (!shortcutsEnabled) {
        return;
    }

    if (event.defaultPrevented || isEditableTarget(event.target)) {
        return;
    }

    const combo = getShortcutComboFromEvent(event);
    if (!combo) {
        return;
    }

    if (deactivateShortcutCombos.has(combo)) {
        if (activeTool) {
            event.preventDefault();
            event.stopPropagation();
            deactivateTool();
        }
        return;
    }

    const targetTool = shortcutToolByCombo.get(combo);
    if (!targetTool) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (activeTool === targetTool) {
        deactivateTool();
        return;
    }

    activateTool(targetTool);
}

function cleanupShortcutListeners(): void {
    document.removeEventListener('keydown', handleShortcutKeydown, true);
    if (chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleShortcutStorageChanged);
    }
}

function initializeShortcutListeners(): void {
    loadShortcutStorage();
    document.addEventListener('keydown', handleShortcutKeydown, true);
    chrome.storage.onChanged.addListener(handleShortcutStorageChanged);
    window.addEventListener('pagehide', cleanupShortcutListeners, { once: true });
    window.addEventListener('unload', cleanupShortcutListeners, { once: true });
}

initializeShortcutListeners();

// --- Unified Message Handler ---
if (isContextValid()) chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'PING') {
        sendResponse({ success: true, message: 'PONG' });
        return true;
    }

    if (request.action === 'GET_ACTIVE_TOOL') {
        sendResponse({ success: true, tool: activeTool });
        return true;
    }

    if (request.action === 'GIF_RECORDING_STARTED') {
        showRecordingIndicator();
        // Lock scroll for selection/element mode (C3)
        const mode = request.data?.mode;
        if (mode === 'selection' || mode === 'element') {
            lockScroll();
        }
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'GIF_RECORDING_ENDED') {
        hideRecordingIndicator();
        unlockScroll();
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'GIF_SELECT_AREA') {
        lockScroll();
        sendResponse({ success: true }); // Immediate ACK (C2)
        startAreaSelection().then(async (bounds) => {
            if (bounds) {
                await showCountdown(3);
                safeSendMessage({
                    action: 'GIF_AREA_SELECTED',
                    data: { ...bounds, viewportWidth: window.innerWidth },
                });
            } else {
                unlockScroll();
                safeSendMessage({ action: 'GIF_SELECTION_CANCEL' });
            }
        });
        return true;
    }

    if (request.action === 'GIF_SELECT_ELEMENT') {
        lockScroll();
        sendResponse({ success: true }); // Immediate ACK (C2)
        startElementSelection().then(async (bounds) => {
            if (bounds) {
                await showCountdown(3);
                safeSendMessage({
                    action: 'GIF_AREA_SELECTED',
                    data: { ...bounds, viewportWidth: window.innerWidth },
                });
            } else {
                unlockScroll();
                safeSendMessage({ action: 'GIF_SELECTION_CANCEL' });
            }
        });
        return true;
    }

    if (request.action === 'GIF_SELECTION_CANCEL') {
        cancelSelection();
        unlockScroll();
        sendResponse({ success: true });
        return true;
    }

    if (
      request.action === MODAL_ACTIONS.OPEN_CONTEXT_MENU_MODAL ||
      request.action === MODAL_ACTIONS.OPEN_MODAL
    ) {
        const toolId =
          typeof request.tool === 'string' && request.tool.trim().length > 0 ? request.tool : null;
        const nonce =
          typeof request.nonce === 'string' && request.nonce.trim().length > 0 ? request.nonce : '';
        const tabId =
          typeof request.tabId === 'number' && Number.isInteger(request.tabId) && request.tabId > 0
            ? request.tabId
            : null;

        if (!nonce) {
            sendResponse({ success: false, error: 'Missing nonce for modal open request' });
            return true;
        }

        openContextMenuModal({
          toolId,
          tabId,
          nonce,
        })
          .then((opened) => {
            sendResponse({ success: true, opened });
          })
          .catch((error) => {
            sendResponse({ success: false, error: (error as Error).message });
          });

        return true;
    }

    if (request.action === 'CLOSE_CONTEXT_MENU_MODAL') {
        closeContextMenuModal();
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'TOGGLE_TOOL') {
        try {
            const { tool, active, pickerMode } = request;
            if (active) {
                activateTool(tool, { pickerMode });
            } else {
                deactivateTool();
            }
            sendResponse({ success: true, tool, active });
        } catch (error) {
            sendResponse({ success: false, error: (error as Error).message });
        }
        return true;
    }

    // Component Inspector handlers
    if (request.action === 'COMPONENT_TOGGLE_PICKER') {
        const { active } = request;
        try {
            if (active) {
                activateComponentPicker();
            } else {
                deactivateComponentPicker();
            }
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: (error as Error).message });
        }
        return true;
    }

    if (request.action === 'COMPONENT_SCAN') {
        try {
            performComponentScan(request.options);
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: (error as Error).message });
        }
        return true;
    }

    if (request.action === 'CONSOLE_TOGGLE_INTERCEPT') {
        const shouldEnable = request.data?.enabled !== false;
        if (shouldEnable) {
            if (isConsoleSpyEnabled()) {
                sendResponse({ success: true, enabled: true });
            } else {
                enableConsoleSpy(showToast)
                    .then((enabled) => {
                        sendResponse({ success: true, enabled });
                    })
                    .catch(() => {
                        sendResponse({ success: true, enabled: false });
                    });
            }
        } else {
            disableConsoleSpy(showToast)
                .then(() => {
                    sendResponse({ success: true, enabled: false });
                })
                .catch(() => {
                    sendResponse({ success: true, enabled: false });
                });
        }

        return true;
    }

    if (request.action === 'ASSET_EXTRACT') {
        handleAssetExtract(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'ASSET_DOWNLOAD_MULTIPLE') {
        handleAssetDownloadMultiple(request.data.assets)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'ASSET_DOWNLOAD_ZIP') {
        handleAssetDownloadZip(request.data.assets, showToast)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'ASSET_COPY_CLIPBOARD') {
        handleAssetCopyClipboard(request.data.assets, showToast)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'ASSET_GET_SETTINGS') {
        chrome.storage.local.get(['assetManager:settings'], (result) => {
            sendResponse({ success: true, data: result['assetManager:settings'] });
        });
        return true;
    }

    if (request.action === 'ASSET_UPDATE_SETTINGS') {
        chrome.storage.local.set({ 'assetManager:settings': request.data }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'TAILWIND_SCAN') {
        handleTailwindScan()
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'TAILWIND_CONVERT_CSS') {
        handleTailwindConvertCSS(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'SCROLL_TO') {
        const x = typeof request.x === 'number'
            ? request.x
            : (typeof request.data?.x === 'number' ? request.data.x : 0);
        const y = typeof request.y === 'number'
            ? request.y
            : (typeof request.data?.y === 'number' ? request.data.y : 0);

        window.scrollTo(x, y);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                sendResponse({ success: true });
            });
        });

        return true;
    }

    if (request.action === 'GET_PAGE_DIMENSIONS') {
        sendResponse({
            success: true,
            dimensions: {
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
            }
        });
        return true;
    }

    if (request.action === 'TAILWIND_CONVERT_ELEMENT') {
        handleTailwindConvertElement(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'TAILWIND_CONVERT_ALL_INLINE') {
        handleTailwindConvertAllInline()
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'TAILWIND_EXTRACT_CONFIG') {
        handleTailwindExtractConfig()
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'TAILWIND_GET_DETECTION') {
        handleTailwindGetDetection()
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // Accessibility scan
    if (request.action === 'A11Y_SCAN_START') {
        handleAccessibilityScan(request.data)
            .then((report) => {
                safeSendMessage({ action: 'A11Y_SCAN_RESULT', data: report });
                sendResponse({ success: true, data: report });
            })
            .catch((error) => {
                sendResponse({ success: false, error: (error as Error).message });
            });
        return true;
    }

    if (request.action === 'A11Y_SCAN_ELEMENT') {
        handleElementHighlight(request.data as A11yElementMessageData | undefined);
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'A11Y_SCAN_CLEAR') {
        clearHighlights();
        sendResponse({ success: true });
        return true;
    }

    // Crop element screenshot (dataUrl is provided by background script)
    if (request.action === 'CROP_AND_CAPTURE') {
        const { bounds, dataUrl } = request;
        if (!dataUrl) {
            sendResponse({ success: false, error: 'No screenshot data provided' });
            return true;
        }

        let responded = false;
        const respond = (data: { success: boolean; dataUrl?: string; error?: string }) => {
            if (responded) return;
            responded = true;
            clearTimeout(timeout);
            sendResponse(data);
        };

        const timeout = setTimeout(() => {
            respond({ success: false, error: 'Image crop timeout' });
        }, 5000);

        try {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = bounds.width;
                    canvas.height = bounds.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(
                            img,
                            bounds.x, bounds.y, bounds.width, bounds.height,
                            0, 0, bounds.width, bounds.height
                        );
                        respond({ success: true, dataUrl: canvas.toDataURL('image/png') });
                    } else {
                        respond({ success: false, error: 'Failed to get canvas context' });
                    }
                } catch (err) {
                    respond({ success: false, error: (err as Error).message });
                }
            };
            img.onerror = () => {
                respond({ success: false, error: 'Failed to load image' });
            };
            img.src = dataUrl;
        } catch (error) {
            respond({ success: false, error: (error as Error).message });
        }
        return true;
    }
});

function activateTool(tool: string, options?: { pickerMode?: boolean }) {
    if (activeTool) deactivateTool();
    activeTool = tool;

    switch (tool) {
        case 'textEdit':
            textEditManagerInstance.activate();
            showTranslatedToast('content.textEditHint', 'Click text on the page to edit it.', '#10B981');
            break;
        case 'screenshot':
            showTranslatedToast('content.screenshotModeHint', 'Choose capture mode from the side panel.', '#F59E0B');
            break;
        case 'cssScan':
            addHoverListeners();
            showTranslatedToast('content.cssScanHint', 'Hover an element to inspect.', '#3B82F6');
            break;
        case 'tailwind':
            addHoverListeners();
            showTranslatedToast('content.tailwindHint', 'Hover an element to view Tailwind classes.', '#38BDF8');
            break;
        case 'jsInspector':
            addHoverListeners();
            ensureJsInspectorDepthControls();
            showTranslatedToast('content.jsInspectorHint', 'Click an element to inspect JavaScript listeners.', '#1D4ED8');
            break;
        case 'ruler':
            cleanupRuler = initInteractiveRuler();
            showTranslatedToast('content.rulerHint', 'Drag to measure.', '#F59E0B');
            break;
        case 'fontAnalyzer':
            addHoverListeners();
            showTranslatedToast('content.fontAnalyzerHint', 'Click an element to analyze font.', '#8B5CF6');
            break;
        case 'palette':
            scanPalette();
            if (options?.pickerMode) {
                addColorPickerListeners();
                showTranslatedToast('content.colorPickerHint', 'Click anywhere to pick a color.', '#EC4899');
            }
            break;
        case 'assets':
            addHoverListeners();
            showTranslatedToast('content.assetsHint', 'Click an element to extract assets.', '#F59E0B');
            break;
        case 'console':
            if (!isConsoleSpyEnabled()) {
                void enableConsoleSpy(showToast);
            }
            break;
        case 'resourceNetwork':
            enableResourceNetwork();
            break;
        case 'accessibilityChecker':
            addA11ySelectionListeners();
            showTranslatedToast('content.accessibilityEnabled', 'Accessibility checker enabled', '#10B981');
            break;
        case 'gridLayout':
            initGridLayout();
            showTranslatedToast('content.gridLayoutEnabled', 'Grid layout enabled', '#06B6D4');
            break;
        case 'componentInspector':
            activateComponentPicker();
            showTranslatedToast('content.componentInspectorHint', 'Click a component to inspect.', '#8B5CF6');
            break;
    }
}

function deactivateTool() {
    if (activeTool === 'resourceNetwork') {
        resourceNetworkModule.resourceNetworkContentScript.deactivate();
    }
    if (activeTool === 'console') {
        void disableConsoleSpy();
    }
    if (activeTool === 'textEdit') {
        textEditManagerInstance.deactivate();
    }
    if (activeTool === 'accessibilityChecker') {
        removeA11ySelectionListeners();
        clearHighlights();
    }
    if (activeTool === 'gridLayout') {
        cleanupGridLayout();
    }
    if (activeTool === 'componentInspector') {
        deactivateComponentPicker();
    }
    // Cleanup any active area/element selection (L3)
    cancelSelection();
    unlockScroll();
    activeTool = null;
    document.designMode = 'off';
    removeHoverListeners();
    resetJsInspectorDepth();
    removeColorPickerListeners();
    if (cleanupRuler) {
        cleanupRuler();
        cleanupRuler = null;
    }
    clearAllRulerOverlays();
    if (hoverOverlayRef.current) {
        hoverOverlayRef.current.remove();
        hoverOverlayRef.current = null;
    }

    // 텍스트 에디터 오버레이 잔여물 제거
    document.getElementById('klic-text-edit-overlay')?.remove();
    document.getElementById('klic-text-edit-info')?.remove();
}

// --- Text Edit Functions ---
function enableTextEdit() {
    if (textEditActive) return;
    textEditActive = true;

    const makeEditable = () => {
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li, td, th, a, button');
        textElements.forEach((el) => {
            if (el instanceof HTMLElement && el.children.length === 0) {
                el.contentEditable = 'true';
                el.classList.add('klic-text-edit-active');
            }
        });
    };

    makeEditable();
}

function disableTextEdit() {
    textEditActive = false;

    document.querySelectorAll('.klic-text-edit-active').forEach((el) => {
        if (el instanceof HTMLElement) {
            el.removeAttribute('contenteditable');
            el.classList.remove('klic-text-edit-active');
        }
    });
}

// --- Scanners ---
function scanPalette() {
    const colors = new Set<string>();
    const allElements = document.querySelectorAll('*');

    allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bg = style.backgroundColor;
        const border = style.borderColor;

        if (color && !color.includes('rgba(0, 0, 0, 0)')) colors.add(color);
        if (bg && !bg.includes('rgba(0, 0, 0, 0)')) colors.add(bg);
        if (border && !border.includes('rgba(0, 0, 0, 0)') && style.borderWidth !== '0px') colors.add(border);
    });

    const result = Array.from(colors);
    safeSendMessage({ action: 'TOOL_DATA', tool: 'palette', data: result });
    showTranslatedToast('content.paletteFoundColors', `Found ${result.length} colors`, '#EC4899', { count: result.length });
    // Note: Don't deactivate - keep tool active for continuous monitoring
}

// --- Color Picker Logic ---
async function colorPickerClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if ('EyeDropper' in window) {
        try {
            const eyeDropper = new (window as Window & { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
            const result = await eyeDropper.open();
            await navigator.clipboard.writeText(result.sRGBHex);
            showTranslatedToast('content.colorCopiedValue', `Color copied: ${result.sRGBHex}`, result.sRGBHex, { color: result.sRGBHex });
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                showTranslatedToast('content.colorExtractFailed', 'Failed to extract color', '#EF4444');
            }
        }
    } else {
        const target = e.target as HTMLElement;
        const color = window.getComputedStyle(target).backgroundColor;
        await navigator.clipboard.writeText(color);
        showTranslatedToast('content.colorCopiedValue', `Color copied: ${color}`, color, { color });
    }

    // palette 도구는 유지하고 피커 모드만 종료
    removeColorPickerListeners();

    // App.tsx에 피커 모드 종료 알림
    safeSendMessage({ action: 'PALETTE_PICKER_DONE' });
}

function addColorPickerListeners() {
    document.body.style.cursor = 'crosshair';
    document.addEventListener('click', colorPickerClick, true);
}

function removeColorPickerListeners() {
    document.body.style.cursor = '';
    document.removeEventListener('click', colorPickerClick, true);
}

// --- Hover Logic ---
function addHoverListeners() {
    document.addEventListener('mousemove', handleHover, true);
    document.addEventListener('click', handleClick, true);
}

function removeHoverListeners() {
    document.removeEventListener('mousemove', handleHover, true);
    document.removeEventListener('click', handleClick, true);
}

// --- Resource Network ---
function enableResourceNetwork() {
    resourceNetworkModule.resourceNetworkContentScript.activate();
    showTranslatedToast('content.resourceNetworkEnabled', 'Resource network monitoring enabled', '#8B5CF6');

    Promise.resolve(resourceNetworkModule.resourceNetworkContentScript.collectStorageStats()).then((stats) => {
        safeSendMessage({
            action: 'TOOL_DATA',
            tool: 'resourceNetwork',
            data: { type: 'storage', stats }
        });
    });
}

// Suppress unused variable warnings for text edit functions
void enableTextEdit;
void disableTextEdit;
