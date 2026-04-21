# Phase 6: 컬러피커 - React 컴포넌트

**태스크 범위**: Task #5.35 ~ #5.42 (8개)
**예상 시간**: 4.5시간
**의존성**: Phase 1~5 완료

---

## Task #5.35: ColorPickerPanel 메인 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/ColorPickerPanel.tsx`
- **시간**: 45분
- **의존성**: Task #5.31-#5.34

```typescript
import React, { useState } from 'react';
import { useColorStorage } from '../../../hooks/colorPicker/useColorStorage';
import { useColorPickerSettings } from '../../../hooks/colorPicker/useColorPickerSettings';
import { ColorDisplay } from './ColorDisplay';
import { ColorHistoryGrid } from './ColorHistoryGrid';
import { ColorPalette } from './ColorPalette';
import { ContrastChecker } from './ContrastChecker';
import { CollectionManager } from './CollectionManager';
import { Color } from '../../../types/colorPicker';
import { createColorFromHex } from '../../../utils/colorPicker/colorFactory';

export function ColorPickerPanel() {
  const { history, addColor, deleteColor, clearHistory } = useColorStorage();
  const { settings } = useColorPickerSettings();
  const [activeTab, setActiveTab] = useState<'history' | 'palette' | 'contrast' | 'collections'>('history');
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

      const eyeDropper = new (window as any).EyeDropper();
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
    <div className="color-picker-panel">
      <div className="panel-header">
        <h2>컬러피커</h2>
        <button onClick={handlePickColor} className="pick-color-btn">
          색상 추출
        </button>
      </div>

      {selectedColor && (
        <ColorDisplay color={selectedColor} />
      )}

      <div className="tab-navigation">
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>
          히스토리 ({history.colors.length})
        </button>
        <button onClick={() => setActiveTab('palette')} className={activeTab === 'palette' ? 'active' : ''}>
          팔레트
        </button>
        <button onClick={() => setActiveTab('contrast')} className={activeTab === 'contrast' ? 'active' : ''}>
          대비율
        </button>
        <button onClick={() => setActiveTab('collections')} className={activeTab === 'collections' ? 'active' : ''}>
          컬렉션
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'history' && (
          <ColorHistoryGrid
            colors={history.colors}
            onSelectColor={setSelectedColor}
            onDeleteColor={deleteColor}
          />
        )}

        {activeTab === 'palette' && selectedColor && (
          <ColorPalette baseColor={selectedColor} />
        )}

        {activeTab === 'contrast' && selectedColor && (
          <ContrastChecker foreground={selectedColor} />
        )}

        {activeTab === 'collections' && (
          <CollectionManager />
        )}
      </div>
    </div>
  );
}
```

**완료 조건**: 메인 UI 동작 검증

---

## Task #5.36: ColorDisplay 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/ColorDisplay.tsx`
- **시간**: 30분
- **의존성**: Task #5.1, #5.14

**상세 내용**:
- 색상 미리보기 (큰 사각형)
- 모든 포맷 표시 (HEX, RGB, HSL, HSV)
- 클릭 시 클립보드 복사
- 복사 성공 토스트 메시지

```typescript
import React, { useState } from 'react';
import { Color } from '../../../types/colorPicker';
import { colorToAllFormats } from '../../../utils/colorPicker/colorString';

interface ColorDisplayProps {
  color: Color;
}

export function ColorDisplay({ color }: ColorDisplayProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const formats = colorToAllFormats(color);

  const handleCopy = async (format: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="color-display">
      <div
        className="color-preview"
        style={{ backgroundColor: color.hex }}
      />

      <div className="color-values">
        {Object.entries(formats).map(([format, value]) => (
          <div key={format} className="color-value-row">
            <span className="format-label">{format.toUpperCase()}</span>
            <span className="format-value">{value}</span>
            <button
              onClick={() => handleCopy(format, value)}
              className="copy-btn"
            >
              {copiedFormat === format ? '복사됨!' : '복사'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**완료 조건**: 색상 표시 및 복사 검증

---

## Task #5.37: ColorHistoryGrid 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/ColorHistoryGrid.tsx`
- **시간**: 30분
- **의존성**: Task #5.1, #5.31

**상세 내용**:
- 그리드 형태로 히스토리 표시
- 클릭 시 색상 선택
- 삭제 버튼
- 빈 상태 메시지

