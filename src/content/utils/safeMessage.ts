/**
 * Safe Chrome runtime messaging utilities
 *
 * Prevents "Extension context invalidated" errors when the extension
 * is reloaded while content scripts are still running on pages.
 */

export function isContextValid(): boolean {
    try {
        return !!chrome.runtime?.id;
    } catch {
        return false;
    }
}

export function safeSendMessage(message: unknown): void {
    try {
        if (isContextValid()) {
            chrome.runtime.sendMessage(message);
        }
    } catch {
        // Extension context invalidated — ignore silently
    }
}

export function safeSendMessageWithCallback(
    message: unknown,
    callback: (response: unknown) => void
): void {
    try {
        if (isContextValid()) {
            chrome.runtime.sendMessage(message, callback);
        }
    } catch {
        // Extension context invalidated — ignore silently
    }
}
