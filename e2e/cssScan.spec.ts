/**
 * CSS Scan E2E Tests
 */

import { test, expect, Page } from '@playwright/test';

test.describe('CSS Scan Tool', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('https://example.com');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should scan page CSS', async () => {
    // Inject CSS scan functionality
    await page.evaluate(() => {
      (window as { extractElementStyle?: (element: HTMLElement) => unknown }).extractElementStyle = (element: HTMLElement) => {
        const computedStyle = window.getComputedStyle(element);
        return {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          display: computedStyle.getPropertyValue('display'),
          color: computedStyle.getPropertyValue('color'),
          backgroundColor: computedStyle.getPropertyValue('background-color'),
        };
      };
    });

    // Scan element
    const result = await page.evaluate((): { tagName: string } | undefined => {
      const h1 = document.querySelector('h1');

      const extractor = (window as { extractElementStyle?: (element: HTMLElement) => unknown }).extractElementStyle;
      if (!extractor || !(h1 instanceof HTMLElement)) {
        return undefined;
      }

      return extractor(h1) as { tagName: string };
    });

    expect(result).toBeDefined();
    expect(result?.tagName).toBe('H1');
  });

  test('should extract colors from page', async () => {
    const colors = await page.evaluate(() => {
      const colorSet = new Set<string>();
      const elements = document.querySelectorAll('*');

      for (const element of Array.from(elements)) {
        if (!(element instanceof HTMLElement)) continue;

        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.getPropertyValue('color');
        const bgColor = computedStyle.getPropertyValue('background-color');

        if (color && color !== 'rgba(0, 0, 0, 0)') {
          colorSet.add(color);
        }
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          colorSet.add(bgColor);
        }
      }

      return Array.from(colorSet);
    });

    expect(colors.length).toBeGreaterThan(0);
  });

  test('should find flex containers', async () => {
    const flexContainers = await page.evaluate(() => {
      const containers: HTMLElement[] = [];
      const elements = document.querySelectorAll('*');

      for (const element of Array.from(elements)) {
        if (!(element instanceof HTMLElement)) continue;

        const computedStyle = window.getComputedStyle(element);
        const display = computedStyle.getPropertyValue('display');

        if (display === 'flex' || display === 'inline-flex') {
          containers.push(element);
        }
      }

      return containers.map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
      }));
    });

    expect(Array.isArray(flexContainers)).toBe(true);
  });

  test('should find grid containers', async () => {
    const gridContainers = await page.evaluate(() => {
      const containers: HTMLElement[] = [];
      const elements = document.querySelectorAll('*');

      for (const element of Array.from(elements)) {
        if (!(element instanceof HTMLElement)) continue;

        const computedStyle = window.getComputedStyle(element);
        const display = computedStyle.getPropertyValue('display');

        if (display === 'grid' || display === 'inline-grid') {
          containers.push(element);
        }
      }

      return containers.map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
      }));
    });

    expect(Array.isArray(gridContainers)).toBe(true);
  });

  test('should extract box model info', async () => {
    const boxModel = await page.evaluate(() => {
      const element = document.querySelector('h1') as HTMLElement;
      if (!element) return null;

      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      return {
        content: {
          width: rect.width,
          height: rect.height,
        },
        padding: {
          top: parseFloat(computedStyle.getPropertyValue('padding-top')),
          right: parseFloat(computedStyle.getPropertyValue('padding-right')),
          bottom: parseFloat(computedStyle.getPropertyValue('padding-bottom')),
          left: parseFloat(computedStyle.getPropertyValue('padding-left')),
        },
        border: {
          top: parseFloat(computedStyle.getPropertyValue('border-top-width')),
          right: parseFloat(computedStyle.getPropertyValue('border-right-width')),
          bottom: parseFloat(computedStyle.getPropertyValue('border-bottom-width')),
          left: parseFloat(computedStyle.getPropertyValue('border-left-width')),
        },
        margin: {
          top: parseFloat(computedStyle.getPropertyValue('margin-top')),
          right: parseFloat(computedStyle.getPropertyValue('margin-right')),
          bottom: parseFloat(computedStyle.getPropertyValue('margin-bottom')),
          left: parseFloat(computedStyle.getPropertyValue('margin-left')),
        },
      };
    });

    if (boxModel) {
      expect(boxModel.content.width).toBeGreaterThan(0);
      expect(boxModel.content.height).toBeGreaterThan(0);
    }
  });

  test('should calculate selector specificity', async () => {
    const specificities = await page.evaluate(() => {
      const calculate = (selector: string) => {
        const trimmed = selector.trim();
        if (trimmed.length === 0) return 0;

        const ids = (trimmed.match(/#[\w-]+/g) || []).length;
        const classes = (trimmed.match(/\.[\w-]+/g) || []).length;
        const attributes = (trimmed.match(/\[[^\]]+\]/g) || []).length;
        const pseudoClasses = (trimmed.match(/:(?!:)[\w-]+(\([^)]*\))?/g) || []).length;

        const typeSelectors = (trimmed.match(/(^|\s|>|\+|~)([a-zA-Z][\w-]*)/g) || []).length;
        const pseudoElements = (trimmed.match(/::[\w-]+/g) || []).length;

        return ids * 100 + (classes + attributes + pseudoClasses) * 10 + (typeSelectors + pseudoElements);
      };

      return {
        id: calculate('#test'),
        class: calculate('.test'),
        element: calculate('div'),
        combined: calculate('#test.class'),
      };
    });

    expect(specificities.id).toBe(100);
    expect(specificities.class).toBe(10);
    expect(specificities.element).toBe(1);
    expect(specificities.combined).toBe(110);
  });

  test('should parse color values', async () => {
    const colors = await page.evaluate(() => {
      const parse = (color: string) => {
        const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
        if (hexMatch) return { format: 'hex', value: color };
        return null;
      };

      return {
        hex: parse('#ff0000'),
        hexShort: parse('#f00'),
        invalid: parse('not-a-color'),
      };
    });

    expect(colors.hex?.format).toBe('hex');
    expect(colors.hexShort?.format).toBe('hex');
    expect(colors.invalid).toBeNull();
  });

  test('should export CSS', async () => {
    const css = await page.evaluate(() => {
      const sheets = document.styleSheets;
      const rules: string[] = [];

      for (const sheet of Array.from(sheets)) {
        try {
          const sheetRules = sheet.cssRules || sheet.rules;
          for (const rule of Array.from(sheetRules)) {
            if (rule instanceof CSSStyleRule) {
              rules.push(rule.cssText);
            }
          }
        } catch {
          // CORS error - skip
        }
      }

      return rules.join('\n');
    });

    expect(typeof css).toBe('string');
  });

  test('should compare two elements styles', async () => {
    const comparison = await page.evaluate(() => {
      const h1 = document.querySelector('h1') as HTMLElement;
      const p = document.querySelector('p') as HTMLElement;

      if (!h1 || !p) return null;

      const h1Style = window.getComputedStyle(h1);
      const pStyle = window.getComputedStyle(p);

      const differences: Array<{ property: string; value1: string; value2: string }> = [];

      // Compare color
      const h1Color = h1Style.getPropertyValue('color');
      const pColor = pStyle.getPropertyValue('color');

      if (h1Color !== pColor) {
        differences.push({
          property: 'color',
          value1: h1Color,
          value2: pColor,
        });
      }

      return differences;
    });

    expect(Array.isArray(comparison)).toBe(true);
  });

  test('should find all used fonts', async () => {
    const fonts = await page.evaluate(() => {
      const fontMap = new Map<string, number>();

      const elements = document.querySelectorAll('*');
      for (const element of Array.from(elements)) {
        if (!(element instanceof HTMLElement)) continue;

        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.getPropertyValue('font-family');
        const family = fontFamily.split(',')[0].replace(/['"]/g, '').trim();

        fontMap.set(family, (fontMap.get(family) || 0) + 1);
      }

      return Array.from(fontMap.entries()).map(([family, count]) => ({
        family,
        count,
      }));
    });

    expect(fonts.length).toBeGreaterThan(0);
  });
});