```typescript
import React from 'react';
import { Color } from '../../../types/colorPicker';

interface ColorHistoryGridProps {
  colors: Color[];
  onSelectColor: (color: Color) => void;
  onDeleteColor: (colorId: string) => void;
}

export function ColorHistoryGrid({ colors, onSelectColor, onDeleteColor }: ColorHistoryGridProps) {
  if (colors.length === 0) {
    return <div className="empty-state">저장된 색상이 없습니다.</div>;
  }

  return (
    <div className="color-history-grid">
      {colors.map((color) => (
        <div key={color.id} className="color-history-item">
          <div
            className="color-swatch"
            style={{ backgroundColor: color.hex }}
            onClick={() => onSelectColor(color)}
            title={color.hex}
          />
          <button
            className="delete-btn"
            onClick={() => onDeleteColor(color.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
```

**완료 조건**: 그리드 렌더링 검증

---

## Task #5.38: ColorPalette 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/ColorPalette.tsx`
- **시간**: 45분
- **의존성**: Task #5.19-#5.25

**상세 내용**:
- 팔레트 타입 선택 (드롭다운)
- 자동 팔레트 생성
- 색상 클릭 시 저장
- 팔레트 이름 입력

```typescript
import React, { useState, useMemo } from 'react';
import { Color, PaletteType } from '../../../types/colorPicker';
import { PALETTE_TYPE_LABELS } from '../../../constants/colors';
import { generateAnalogous } from '../../../utils/colorPicker/palettes/analogous';
import { generateComplementary } from '../../../utils/colorPicker/palettes/complementary';
import { generateTriadic } from '../../../utils/colorPicker/palettes/triadic';
import { generateTetradic } from '../../../utils/colorPicker/palettes/tetradic';
import { generateMonochromatic } from '../../../utils/colorPicker/palettes/monochromatic';
import { generateShades } from '../../../utils/colorPicker/palettes/shades';
import { generateTints } from '../../../utils/colorPicker/palettes/tints';

interface ColorPaletteProps {
  baseColor: Color;
  onSaveColor?: (color: Color) => void;
}

export function ColorPalette({ baseColor, onSaveColor }: ColorPaletteProps) {
  const [paletteType, setPaletteType] = useState<PaletteType>('analogous');

  const palette = useMemo(() => {
    switch (paletteType) {
      case 'analogous':
        return generateAnalogous(baseColor);
      case 'complementary':
        return generateComplementary(baseColor);
      case 'triadic':
        return generateTriadic(baseColor);
      case 'tetradic':
        return generateTetradic(baseColor);
      case 'monochromatic':
        return generateMonochromatic(baseColor);
      case 'shades':
        return generateShades(baseColor);
      case 'tints':
        return generateTints(baseColor);
    }
  }, [baseColor, paletteType]);

  return (
    <div className="color-palette">
      <select
        value={paletteType}
        onChange={(e) => setPaletteType(e.target.value as PaletteType)}
        className="palette-type-select"
      >
        {Object.entries(PALETTE_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="palette-colors">
        {palette.map((color) => (
          <div
            key={color.id}
            className="palette-color"
            style={{ backgroundColor: color.hex }}
            onClick={() => onSaveColor?.(color)}
            title={color.hex}
          />
        ))}
      </div>
    </div>
  );
}
```

**완료 조건**: 팔레트 생성 검증

---

## Task #5.39: ContrastChecker 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/ContrastChecker.tsx`
- **시간**: 30분
- **의존성**: Task #5.26-#5.30

**상세 내용**:
- 배경 색상 선택 (색상 입력)
- 대비율 표시
- WCAG AA/AAA 통과 여부
- 접근성 등급 표시

```typescript
import React, { useState } from 'react';
import { Color } from '../../../types/colorPicker';
import { getContrastResult } from '../../../utils/colorPicker/accessibility/contrast';
import { createColorFromHex } from '../../../utils/colorPicker/colorFactory';

interface ContrastCheckerProps {
  foreground: Color;
}

export function ContrastChecker({ foreground }: ContrastCheckerProps) {
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');

  const background = createColorFromHex(backgroundColor);
  const result = getContrastResult(foreground, background);

  return (
    <div className="contrast-checker">
      <div className="contrast-preview">
        <div
          className="preview-text"
          style={{
            backgroundColor,
            color: foreground.hex,
          }}
        >
          샘플 텍스트
        </div>
      </div>

      <div className="contrast-info">
        <div className="contrast-ratio">
          대비율: <strong>{result.ratio}:1</strong>
        </div>

        <div className="wcag-results">
          <div className={result.passAA ? 'pass' : 'fail'}>
            AA: {result.passAA ? '통과' : '실패'}
          </div>
          <div className={result.passAAA ? 'pass' : 'fail'}>
            AAA: {result.passAAA ? '통과' : '실패'}
          </div>
        </div>

        <div className="rating">
          등급: <strong>{result.rating.toUpperCase()}</strong>
        </div>
      </div>

      <div className="background-selector">
        <label>배경색:</label>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
        />
        <input
          type="text"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
        />
      </div>
    </div>
  );
}
```

