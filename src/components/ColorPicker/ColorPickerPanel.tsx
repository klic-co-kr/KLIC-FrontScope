import React, { useState } from 'react';
import { useColorStorage } from '../../hooks/colorPicker/useColorStorage';
import { useColorPickerSettings } from '../../hooks/colorPicker/useColorPickerSettings';
import { Color } from '../../types/colorPicker';
import { createColorFromHex } from '../../utils/colorPicker/colorFactory';

export function ColorPickerPanel() {
  const { history, addColor, clearHistory } = useColorStorage();
  const { settings } = useColorPickerSettings();
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);

  /**
   * EyeDropper로 색상 추출
   */
  const handlePickColor = async () => {
    try {
      if (!('EyeDropper' in window)) {
        alert('EyeDropper API를 지원하지 않는 브라우저입니다.');
        return;
      }

      const eyeDropper = new (window as Window & { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
      const result = await eyeDropper.open();

      if (result.sRGBHex) {
        const color = createColorFromHex(result.sRGBHex);

        if (settings.autoSave) {
          await addColor(color);
        }

        setSelectedColor(color);

        if (settings.autoCopyToClipboard) {
          await navigator.clipboard.writeText(result.sRGBHex);
        }
      }
    } catch (error) {
      console.error('Failed to pick color:', error);
    }
  };

  return (
    <div className="color-picker-panel p-4">
      <div className="panel-header mb-4">
        <h2 className="text-xl font-bold">컬러피커</h2>
        <button
          onClick={handlePickColor}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          색상 추출
        </button>
      </div>

      {selectedColor && (
        <div className="color-display mb-4">
          <div
            className="color-preview w-full h-32 rounded mb-2"
            style={{ backgroundColor: selectedColor.hex }}
          />
          <div className="color-info text-sm space-y-1">
            <div>HEX: {selectedColor.hex}</div>
            <div>RGB: rgb({selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b})</div>
            <div>HSL: hsl({selectedColor.hsl.h}, {selectedColor.hsl.s}%, {selectedColor.hsl.l}%)</div>
          </div>
        </div>
      )}

      <div className="history-section">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">히스토리 ({history.colors.length})</h3>
          {history.colors.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-red-500 hover:text-red-700"
            >
              전체 삭제
            </button>
          )}
        </div>
        <div className="color-grid grid grid-cols-5 gap-2">
          {history.colors.map((color) => (
            <div
              key={color.id}
              className="color-item cursor-pointer rounded border border-gray-300 h-12"
              style={{ backgroundColor: color.hex }}
              onClick={() => setSelectedColor(color)}
              title={color.hex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
