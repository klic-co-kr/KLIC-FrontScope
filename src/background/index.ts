/// <reference types="chrome" />

import { STORAGE_KEYS } from '../constants/storage';
import { MESSAGE_ACTIONS, MODAL_ACTIONS } from '@/constants/messages';
import { normalizeShortcutCombo } from '../utils/shortcuts/shortcutValidation';
import { startRecording, stopRecording, isRecording, isEncodingInProgress, setupEncodeCompleteListener } from './recording';
import { getJsInspectorErrorMessage, inspectElementScripts } from './jsInspector';

// Initialize GIF encoding completion listener (fire-and-forget pattern)
setupEncodeCompleteListener();

async function deactivateToolInWindow(windowId: number): Promise<void> {
    const [targetTab] = await chrome.tabs.query({ active: true, windowId });
    if (!targetTab?.id) return;

    await chrome.tabs.sendMessage(targetTab.id, {
        action: 'TOGGLE_TOOL',
        active: false,
    }).catch(() => undefined);
}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'sidepanel-session') return;

    let windowId: number | null = null;

    port.onMessage.addListener((message) => {
        if (typeof message?.windowId === 'number') {
            windowId = message.windowId;
        }
    });

    port.onDisconnect.addListener(() => {
        if (windowId === null) return;
        void deactivateToolInWindow(windowId);
    });
});

type ShortcutToolId =
    | 'textEdit'
    | 'screenshot'
    | 'cssScan'
    | 'fontAnalyzer'
    | 'palette'
    | 'colorPicker'
    | 'ruler'
    | 'assets'
    | 'console'
    | 'tailwind'
    | 'jsInspector'
    | 'gridLayout'
    | 'resourceNetwork'
    | 'accessibilityChecker';

const SHORTCUT_TOOL_IDS: readonly ShortcutToolId[] = [
    'textEdit',
    'screenshot',
    'cssScan',
    'fontAnalyzer',
    'palette',
    'colorPicker',
    'ruler',
    'assets',
    'console',
    'tailwind',
    'jsInspector',
    'gridLayout',
    'resourceNetwork',
    'accessibilityChecker',
];

function isContextMenuToolId(value: string): value is ShortcutToolId {
    return SHORTCUT_TOOL_IDS.includes(value as ShortcutToolId);
}

async function activateToolInTab(tabId: number, toolId: ShortcutToolId): Promise<boolean> {
    const response = await chrome.tabs.sendMessage(tabId, {
        action: 'TOGGLE_TOOL',
        tool: toolId,
        active: true,
    }).catch(() => null);

    return response?.success === true;
}

async function openContextMenuTool(tab: chrome.tabs.Tab, toolId: ShortcutToolId): Promise<void> {
    if (!tab.id || !tab.windowId) {
        return;
    }

    if (!tab.url || isRestrictedUrl(tab.url)) {
        await setModalFallbackSignal(tab.id, toolId, 'restricted-url');
        await chrome.sidePanel.open({
            tabId: tab.id,
            windowId: tab.windowId,
        }).catch(() => undefined);
        return;
    }

    const contentReady = await ensureContentScriptInjected(tab.id);
    if (!contentReady) {
        await setModalFallbackSignal(tab.id, toolId, 'content-script-injection-failed');
        await chrome.sidePanel.open({
            tabId: tab.id,
            windowId: tab.windowId,
        }).catch(() => undefined);
        return;
    }

    const toolActivated = await activateToolInTab(tab.id, toolId);
    if (!toolActivated) {
        await setModalFallbackSignal(tab.id, toolId, 'modal-not-supported');
        await chrome.sidePanel.open({
            tabId: tab.id,
            windowId: tab.windowId,
        }).catch(() => undefined);
        return;
    }

    const modalResponse = await chrome.tabs.sendMessage(tab.id, {
        action: MODAL_ACTIONS.OPEN_CONTEXT_MENU_MODAL,
        tool: toolId,
        tabId: tab.id,
        nonce: generateModalNonce(),
    }).catch(() => null);

    if (!modalResponse?.success || modalResponse.opened !== true) {
        const fallbackReason = modalResponse?.error === 'open-failed'
            ? 'modal-rejected'
            : 'fallback-open-failed';
        await setModalFallbackSignal(tab.id, toolId, fallbackReason);
        await chrome.sidePanel.open({
            tabId: tab.id,
            windowId: tab.windowId,
        }).catch(() => undefined);
    }
}


