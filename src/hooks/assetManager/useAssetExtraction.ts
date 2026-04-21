/**
 * Asset Extraction Hook
 * Manages asset extraction process
 */

import { useState, useCallback } from 'react';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import type { ImageAsset, AssetCollection, AssetManagerSettings } from '../../types/assetManager';

export interface ExtractionState {
  extracting: boolean;
  progress: number;
  currentCollection: AssetCollection | null;
  error: string | null;
}

export function useAssetExtraction() {
  const [state, setState] = useState<ExtractionState>({
    extracting: false,
    progress: 0,
    currentCollection: null,
    error: null,
  });

  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Extract assets from the current page
  const extractAssets = useCallback(async (settings: AssetManagerSettings) => {
    try {
      setState({ extracting: true, progress: 0, currentCollection: null, error: null });

      // Send message to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Check if tab can be accessed (chrome://, edge://, etc. cannot)
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        throw new Error('This page does not support content scripts');
      }

      // Check if content script is loaded
      let contentScriptLoaded = false;
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
        contentScriptLoaded = true;
      } catch {
        // Content script not loaded, try to inject it
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['assets/content.js'],
          });
          // Wait for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 200));
          contentScriptLoaded = true;
        } catch (injectError) {
          console.error('Failed to inject content script:', injectError);
          throw new Error('Cannot access this page. Please try navigating to a regular website.');
        }
      }

      if (!contentScriptLoaded) {
        throw new Error('Content script failed to load');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: MESSAGE_ACTIONS.ASSET_EXTRACT,
        data: settings,
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to extract assets');
      }

      setState({
        extracting: false,
        progress: 100,
        currentCollection: response.data,
        error: null,
      });

      return response.data as AssetCollection;
    } catch (error) {
      setState({
        extracting: false,
        progress: 0,
        currentCollection: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, []);

  // Toggle asset selection
  const toggleAsset = useCallback((assetId: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  }, []);

  // Select all assets
  const selectAll = useCallback((assets: ImageAsset[]) => {
    setSelectedAssets(new Set(assets.map((a) => a.id)));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedAssets(new Set());
  }, []);

  // Get selected assets
  const getSelectedAssets = useCallback(
    (assets: ImageAsset[]): ImageAsset[] => {
      return assets.filter((a) => selectedAssets.has(a.id));
    },
    [selectedAssets]
  );

  // Download selected assets
  const downloadSelected = useCallback(
    async (assets: ImageAsset[], format: 'original' | 'zip') => {
      const selected = getSelectedAssets(assets);

      if (selected.length === 0) {
        throw new Error('No assets selected');
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Check if content script is loaded
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
      } catch {
        throw new Error('Content script not loaded. Please refresh the page.');
      }

      const action =
        format === 'zip'
          ? MESSAGE_ACTIONS.ASSET_DOWNLOAD_ZIP
          : MESSAGE_ACTIONS.ASSET_DOWNLOAD_ALL;

      await chrome.tabs.sendMessage(tab.id, {
        action,
        data: { assets: selected },
      });
    },
    [getSelectedAssets]
  );

  // Copy selected to clipboard
  const copyToClipboard = useCallback(async (assets: ImageAsset[]) => {
    const selected = getSelectedAssets(assets);

    if (selected.length === 0) {
      throw new Error('No assets selected');
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('No active tab found');
    }

    // Check if content script is loaded
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
    } catch {
      throw new Error('Content script not loaded. Please refresh the page.');
    }

    await chrome.tabs.sendMessage(tab.id, {
      action: MESSAGE_ACTIONS.ASSET_COPY_CLIPBOARD,
      data: { assets: selected },
    });
  }, [getSelectedAssets]);

  return {
    ...state,
    selectedAssets,
    extractAssets,
    toggleAsset,
    selectAll,
    clearSelection,
    getSelectedAssets,
    downloadSelected,
    copyToClipboard,
  };
}
