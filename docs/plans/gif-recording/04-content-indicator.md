# Phase 4: Content Script Recording Indicator (Tasks 12-13)

Recording indicator overlay and content script message handler integration.

---

## Task 12: Create Content Script Recording Indicator

**Files:**
- Create: `src/content/recording/recordingIndicator.ts`

**Step 1: Write the indicator module**

```typescript
// src/content/recording/recordingIndicator.ts
// Recording indicator overlay — minimal DOM, pointerEvents: none

let indicatorEl: HTMLElement | null = null;
let styleEl: HTMLStyleElement | null = null;

export function showRecordingIndicator(): void {
  if (indicatorEl) return;

  indicatorEl = document.createElement('div');
  Object.assign(indicatorEl.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: '2147483647',
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  });

  const dot = document.createElement('div');
  Object.assign(dot.style, {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#fff',
    animation: 'klic-rec-pulse 1s ease-in-out infinite',
  });

  const label = document.createElement('span');
  label.textContent = 'REC';

  styleEl = document.createElement('style');
  styleEl.dataset.klicRec = '';
  styleEl.textContent = `
    @keyframes klic-rec-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;

  indicatorEl.appendChild(dot);
  indicatorEl.appendChild(label);
  document.head.appendChild(styleEl);
  document.body.appendChild(indicatorEl);
}

export function hideRecordingIndicator(): void {
  indicatorEl?.remove();
  indicatorEl = null;
  styleEl?.remove();
  styleEl = null;
}
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/content/recording/recordingIndicator.ts
git commit -m "feat(gif): create recording indicator for content script"
```

---

## Task 13: Integrate Recording Indicator into Content Script

**Files:**
- Modify: `src/content/index.ts`

**Step 1: Add import**

At the top of `src/content/index.ts`, add:

```typescript
import { showRecordingIndicator, hideRecordingIndicator } from './recording/recordingIndicator';
```

**Step 2: Add message handlers**

Inside the `chrome.runtime.onMessage.addListener` callback (after the existing `CROP_AND_CAPTURE` handler), add:

```typescript
    if (request.action === 'GIF_RECORDING_STARTED') {
        showRecordingIndicator();
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'GIF_RECORDING_ENDED') {
        hideRecordingIndicator();
        sendResponse({ success: true });
        return true;
    }
```

**Step 3: Type check and build**

Run: `tsc -b && npm run build`
Expected: Both succeed

**Step 4: Commit**

```bash
git add src/content/index.ts
git commit -m "feat(gif): integrate recording indicator into content script message handler"
```
