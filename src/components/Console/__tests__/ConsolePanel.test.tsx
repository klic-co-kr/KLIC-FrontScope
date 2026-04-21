/**
 * Console Panel Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsolePanel from '../ConsolePanel';
import { chrome } from 'jest-chrome';

// Mock chrome API
(global as typeof globalThis & { chrome: typeof chrome }).chrome = chrome;

describe('ConsolePanel', () => {
  beforeEach(() => {
    // Mock chrome.storage.local.get
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const data: Record<string, unknown> = {};
      if (callback) callback(data);
      return Promise.resolve(data);
    });

    // Mock chrome.storage.local.set
    chrome.storage.local.set.mockResolvedValue(undefined);

    // Mock chrome.tabs.query
    chrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://example.com' },
    ] as Array<{ id: number; url: string }>);

    // Mock chrome.tabs.sendMessage
    chrome.tabs.sendMessage.mockResolvedValue({
      success: true,
    });
  });

  it('should render the panel with header', () => {
    render(<ConsolePanel />);
    expect(screen.getByText('콘솔')).toBeInTheDocument();
  });

  it('should have capture start/stop button', () => {
    render(<ConsolePanel />);
    expect(screen.getByText('캡처 시작')).toBeInTheDocument();
  });

  it('should have clear logs button', () => {
    render(<ConsolePanel />);
    const trashIcon = document.querySelector('.klic-console-panel button[title="로그 지우기"]');
    expect(trashIcon).toBeInTheDocument();
  });

  it('should have export button with dropdown', () => {
    render(<ConsolePanel />);
    const downloadIcon = document.querySelector('.klic-console-panel button[title="내보내기"]');
    expect(downloadIcon).toBeInTheDocument();
  });

  it('should have tabs: logs, stats, settings', () => {
    render(<ConsolePanel />);
    expect(screen.getByText(/로그 \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText('통계')).toBeInTheDocument();
    expect(screen.getByText('설정')).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    render(<ConsolePanel />);
    const user = userEvent.setup();

    const statsTab = screen.getByText('통계');
    await user.click(statsTab);
    expect(screen.getByText('레벨별 통계')).toBeInTheDocument();

    const logsTab = screen.getByText(/로그/);
    await user.click(logsTab);
    expect(screen.getByText(/로그 \(\d+\)/)).toBeInTheDocument();
  });

  it('should show empty state when no logs and not capturing', () => {
    render(<ConsolePanel />);
    expect(screen.getByText('콘솔 로그가 없습니다')).toBeInTheDocument();
  });

  it('should toggle intercept state when button clicked', async () => {
    render(<ConsolePanel />);
    const user = userEvent.setup();

    const captureButton = screen.getByText('캡처 시작');
    await user.click(captureButton);

    await waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        {
          action: 'CONSOLE_TOGGLE_INTERCEPT',
          data: { enabled: true },
        }
      );
    });
  });

  it('should render log filter buttons', () => {
    render(<ConsolePanel />);
    expect(screen.getByText(/Debug/)).toBeInTheDocument();
    expect(screen.getByText(/Log/)).toBeInTheDocument();
    expect(screen.getByText(/Info/)).toBeInTheDocument();
    expect(screen.getByText(/Warning/)).toBeInTheDocument();
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  it('should have search bar', () => {
    render(<ConsolePanel />);
    expect(screen.getByPlaceholderText('로그 검색...')).toBeInTheDocument();
  });
});
