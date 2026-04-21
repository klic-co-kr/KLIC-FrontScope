# Phase 6: Integration (Tasks 43-47)

> Tool registration, ToolRouter, content script handler, background context menu

---

## Task 43: Register accessibilityChecker in Tools

**Files:**
- Modify: `src/sidepanel/constants/tools.ts`

**Step 1: Add to ToolType union**

```typescript
export type ToolType =
  | 'textEdit'
  | 'screenshot'
  | 'cssScan'
  | 'fontAnalyzer'
  | 'palette'
  | 'colorPicker'
  | 'ruler'
  | 'assets'
  | 'console'
  | 'tailwind'
  | 'gridLayout'
  | 'resourceNetwork'
  | 'accessibilityChecker';  // NEW
```

**Step 2: Add import**

```typescript
import { ShieldCheck } from 'lucide-react';
```

**Step 3: Add to ALL_TOOLS array** (after `resourceNetwork`)

```typescript
{
  id: 'accessibilityChecker',
  name: '접근성 검사',
  description: 'KRDS 웹접근성 검사',
  icon: ShieldCheck,
  category: 'analyze',
  exclusive: false,
  shortcut: 'Ctrl+Shift+A',
},
```

**Note:** `exclusive: false` — accessibility checker can coexist with other tools. It performs scanning via `A11Y_SCAN_START`, but when active it also enables element hover-selection + an in-page Inspector overlay (mousemove listener + outline/beacon UI).

**Step 4:** `tsc -b` → No errors

**Commit:** `feat(a11y): register accessibilityChecker as Tool #13`

---

## Task 44: Add AccessibilityPanel to ToolRouter

**Files:**
- Modify: `src/sidepanel/components/ToolRouter.tsx`

**Step 1: Add import**

```typescript
import { AccessibilityPanel } from '../../components/AccessibilityChecker';
```

**Step 2: Add case to switch**

```tsx
case 'accessibilityChecker':
  return (
    <div className="mt-6 -m-4">
      <AccessibilityPanel onToggle={toolProps.onToggle} />
    </div>
  );
```

**Step 3:** `tsc -b` → No errors

**Commit:** `feat(a11y): add AccessibilityPanel to ToolRouter switch`

---

## Task 45: Add Scan Handler to Content Script

**Files:**
- Modify: `src/content/index.ts`

**Step 1: Add import**

```typescript
import { runAccessibilityScan } from './accessibility/scanOrchestrator';
```

**Step 2: Add message handler**

**Before** the `chrome.runtime.onMessage.addListener` call, add these module-level variables at the top of `src/content/index.ts` (alongside other module-level state like `activeTool`):

```typescript
// --- A11Y highlight state (module-level) ---
let activeHighlightTimer: ReturnType<typeof setTimeout> | null = null;
let activeHighlightCleanup: (() => void) | null = null;

function clearA11yHighlight(): void {
  if (activeHighlightTimer) { clearTimeout(activeHighlightTimer); activeHighlightTimer = null; }
  if (activeHighlightCleanup) { activeHighlightCleanup(); }
}
```

**Then**, in the `chrome.runtime.onMessage.addListener` callback, add:

```typescript
if (request.action === 'A11Y_SCAN_START') {
  const settings = request.settings;
  runAccessibilityScan(settings)
    .then((report) => {
      // Send report directly via sendResponse (single channel, no race condition)
      sendResponse({ success: true, report });
    })
    .catch((error) => {
      sendResponse({ success: false, error: (error as Error).message });
    });
  return true; // async response
}

if (request.action === 'A11Y_SCAN_ELEMENT') {
  // Highlight the specified element on the page
  const selector = request.selector;
  try {
    // Clear any previous highlight before applying new one
    clearA11yHighlight();

    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Save original styles and apply highlight
      const htmlEl = el as HTMLElement;
      const prevOutline = htmlEl.style.outline;
      const prevOutlineOffset = htmlEl.style.outlineOffset;
      htmlEl.style.outline = '3px solid #DC3545';
      htmlEl.style.outlineOffset = '2px';

      // Store cleanup reference (cleared by next highlight or A11Y_SCAN_CLEAR)
      activeHighlightCleanup = () => {
        htmlEl.style.outline = prevOutline;
        htmlEl.style.outlineOffset = prevOutlineOffset;
        activeHighlightCleanup = null;
      };

      // Auto-clear after 3 seconds
      activeHighlightTimer = setTimeout(() => {
        clearA11yHighlight();
      }, 3000);
    }
    sendResponse({ success: true });
  } catch {
    sendResponse({ success: false });
  }
  return true;
}

if (request.action === 'A11Y_SCAN_CLEAR') {
  clearA11yHighlight();
  sendResponse({ success: true });
  return true;
}
```

**Step 3:** `tsc -b && npm run build` → Both succeed

**Commit:** `feat(a11y): add accessibility scan handler to content script`

---

## Task 46: Add Context Menu Entry

**Files:**
- Modify: `src/background/index.ts`

Add to the TOOLS array used for context menu creation:

```typescript
{
  id: 'accessibilityChecker',
  title: '접근성 검사',
}
```

**Commit:** `feat(a11y): add accessibility checker context menu entry`

---

## Task 47: Add activateTool Case

**Files:**
- Modify: `src/content/index.ts`

In the `activateTool()` switch statement, add a case for `'accessibilityChecker'`:

```typescript
case 'accessibilityChecker':
  // Enable hover selection mode + Inspector overlay.
  // The scan itself is triggered via A11Y_SCAN_START message, not via tool activation.
  addA11ySelectionListeners();
  break;
```

**Commit:** `feat(a11y): add accessibilityChecker case to activateTool switch`
