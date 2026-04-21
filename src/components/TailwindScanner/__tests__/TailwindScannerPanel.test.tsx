/**
 * Tailwind Scanner Panel Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TailwindScannerPanel from '../TailwindScannerPanel';
import { chrome } from 'jest-chrome';

// Mock chrome API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.chrome = chrome as any;

describe('TailwindScannerPanel', () => {
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
    ] as { id: number; url?: string });

    // Mock chrome.tabs.sendMessage
    chrome.tabs.sendMessage.mockResolvedValue({
      success: true,
      data: {
        timestamp: Date.now(),
        url: 'https://example.com',
        title: 'Example',
        isTailwindDetected: true,
        version: 'v3',
        isJITMode: true,
        totalClasses: 150,
        classesByCategory: {
          layout: 20,
          flexbox: 30,
          spacing: 40,
          colors: 25,
          typography: 35,
        },
        classes: [],
        customClasses: [],
        arbitraryValues: [],
        config: undefined,
      },
    });
  });

  it('should render the panel with header', () => {
    render(<TailwindScannerPanel />);
    expect(screen.getByText('Tailwind 스캐너')).toBeInTheDocument();
  });

  it('should have scan button', () => {
    render(<TailwindScannerPanel />);
    expect(screen.getByText('스캔')).toBeInTheDocument();
  });

  it('should have tabs: scan, convert, config, settings', () => {
    render(<TailwindScannerPanel />);
    expect(screen.getByText('스캔 결과')).toBeInTheDocument();
    expect(screen.getByText('CSS 변환')).toBeInTheDocument();
    expect(screen.getByText('설정 추출')).toBeInTheDocument();
    expect(screen.getByText('설정')).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    render(<TailwindScannerPanel />);
    const user = userEvent.setup();

    const convertTab = screen.getByText('CSS 변환');
    await user.click(convertTab);
    expect(screen.getByText('CSS 코드 입력')).toBeInTheDocument();

    const configTab = screen.getByText('설정 추출');
    await user.click(configTab);
    expect(screen.getByText('색상')).toBeInTheDocument();

    const settingsTab = screen.getByText('설정');
    await user.click(settingsTab);
    expect(screen.getByText('감지 설정')).toBeInTheDocument();
  });

  it('should show empty state when no scan', () => {
    render(<TailwindScannerPanel />);
    expect(screen.getByText(/스캔을 시작하려면/)).toBeInTheDocument();
  });

  it('should trigger scan when button clicked', async () => {
    render(<TailwindScannerPanel />);
    const user = userEvent.setup();

    const scanButton = screen.getByText('스캔');
    await user.click(scanButton);

    await waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { action: 'TAILWIND_SCAN' }
      );
    });
  });

  it('should render conversion options', async () => {
    render(<TailwindScannerPanel />);
    const user = userEvent.setup();

    const convertTab = screen.getByText('CSS 변환');
    await user.click(convertTab);

    expect(screen.getByText('CSS 입력')).toBeInTheDocument();
    expect(screen.getByText('요소 선택')).toBeInTheDocument();
    expect(screen.getByText('인라인 스타일')).toBeInTheDocument();
  });

  it('should render config extraction options', async () => {
    render(<TailwindScannerPanel />);
    const user = userEvent.setup();

    const configTab = screen.getByText('설정 추출');
    await user.click(configTab);

    expect(screen.getByText('색상')).toBeInTheDocument();
    expect(screen.getByText('간격')).toBeInTheDocument();
    expect(screen.getByText('폰트 크기')).toBeInTheDocument();
    expect(screen.getByText('전체 설정')).toBeInTheDocument();
  });

  it('should render settings with checkboxes', async () => {
    render(<TailwindScannerPanel />);
    const user = userEvent.setup();

    const settingsTab = screen.getByText('설정');
    await user.click(settingsTab);

    expect(screen.getByText('JIT 모드 감지')).toBeInTheDocument();
    expect(screen.getByText('임의 값 포함')).toBeInTheDocument();
    expect(screen.getByText('변환 제안 표시')).toBeInTheDocument();
    expect(screen.getByText('자동 스캔')).toBeInTheDocument();
  });
});
