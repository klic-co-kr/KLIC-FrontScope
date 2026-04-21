/**
 * Display Converter
 *
 * CSS display → Tailwind 클래스 변환
 */

import type { ConversionSuggestion } from '../../../types/tailwindScanner';

/**
 * display 속성 변환
 */
export function convertDisplay(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'display') {
    return [];
  }

  const displayMap: Record<string, { tailwind: string; note?: string }> = {
    'block': { tailwind: 'block' },
    'inline-block': { tailwind: 'inline-block' },
    'inline': { tailwind: 'inline' },
    'flex': { tailwind: 'flex' },
    'inline-flex': { tailwind: 'inline-flex' },
    'grid': { tailwind: 'grid' },
    'inline-grid': { tailwind: 'inline-grid' },
    'hidden': { tailwind: 'hidden', note: 'display: none과 동일' },
    'contents': { tailwind: 'contents' },
    'table': { tailwind: 'table' },
    'inline-table': { tailwind: 'inline-table' },
    'table-caption': { tailwind: 'table-caption' },
    'table-cell': { tailwind: 'table-cell' },
    'table-column': { tailwind: 'table-column' },
    'table-column-group': { tailwind: 'table-column-group' },
    'table-footer-group': { tailwind: 'table-footer-group' },
    'table-header-group': { tailwind: 'table-header-group' },
    'table-row': { tailwind: 'table-row' },
    'table-row-group': { tailwind: 'table-row-group' },
    'flow-root': { tailwind: 'flow-root' },
    'list-item': { tailwind: 'list-item' },
  };

  const mapped = displayMap[cssValue.toLowerCase()];
  if (mapped) {
    suggestions.push({
      css: `display: ${cssValue}`,
      tailwind: mapped.tailwind,
      confidence: 1.0,
      category: 'layout',
      isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * position 속성 변환
 */
export function convertPosition(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'position') {
    return [];
  }

  const positionMap: Record<string, string> = {
    'static': 'static',
    'fixed': 'fixed',
    'absolute': 'absolute',
    'relative': 'relative',
    'sticky': 'sticky',
  };

  const tailwindPosition = positionMap[cssValue.toLowerCase()];
  if (tailwindPosition) {
    suggestions.push({
      css: `position: ${cssValue}`,
      tailwind: tailwindPosition,
      confidence: 1.0,
      category: 'layout',
    isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * top/right/bottom/left 속성 변환
 */
export function convertInset(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  const validProps = ['top', 'right', 'bottom', 'left', 'inset'];
  if (!validProps.includes(cssProperty)) {
    return [];
  }

  // auto 처리
  if (cssValue === 'auto') {
    if (cssProperty === 'inset') {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: 'inset-auto',
        confidence: 1.0,
        category: 'layout',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${cssProperty}-auto`,
        confidence: 1.0,
        category: 'layout',
        isArbitrary: false,
      });
    }
    return suggestions;
  }

  // 0 처리
  if (cssValue === '0' || cssValue === '0px') {
    if (cssProperty === 'inset') {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: 'inset-0',
        confidence: 1.0,
        category: 'layout',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${cssProperty}-0`,
        confidence: 1.0,
        category: 'layout',
        isArbitrary: false,
      });
    }
    return suggestions;
  }

  // 백분율 처리
  if (cssValue.endsWith('%')) {
    const percentValue = cssValue;
    if (cssProperty === 'inset') {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `inset-[${percentValue}]`,
        confidence: 0.9,
        category: 'layout',
        isArbitrary: true,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${cssProperty}-[${percentValue}]`,
        confidence: 0.9,
        category: 'layout',
        isArbitrary: true,
      });
    }
    return suggestions;
  }

  // px 단위 처리
  const pxMatch = cssValue.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (pxMatch) {
    const pxValue = parseFloat(pxMatch[1]);

    // 표준 값 매핑 (0.5rem 단위)
    const insetScale: Record<number, string> = {
      0: '0',
      2: '0.5',
      4: '1',
      6: '1.5',
      8: '2',
      10: '2.5',
      12: '3',
      16: '4',
      20: '5',
      24: '6',
      28: '7',
      32: '8',
      36: '9',
      40: '10',
      44: '11',
      48: '12',
      52: '13',
      56: '14',
      60: '15',
      64: '16',
      72: '18',
      80: '20',
      96: '24',
    };

    // 음수 처리
    const isNegative = pxValue < 0;
    const absoluteValue = Math.abs(pxValue);

    let closest: string | null = null;
    let minDiff = Infinity;

    for (const [px, rem] of Object.entries(insetScale)) {
      const pxNum = parseInt(px, 10);
      const diff = Math.abs(pxNum - absoluteValue);
      if (diff < minDiff) {
        minDiff = diff;
        closest = rem;
      }
    }

    if (closest && minDiff <= 2) {
      const prefix = isNegative ? '-' : '';
      if (cssProperty === 'inset') {
        suggestions.push({
          css: `${cssProperty}: ${cssValue}`,
          tailwind: `inset-${prefix}${closest}`,
          confidence: 0.9,
          category: 'layout',
          isArbitrary: false,
        });
      } else {
        suggestions.push({
          css: `${cssProperty}: ${cssValue}`,
          tailwind: `${cssProperty}-${prefix}${closest}`,
          confidence: 0.9,
          category: 'layout',
          isArbitrary: false,
        });
      }
    }

    // 임의 값 대안
    const prefix = isNegative ? '-' : '';
    if (cssProperty === 'inset') {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `inset-[${prefix}${absoluteValue}px]`,
        confidence: 0.8,
        category: 'layout',
        isArbitrary: true,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${cssProperty}-[${prefix}${absoluteValue}px]`,
        confidence: 0.8,
        category: 'layout',
        isArbitrary: true,
      });
    }
  }

  // rem 단위 처리
  const remMatch = cssValue.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (remMatch) {
    if (cssProperty === 'inset') {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `inset-[${cssValue}]`,
        confidence: 0.8,
        category: 'layout',
        isArbitrary: true,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${cssProperty}-[${cssValue}]`,
        confidence: 0.8,
        category: 'layout',
        isArbitrary: true,
      });
    }
  }

  return suggestions;
}

/**
 * overflow 속성 변환
 */
export function convertOverflow(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (!cssProperty.startsWith('overflow')) {
    return [];
  }

  const axis = cssProperty === 'overflow' ? '' : `-${cssProperty.replace('overflow-', '')}`;

  const overflowMap: Record<string, string> = {
    'visible': 'visible',
    'hidden': 'hidden',
    'clip': 'clip',
    'scroll': 'scroll',
    'auto': 'auto',
  };

  const tailwindOverflow = overflowMap[cssValue.toLowerCase()];
  if (tailwindOverflow) {
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `overflow${axis}-${tailwindOverflow}`,
      confidence: 1.0,
      category: 'layout',
    isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * z-index 속성 변환
 */
export function convertZIndex(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'z-index') {
    return [];
  }

  // auto
  if (cssValue === 'auto') {
    suggestions.push({
      css: `z-index: ${cssValue}`,
      tailwind: 'z-auto',
      confidence: 1.0,
      category: 'layout',
    isArbitrary: false,
    });
    return suggestions;
  }

  // 숫자 값
  const numValue = parseInt(cssValue, 10);
  if (!isNaN(numValue)) {
    const zIndexMap: Record<number, string> = {
      0: '0',
      10: '10',
      20: '20',
      30: '30',
      40: '40',
      50: '50',
    };

    const mapped = zIndexMap[numValue];
    if (mapped) {
      suggestions.push({
        css: `z-index: ${cssValue}`,
        tailwind: `z-${mapped}`,
        confidence: 1.0,
        category: 'layout',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `z-index: ${cssValue}`,
        tailwind: `z-[${cssValue}]`,
        confidence: 0.8,
        category: 'layout',
        isArbitrary: true,
      });
    }
  }

  // Handle 'auto' value separately
  if (cssValue === 'auto') {
    suggestions.push({
      css: `z-index: auto`,
      tailwind: 'z-auto',
      confidence: 1.0,
      category: 'layout',
      isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * 계산된 스타일에서 layout 관련 속성 추출
 */
export function extractLayoutFromStyles(
  computedStyle: CSSStyleDeclaration
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  const display = computedStyle.display;
  const position = computedStyle.position;
  const zIndex = computedStyle.zIndex;
  const overflow = computedStyle.overflow;
  const overflowX = computedStyle.overflowX;
  const overflowY = computedStyle.overflowY;

  if (display && display !== 'inline') {
    suggestions.push(...convertDisplay('display', display));
  }

  if (position && position !== 'static') {
    suggestions.push(...convertPosition('position', position));
  }

  if (zIndex && zIndex !== 'auto') {
    suggestions.push(...convertZIndex('z-index', zIndex));
  }

  if (overflow && overflow !== 'visible') {
    suggestions.push(...convertOverflow('overflow', overflow));
  }

  if (overflowX && overflowX !== 'visible') {
    suggestions.push(...convertOverflow('overflow-x', overflowX));
  }

  if (overflowY && overflowY !== 'visible') {
    suggestions.push(...convertOverflow('overflow-y', overflowY));
  }

  // top/right/bottom/left
  const insets = ['top', 'right', 'bottom', 'left'];
  insets.forEach((prop) => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value !== 'auto' && value !== '0px') {
      suggestions.push(...convertInset(prop, value));
    }
  });

  return suggestions;
}

/**
 * flex-direction 속성 변환
 */
export function convertFlexDirection(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'flex-direction') {
    return [];
  }

  const directionMap: Record<string, string> = {
    'row': 'flex-row',
    'row-reverse': 'flex-row-reverse',
    'col': 'flex-col',
    'column': 'flex-col',
    'column-reverse': 'flex-col-reverse',
  };

  const tailwindDirection = directionMap[cssValue.toLowerCase()];
  if (tailwindDirection) {
    suggestions.push({
      css: `flex-direction: ${cssValue}`,
      tailwind: tailwindDirection,
      confidence: 1.0,
      category: 'flexbox',
    isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * justify-content 속성 변환
 */
export function convertJustifyContent(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'justify-content') {
    return [];
  }

  const justifyMap: Record<string, string> = {
    'flex-start': 'justify-start',
    'start': 'justify-start',
    'flex-end': 'justify-end',
    'end': 'justify-end',
    'center': 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
  };

  const tailwindJustify = justifyMap[cssValue.toLowerCase()];
  if (tailwindJustify) {
    suggestions.push({
      css: `justify-content: ${cssValue}`,
      tailwind: tailwindJustify,
      confidence: 1.0,
      category: 'flexbox',
    isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * align-items 속성 변환
 */
export function convertAlignItems(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'align-items') {
    return [];
  }

  const alignMap: Record<string, string> = {
    'flex-start': 'items-start',
    'start': 'items-start',
    'flex-end': 'items-end',
    'end': 'items-end',
    'center': 'items-center',
    'baseline': 'items-baseline',
    'stretch': 'items-stretch',
  };

  const tailwindAlign = alignMap[cssValue.toLowerCase()];
  if (tailwindAlign) {
    suggestions.push({
      css: `align-items: ${cssValue}`,
      tailwind: tailwindAlign,
      confidence: 1.0,
      category: 'flexbox',
    isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * flex-wrap 속성 변환
 */
export function convertFlexWrap(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'flex-wrap') {
    return [];
  }

  const wrapMap: Record<string, string> = {
    'nowrap': 'flex-nowrap',
    'wrap': 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
  };

  const tailwindWrap = wrapMap[cssValue.toLowerCase()];
  if (tailwindWrap) {
    suggestions.push({
      css: `flex-wrap: ${cssValue}`,
      tailwind: tailwindWrap,
      confidence: 1.0,
      category: 'flexbox',
    isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * gap 속성 변환
 */
export function convertGap(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'gap' && cssProperty !== 'row-gap' && cssProperty !== 'column-gap') {
    return [];
  }

  const axis = cssProperty === 'gap' ? '' : cssProperty.replace('gap', '');

  const pxMatch = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (!pxMatch) {
    return [];
  }

  const pxValue = parseFloat(pxMatch[1]);

  // gap 스케일 (padding과 동일)
  const gapScale: Record<number, string> = {
    0: '0', 4: '1', 6: '1.5', 8: '2', 10: '2.5', 12: '3',
    16: '4', 20: '5', 24: '6', 28: '7', 32: '8', 36: '9',
    40: '10', 44: '11', 48: '12', 52: '13', 56: '14', 60: '15',
    64: '16', 72: '18', 80: '20', 96: '24',
  };

  let closest: string | null = null;
  let minDiff = Infinity;

  for (const [px, rem] of Object.entries(gapScale)) {
    const pxNum = parseInt(px, 10);
    const diff = Math.abs(pxNum - pxValue);
    if (diff < minDiff) {
      minDiff = diff;
      closest = rem;
    }
  }

  if (closest && minDiff <= 2) {
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `gap${axis}-${closest}`,
      confidence: 0.9,
      category: 'spacing',
    isArbitrary: false,
    });
  }

  // 임의 값
  suggestions.push({
    css: `${cssProperty}: ${cssValue}`,
    tailwind: `gap${axis}-[${cssValue}]`,
    confidence: 0.7,
    category: 'spacing',
    isArbitrary: true,
  });

  return suggestions;
}