const SHORTCUT_COMMAND_TO_COMBO = {
    'tool-shortcut-slot-e': 'Ctrl+Shift+E',
    'tool-shortcut-slot-s': 'Ctrl+Shift+S',
    'tool-shortcut-slot-c': 'Ctrl+Shift+C',
    'tool-shortcut-slot-i': 'Ctrl+Shift+I',
    'tool-shortcut-slot-r': 'Ctrl+Shift+R',
    'tool-shortcut-slot-g': 'Ctrl+Shift+G',
    'tool-shortcut-slot-a': 'Ctrl+Shift+A',
} as const;

const DEACTIVATE_SHORTCUT_COMMAND = 'shortcut-deactivate-active-tool' as const;

type ShortcutCommandName = keyof typeof SHORTCUT_COMMAND_TO_COMBO;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isShortcutCommand(command: string): command is ShortcutCommandName {
    return Object.prototype.hasOwnProperty.call(SHORTCUT_COMMAND_TO_COMBO, command);
}

function isRestrictedUrl(url?: string): boolean {
    if (!url) return false;
    return (
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        url.startsWith('moz-extension://') ||
        url.startsWith('extension://')
    );
}

function generateModalNonce(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function setModalFallbackSignal(
    tabId: number,
    toolId: ShortcutToolId,
    reason: 'restricted-url' | 'content-script-injection-failed' | 'modal-not-supported' | 'modal-rejected' | 'fallback-open-failed'
): Promise<void> {
    try {
        if (!chrome.storage?.session?.set) {
            return;
        }

        await chrome.storage.session.set({
            'modal:lastFallback': {
                tabId,
                toolId,
                reason,
                ts: Date.now(),
            },
        });
    } catch {
        // Ignore fallback telemetry write failures.
    }
}

async function pingContentScript(tabId: number): Promise<boolean> {
    try {
        const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
        return response?.success === true;
    } catch {
        return false;
    }
}

async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
    if (await pingContentScript(tabId)) {
        return true;
    }

    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab || tab.status !== 'complete') {
        return false;
    }

    try {
        await chrome.scripting.executeScript({
            target: { tabId, allFrames: false },
            files: ['assets/content.js'],
        });
    } catch {
        return false;
    }

    let retries = 4;
    while (retries > 0) {
        if (await pingContentScript(tabId)) {
            return true;
        }

        retries -= 1;
        if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 120));
        }
    }

    return false;
}

async function getActiveToolInTab(tabId: number): Promise<ShortcutToolId | null> {
    try {
        const response = await chrome.tabs.sendMessage(tabId, { action: 'GET_ACTIVE_TOOL' });
        const activeTool = response?.tool;

        if (typeof activeTool !== 'string') {
            return null;
        }

        return SHORTCUT_TOOL_IDS.includes(activeTool as ShortcutToolId)
            ? (activeTool as ShortcutToolId)
            : null;
    } catch {
        return null;
    }
}

async function resolveToolForShortcutCommand(command: ShortcutCommandName): Promise<ShortcutToolId | null> {
    const commandCombo = normalizeShortcutCombo(SHORTCUT_COMMAND_TO_COMBO[command]);

    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.SHORTCUTS_DATA);
        const rawStoredData = result[STORAGE_KEYS.SHORTCUTS_DATA];

        if (isRecord(rawStoredData) && isRecord(rawStoredData.tools)) {
            for (const toolId of SHORTCUT_TOOL_IDS) {
                const rawShortcut = rawStoredData.tools[toolId];
                if (typeof rawShortcut !== 'string' || rawShortcut.trim().length === 0) {
                    continue;
                }

                if (normalizeShortcutCombo(rawShortcut) === commandCombo) {
                    return toolId;
                }
            }
        }
    } catch (error) {
        console.warn('Failed to resolve shortcut command from storage:', error);
    }

    return null;
}

async function handleToolShortcutCommand(command: string): Promise<void> {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!activeTab?.id || isRestrictedUrl(activeTab.url)) {
            return;
        }

        const tabId = activeTab.id;
        const contentReady = await ensureContentScriptInjected(tabId);
        if (!contentReady) {
            return;
        }

        if (command === DEACTIVATE_SHORTCUT_COMMAND) {
            await chrome.tabs.sendMessage(tabId, {
                action: 'TOGGLE_TOOL',
                active: false,
            }).catch(() => null);
            return;
        }

        if (!isShortcutCommand(command)) {
            return;
        }

        const toolId = await resolveToolForShortcutCommand(command);
        if (!toolId) {
            return;
        }

        const currentTool = await getActiveToolInTab(tabId);
        const shouldActivate = currentTool !== toolId;

        const response = await chrome.tabs.sendMessage(tabId, {
            action: 'TOGGLE_TOOL',
            tool: toolId,
            active: shouldActivate,
        }).catch(() => null);

        if (!response?.success) {
            return;
        }

        if (shouldActivate) {
            await chrome.sidePanel.open({ tabId }).catch(() => undefined);
        }
    } catch (error) {
        console.error('Failed to handle shortcut command:', error);
    }
}

