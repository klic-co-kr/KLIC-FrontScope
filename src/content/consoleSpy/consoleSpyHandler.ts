/// <reference types="chrome" />

import { MESSAGE_ACTIONS } from '@/constants/messages';
import { safeSendMessage } from '../utils/safeMessage';
import { t as translate } from '../../i18n/core';

type ConsoleSpyMessage = {
  type?: string;
  level?: string;
  content?: string;
  args?: unknown[];
  timestamp?: number;
};

const PAGE_EVENT_TYPE = 'KLIC_CONSOLE_LOG';
const DATA_ATTR_INSTALLED = 'data-klic-console-spy-installed';
const DATA_ATTR_ENABLED = 'data-klic-console-spy-enabled';
const COMMAND_EVENT_NAME = 'klic-console-spy-command';

let spyEnabled = false;
let windowListenerAttached = false;

async function translateMessage(key: string, fallback: string): Promise<string> {
  try {
    const value = await translate(key);
    return value && value !== key ? value : fallback;
  } catch {
    return fallback;
  }
}

const onWindowMessage = (event: MessageEvent<ConsoleSpyMessage>) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  if (event.data?.type !== PAGE_EVENT_TYPE) return;

  safeSendMessage({
    action: MESSAGE_ACTIONS.CONSOLE_LOG,
    level: event.data.level,
    content: event.data.content,
    args: event.data.args,
    timestamp: event.data.timestamp,
  });
};

async function waitForDataAttribute(
  attribute: string,
  expectedValue: string,
  timeoutMs = 240
): Promise<boolean> {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    if (document.documentElement.getAttribute(attribute) === expectedValue) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 24));
  }

  return document.documentElement.getAttribute(attribute) === expectedValue;
}

async function requestMainWorldInjection(): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'CONSOLE_INJECT_MAIN_WORLD' }) as {
      success?: boolean;
    };

    return Boolean(response?.success);
  } catch {
    return false;
  }
}

async function ensureSpyScriptInjected(): Promise<boolean> {
  if (document.documentElement.getAttribute(DATA_ATTR_INSTALLED) === '1') {
    return true;
  }

  const fallbackInstalled = await requestMainWorldInjection();
  if (!fallbackInstalled) return false;

  return waitForDataAttribute(DATA_ATTR_INSTALLED, '1', 420);
}

async function runPageCommand(command: 'enable' | 'disable'): Promise<boolean> {
  document.dispatchEvent(
    new CustomEvent(COMMAND_EVENT_NAME, {
      detail: { command },
    })
  );

  const expected = command === 'enable' ? '1' : '0';
  return waitForDataAttribute(DATA_ATTR_ENABLED, expected);
}

export async function enableConsoleSpy(showToast: (message: string, color?: string) => void): Promise<boolean> {
  if (spyEnabled) return true;

  const initialized = await ensureSpyScriptInjected();
  if (!initialized) {
    showToast(
      await translateMessage('content.consoleSpyEnableFailed', 'Unable to start console capture'),
      '#EF4444'
    );
    return false;
  }

  if (!windowListenerAttached) {
    window.addEventListener('message', onWindowMessage);
    windowListenerAttached = true;
  }

  const enabled = await runPageCommand('enable');
  if (!enabled) {
    if (windowListenerAttached) {
      window.removeEventListener('message', onWindowMessage);
      windowListenerAttached = false;
    }
    spyEnabled = false;
    showToast(
      await translateMessage('content.consoleSpyEnableFailed', 'Unable to start console capture'),
      '#EF4444'
    );
    return false;
  }

  spyEnabled = true;
  showToast(await translateMessage('content.consoleSpyEnabled', 'Console capture enabled'), '#2563EB');
  return true;
}

export async function disableConsoleSpy(showToast?: (message: string, color?: string) => void): Promise<void> {
  if (!spyEnabled && !windowListenerAttached) return;

  await runPageCommand('disable');
  spyEnabled = false;

  if (windowListenerAttached) {
    window.removeEventListener('message', onWindowMessage);
    windowListenerAttached = false;
  }

  if (showToast) {
    showToast(await translateMessage('content.consoleSpyDisabled', 'Console capture disabled'), '#6B7280');
  }
}

export function isConsoleSpyEnabled(): boolean {
  return spyEnabled;
}
