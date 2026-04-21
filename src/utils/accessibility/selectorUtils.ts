// src/utils/accessibility/selectorUtils.ts
// Utility functions for DOM element selection and inspection

/**
 * Generate unique CSS selector for an element
 */
export function generateSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className
        .toString()
        .split(' ')
        .filter((c) => c.length > 0)
        .map((c) => `.${c}`)
        .slice(0, 3); // Limit to 3 classes for brevity
      selector += classes.join('');
    }

    path.unshift(selector);

    // Move to parent
    current = current.parentElement as HTMLElement;
    if (path.length > 5) break; // Limit path depth
  }

  return path.join(' > ');
}

/**
 * Check if element is KLIC extension element (should skip)
 */
export function isKLICElement(element: HTMLElement): boolean {
  // Check for KLIC-specific class names
  const klicClasses = ['klic-', 'klic_'];
  if (element.className) {
    const classes = element.className.toString().toLowerCase();
    if (klicClasses.some((cls) => classes.includes(cls))) {
      return true;
    }
  }

  const elementId = typeof element.id === 'string' ? element.id : String(element.id ?? '');
  if (elementId && elementId.toLowerCase().startsWith('klic')) {
    return true;
  }

  return false;
}

/**
 * Get element description for reporting
 */
export function getElementDescription(element: HTMLElement): { tagName: string; selector: string; outerHTML: string } {
  const tagName = element.tagName.toLowerCase();
  const selector = generateSelector(element);

  // Truncate outerHTML to 200 chars
  let outerHTML = element.outerHTML;
  if (outerHTML.length > 200) {
    outerHTML = outerHTML.substring(0, 197) + '...';
  }

  return { tagName, selector, outerHTML };
}

/**
 * Check if element is visible
 */
export function isVisible(element: HTMLElement): boolean {
  if (!element) return false;

  // Check display property
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  // Check if element is in DOM
  if (!document.body.contains(element)) {
    return false;
  }

  return true;
}

/**
 * Check if element has text content
 */
export function hasTextContent(element: HTMLElement): boolean {
  return Boolean(
    element.textContent?.trim() ||
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby')
  );
}

/**
 * Find all interactive elements in subtree
 */
export function findInteractiveElements(root: HTMLElement): HTMLElement[] {
  const interactiveSelectors = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(root.querySelectorAll(interactiveSelectors));
}

/**
 * Get text contrast color from computed styles
 */
export function getTextColors(element: HTMLElement): { foreground: string; background: string } | null {
  const style = window.getComputedStyle(element);

  const foreground = style.color.trim();
  const background = style.backgroundColor.trim();

  // Check if colors are valid
  if (foreground === 'rgba(0, 0, 0, 0)' || background === 'rgba(0, 0, 0, 0)') {
    return null; // Transparent
  }

  return { foreground, background };
}

/**
 * Parse rgb/rgba color to components
 */
export function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  // Handle hex
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
      a: 1,
    };
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  // Handle named colors (basic set)
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    'black': { r: 0, g: 0, b: 0 },
    'white': { r: 255, g: 255, b: 255 },
    'red': { r: 255, g: 0, b: 0 },
    'green': { r: 0, g: 128, b: 0 },
    'blue': { r: 0, g: 0, b: 255 },
    'yellow': { r: 255, g: 255, b: 0 },
    'cyan': { r: 0, g: 255, b: 255 },
    'magenta': { r: 255, g: 0, b: 255 },
    'silver': { r: 192, g: 192, b: 192 },
    'gray': { r: 128, g: 128, b: 128 },
    'maroon': { r: 128, g: 0, b: 0 },
    'olive': { r: 128, g: 128, b: 0 },
    'purple': { r: 128, g: 0, b: 128 },
    'teal': { r: 0, g: 128, b: 128 },
    'navy': { r: 0, g: 0, b: 128 },
  };

  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return { ...namedColors[lowerColor], a: 1 };
  }

  return null;
}
