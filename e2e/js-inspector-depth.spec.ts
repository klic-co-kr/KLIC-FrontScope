import { test, expect } from '@playwright/test'

const TEST_PAGE_HTML = `
<!doctype html>
<html>
  <body style="margin: 0; padding: 96px 16px 16px;">
    <div id="visualSlider"><div id="inner"><button id="leaf">Leaf</button></div></div>
    <script>
      (function () {
        var depth = 0;
        var label = document.createElement('div');
        label.id = 'depth-label';
        label.textContent = 'depth:' + depth;
        label.style.position = 'fixed';
        label.style.top = '8px';
        label.style.left = '8px';
        label.style.padding = '4px 8px';
        label.style.background = '#1D4ED8';
        label.style.color = '#fff';
        label.style.fontSize = '12px';
        label.style.zIndex = '2147483647';
        document.body.appendChild(label);

        function clamp(v) { return Math.max(0, Math.min(20, v)); }
        function anchor(el) {
          var node = el;
          for (var i = 0; i < depth; i += 1) {
            if (!node.parentElement) break;
            node = node.parentElement;
          }
          return node;
        }

        label.addEventListener('wheel', function (event) {
          depth = clamp(depth + (event.deltaY > 0 ? 1 : -1));
          label.textContent = 'depth:' + depth;
          event.preventDefault();
        }, { passive: false });

        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            depth = 0;
            label.textContent = 'depth:' + depth;
          } else if (event.key === ']') {
            depth = clamp(depth + 1);
            label.textContent = 'depth:' + depth;
          } else if (event.key === '[') {
            depth = clamp(depth - 1);
            label.textContent = 'depth:' + depth;
          }
        });

        document.getElementById('leaf').addEventListener('click', function (event) {
          var el = anchor(event.target);
          window.__anchorId = el.id || el.tagName.toLowerCase();
        });
      })();
    </script>
  </body>
</html>
`

test('depth wheel + ESC + click anchor behavior', async ({ page }) => {
  await page.setContent(TEST_PAGE_HTML)

  const label = page.locator('#depth-label')
  await label.hover()

  await page.mouse.wheel(0, 120)
  await expect(label).toContainText('depth:1')

  await page.mouse.wheel(0, 120)
  await expect(label).toContainText('depth:2')

  await page.click('#leaf')
  await expect(page.evaluate(() => (window as Window & { __anchorId?: string }).__anchorId)).resolves.toBe('visualSlider')

  await page.keyboard.press('Escape')
  await expect(label).toContainText('depth:0')
})

test('depth bracket key mapping works', async ({ page }) => {
  await page.setContent(TEST_PAGE_HTML)

  const label = page.locator('#depth-label')

  await page.keyboard.press('BracketRight')
  await expect(label).toContainText('depth:1')

  await page.keyboard.press('BracketRight')
  await expect(label).toContainText('depth:2')

  await page.keyboard.press('BracketLeft')
  await expect(label).toContainText('depth:1')

  await page.keyboard.press('Escape')
  await expect(label).toContainText('depth:0')
})
