/**
 * Hover Handler
 *
 * 마우스 호버 오버레이 및 클릭 이벤트 처리
 * (Screenshot, CSS Scan, Tailwind 도구용)
 */

import { mapToTailwind } from '../tailwind/tailwindHandler';
import { extractCssScanData } from '../cssScan/cssScanExtractor';
import { safeSendMessage } from '../utils/safeMessage';
import { t as translate } from '../../i18n/core';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { getSelector, getXPath } from '../../utils/dom/selectorGenerator';
import type { JsInspectorTargetRequest } from '../../types/jsInspector';
import {
    clampDepth,
    getAncestorAtDepth,
    depthDeltaFromDrag,
    depthDeltaFromWheel,
    JS_INSPECTOR_DEPTH_DEFAULTS,
} from './jsInspectorDepth';


export interface HoverHandlerState {
    getActiveTool: () => string | null;
    hoverOverlay: { current: HTMLElement | null };
    deactivateTool: () => void;
    showToast: (message: string, color?: string) => void;
}

export type HoverHandler = {
    handleHover: (e: MouseEvent) => void;
    handleClick: (e: MouseEvent) => Promise<void>;
    resetJsInspectorDepth: () => void;
    ensureJsInspectorDepthControls: () => void;
};

interface HoverMessages {
    screenshotLabel: string;
    cssScanLabel: string;
    fontAnalyzerLabel: string;
    tailwindLabel: string;
    jsInspectorLabel: string;
    assetsLabel: string;
    resourceNetworkLabel: string;
    accessibilityCheckerLabel: string;
    clickToViewTailwind: string;
    clickToExtractColor: string;
    clickToInspectJs: string;
    jsInspectorDepthLabel: string;
    jsInspectorDepthHint: string;
    sourcePrefix: string;
    linkPrefix: string;
    missingAlt: string;
}