if (chrome.commands?.onCommand) {
    chrome.commands.onCommand.addListener((command) => {
        if (command !== DEACTIVATE_SHORTCUT_COMMAND && !isShortcutCommand(command)) {
            return;
        }

        void handleToolShortcutCommand(command);
    });
}

// --- i18n Initialization ---
// Sync language from storage to Chrome i18n
async function initI18n() {
  try {
    const result = await chrome.storage.local.get('app:language');
    const savedLang = result['app:language'];

    // Chrome i18n uses UI language by default, we can't change it dynamically
    // But we ensure our storage is consistent
    if (!savedLang) {
      const uiLang = chrome.i18n.getUILanguage();
      const defaultLang = uiLang.startsWith('ko') ? 'ko' : 'en';
      await chrome.storage.local.set({ 'app:language': defaultLang });
    }
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }
}

// --- Kill Switch & Update Check Configuration ---
const CHECK_URL = "https://gist.githubusercontent.com/kyunghwanchoi747/24ca3a1f5e2edfc71ab54b8b8732a38d/raw/28f7b86f3323ab132b840908df7d000018e4448e/gistfile1.txt";

// Update check interval (in minutes) - Default 60 minutes
const CHECK_ALARM_NAME = 'check_update_status';
const CHECK_INTERVAL_MINUTES = 60;

// Set up alarm
chrome.alarms.create(CHECK_ALARM_NAME, { periodInMinutes: CHECK_INTERVAL_MINUTES });

// Initialize i18n
initI18n();

function setupContextMenus(): void {
    // Use removeAll first to prevent duplicate errors during development reloads
    chrome.contextMenus.removeAll(() => {
        // Parent Menu
        chrome.contextMenus.create({
            id: "klic-tools-parent",
            title: chrome.i18n.getMessage("manifest_name"),
            contexts: ["all"]
        });

        // Tool Menus - use chrome.i18n.getMessage for localization
        const TOOLS = [
            { id: 'textEdit', messageKey: 'tools_textEdit_name', emoji: '✏️' },
            { id: 'screenshot', messageKey: 'tools_screenshot_name', emoji: '📸' },
            { id: 'cssScan', messageKey: 'tools_cssScan_name', emoji: '🔍' },
            { id: 'fontAnalyzer', messageKey: 'tools_fontAnalyzer_name', emoji: '🔤' },
            { id: 'palette', messageKey: 'tools_palette_name', emoji: '🎨' },
            { id: 'colorPicker', messageKey: 'tools_colorPicker_name', emoji: '🎯' },
            { id: 'ruler', messageKey: 'tools_ruler_name', emoji: '📏' },
            { id: 'assets', messageKey: 'tools_assets_name', emoji: '🖼️' },
            { id: 'console', messageKey: 'tools_console_name', emoji: '💻' },
            { id: 'tailwind', messageKey: 'tools_tailwind_name', emoji: '🌊' },
            { id: 'jsInspector', messageKey: 'tools_jsInspector_name', emoji: '🧠' },
            { id: 'gridLayout', messageKey: 'tools_gridLayout_name', emoji: '📐' },
            { id: 'resourceNetwork', messageKey: 'tools_resourceNetwork_name', emoji: '📊' },
            { id: 'accessibilityChecker', messageKey: 'tools_accessibilityChecker_name', emoji: '♿' },
        ];

        TOOLS.forEach(tool => {
            chrome.contextMenus.create({
                id: `tool-${tool.id}`,
                parentId: "klic-tools-parent",
                title: `${tool.emoji} ${chrome.i18n.getMessage(tool.messageKey) || tool.id}`,
                contexts: ["all"]
            });
        });

        // Copy Selection Menu (Existing feature)
        chrome.contextMenus.create({
            id: "klic-copy-selection",
            title: `📋 ${chrome.i18n.getMessage("context_copySelection")}`,
            contexts: ["selection"]
        });
    });
}

// Check status on alarm or startup
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CHECK_ALARM_NAME) {
        checkStatus();
    }
});

