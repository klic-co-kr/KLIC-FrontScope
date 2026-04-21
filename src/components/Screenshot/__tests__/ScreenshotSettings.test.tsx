/**
 * ScreenshotSettings Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScreenshotSettings } from '../ScreenshotSettings';
import type { ScreenshotSettings as SettingsType } from '../../../types/screenshot';

const mockSettings: SettingsType = {
  defaultFormat: 'png',
  quality: 0.92,
  captureMode: 'element',
  enableAnnotations: true,
  autoDownload: false,
  includeCursor: false,
};

describe('ScreenshotSettings', () => {
  const handleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings panel', () => {
    render(<ScreenshotSettings settings={mockSettings} onChange={handleChange} />);

    expect(screen.getByText('Image Format')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Default Capture Mode')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();
  });

  it('should display current format', () => {
    render(<ScreenshotSettings settings={mockSettings} onChange={handleChange} />);

    const pngRadio = screen.getByLabelText('PNG');
    expect(pngRadio).toBeChecked();
  });

  it('should display current quality', () => {
    render(<ScreenshotSettings settings={mockSettings} onChange={handleChange} />);

    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('should call onChange when format changes', () => {
    render(<ScreenshotSettings settings={mockSettings} onChange={handleChange} />);

    const jpegRadio = screen.getByLabelText('JPEG');
    fireEvent.click(jpegRadio);

    expect(handleChange).toHaveBeenCalledWith({
      ...mockSettings,
      defaultFormat: 'jpeg',
    });
  });

  it('should call onChange when quality changes', () => {
    render(<ScreenshotSettings settings={mockSettings} onChange={handleChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.8' } });

    expect(handleChange).toHaveBeenCalledWith({
      ...mockSettings,
      quality: 0.8,
    });
  });

  it('should call onChange when capture mode changes', () => {
    render(<ScreenshotSettings settings={mockSettings} onChange={handleChange} />);

    const areaRadio = screen.getByLabelText('Area');
    fireEvent.click(areaRadio);

    expect(handleChange).toHaveBeenCalledWith({
      ...mockSettings,
      captureMode: 'area',
    });
  });

  it('should call onChange when toggle changes', () => {
    render(<ScreenshotSettings settings={mockSettings} onChange={handleChange} />);

    const annotationsCheckbox = screen.getByLabelText('Enable Annotations');
    fireEvent.click(annotationsCheckbox);

    expect(handleChange).toHaveBeenCalledWith({
      ...mockSettings,
      enableAnnotations: false,
    });
  });

  it('should hide quality slider for PNG format', () => {
    const pngSettings = { ...mockSettings, defaultFormat: 'png' as const };
    render(<ScreenshotSettings settings={pngSettings} onChange={handleChange} />);

    expect(screen.queryByText('Quality')).not.toBeInTheDocument();
  });

  it('should show quality slider for JPEG format', () => {
    const jpegSettings = { ...mockSettings, defaultFormat: 'jpeg' as const };
    render(<ScreenshotSettings settings={jpegSettings} onChange={handleChange} />);

    expect(screen.getByText('Quality')).toBeInTheDocument();
  });
});