export function createHoverHandler(state: HoverHandlerState): HoverHandler {
    const messages: HoverMessages = {
        screenshotLabel: 'Screenshot',
        cssScanLabel: 'CSS Scan',
        fontAnalyzerLabel: 'Font Analyzer',
        tailwindLabel: 'Tailwind',
        jsInspectorLabel: 'JS Inspector',
        assetsLabel: 'Assets',
        resourceNetworkLabel: 'Resource Network',
        accessibilityCheckerLabel: 'Accessibility Checker',
        clickToViewTailwind: 'Click to view Tailwind classes',
        clickToExtractColor: 'Click to extract color',
        clickToInspectJs: 'Click to inspect event JS',
        jsInspectorDepthLabel: 'JS Inspector • Depth: {{depth}}',
        jsInspectorDepthHint: 'Drag label / wheel / ESC reset',
        sourcePrefix: 'Source',
        linkPrefix: 'Link',
        missingAlt: 'missing alt',
    };

    const translateMessage = async (
        key: string,
        fallback: string,
        options?: Record<string, unknown>
    ): Promise<string> => {
        try {
            const value = await translate(key, options);
            return value && value !== key ? value : fallback;
        } catch {
            return fallback;
        }
    };

    void (async () => {
        messages.screenshotLabel = await translateMessage('tools.screenshot.name', messages.screenshotLabel);
        messages.cssScanLabel = await translateMessage('tools.cssScan.name', messages.cssScanLabel);
        messages.fontAnalyzerLabel = await translateMessage('tools.fontAnalyzer.name', messages.fontAnalyzerLabel);
        messages.tailwindLabel = await translateMessage('tools.tailwind.name', messages.tailwindLabel);
        messages.jsInspectorLabel = await translateMessage('tools.jsInspector.name', messages.jsInspectorLabel);
        messages.assetsLabel = await translateMessage('tools.assets.name', messages.assetsLabel);
        messages.resourceNetworkLabel = await translateMessage('tools.resourceNetwork.name', messages.resourceNetworkLabel);
        messages.accessibilityCheckerLabel = await translateMessage('tools.accessibilityChecker.name', messages.accessibilityCheckerLabel);
        messages.clickToViewTailwind = await translateMessage('content.clickToViewTailwind', messages.clickToViewTailwind);
        messages.clickToExtractColor = await translateMessage('content.clickToExtractColor', messages.clickToExtractColor);
        messages.clickToInspectJs = await translateMessage('content.clickToInspectJs', messages.clickToInspectJs);
        messages.jsInspectorDepthLabel = await translateMessage('content.jsInspectorDepthLabel', messages.jsInspectorDepthLabel, { depth: 0 });
        messages.jsInspectorDepthHint = await translateMessage('content.jsInspectorDepthHint', messages.jsInspectorDepthHint);
        messages.sourcePrefix = await translateMessage('content.sourcePrefix', messages.sourcePrefix);
        messages.linkPrefix = await translateMessage('content.linkPrefix', messages.linkPrefix);
        messages.missingAlt = await translateMessage('content.missingAlt', messages.missingAlt);
    })();

    // 도구별 스타일 설정
    const toolStyles: Record<string, { border: string; bg: string; labelBg: string; label: string }> = {
        screenshot: {
            border: '2px solid #3B82F6',
            bg: 'rgba(59, 130, 246, 0.1)',
            labelBg: '#3B82F6',
            label: messages.screenshotLabel
        },
        cssScan: {
            border: '2px solid #8B5CF6',
            bg: 'rgba(139, 92, 246, 0.1)',
            labelBg: '#8B5CF6',
            label: messages.cssScanLabel
        },
        fontAnalyzer: {
            border: '2px solid #8B5CF6',
            bg: 'rgba(139, 92, 246, 0.1)',
            labelBg: '#8B5CF6',
            label: messages.fontAnalyzerLabel
        },
        tailwind: {
            border: '2px solid #14B8A6',
            bg: 'rgba(20, 184, 166, 0.1)',
            labelBg: '#14B8A6',
            label: messages.tailwindLabel
        },
        jsInspector: {
            border: '2px solid #1D4ED8',
            bg: 'rgba(29, 78, 216, 0.12)',
            labelBg: '#1D4ED8',
            label: messages.jsInspectorLabel
        },
        assets: {
            border: '2px solid #F59E0B',
            bg: 'rgba(245, 158, 11, 0.1)',
            labelBg: '#F59E0B',
            label: messages.assetsLabel
        },
        resourceNetwork: {
            border: '2px solid #EF4444',
            bg: 'rgba(239, 68, 68, 0.1)',
            labelBg: '#EF4444',
            label: messages.resourceNetworkLabel
        },
        accessibilityChecker: {
            border: '2px solid #10B981',
            bg: 'rgba(16, 185, 129, 0.1)',
            labelBg: '#10B981',
            label: messages.accessibilityCheckerLabel
        },
    };

    let jsInspectorDepth = 0;
    let draggingLabel = false;
    let dragPointerId: number | null = null;
    let dragStartY = 0;
    let dragStartDepth = 0;
    let dragMoved = false;
    let suppressClickUntil = 0;
    let escListenerAttached = false;
    let jsInspectorInfoEl: HTMLElement | null = null;
    let lastJsInspectorClickTarget: HTMLElement | null = null;

    const isEditableTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) {
            return false;
        }
        if (target.isContentEditable) {
            return true;
        }
        const tagName = target.tagName;
        return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
    };

    const onInspectorKeyDown = (event: KeyboardEvent) => {
        if (state.getActiveTool() !== 'jsInspector') return;
        if (isEditableTarget(event.target)) return;

        const key = event.key;
        const code = event.code;

        if (key === 'Escape' || code === 'Escape') {
            jsInspectorDepth = 0;
        } else if (key === ']' || code === 'BracketRight') {
            jsInspectorDepth = clampDepth(jsInspectorDepth + 1, JS_INSPECTOR_DEPTH_DEFAULTS.maxDepth);
        } else if (key === '[' || code === 'BracketLeft') {
            jsInspectorDepth = clampDepth(jsInspectorDepth - 1, JS_INSPECTOR_DEPTH_DEFAULTS.maxDepth);
        } else {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (jsInspectorInfoEl) {
            void formatJsInspectorLabel().then((label) => {
                if (state.getActiveTool() === 'jsInspector' && jsInspectorInfoEl) {
                    jsInspectorInfoEl.innerText = label;
                }
            });
        }

        void (async () => {
            state.showToast(
                await translateMessage('content.jsInspectorDepthToast', 'JS Inspector depth: {{depth}}', { depth: jsInspectorDepth }),
                '#1D4ED8'
            );
        })();

        rerunJsInspectorIfPossible();
    };

    const formatJsInspectorLabel = async (): Promise<string> => {
        const depthText = await translateMessage('content.jsInspectorDepthLabel', messages.jsInspectorDepthLabel, {
            depth: jsInspectorDepth,
        });
        return `${depthText} • ${messages.jsInspectorDepthHint}`;
    };

    const resetJsInspectorDepth = () => {
        jsInspectorDepth = 0;
        draggingLabel = false;
        dragPointerId = null;
        dragMoved = false;
        suppressClickUntil = 0;
        jsInspectorInfoEl = null;
        lastJsInspectorClickTarget = null;
        if (escListenerAttached) {
            document.removeEventListener('keydown', onInspectorKeyDown, true);
            escListenerAttached = false;
        }
    };

    const resolveInspectorAnchor = (target: HTMLElement): HTMLElement => {
        return getAncestorAtDepth(target, jsInspectorDepth, JS_INSPECTOR_DEPTH_DEFAULTS.maxDepth);
    };

    const buildSelectionState = (clickedEl: HTMLElement) => {
        const anchorEl = resolveInspectorAnchor(clickedEl);
        const path: JsInspectorTargetRequest[] = [];

        let current: HTMLElement | null = clickedEl;
        let depth = 0;

        while (current && depth <= JS_INSPECTOR_DEPTH_DEFAULTS.maxDepth) {
            path.push({
                selector: getSelector(current),
                xpath: getXPath(current),
                relation: depth === 0 ? 'self' : (`ancestor-${depth}` as const),
                tagName: current.tagName.toLowerCase(),
                id: current.id || undefined,
                className: typeof current.className === 'string' ? current.className : undefined,
                inlineHandlers: [],
            });

            if (current === anchorEl) {
                break;
            }

            current = current.parentElement;
            depth += 1;
        }

        const clicked = path[0];
        const anchor = path[path.length - 1] ?? path[0];

        return {
            depth: jsInspectorDepth,
            maxDepth: JS_INSPECTOR_DEPTH_DEFAULTS.maxDepth,
            clicked: {
                relation: clicked.relation,
                selector: clicked.selector,
                tagName: clicked.tagName,
                id: clicked.id,
                className: clicked.className,
            },
            anchor: {
                relation: anchor.relation,
                selector: anchor.selector,
                tagName: anchor.tagName,
                id: anchor.id,
                className: anchor.className,
            },
            path: path.map((node) => ({
                relation: node.relation,
                selector: node.selector,
                tagName: node.tagName,
                id: node.id,
                className: node.className,
            })),
        };
    };

    const rerunJsInspectorIfPossible = () => {
        if (state.getActiveTool() !== 'jsInspector') {
            return;
        }
        if (!lastJsInspectorClickTarget) {
            return;
        }

        void (async () => {
            try {
                const anchor = resolveInspectorAnchor(lastJsInspectorClickTarget);
                const inspectionTargets = buildInspectionTargets(anchor, 14);

                const response = await chrome.runtime.sendMessage({
                    action: MESSAGE_ACTIONS.JS_INSPECT_ELEMENT,
                    data: {
                        targets: inspectionTargets,
                    },
                }) as { success?: boolean; data?: unknown; error?: string };

                if (!response?.success) {
                    throw new Error(response?.error || 'JS inspection failed');
                }

                const selection = buildSelectionState(lastJsInspectorClickTarget);
                safeSendMessage({
                    action: 'TOOL_DATA',
                    tool: 'jsInspector',
                    data: {
                        ...(response.data as Record<string, unknown>),
                        selection,
                    },
                });
            } catch {
                state.showToast(
                    await translateMessage('content.jsInspectorFailed', 'Failed to inspect JavaScript events'),
                    '#EF4444'
                );
            }
        })();
    };

    function collectInlineHandlers(element: HTMLElement): Array<{ eventType: string; code: string }> {
        return element
            .getAttributeNames()
            .filter((name) => name.startsWith('on'))
            .map((name) => {
                const code = element.getAttribute(name);
                const eventType = name.slice(2);
                if (!code || !eventType) {
                    return null;
                }
                return {
                    eventType,
                    code,
                };
            })
            .filter((handler): handler is { eventType: string; code: string } => handler !== null);
    }

    function buildInspectionTargets(element: HTMLElement, maxDepth = 5): JsInspectorTargetRequest[] {
        const targets: JsInspectorTargetRequest[] = [];
        let current: HTMLElement | null = element;
        let depth = 0;

        while (current && depth < maxDepth) {
            const selector = getSelector(current);
            const xpath = getXPath(current);
            const relation = depth === 0 ? 'self' : (`ancestor-${depth}` as const);
            const className = typeof current.className === 'string' ? current.className : undefined;

            targets.push({
                selector,
                xpath,
                relation,
                tagName: current.tagName.toLowerCase(),
                id: current.id || undefined,
                className,
                inlineHandlers: collectInlineHandlers(current),
            });

            current = current.parentElement;
            depth += 1;
        }

        return targets;
    }

    function handleHover(e: MouseEvent) {
        const activeTool = state.getActiveTool();
        if (!activeTool) return;
        const target = e.target as HTMLElement;
        if (target === state.hoverOverlay.current || target.closest('#klic-overlay')) return;

        const inspectorAnchor = activeTool === 'jsInspector' ? resolveInspectorAnchor(target) : target;

        const styles = toolStyles[activeTool] || toolStyles.screenshot;

        if (!state.hoverOverlay.current) {
            state.hoverOverlay.current = document.createElement('div');
            state.hoverOverlay.current.id = 'klic-overlay';
            Object.assign(state.hoverOverlay.current.style, {
                position: 'absolute',
                pointerEvents: 'none',
                border: styles.border,
                backgroundColor: styles.bg,
                zIndex: '2147483646',
                transition: 'all 0.1s ease',
                borderRadius: '4px'
            });

            const info = document.createElement('div');
            info.id = 'klic-info';
            Object.assign(info.style, {
                position: 'absolute',
                top: '-28px',
                left: '0',
                background: styles.labelBg,
                color: 'white',
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: '600',
                fontFamily: 'system-ui, sans-serif'
            });
            info.textContent = styles.label;
            state.hoverOverlay.current.appendChild(info);
            document.body.appendChild(state.hoverOverlay.current);
        }

        const rect = inspectorAnchor.getBoundingClientRect();
        Object.assign(state.hoverOverlay.current.style, {
            top: `${rect.top + window.scrollY}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
        });

        const info = state.hoverOverlay.current.querySelector('#klic-info') as HTMLElement;
        info.style.top = rect.top < 40 ? '8px' : '-28px';
        info.style.pointerEvents = 'none';
        info.onpointerdown = null;
        info.onpointermove = null;
        info.onpointerup = null;
        info.onpointercancel = null;
        info.onwheel = null;
        if (activeTool === 'cssScan') {
            jsInspectorInfoEl = null;
            const id = inspectorAnchor.id ? `#${inspectorAnchor.id}` : '';
            const cls = Array.from(inspectorAnchor.classList).slice(0, 2).map(c => `.${c}`).join('');
            info.innerText = `${inspectorAnchor.tagName.toLowerCase()}${id}${cls} (${Math.round(rect.width)}x${Math.round(rect.height)})`;
        } else if (activeTool === 'tailwind') {
            jsInspectorInfoEl = null;
            info.innerText = messages.clickToViewTailwind;
        } else if (activeTool === 'fontAnalyzer') {
            jsInspectorInfoEl = null;
            const style = window.getComputedStyle(target);
            const fontFamily = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            const fontSize = style.fontSize;
            const fontWeight = style.fontWeight;
            info.innerText = `${fontFamily} ${fontWeight} ${fontSize}`;
        } else if (activeTool === 'jsInspector') {
            jsInspectorInfoEl = info;
            if (!escListenerAttached) {
                document.addEventListener('keydown', onInspectorKeyDown, true);
                escListenerAttached = true;
            }
            info.style.pointerEvents = 'auto';
            info.onpointerdown = (event: PointerEvent) => {
                if (state.getActiveTool() !== 'jsInspector') return;
                draggingLabel = true;
                dragPointerId = event.pointerId;
                dragStartY = event.clientY;
                dragStartDepth = jsInspectorDepth;
                dragMoved = false;
                info.setPointerCapture(event.pointerId);
                event.preventDefault();
                event.stopPropagation();
            };
            info.onpointermove = (event: PointerEvent) => {
                if (!draggingLabel || dragPointerId !== event.pointerId) return;
                const delta = depthDeltaFromDrag(event.clientY - dragStartY, JS_INSPECTOR_DEPTH_DEFAULTS.dragStepPx);
                const nextDepth = clampDepth(dragStartDepth + delta, JS_INSPECTOR_DEPTH_DEFAULTS.maxDepth);
                if (nextDepth !== jsInspectorDepth) {
                    jsInspectorDepth = nextDepth;
                    dragMoved = true;
                    void formatJsInspectorLabel().then((label) => {
                        if (state.getActiveTool() === 'jsInspector') {
                            info.innerText = label;
                        }
                    });
                }
                event.preventDefault();
                event.stopPropagation();
            };
            const stopDrag = (event: PointerEvent) => {
                if (!draggingLabel || dragPointerId !== event.pointerId) return;
                draggingLabel = false;
                dragPointerId = null;
                if (dragMoved) {
                    suppressClickUntil = Date.now() + 150;
                }
                dragMoved = false;
                if (info.hasPointerCapture(event.pointerId)) {
                    info.releasePointerCapture(event.pointerId);
                }
                event.preventDefault();
                event.stopPropagation();
            };
            info.onpointerup = stopDrag;
            info.onpointercancel = stopDrag;
            info.onwheel = (event: WheelEvent) => {
                const delta = depthDeltaFromWheel(event.deltaY);
                if (delta === 0) return;
                jsInspectorDepth = clampDepth(jsInspectorDepth + delta, JS_INSPECTOR_DEPTH_DEFAULTS.maxDepth);
                void formatJsInspectorLabel().then((label) => {
                    if (state.getActiveTool() === 'jsInspector') {
                        info.innerText = label;
                    }
                });
            };
            void formatJsInspectorLabel().then((label) => {
                if (state.getActiveTool() === 'jsInspector') {
                    info.innerText = label;
                }
            });
        } else if (activeTool === 'assets') {
            jsInspectorInfoEl = null;
            info.style.pointerEvents = 'none';
            info.onpointerdown = null;
            info.onpointermove = null;
            info.onpointerup = null;
            info.onpointercancel = null;
            info.onwheel = null;
            const tagName = target.tagName.toLowerCase();
            const infoText: string[] = [tagName];
            if (target.id) infoText.push(`#${target.id}`);
            if (target.className) {
                const classes = Array.from(target.classList).slice(0, 2).map(c => `.${c}`);
                if (classes.length > 0) infoText.push(classes.join(''));
            }
            const src = target.getAttribute('src');
            const href = target.getAttribute('href');
            if (src) infoText.push(`${messages.sourcePrefix}: ${src.substring(0, 20)}...`);
            if (href) infoText.push(`${messages.linkPrefix}: ${href.substring(0, 20)}...`);
            info.innerText = infoText.join(' ');
        } else if (activeTool === 'resourceNetwork') {
            jsInspectorInfoEl = null;
            info.style.pointerEvents = 'none';
            info.onpointerdown = null;
            info.onpointermove = null;
            info.onpointerup = null;
            info.onpointercancel = null;
            info.onwheel = null;
            const style = window.getComputedStyle(target);
            const bgImage = style.backgroundImage;
            const hasImg = target.tagName === 'IMG';
            const hasVideo = target.tagName === 'VIDEO';
            const infoText: string[] = [target.tagName.toLowerCase()];
            if (hasImg) infoText.push(`(img)`);
            if (hasVideo) infoText.push(`(video)`);
            if (bgImage && bgImage !== 'none') infoText.push(`(bg-img)`);
            info.innerText = infoText.join(' ');
        } else if (activeTool === 'accessibilityChecker') {
            jsInspectorInfoEl = null;
            info.style.pointerEvents = 'none';
            info.onpointerdown = null;
            info.onpointermove = null;
            info.onpointerup = null;
            info.onpointercancel = null;
            info.onwheel = null;
            const tagName = target.tagName.toLowerCase();
            const infoText: string[] = [tagName];
            const role = target.getAttribute('role');
            const ariaLabel = target.getAttribute('aria-label');
            const alt = target.getAttribute('alt');
            if (role) infoText.push(`role="${role}"`);
            if (ariaLabel) infoText.push(`aria-label`);
            if (alt) infoText.push(`alt="${alt}"`);
            if (!alt && target.tagName === 'IMG') infoText.push(`⚠️ ${messages.missingAlt}`);
            info.innerText = infoText.join(' ');
        } else {
            jsInspectorInfoEl = null;
            info.style.pointerEvents = 'none';
            info.onpointerdown = null;
            info.onpointermove = null;
            info.onpointerup = null;
            info.onpointercancel = null;
            info.onwheel = null;
            info.innerText = styles.label;
        }
    }

    async function handleClick(e: MouseEvent) {
        const activeTool = state.getActiveTool();
        if (!activeTool) return;
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;

        if (activeTool === 'jsInspector' && Date.now() < suppressClickUntil) {
            return;
        }

        if (activeTool === 'screenshot') {
            if (state.hoverOverlay.current) state.hoverOverlay.current.style.display = 'none';
            try {
                state.showToast(await translateMessage('content.capturing', 'Capturing...'), '#F59E0B');

                const rect = target.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                const bounds = {
                    x: Math.max(0, Math.floor(rect.left * dpr)),
                    y: Math.max(0, Math.floor(rect.top * dpr)),
                    width: Math.floor(rect.width * dpr),
                    height: Math.floor(rect.height * dpr)
                };

                let response: { success?: boolean; dataUrl?: string; error?: string };
                try {
                    response = await chrome.runtime.sendMessage({
                        action: 'CAPTURE_ELEMENT',
                        bounds: bounds
                    });
                } catch {
                    throw new Error('Extension context invalidated');
                }

                if (response.success && response.dataUrl) {
                    const link = document.createElement('a');
                    link.download = `klic-screenshot-${Date.now()}.png`;
                    link.href = response.dataUrl;
                    link.click();

                    state.showToast(await translateMessage('content.downloadComplete', 'Download complete!'), '#10B981');

                    // 캡처 후 도구 비활성화
                    state.deactivateTool();
                } else {
                    throw new Error(response.error || 'Capture failed');
                }
            } catch (err) {
                console.error(err);
                state.showToast(await translateMessage('content.captureFailed', 'Capture failed'), '#EF4444');
            }
            if (state.hoverOverlay.current) state.hoverOverlay.current.style.display = 'block';
        }
        else if (activeTool === 'cssScan') {
            const style = window.getComputedStyle(target);
            const props = [
                'font-family', 'font-size', 'font-weight', 'line-height', 'color',
                'background-color', 'padding', 'margin', 'border', 'border-radius',
                'width', 'height', 'display', 'flex-direction', 'align-items', 'justify-content',
                'gap', 'position', 'z-index'
            ];

            let css = `/* ${target.tagName.toLowerCase()} styles */\n`;
            props.forEach(p => {
                const val = style.getPropertyValue(p);
                if (val && val !== '0px' && val !== 'none' && val !== 'auto' && val !== 'normal') {
                    css += `${p}: ${val};\n`;
                }
            });

            await navigator.clipboard.writeText(css);
            state.showToast(await translateMessage('content.cssCopied', 'CSS copied to clipboard'), '#10B981');

            // 리치 데이터 추출 + 사이드 패널 전송
            const cssScanData = extractCssScanData(target);
            safeSendMessage({ action: 'TOOL_DATA', tool: 'cssScan', data: cssScanData });
        }
        else if (activeTool === 'tailwind') {
            const tw = mapToTailwind(target);
            await navigator.clipboard.writeText(tw);
            state.showToast(await translateMessage('content.tailwindCopied', 'Tailwind classes copied!'), '#38BDF8');
        }
        else if (activeTool === 'fontAnalyzer') {
            const style = window.getComputedStyle(target);
            const fontData = {
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
                color: style.color,
                backgroundColor: style.backgroundColor,
                element: {
                    tag: target.tagName.toLowerCase(),
                    id: target.id || undefined,
                    classList: Array.from(target.classList),
                    selector: target.id ? `#${target.id}` : (target.classList[0] ? `.${target.classList[0]}` : target.tagName.toLowerCase())
                }
            };

            // 사이드 패널로 폰트 정보 전송
            safeSendMessage({ action: 'TOOL_DATA', tool: 'fontAnalyzer', data: fontData });
            const fontName = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            state.showToast(
                await translateMessage('content.fontAnalyzed', 'Font analyzed: {{font}}', { font: fontName }),
                '#8B5CF6'
            );
        }
        else if (activeTool === 'jsInspector') {
            try {
                lastJsInspectorClickTarget = target;
                const anchor = resolveInspectorAnchor(target);
                const baseTargets = buildInspectionTargets(anchor, 14);
                const inspectionTargets: JsInspectorTargetRequest[] = [];
                const seenSelectors = new Set<string>();

                const pushUniqueTarget = (item: JsInspectorTargetRequest) => {
                    if (seenSelectors.has(item.selector)) {
                        return;
                    }
                    seenSelectors.add(item.selector);
                    inspectionTargets.push(item);
                };

                if (baseTargets[0]) {
                    pushUniqueTarget(baseTargets[0]);
                }

                const anchorCandidates: HTMLElement[] = [];
                const closestWithId = target.closest('[id]');
                if (closestWithId instanceof HTMLElement) {
                    anchorCandidates.push(closestWithId);
                }

                const sliderLikeAncestor = target.closest('[id*="slider" i], [class*="slider" i], [class*="slick" i]');
                if (sliderLikeAncestor instanceof HTMLElement) {
                    anchorCandidates.push(sliderLikeAncestor);
                }

                for (const anchor of anchorCandidates) {
                    const anchoredTargets = buildInspectionTargets(anchor, 4);
                    for (const anchoredTarget of anchoredTargets) {
                        pushUniqueTarget(anchoredTarget);
                    }
                }

                for (let index = 1; index < baseTargets.length; index += 1) {
                    const baseTarget = baseTargets[index];
                    if (!baseTarget) {
                        continue;
                    }
                    pushUniqueTarget(baseTarget);
                }

                const response = await chrome.runtime.sendMessage({
                    action: MESSAGE_ACTIONS.JS_INSPECT_ELEMENT,
                    data: {
                        targets: inspectionTargets,
                    },
                }) as { success?: boolean; data?: unknown; error?: string };

                if (!response?.success) {
                    throw new Error(response?.error || 'JS inspection failed');
                }

                const selection = buildSelectionState(target);
                safeSendMessage({
                    action: 'TOOL_DATA',
                    tool: 'jsInspector',
                    data: {
                        ...(response.data as Record<string, unknown>),
                        selection,
                    },
                });
                const count = typeof (response.data as { totalListeners?: unknown })?.totalListeners === 'number'
                    ? (response.data as { totalListeners: number }).totalListeners
                    : 0;
                state.showToast(
                    await translateMessage('content.jsInspectorExtracted', '{{count}} handlers extracted', { count }),
                    '#1D4ED8'
                );
            } catch {
                state.showToast(
                    await translateMessage('content.jsInspectorFailed', 'Failed to inspect JavaScript events'),
                    '#EF4444'
                );
            }
        }
        else if (activeTool === 'assets') {
            const assetInfo = {
                tag: target.tagName.toLowerCase(),
                id: target.id || undefined,
                classList: Array.from(target.classList),
                src: target.getAttribute('src') || undefined,
                href: target.getAttribute('href') || undefined,
                alt: target.getAttribute('alt') || undefined,
                title: target.getAttribute('title') || undefined,
                style: {
                    backgroundImage: window.getComputedStyle(target).backgroundImage || undefined,
                    fontSize: window.getComputedStyle(target).fontSize || undefined,
                    fontFamily: window.getComputedStyle(target).fontFamily || undefined
                }
            };
            safeSendMessage({ action: 'TOOL_DATA', tool: 'assets', data: assetInfo });
            state.showToast(
                await translateMessage('content.assetDetected', 'Asset: {{tag}}', { tag: target.tagName.toLowerCase() }),
                '#F59E0B'
            );
        }
        else if (activeTool === 'resourceNetwork') {
            const resourceInfo = {
                tag: target.tagName.toLowerCase(),
                id: target.id || undefined,
                src: target.getAttribute('src') || undefined,
                href: target.getAttribute('href') || undefined,
                type: target.tagName === 'IMG' ? 'image' :
                      target.tagName === 'VIDEO' ? 'video' :
                      target.tagName === 'SCRIPT' ? 'script' :
                      target.tagName === 'LINK' ? 'stylesheet' : 'unknown',
                size: target.getAttribute('src') ? 'unknown' : undefined
            };
            safeSendMessage({ action: 'TOOL_DATA', tool: 'resourceNetwork', data: resourceInfo });
            state.showToast(
                await translateMessage('content.resourceDetected', 'Resource: {{type}}', { type: resourceInfo.type }),
                '#EF4444'
            );
        }
        else if (activeTool === 'accessibilityChecker') {
            const a11yInfo = {
                tag: target.tagName.toLowerCase(),
                id: target.id || undefined,
                classList: Array.from(target.classList),
                role: target.getAttribute('role') || undefined,
                ariaLabel: target.getAttribute('aria-label') || undefined,
                ariaHidden: target.getAttribute('aria-hidden') || undefined,
                alt: target.getAttribute('alt') || undefined,
                title: target.getAttribute('title') || undefined,
                tabIndex: target.getAttribute('tabindex') || undefined,
                hasAlt: target.tagName === 'IMG' ? !!target.getAttribute('alt') : undefined,
                hasAriaLabel: !!target.getAttribute('aria-label'),
                textContent: target.textContent?.trim().substring(0, 50) || undefined
            };
            safeSendMessage({ action: 'TOOL_DATA', tool: 'accessibilityChecker', data: a11yInfo });
            state.showToast(
                await translateMessage('content.accessibilityDetected', 'Accessibility: {{tag}}', { tag: target.tagName.toLowerCase() }),
                '#10B981'
            );
        }
    }

    const ensureJsInspectorDepthControls = () => {
        if (escListenerAttached) {
            return;
        }
        document.addEventListener('keydown', onInspectorKeyDown, true);
        escListenerAttached = true;
    };

    return { handleHover, handleClick, resetJsInspectorDepth, ensureJsInspectorDepthControls };
}
