/**
 * CSS Scan Panel Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CSSScanPanel } from '../CSSScanPanel';

// Mock Chrome API
(global as typeof globalThis & { chrome: Partial<typeof chrome> }).chrome = {
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
    },
  },
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve({})),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([{ id: 1 }])),
    sendMessage: vi.fn(),
  },
};

describe('CSSScanPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render panel header', () => {
    render(<CSSScanPanel />);
    expect(screen.getByText('CSS Scan')).toBeInTheDocument();
  });

  it('should render tabs', () => {
    render(<CSSScanPanel />);

    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Fonts')).toBeInTheDocument();
    expect(screen.getByText('Layouts')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should show Inspector tab by default', () => {
    render(<CSSScanPanel />);
    expect(screen.getByText('Inspector')).toHaveClass('bg-blue-100');
  });

  it('should switch tabs when clicked', () => {
    render(<CSSScanPanel />);

    const colorsTab = screen.getByText('Colors');
    fireEvent.click(colorsTab);

    expect(colorsTab).toHaveClass('bg-blue-100');
  });

  it('should send scan message when Scan Page clicked', async () => {
    render(<CSSScanPanel />);

    const scanButton = screen.getByText('Scan Page');
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalled();
    });
  });

  it('should send cancel message when Stop clicked', async () => {
    render(<CSSScanPanel />);

    // First scan
    const scanButton = screen.getByText('Scan Page');
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalled();
    });

    // Clear mocks
    vi.clearAllMocks();

    // Then stop
    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CSS_SCAN_CANCEL',
        }),
        expect.any(Number)
      );
    });
  });
});