chrome.runtime.onStartup.addListener(() => {
    checkStatus();
    setupContextMenus();
});

chrome.runtime.onInstalled.addListener(() => {
    checkStatus();

    // Enable Side Panel on standard click
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error("Failed to set panel behavior:", error));

    setupContextMenus();
});

setupContextMenus();

chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Validate tab ID is positive before using it
    if (!tab?.id || tab.id < 0) return;

    // Check if tab URL is a restricted system page (chrome://, edge://, about:, etc.)
    if (tab.url && (
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('moz-extension://') ||
        tab.url.startsWith('extension://')
    )) {
        // Cannot inject scripts into system pages.
        if (chrome.notifications?.create) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icon-128.png'),
                title: 'KLIC-FrontScope',
                message: 'This page cannot be analyzed. Please try on a regular webpage.',
                priority: 2
            });
        } else {
            console.warn('KLIC-FrontScope: notifications permission not available for restricted page');
        }
        return;
    }

    if (info.menuItemId === "klic-copy-selection" && info.selectionText) {
        const text = info.selectionText;
        const url = tab.url || "";
        const title = tab.title || "";

        // Format as markdown quote with source
        const markdown = `> ${text}\n\n---\n[출처]: ${url} (${title})\n[정리]: KLIC-FrontScope`;

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (content) => {
                navigator.clipboard.writeText(content).then(() => {
                    console.log("KLIC-FrontScope: Copied to clipboard");
                });
            },
            args: [markdown]
        });
    } else if (typeof info.menuItemId === "string" && info.menuItemId.startsWith("tool-")) {
        const toolId = info.menuItemId.replace("tool-", "");

        if (!isContextMenuToolId(toolId)) {
            return;
        }

        void openContextMenuTool(tab, toolId);
    }
});

interface ServerAppStatus {
    status: string;
    minVersion?: string;
    message?: string;
    link?: string;
}

interface StoredAppStatus {
    active: boolean;
    updateRequired: boolean;
    message: string;
    link: string;
}

async function checkStatus() {
    try {
        const response = await fetch(CHECK_URL);
        const data: ServerAppStatus = await response.json();

        const manifest = chrome.runtime.getManifest();
        const currentVersion = manifest.version;

        const isKillSwitchActive = data.status === 'disabled';
        const isUpdateRequired = isNewerVersion(currentVersion, data.minVersion);

        await chrome.storage.local.set({
            appStatus: {
                active: isKillSwitchActive,
                updateRequired: isUpdateRequired,
                message: data.message || "A new version is available.",
                link: data.link || "https://notebooklm.google.com/"
            }
        });

        if (isKillSwitchActive || isUpdateRequired) {
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        } else {
            // If everything is fine, clear the badge (unless we have collected links)
            chrome.storage.local.get(['collectedLinks'], (result) => {
                const links = result.collectedLinks as string[] | undefined;
                const count = links ? links.length : 0;
                if (count > 0) {
                    chrome.action.setBadgeText({ text: count.toString() });
                    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Or green/blue? Original says Red.
                } else {
                    chrome.action.setBadgeText({ text: '' });
                }
            });
        }

    } catch (error) {
        console.error("Status check failed:", error);
    }
}

// Version comparison utility
function isNewerVersion(current: string, target?: string): boolean {
    if (!target) return false;
    const c = current.split('.').map(Number);
    const t = target.split('.').map(Number);
    for (let i = 0; i < Math.max(c.length, t.length); i++) {
        const cv = c[i] || 0;
        const tv = t[i] || 0;
        if (cv < tv) return true;
        if (cv > tv) return false;
    }
    return false;
}

