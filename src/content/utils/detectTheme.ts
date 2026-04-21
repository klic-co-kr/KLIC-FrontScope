/**
 * Content Script Theme Detection Utilities
 *
 * Content scripts are injected into web pages and cannot access extension CSS variables.
 * These utilities detect page theme using luminance and provide appropriate colors.
 */

/**
 * Detect page theme by analyzing body background luminance
 */
export function detectPageTheme(): 'light' | 'dark' {
  const body = document.body;
  if (!body) return 'light';

  const bgColor = window.getComputedStyle(body).backgroundColor;

  // Extract RGB values
  const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 'light';

  const [, r, g, b] = match.map(Number);

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'light' : 'dark';
}

/**
 * Get toast/overlay colors based on detected page theme
 */
export const getToastColors = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    return {
      background: '#1a1a1a',
      foreground: '#f5f5f5',
      border: '#333333',
      primary: '#60a5fa',
      primaryForeground: '#1a1a1a',
    };
  }
  return {
    background: '#ffffff',
    foreground: '#0a0a0a',
    border: '#e5e5e5',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
  };
};

/**
 * Create a styled toast element that adapts to page theme
 */
export function createThemedToast(message: string, duration = 3000): HTMLElement {
  const theme = detectPageTheme();
  const colors = getToastColors(theme);

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${colors.background};
    color: ${colors.foreground};
    border: 1px solid ${colors.border};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    animation: slideIn 0.2s ease-out;
  `;

  // Add animation keyframes
  if (!document.getElementById('toast-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }

  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.2s ease-out';
    setTimeout(() => toast.remove(), 200);
  }, duration);

  return toast;
}