**완료 조건**: 대비율 계산 검증

---

## Task #5.40: CollectionManager 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/CollectionManager.tsx`
- **시간**: 45분
- **의존성**: Task #5.32

**상세 내용**:
- 컬렉션 생성 (이름 입력)
- 색상 추가/제거 (드래그 앤 드롭)
- 컬렉션 삭제
- 컬렉션 목록 표시

```typescript
import React, { useState } from 'react';
import { useColorCollections } from '../../../hooks/colorPicker/useColorCollections';
import { Color } from '../../../types/colorPicker';

export function CollectionManager() {
  const { collections, createCollection, addColorToCollection, removeColorFromCollection, deleteCollection } = useColorCollections();
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    const collection = await createCollection(newCollectionName);
    if (collection) {
      setNewCollectionName('');
      setSelectedCollectionId(collection.id);
    }
  };

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);

  return (
    <div className="collection-manager">
      <div className="create-collection">
        <input
          type="text"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          placeholder="컬렉션 이름"
        />
        <button onClick={handleCreateCollection}>생성</button>
      </div>

      <div className="collection-list">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className={`collection-item ${selectedCollectionId === collection.id ? 'active' : ''}`}
            onClick={() => setSelectedCollectionId(collection.id)}
          >
            <span className="collection-name">{collection.name}</span>
            <span className="color-count">{collection.colors.length}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteCollection(collection.id);
              }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      {selectedCollection && (
        <div className="collection-colors">
          <h3>{selectedCollection.name}</h3>
          <div className="color-grid">
            {selectedCollection.colors.map((color) => (
              <div
                key={color.id}
                className="color-swatch"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**완료 조건**: 컬렉션 관리 검증

---

## Task #5.41: FormatSelector 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/FormatSelector.tsx`
- **시간**: 15분
- **의존성**: Task #5.1, #5.4

**상세 내용**:
- 포맷 드롭다운 (HEX, RGB, HSL, HSV, CSS Var)
- 선택 시 기본 포맷 변경

```typescript
import React from 'react';
import { ColorFormat, ColorPickerSettings } from '../../../types/colorPicker';
import { COLOR_FORMAT_LABELS } from '../../../constants/colors';

interface FormatSelectorProps {
  settings: ColorPickerSettings;
  onFormatChange: (format: ColorFormat) => void;
}

export function FormatSelector({ settings, onFormatChange }: FormatSelectorProps) {
  return (
    <div className="format-selector">
      <label>기본 포맷:</label>
      <select
        value={settings.defaultFormat}
        onChange={(e) => onFormatChange(e.target.value as ColorFormat)}
      >
        {Object.entries(COLOR_FORMAT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

**완료 조건**: 포맷 변경 검증

---

## Task #5.42: ExportModal 컴포넌트

- **파일**: `src/sidepanel/components/ColorPicker/ExportModal.tsx`
- **시간**: 30분
- **의존성**: Task #5.1

**상세 내용**:
- Export 포맷 선택 (JSON, CSS, SCSS, Tailwind, CSV)
- 변환 및 다운로드
- 미리보기

```typescript
import React, { useState } from 'react';
import { Color, ExportFormat } from '../../../types/colorPicker';
import { EXPORT_FORMAT_LABELS } from '../../../constants/colors';

interface ExportModalProps {
  colors: Color[];
  onClose: () => void;
}

export function ExportModal({ colors, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [preview, setPreview] = useState<string>('');

  const generateExport = () => {
    let content = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(colors, null, 2);
        break;
      case 'css':
        content = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n');
        content = `:root {\n${content}\n}`;
        break;
      case 'scss':
        content = colors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join('\n');
        break;
      case 'tailwind':
        const colorObj = colors.reduce((acc, c, i) => {
          acc[`color-${i + 1}`] = c.hex;
          return acc;
        }, {} as Record<string, string>);
        content = `colors: ${JSON.stringify(colorObj, null, 2)}`;
        break;
      case 'csv':
        content = 'name,hex,rgb,hsl\n' + colors.map(c =>
          `${c.name || ''},${c.hex},${c.hex},${c.hex}`
        ).join('\n');
        break;
    }

    setPreview(content);
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colors.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-modal">
      <div className="modal-content">
        <h2>색상 내보내기</h2>

        <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
          {Object.entries(EXPORT_FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <button onClick={generateExport}>생성</button>

        {preview && (
          <>
            <pre>{preview}</pre>
            <button onClick={handleDownload}>다운로드</button>
          </>
        )}

        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
```

**완료 조건**: Export 기능 검증

---

**완료 후 다음 단계**: [Phase 7: Content Script](./TASK-05-phase-07-content-script.md)
