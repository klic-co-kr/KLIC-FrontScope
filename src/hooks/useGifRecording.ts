// src/hooks/useGifRecording.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { RecordingState, GIFSettings, GIFQuality, CropBounds } from '../types/recording';
import { SCREENSHOT_ACTIONS } from '../constants/screenshotMessages';

const INITIAL_STATE: RecordingState = {
  isRecording: false,
  isEncoding: false,
  isSelecting: false,
  elapsed: 0,
  frameCount: 0,
  encodingProgress: 0,
};

// Map quality to maxColors
const QUALITY_TO_MAX_COLORS: Record<GIFQuality, number> = {
  low: 64,
  medium: 128,
  high: 256,
};

interface UseGifRecordingOptions {
  settings: GIFSettings;
  tabId?: number;
  windowId?: number;
}

export function useGifRecording({ settings, tabId, windowId }: UseGifRecordingOptions) {
  const [state, setState] = useState<RecordingState>(INITIAL_STATE);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Cache tab/window for area selection flow
  const targetRef = useRef<{ tabId: number; windowId: number } | null>(null);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for all GIF-related messages from background/offscreen
  useEffect(() => {
    const handleMessage = (message: { action: string; data?: Record<string, unknown> }) => {
      if (message.action === 'GIF_RECORDING_PROGRESS') {
        setState((prev) => ({
          ...prev,
          elapsed: (message.data?.elapsed as number) ?? prev.elapsed,
          frameCount: (message.data?.frameCount as number) ?? prev.frameCount,
        }));
      }

      if (message.action === 'GIF_AREA_SELECTED') {
        const payload = message.data as unknown as (CropBounds & { viewportWidth?: number });
        const bounds: CropBounds = {
          x: payload.x,
          y: payload.y,
          width: payload.width,
          height: payload.height,
        };
        const pageViewportWidth = typeof payload.viewportWidth === 'number' ? payload.viewportWidth : undefined;
        const currentSettings = settingsRef.current;
        const target = targetRef.current;
        if (!target) return;

        // Clear selection timeout
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
          selectionTimeoutRef.current = null;
        }

        // Calculate output size preserving aspect ratio (C4)
        const aspectRatio = bounds.width / bounds.height;
        const outputWidth = currentSettings.width;
        const outputHeight = Math.round(outputWidth / aspectRatio);

        setState((prev) => ({ ...prev, isSelecting: false, isRecording: true }));
        chrome.runtime.sendMessage({
          action: 'GIF_RECORDING_START',
          config: {
            tabId: target.tabId,
            windowId: target.windowId,
            width: outputWidth,
            height: outputHeight,
            fps: currentSettings.fps,
            maxDuration: currentSettings.duration,
            maxColors: QUALITY_TO_MAX_COLORS[currentSettings.quality],
            qualityProfile: currentSettings.qualityProfile,
            mode: currentSettings.mode,
            cropBounds: bounds,
            viewportWidth: pageViewportWidth ?? window.screen.width,
          },
        });
      }

      if (message.action === 'GIF_SELECTION_CANCEL') {
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
          selectionTimeoutRef.current = null;
        }
        setState((prev) => ({ ...prev, isSelecting: false }));
      }

      // Auto-stop state sync (H5)
      if (message.action === 'GIF_RECORDING_AUTO_STOPPED') {
        setState((prev) => ({ ...prev, isRecording: false, isEncoding: true }));
      }

      // Encoding complete — reset isEncoding
      if (message.action === 'GIF_ENCODE_COMPLETE') {
        setState((prev) => ({ ...prev, isEncoding: false }));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const startRecording = useCallback(async () => {
    // Get current tab and window if not provided
    let targetTabId = tabId;
    let targetWindowId = windowId;

    if (!targetTabId || !targetWindowId) {
      const currentWindow = await chrome.windows.getCurrent();
      const [currentTab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
      if (currentTab) {
        targetTabId = currentTab.id;
        targetWindowId = currentWindow.id;
      }
    }

    if (!targetTabId || !targetWindowId) return;

    const currentSettings = settingsRef.current;
    targetRef.current = { tabId: targetTabId, windowId: targetWindowId };

    try {
      await chrome.tabs.sendMessage(targetTabId, { action: SCREENSHOT_ACTIONS.CANCEL_CAPTURE });
    } catch (error) {
      void error;
    }

    if (currentSettings.mode === 'fullscreen') {
      // Fullscreen mode — start recording directly
      const aspectRatio = 16 / 9;
      const height = Math.round(currentSettings.width / aspectRatio);

      setState((prev) => ({ ...prev, isRecording: true }));
      await chrome.runtime.sendMessage({
        action: 'GIF_RECORDING_START',
        config: {
          tabId: targetTabId,
          windowId: targetWindowId,
          width: currentSettings.width,
          height,
          fps: currentSettings.fps,
          maxDuration: currentSettings.duration,
          maxColors: QUALITY_TO_MAX_COLORS[currentSettings.quality],
          qualityProfile: currentSettings.qualityProfile,
          mode: 'fullscreen',
        },
      });
    } else {
      // Selection/Element mode — ensure content script is ready (C1)
      try {
        await chrome.tabs.sendMessage(targetTabId, { action: 'PING' });
      } catch {
        await chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          files: ['assets/content.js'],
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      setState((prev) => ({ ...prev, isSelecting: true }));

      const action = currentSettings.mode === 'selection' ? 'GIF_SELECT_AREA' : 'GIF_SELECT_ELEMENT';
      chrome.tabs.sendMessage(targetTabId, { action });

      // 60s timeout safety (H1)
      selectionTimeoutRef.current = setTimeout(() => {
        setState((prev) => {
          if (prev.isSelecting) {
            chrome.tabs.sendMessage(targetTabId!, { action: 'GIF_SELECTION_CANCEL' });
            return { ...prev, isSelecting: false };
          }
          return prev;
        });
      }, 60000);
    }
  }, [tabId, windowId]);

  const stopRecording = useCallback(async () => {
    setState((prev) => ({ ...prev, isRecording: false, isEncoding: true }));
    await chrome.runtime.sendMessage({ action: 'GIF_RECORDING_STOP' });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    isEncoding: state.isEncoding,
  };
}
