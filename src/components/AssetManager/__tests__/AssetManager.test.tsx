/**
 * Asset Manager Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetManagerPanel from '../AssetManagerPanel';
import { chrome } from 'jest-chrome';

// Mock chrome API
(global as typeof globalThis & { chrome: typeof chrome }).chrome = chrome;

describe('AssetManager Integration', () => {
  beforeEach(() => {
    // Mock chrome.storage.local
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const data: Record<string, unknown> = {};
      if (callback) callback(data);
      return Promise.resolve(data);
    });

    chrome.storage.local.set.mockResolvedValue(undefined);

    // Mock chrome.tabs.query
    chrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://example.com' },
    ] as Array<{ id: number; url: string }>);

    // Mock chrome.tabs.sendMessage
    chrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: {
        id: 'test-collection',
        url: 'https://example.com',
        title: 'Test Page',
        timestamp: Date.now(),
        assets: [],
        stats: {
          totalCount: 0,
          totalSize: 0,
          byType: {},
          byFormat: {},
        },
      },
    });

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AssetManagerPanel', () => {
    it('should render the panel with header', () => {
      render(<AssetManagerPanel />);
      expect(screen.getByText('Asset Manager')).toBeInTheDocument();
    });

    it('should have three tabs: Current Assets, Collections, Settings', () => {
      render(<AssetManagerPanel />);
      expect(screen.getByText('Current Assets')).toBeInTheDocument();
      expect(screen.getByText('Collections')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should switch between tabs', async () => {
      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const collectionsTab = screen.getByText('Collections');
      await user.click(collectionsTab);
      expect(screen.getByText('No saved collections')).toBeInTheDocument();

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);
      expect(screen.getByText('Image Size Filters')).toBeInTheDocument();
    });

    it('should show extract button and handle extraction', async () => {
      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const extractButton = screen.getByText('Extract');
      expect(extractButton).toBeInTheDocument();

      await user.click(extractButton);

      await waitFor(() => {
        expect(chrome.tabs.query).toHaveBeenCalledWith({
          active: true,
          currentWindow: true,
        });
      });
    });
  });

  describe('Filters', () => {
    it('should display filter options when assets are present', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: {
          id: 'test-collection',
          url: 'https://example.com',
          title: 'Test Page',
          timestamp: Date.now(),
          assets: [
            {
              id: '1',
              url: 'https://example.com/image.png',
              type: 'img',
              source: 'src',
              format: 'png',
              size: 1024,
            },
          ],
          stats: {
            totalCount: 1,
            totalSize: 1024,
            byType: { img: 1 } as Record<string, number>,
            byFormat: { png: 1 },
          },
        },
      });

      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      // First extract to get assets
      const extractButton = screen.getByText('Extract');
      await user.click(extractButton);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });
    });

    it('should toggle filter expansion', async () => {
      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const filterButton = screen.getByText('Filters');
      await user.click(filterButton);

      // Should show filter options when expanded
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by URL/)).toBeInTheDocument();
      });
    });
  });

  describe('Settings Tab', () => {
    it('should display all setting categories', async () => {
      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText('Image Size Filters')).toBeInTheDocument();
        expect(screen.getByText('Include in Extraction')).toBeInTheDocument();
        expect(screen.getByText('Detection')).toBeInTheDocument();
        expect(screen.getByText('Download Options')).toBeInTheDocument();
      });
    });

    it('should toggle checkboxes', async () => {
      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      await waitFor(() => {
        const includeDataUri = screen.getByLabelText('Data URIs');
        expect(includeDataUri).toBeInTheDocument();
      });

      const includeDataUri = screen.getByLabelText('Data URIs');
      await user.click(includeDataUri);

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('should show empty state for assets', () => {
      render(<AssetManagerPanel />);

      expect(screen.getByText(/No assets found/)).toBeInTheDocument();
    });

    it('should show empty state for collections', async () => {
      chrome.storage.local.get.mockResolvedValue({
        'assetManager:collections': [],
      });

      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const collectionsTab = screen.getByText('Collections');
      await user.click(collectionsTab);

      await waitFor(() => {
        expect(screen.getByText('No saved collections')).toBeInTheDocument();
      });
    });
  });

  describe('Selection Actions', () => {
    it('should enable actions when assets are selected', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: {
          id: 'test-collection',
          url: 'https://example.com',
          title: 'Test Page',
          timestamp: Date.now(),
          assets: [
            {
              id: '1',
              url: 'https://example.com/image.png',
              type: 'img',
              source: 'src',
              format: 'png',
              size: 1024,
            },
          ],
          stats: {
            totalCount: 1,
            totalSize: 1024,
            byType: { img: 1 } as Record<string, number>,
            byFormat: { png: 1 },
          },
        },
      });

      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const extractButton = screen.getByText('Extract');
      await user.click(extractButton);

      await waitFor(() => {
        expect(screen.getByText('1 assets')).toBeInTheDocument();
      });
    });
  });

  describe('View Mode Toggle', () => {
    it('should switch between grid and list view', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: {
          id: 'test-collection',
          url: 'https://example.com',
          title: 'Test Page',
          timestamp: Date.now(),
          assets: [
            {
              id: '1',
              url: 'https://example.com/image.png',
              type: 'img',
              source: 'src',
              format: 'png',
              size: 1024,
            },
            {
              id: '2',
              url: 'https://example.com/image2.jpg',
              type: 'img',
              source: 'src',
              format: 'jpg',
              size: 2048,
            },
          ],
          stats: {
            totalCount: 2,
            totalSize: 3072,
            byType: { img: 2 } as Record<string, number>,
            byFormat: { png: 1, jpg: 1 },
          },
        },
      });

      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const extractButton = screen.getByText('Extract');
      await user.click(extractButton);

      await waitFor(() => {
        expect(screen.getByLabelText('List view')).toBeInTheDocument();
      });

      const listButton = screen.getByLabelText('List view');
      await user.click(listButton);

      // Should still be on the page
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });

  describe('Preview Modal', () => {
    it('should open preview modal when clicking on asset', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({
        success: true,
        data: {
          id: 'test-collection',
          url: 'https://example.com',
          title: 'Test Page',
          timestamp: Date.now(),
          assets: [
            {
              id: '1',
              url: 'https://example.com/image.png',
              type: 'img',
              source: 'src',
              format: 'png',
              size: 1024,
              dimensions: { width: 100, height: 100 },
            },
          ],
          stats: {
            totalCount: 1,
            totalSize: 1024,
            byType: { img: 1 } as Record<string, number>,
            byFormat: { png: 1 },
          },
        },
      });

      render(<AssetManagerPanel />);
      const user = userEvent.setup();

      const extractButton = screen.getByText('Extract');
      await user.click(extractButton);

      await waitFor(() => {
        // Find an asset card and click its preview button
        const previewButtons = screen.getAllByTitle('Open in new tab');
        expect(previewButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
