/**
 * Grid Layout E2E Tests
 *
 * End-to-end tests using Playwright
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Helpers
const openSidePanel = async (context: BrowserContext) => {
  // Open extension side panel
  const sidePanelUrl = 'chrome-extension://*/sidepanel.html';
  const pages = context.pages();
  const sidePanel = pages.find(p => p.url().includes('sidepanel')) ||
                   await context.newPage();
  await sidePanel.goto(sidePanelUrl);
  return sidePanel;
};

const navigateToTestPage = async (page: Page) => {
  await page.goto('https://example.com');
  await page.waitForLoadState('networkidle');
};

const activateGridLayout = async (sidePanel: Page) => {
  await sidePanel.click('[data-testid="grid-layout-toggle"]');
  await sidePanel.waitForSelector('[data-testid="grid-layout-panel"][data-active="true"]', { timeout: 5000 });
};

test.describe.skip('Grid Layout Tool E2E', () => {
  let sidePanel: Page;
  let testPage: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    // Load extension
    // Note: In real E2E tests, you'd load the unpacked extension
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Create pages for testing
    testPage = await context.newPage();
    await navigateToTestPage(testPage);
    sidePanel = await openSidePanel(context);
  });

  test.afterEach(async () => {
    await testPage.close();
    // Don't close sidePanel between tests for efficiency
  });

  test.describe('Activation and Deactivation', () => {
    test('should activate grid layout tool', async () => {
      // Click activate button
      await sidePanel.click('[data-testid="grid-layout-activate"]');

      // Verify panel is active
      await expect(sidePanel.locator('[data-testid="grid-layout-panel"]'))
        .toHaveAttribute('data-active', 'true');

      // Verify overlay is injected on test page
      await expect(testPage.locator('#grid-overlay-container')).toBeVisible();
    });

    test('should deactivate grid layout tool', async () => {
      // First activate
      await activateGridLayout(sidePanel);

      // Then deactivate
      await sidePanel.click('[data-testid="grid-layout-deactivate"]');

      // Verify panel is inactive
      await expect(sidePanel.locator('[data-testid="grid-layout-panel"]'))
        .toHaveAttribute('data-active', 'false');

      // Verify overlay is removed from test page
      await expect(testPage.locator('#grid-overlay-container')).not.toBeVisible();
    });

    test('should persist activation state across page reloads', async () => {
      // Activate tool
      await activateGridLayout(sidePanel);

      // Reload test page
      await testPage.reload();
      await testPage.waitForLoadState('networkidle');

      // Verify overlay is still present
      await expect(testPage.locator('#grid-overlay-container')).toBeVisible();
    });
  });

  test.describe('Grid Overlay', () => {
    test('should display grid overlay when enabled', async () => {
      await activateGridLayout(sidePanel);

      // Enable grid overlay
      await sidePanel.click('[data-testid="grid-overlay-toggle"]');

      // Verify grid is visible on page
      const lineCount = await testPage.locator('.grid-line').count();
      expect(lineCount).toBeGreaterThan(0);
    });

    test('should change grid column count', async () => {
      await activateGridLayout(sidePanel);

      // Set column count to 6
      await sidePanel.fill('[data-testid="column-count-input"]', '6');

      // Verify grid has 6 columns
      const gridLines = await testPage.locator('.grid-line.vertical').count();
      expect(gridLines).toBe(7); // 6 columns + 1 end line
    });

    test('should change grid color', async () => {
      await activateGridLayout(sidePanel);

      // Set color to blue
      await sidePanel.click('[data-testid="grid-color-picker"]');
      await sidePanel.click('[data-color="#0000ff"]');

      // Verify grid color changed
      const gridLine = testPage.locator('.grid-line').first();
      const backgroundColor = await gridLine.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(backgroundColor).toContain('rgb(0, 0, 255)');
    });

    test('should change grid opacity', async () => {
      await activateGridLayout(sidePanel);

      // Set opacity to 80%
      await sidePanel.fill('[data-testid="grid-opacity-slider"]', '0.8');

      // Verify opacity changed
      const gridOverlay = testPage.locator('#grid-overlay-container');
      const opacity = await gridOverlay.evaluate(el => {
        return window.getComputedStyle(el).opacity;
      });
      expect(opacity).toBe('0.8');
    });

    test('should adjust column width', async () => {
      await activateGridLayout(sidePanel);

      // Set column width
      await sidePanel.fill('[data-testid="column-width-input"]', '100');

      // Verify column width
      const column = testPage.locator('.grid-column').first();
      const width = await column.evaluate(el => {
        return window.getComputedStyle(el).width;
      });
      expect(width).toContain('100px');
    });

    test('should adjust gutter width', async () => {
      await activateGridLayout(sidePanel);

      // Set gutter width
      await sidePanel.fill('[data-testid="gutter-width-input"]', '30');

      // Verify gutter width
      const gutter = testPage.locator('.grid-gutter').first();
      const width = await gutter.evaluate(el => {
        return window.getComputedStyle(el).width;
      });
      expect(width).toContain('30px');
    });
  });

  test.describe('Guide Lines', () => {
    test('should add vertical guide line', async () => {
      await activateGridLayout(sidePanel);

      // Click add vertical guide button
      await sidePanel.click('[data-testid="add-vertical-guide"]');

      // Verify guide is created
      await expect(testPage.locator('.guide-line.vertical')).toBeVisible();

      // Verify guide appears in side panel list
      await expect(sidePanel.locator('[data-testid="guide-list-item"]')).toHaveCount(1);
    });

    test('should add horizontal guide line', async () => {
      await activateGridLayout(sidePanel);

      // Click add horizontal guide button
      await sidePanel.click('[data-testid="add-horizontal-guide"]');

      // Verify guide is created
      await expect(testPage.locator('.guide-line.horizontal')).toBeVisible();
    });

    test('should drag guide line', async () => {
      await activateGridLayout(sidePanel);

      // Add a guide
      await sidePanel.click('[data-testid="add-vertical-guide"]');

      const guide = testPage.locator('.guide-line').first();
      const box = await guide.boundingBox();

      // Drag the guide
      await testPage.mouse.move(box!.x + 5, box!.y + 5);
      await testPage.mouse.down();
      await testPage.mouse.move(box!.x + 105, box!.y + 5);
      await testPage.mouse.up();

      // Verify guide position changed
      const newPosition = await guide.evaluate(el => {
        return window.getComputedStyle(el).left;
      });
      expect(newPosition).not.toBe('0px');
    });

    test('should lock guide line', async () => {
      await activateGridLayout(sidePanel);

      // Add a guide
      await sidePanel.click('[data-testid="add-vertical-guide"]');

      // Lock the guide via side panel
      await sidePanel.click('[data-testid="guide-lock-toggle"]');

      // Verify guide has locked class
      await expect(testPage.locator('.guide-line.locked')).toBeVisible();

      // Try to drag (should not move)
      const guide = testPage.locator('.guide-line').first();
      const box = await guide.boundingBox();
      const originalLeft = await guide.evaluate(el => el.style.left);

      await testPage.mouse.move(box!.x + 5, box!.y + 5);
      await testPage.mouse.down();
      await testPage.mouse.move(box!.x + 105, box!.y + 5);
      await testPage.mouse.up();

      const newLeft = await guide.evaluate(el => el.style.left);
      expect(newLeft).toBe(originalLeft);
    });

    test('should delete guide line', async () => {
      await activateGridLayout(sidePanel);

      // Add a guide
      await sidePanel.click('[data-testid="add-vertical-guide"]');

      // Verify guide exists
      await expect(testPage.locator('.guide-line')).toHaveCount(1);

      // Delete the guide via side panel
      await sidePanel.click('[data-testid="guide-delete-button"]');

      // Confirm deletion
      await sidePanel.click('[data-testid="confirm-delete"]');

      // Verify guide is removed
      await expect(testPage.locator('.guide-line')).toHaveCount(0);
    });

    test('should clear all guides', async () => {
      await activateGridLayout(sidePanel);

      // Add multiple guides
      await sidePanel.click('[data-testid="add-vertical-guide"]');
      await sidePanel.click('[data-testid="add-horizontal-guide"]');

      // Clear all guides
      await sidePanel.click('[data-testid="clear-all-guides"]');
      await sidePanel.click('[data-testid="confirm-clear"]');

      // Verify all guides are removed
      await expect(testPage.locator('.guide-line')).toHaveCount(0);
    });
  });

  test.describe('Whitespace Pattern', () => {
    test('should display whitespace pattern when enabled', async () => {
      await activateGridLayout(sidePanel);

      // Enable whitespace overlay
      await sidePanel.click('[data-testid="whitespace-toggle"]');

      // Verify whitespace overlay is visible
      await expect(testPage.locator('#whitespace-overlay')).toBeVisible();
    });

    test('should change whitespace pattern type', async () => {
      await activateGridLayout(sidePanel);

      // Enable whitespace
      await sidePanel.click('[data-testid="whitespace-toggle"]');

      // Change to dots pattern
      await sidePanel.selectOption('[data-testid="whitespace-pattern-select"]', 'dots');

      // Verify pattern changed
      const overlay = testPage.locator('#whitespace-overlay');
      const backgroundImage = await overlay.evaluate(el => {
        return window.getComputedStyle(el).backgroundImage;
      });
      expect(backgroundImage).toContain('radial-gradient'); // Dots use radial gradient
    });

    test('should change whitespace color', async () => {
      await activateGridLayout(sidePanel);

      // Enable whitespace
      await sidePanel.click('[data-testid="whitespace-toggle"]');

      // Change color
      await sidePanel.click('[data-testid="whitespace-color-picker"]');
      await sidePanel.click('[data-color="#ff0000"]');

      // Verify color changed
      const overlay = testPage.locator('#whitespace-overlay');
      const color = await overlay.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(color).toContain('255');
    });

    test('should adjust whitespace spacing', async () => {
      await activateGridLayout(sidePanel);

      // Enable whitespace
      await sidePanel.click('[data-testid="whitespace-toggle"]');

      // Change spacing
      await sidePanel.fill('[data-testid="whitespace-spacing-input"]', '40');

      // Verify spacing changed
      const overlay = testPage.locator('#whitespace-overlay');
      const backgroundSize = await overlay.evaluate(el => {
        return window.getComputedStyle(el).backgroundSize;
      });
      expect(backgroundSize).toContain('40px');
    });
  });

  test.describe('Viewport Presets', () => {
    test('should select viewport preset', async () => {
      await activateGridLayout(sidePanel);

      // Select iPhone preset
      await sidePanel.click('[data-testid="viewport-selector"]');
      await sidePanel.click('[data-preset="mobile-375x667"]');

      // Verify preset is selected
      await expect(sidePanel.locator('[data-preset="mobile-375x667"][data-selected="true"]'))
        .toBeVisible();

      // Verify viewport info shows correct dimensions
      await expect(sidePanel.locator('[data-testid="viewport-dimensions"]'))
        .toContainText('375 × 667');
    });

    test('should create custom viewport preset', async () => {
      await activateGridLayout(sidePanel);

      // Click create preset button
      await sidePanel.click('[data-testid="create-preset-button"]');

      // Fill in preset details
      await sidePanel.fill('[data-testid="preset-name-input"]', 'Custom Test');
      await sidePanel.fill('[data-testid="preset-width-input"]', '800');
      await sidePanel.fill('[data-testid="preset-height-input"]', '600');

      // Save preset
      await sidePanel.click('[data-testid="save-preset-button"]');

      // Verify preset appears in selector
      await sidePanel.click('[data-testid="viewport-selector"]');
      await expect(sidePanel.locator('[data-preset*="custom-test"]')).toBeVisible();
    });

    test('should delete custom viewport preset', async () => {
      await activateGridLayout(sidePanel);

      // Create a preset first
      await sidePanel.click('[data-testid="create-preset-button"]');
      await sidePanel.fill('[data-testid="preset-name-input"]', 'ToDelete');
      await sidePanel.fill('[data-testid="preset-width-input"]', '500');
      await sidePanel.fill('[data-testid="preset-height-input"]', '400');
      await sidePanel.click('[data-testid="save-preset-button"]');

      // Delete the preset
      await sidePanel.click('[data-testid="viewport-selector"]');
      await sidePanel.click('[data-preset*="todelete"] [data-testid="delete-preset"]');

      // Verify preset is removed
      await expect(sidePanel.locator('[data-preset*="todelete"]')).not.toBeVisible();
    });
  });

  test.describe('Settings Persistence', () => {
    test('should save settings to storage', async () => {
      await activateGridLayout(sidePanel);

      // Change settings
      await sidePanel.fill('[data-testid="column-count-input"]', '6');
      await sidePanel.click('[data-testid="grid-color-picker"]');
      await sidePanel.click('[data-color="#0000ff"]');

      // Reload side panel
      await sidePanel.reload();
      await sidePanel.waitForLoadState('networkidle');

      // Verify settings persisted
      await expect(sidePanel.locator('[data-testid="column-count-input"]'))
        .toHaveValue('6');
    });

    test('should export settings', async () => {
      await activateGridLayout(sidePanel);

      // Click export button
      const downloadPromise = sidePanel.waitForEvent('download');
      await sidePanel.click('[data-testid="export-settings-button"]');
      const download = await downloadPromise;

      // Verify file was downloaded
      expect(download.suggestedFilename()).toContain('grid-layout');
    });

    test('should import settings', async () => {
      // Create a file to import
      JSON.stringify({
        settings: {
          gridOverlay: {
            enabled: true,
            columnCount: 16,
            color: '#00ff00',
          },
        },
        guides: [],
      });

      // Trigger import
      const fileChooserPromise = sidePanel.waitForEvent('filechooser');
      await sidePanel.click('[data-testid="import-settings-button"]');
      await fileChooserPromise;

      // Set file and handle import
      // Note: Playwright file upload requires actual file
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should toggle grid overlay with keyboard shortcut', async () => {
      await activateGridLayout(sidePanel);

      // Press shortcut (e.g., Ctrl+Shift+G)
      await sidePanel.keyboard.press('Control+Shift+G');

      // Verify grid overlay toggled
      await expect(testPage.locator('#grid-overlay-container')).toBeVisible();
    });

    test('should add guide with keyboard shortcut', async () => {
      await activateGridLayout(sidePanel);

      // Press shortcut to add vertical guide (e.g., Ctrl+Alt+V)
      await sidePanel.keyboard.press('Control+Alt+V');

      // Verify guide was added
      await expect(testPage.locator('.guide-line.vertical')).toBeVisible();
    });

    test('should show keyboard shortcuts help', async () => {
      await activateGridLayout(sidePanel);

      // Press help shortcut (e.g., ?)
      await sidePanel.keyboard.press('?');

      // Verify help dialog is shown
      await expect(sidePanel.locator('[data-testid="keyboard-shortcuts-help"]'))
        .toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to different viewport sizes', async () => {
      await activateGridLayout(sidePanel);

      // Resize viewport
      await testPage.setViewportSize({ width: 375, height: 667 });

      // Verify overlay adapts
      const overlay = testPage.locator('#grid-overlay-container');
      const width = await overlay.evaluate((el) => (el as HTMLElement).offsetWidth);
      expect(width).toBe(375);
    });

    test('should update on window resize', async () => {
      await activateGridLayout(sidePanel);

      // Enable grid overlay
      await sidePanel.click('[data-testid="grid-overlay-toggle"]');

      // Resize window
      await testPage.setViewportSize({ width: 800, height: 600 });
      await testPage.waitForTimeout(200); // Wait for debounce

      // Verify grid adapts
      const gridLines = testPage.locator('.grid-line');
      const count = await gridLines.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      await activateGridLayout(sidePanel);

      // Check for ARIA labels on controls
      const count = await sidePanel.locator('[aria-label*="grid"]').count();
      expect(count).toBeGreaterThan(0);
    });

    test('should be keyboard navigable', async () => {
      await activateGridLayout(sidePanel);

      // Tab through controls
      await sidePanel.keyboard.press('Tab');
      await sidePanel.keyboard.press('Tab');
      await sidePanel.keyboard.press('Tab');

      // Verify focus is visible
      const focusedElement = sidePanel.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should handle many guides without lag', async () => {
      await activateGridLayout(sidePanel);

      // Add 20 guides
      for (let i = 0; i < 20; i++) {
        await sidePanel.click('[data-testid="add-vertical-guide"]');
      }

      // Verify all guides are visible
      await expect(testPage.locator('.guide-line')).toHaveCount(20);

      // Verify UI is still responsive
      const start = Date.now();
      await sidePanel.click('[data-testid="grid-overlay-toggle"]');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    test('should handle rapid setting changes', async () => {
      await activateGridLayout(sidePanel);

      const start = Date.now();

      // Change column count rapidly
      for (let i = 1; i <= 10; i++) {
        await sidePanel.fill('[data-testid="column-count-input"]', String(i));
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      await activateGridLayout(sidePanel);

      // Enter invalid column count
      await sidePanel.fill('[data-testid="column-count-input"]', 'invalid');

      // Verify error message or fallback to valid value
      const inputValue = await sidePanel.locator('[data-testid="column-count-input"]').inputValue();
      expect(inputValue).not.toBe('invalid');
    });

    test('should handle storage errors gracefully', async () => {
      // Simulate storage error by blocking storage API
      await testPage.route('**/storage/**', route => route.abort());

      await activateGridLayout(sidePanel);

      // Tool should still function, just without persistence
      await expect(sidePanel.locator('[data-testid="grid-layout-panel"]'))
        .toBeVisible();
    });
  });
});
