type ActiveTabMessage = {
  action: string;
  data?: unknown;
  [key: string]: unknown;
};

const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:',
  'moz-extension://',
];

function isRestrictedUrl(url?: string): boolean {
  if (!url) {
    return false;
  }

  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export async function resolveActiveTabId(): Promise<number | null> {
  if (typeof chrome === 'undefined' || !chrome.windows || !chrome.tabs) {
    return null;
  }

  const currentWindow = await chrome.windows.getCurrent();
  const [targetTab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
  return typeof targetTab?.id === 'number' ? targetTab.id : null;
}

export async function sendMessageToActiveTab<T>(message: ActiveTabMessage): Promise<T> {
  const tabId = await resolveActiveTabId();
  if (!tabId) {
    throw new Error('No active tab found');
  }

  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) {
    throw new Error('Active tab is not available');
  }

  if (isRestrictedUrl(tab.url)) {
    throw new Error('Restricted page: cannot access this data');
  }

  const trySend = async () => {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response as T;
  };

  try {
    return await trySend();
  } catch {
    if (tab.status !== 'complete' || !chrome.scripting) {
      throw new Error('Content script not ready');
    }

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['assets/content.js'],
    });

    return await trySend();
  }
}
