/**
 * Font Analyzer Panel Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FontAnalyzerPanel } from '../FontAnalyzerPanel';

// Mock hooks
vi.mock('../../hooks/fontAnalyzer', () => ({
  useFontAnalysis: () => ({
    isAnalyzing: false,
    result: null,
    error: null,
    analyze: vi.fn(),
    clearResult: vi.fn(),
  }),
  usePageFonts: () => ({
    fonts: [
      { family: 'Arial', count: 10, percentage: 50, variants: ['400', '700'], category: 'sans-serif' as const },
      { family: 'Georgia', count: 5, percentage: 25, variants: ['400'], category: 'serif' as const },
    ],
    isLoading: false,
  }),
  useFontSettings: () => ({
    settings: {
      autoScan: true,
      showSystemFonts: true,
      showWebFonts: true,
      highlightOnHover: true,
      showMetrics: true,
      checkLoading: true,
      theme: 'light' as const,
    },
    updateSettings: vi.fn(),
  }),
  useFontOptimization: () => ({
    score: 75,
    issues: ['Some fonts missing font-display: swap'],
    recommendations: ['Add font-display: swap to web fonts'],
    isChecking: false,
    refresh: vi.fn(),
  }),
}));

describe('FontAnalyzerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render panel', () => {
    render(<FontAnalyzerPanel />);

    expect(screen.getByText('Font Analyzer')).toBeInTheDocument();
  });

  it('should render tabs', () => {
    render(<FontAnalyzerPanel />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Fonts')).toBeInTheDocument();
    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('Pairs')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('Optimization')).toBeInTheDocument();
  });

  it('should switch tabs', () => {
    render(<FontAnalyzerPanel />);

    const fontsTab = screen.getByText('Fonts');
    fireEvent.click(fontsTab);

    expect(screen.getByText('All Fonts on Page')).toBeInTheDocument();
  });

  it('should show overview score', () => {
    render(<FontAnalyzerPanel />);

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Font Score')).toBeInTheDocument();
  });

  it('should show statistics', () => {
    render(<FontAnalyzerPanel />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Font families count
  });

  it('should show recommendations', () => {
    render(<FontAnalyzerPanel />);

    expect(screen.getByText(/Add font-display/)).toBeInTheDocument();
  });

  it('should show optimization tab content', () => {
    render(<FontAnalyzerPanel />);

    const optimizationTab = screen.getByText('Optimization');
    fireEvent.click(optimizationTab);

    expect(screen.getByText('Font Optimization Score')).toBeInTheDocument();
  });
});
