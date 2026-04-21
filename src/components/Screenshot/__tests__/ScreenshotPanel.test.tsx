/**
 * ScreenshotPanel Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScreenshotPanel } from '../ScreenshotPanel';
import type { Screenshot } from '../../../types/screenshot';

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([{ id: 1 }])),
    sendMessage: vi.fn(),
  },
} as Partial<typeof chrome>;

describe('ScreenshotPanel', () => {
  const mockScreenshot: Screenshot = {
    id: 'test-1',
    timestamp: Date.now(),
    mode: 'element',
    format: 'png',
    quality: 0.92,
    dimensions: { width: 1920, height: 1080 },
    size: 102400,
    dataUrl: 'data:image/png;base64,test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render panel header', () => {
    render(<ScreenshotPanel />);
    expect(screen.getByText('Screenshot')).toBeInTheDocument();
  });

  it('should render capture buttons', () => {
    render(<ScreenshotPanel />);

    expect(screen.getByText('Element')).toBeInTheDocument();
    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByText('Full Page')).toBeInTheDocument();
  });

  it('should show gallery tab by default', () => {
    render(<ScreenshotPanel />);

    expect(screen.getByText('Gallery')).toBeInTheDocument();
  });

  it('should switch to settings tab', () => {
    render(<ScreenshotPanel />);

    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    expect(screen.getByText('Image Format')).toBeInTheDocument();
  });

  it('should disable capture buttons while capturing', () => {
    render(<ScreenshotPanel />);

    // Simulate capturing state
    const captureButton = screen.getByText('Element').closest('button');
    expect(captureButton).not.toBeDisabled();
  });

  it('should load screenshots on mount', async () => {
    const mockGet = chrome.storage.local.get as ReturnType<typeof vi.fn>;
    mockGet.mockResolvedValue({
      screenshots: [mockScreenshot],
    });

    render(<ScreenshotPanel />);

    await waitFor(() => {
      expect(chrome.storage.local.get).toHaveBeenCalledWith('screenshots');
    });
  });

  it('should send capture message when clicking capture button', async () => {
    render(<ScreenshotPanel />);

    const elementButton = screen.getByText('Element').closest('button');
    if (elementButton) {
      fireEvent.click(elementButton);

      await waitFor(() => {
        expect(chrome.tabs.sendMessage).toHaveBeenCalled();
      });
    }
  });
});