// Respond to popup status request
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "getAppStatus") {
        chrome.storage.local.get(['appStatus'], (result) => {
            sendResponse(result.appStatus);
        });
        return true;
    }

    if (request.action === 'CONSOLE_INJECT_MAIN_WORLD') {
        const tabId = _sender.tab?.id;
        if (!tabId) {
            sendResponse({ success: false, error: 'No active tab context' });
            return true;
        }

        chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            files: ['console-spy-main-world.js'],
        })
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: (error as Error).message }));

        return true;
    }

    if (request.action === MESSAGE_ACTIONS.JS_INSPECT_ELEMENT) {
        const tabId = _sender.tab?.id;
        if (!tabId) {
            sendResponse({ success: false, error: 'No active tab context' });
            return true;
        }

        inspectElementScripts(tabId, request.data?.targets)
            .then((result) => sendResponse({ success: true, data: result }))
            .catch((error) => sendResponse({ success: false, error: getJsInspectorErrorMessage(error) }));

        return true;
    }

    // Screenshot capture using chrome.tabs.captureVisibleTab
    if (request.action === "CAPTURE_VISIBLE_TAB") {
        const tabId = _sender.tab?.id;
        if (!tabId) {
            sendResponse({ success: false, error: "No tab ID" });
            return true;
        }

        chrome.tabs.get(tabId, (tab) => {
            const windowId = tab?.windowId;
            chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    sendResponse({ success: true, dataUrl });
                }
            });
        });
        return true;
    }

    // Capture element (viewport crop) - capture in background, crop in content
    if (request.action === "CAPTURE_ELEMENT") {
        const { bounds } = request;
        // Use sender.tab.id (from content script) or request.tabId (from side panel)
        const tabId = _sender.tab?.id ?? request.tabId;

        // Validate tab ID
        if (typeof tabId !== 'number' || tabId < 0) {
            sendResponse({ success: false, error: "Invalid tab ID" });
            return true;
        }

        // Capture screenshot in background (has chrome.tabs API access)
        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Tab not found" });
                return;
            }
            chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Failed to capture" });
                    return;
                }
                // Send screenshot + bounds to content script for cropping
                chrome.tabs.sendMessage(tabId, {
                    action: 'CROP_AND_CAPTURE',
                    bounds: bounds,
                    dataUrl: dataUrl
                }, (cropResponse) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse(cropResponse || { success: false, error: "No crop response" });
                    }
                });
            });
        });
        return true;
    }

    // Full page capture (scrolling method)
    if (request.action === "CAPTURE_FULL_PAGE") {
        const { tabId, scrollPositions } = request;

        // Validate tab ID
        if (typeof tabId !== 'number' || tabId < 0) {
            sendResponse({ success: false, error: "Invalid tab ID" });
            return true;
        }

        if (!Array.isArray(scrollPositions) || scrollPositions.length === 0) {
            sendResponse({ success: false, error: "Invalid scroll positions" });
            return true;
        }

        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Tab not found" });
                return;
            }

            const targetWindowId = typeof request.windowId === 'number' ? request.windowId : tab.windowId;
            const captures: string[] = [];
            let currentIndex = 0;

            const captureNext = () => {
                if (currentIndex >= scrollPositions.length) {
                    sendResponse({ success: true, captures });
                    return;
                }

                const currentPosition = scrollPositions[currentIndex];
                if (typeof currentPosition?.x !== 'number' || typeof currentPosition?.y !== 'number') {
                    sendResponse({ success: false, error: "Invalid scroll position payload" });
                    return;
                }

                chrome.tabs.sendMessage(tabId, {
                    action: 'SCROLL_TO',
                    x: currentPosition.x,
                    y: currentPosition.y,
                }, () => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                        return;
                    }

                    setTimeout(() => {
                        chrome.tabs.captureVisibleTab(targetWindowId, { format: 'png' }, (dataUrl) => {
                            if (chrome.runtime.lastError || !dataUrl) {
                                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Failed to capture viewport" });
                                return;
                            }

                            captures.push(dataUrl);
                            currentIndex += 1;
                            captureNext();
                        });
                    }, 120);
                });
            };

            captureNext();
        });

        return true;
    }

    // GIF Recording
    if (request.action === 'GIF_RECORDING_START') {
        startRecording(request.config)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
        return true;
    }

    if (request.action === 'GIF_RECORDING_STOP') {
        stopRecording()
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
        return true;
    }

    if (request.action === 'GIF_RECORDING_STATUS') {
        sendResponse({
            success: true,
            isRecording: isRecording(),
            isEncoding: isEncodingInProgress(),
        });
        return true;
    }
});


// Update badge on stored links change
chrome.storage.onChanged.addListener((changes) => {
    if (changes.collectedLinks) {
        const newValue = changes.collectedLinks.newValue as string[] | undefined;
        const count = newValue ? newValue.length : 0;

        // Update badge only if kill switch is NOT active
        chrome.storage.local.get(['appStatus'], (res) => {
            const status = res.appStatus as StoredAppStatus | undefined;
            if (!status || (!status.active && !status.updateRequired)) {
                if (count > 0) {
                    chrome.action.setBadgeText({ text: count.toString() });
                    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
                } else {
                    chrome.action.setBadgeText({ text: '' });
                }
            }
        });
    }
});
