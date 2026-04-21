# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KLIC-FrontScope is a Chrome Extension (Manifest V3) providing 14 frontend development tools in a Side Panel interface. Built with React 19, TypeScript 6, Vite 8 (Rolldown), and Tailwind CSS 4.

## Development Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # tsc -b && vite build → outputs to dist/
npm run lint         # ESLint (flat config, TS + React hooks + React Refresh)
tsc -b               # Type checking only (no emit)
npm run i18n:check   # Verify translation keys are synced between ko/en
npm run i18n:generate # Extract new translation keys via i18next-parser
npm run test:unit    # vitest run (currently one test file)
npm run test:e2e     # Playwright E2E tests
```

**Loading in Chrome:** `npm run build` → `chrome://extensions/` → Developer mode → Load unpacked → select `dist/`

After code changes: rebuild and click the reload icon on the extension card.

## Architecture

### Five Entry Points (vite.config.ts)

| Entry | File | Context | Chrome APIs |
|-------|------|---------|-------------|
| **popup** | `index.html` | Extension popup | Full |
| **sidepanel** | `sidepanel.html` | Main UI (Side Panel) | Full |
| **background** | `src/background/index.ts` | Service worker | Full (chrome.tabs, captureVisibleTab, debugger, etc.) |
| **content** | `src/content/index.ts` | Injected into web pages | Limited (chrome.runtime only, NO chrome.tabs/windows) |
| **offscreen** | `offscreen.html` | GIF encoding via Canvas API | None (DOM-capable context) |

**Critical constraint:** Content scripts run in an isolated world. They cannot access `chrome.tabs`, `chrome.windows`, or `chrome.scripting`. Use `chrome.runtime.sendMessage` to delegate privileged operations to the background script. Use `window.postMessage` to communicate with page JavaScript.

### Build Pipeline

Two custom Vite plugins handle Chrome Extension constraints:
1. `inlineContentScriptImports` — post-build plugin that recursively inlines all ES module imports in the content script into a single IIFE. Required because Chrome MV3 loads content scripts as classic (non-module) scripts.
2. `generateManifestLocales` — post-bundle plugin that creates `_locales/` directories for Chrome i18n.

### Message Flow

```
Side Panel ──chrome.tabs.sendMessage──► Content Script
                                              │
Content Script ──chrome.runtime.sendMessage──► Background (for privileged APIs)
                                              │
Content Script ──chrome.runtime.sendMessage──► Side Panel (TOOL_DATA, CONSOLE_LOG)
                                              │
Side Panel ──chrome.runtime.connect──────────► Background (port "sidepanel-session" for lifecycle)
```

**Key message actions:**
- `TOGGLE_TOOL` — Side Panel → Content: activate/deactivate a tool
- `TOOL_DATA` — Content → Side Panel: return scan results
- `CONSOLE_LOG` — Content → Side Panel: intercepted console output
- `PING` / `PONG` — Content script health check
- `CAPTURE_ELEMENT` / `CROP_AND_CAPTURE` — screenshot capture flow (background captures, content crops)

All message actions are centralized in `src/constants/messages.ts` as `MESSAGE_ACTIONS`.

**Important:** `TOGGLE_TOOL` handler must call `sendResponse()` and `return true` to keep the message channel open. Forgetting this is a recurring bug source.

### Tool System

14 tools defined in `src/sidepanel/constants/tools.ts`. Tool IDs are **camelCase**:

| Tool ID | Exclusive | Category |
|---------|-----------|----------|
| textEdit | yes | edit |
| screenshot | yes | capture |
| cssScan | yes | analyze |
| ruler | yes | measure |
| gridLayout | yes | measure |
| tailwind | yes | analyze |
| jsInspector | yes | analyze |
| accessibilityChecker | yes | analyze |
| componentInspector | yes | analyze |
| fontAnalyzer | no | analyze |
| palette | no | analyze |
| assets | no | utility |
| console | no | utility |
| resourceNetwork | no | utility |

**Exclusive tools:** Only one can be active at a time. Activating one deactivates others.
**Concurrent tools:** Can run alongside exclusive tools (fontAnalyzer, palette, assets, console, resourceNetwork).

**Tool panel lazy loading:** ToolRouter uses `lazyWithRetry()` for all tool panels with retry keys (e.g., `'klic:lazy-retry:asset-manager-panel'`).

### Content Script Architecture

`src/content/index.ts` is the unified message handler. One tool active at a time via `activeTool` state.

**Module organization:**
```
src/content/
├── index.ts                 # Unified message handler + tool activation switch
├── hover/hoverHandler.ts    # Shared hover overlay (screenshot, cssScan, tailwind, jsInspector)
├── consoleSpy/              # Console interception via page-injected script
├── assetManager/            # Asset extraction handlers
├── tailwind/                # Tailwind class detection + CSS-to-Tailwind conversion
├── gridLayout/              # Grid overlay, guidelines, viewport (standalone module)
├── componentInspector/      # React/component framework detection and inspection
├── accessibility/           # Accessibility scanning (KRDS guidelines)
├── resourceNetwork/         # Performance monitoring
├── recording/               # GIF recording area selector
└── textEdit.ts              # Inline text editing
```

**Dynamic imports:** `resourceNetwork` is loaded via `import()` to reduce initial bundle size. Due to the `inlineContentScriptImports` plugin, these imports are inlined at build time in production but work normally during dev.

### Background Script Architecture

- Uses `chrome.runtime.onConnect` with port name `sidepanel-session` to track side panel lifecycle
- When port disconnects (side panel closes), automatically deactivates the active tool
- `jsInspector.ts` uses Chrome Debugger Protocol (`chrome.debugger`) for script inspection
- `recording.ts` orchestrates GIF recording with the offscreen document

### Side Panel Architecture

**App.tsx** manages tool state and message sending:
1. `handleToolClick(toolId)` → manages exclusive tool switching → calls `switchTool()` for UI state → calls `sendToolMessage()` for content script
2. `sendToolMessage()` finds the active tab in the **current window** via `chrome.windows.getCurrent()` + `chrome.tabs.query()`, PINGs content script, injects if missing, then sends `TOGGLE_TOOL`
3. Supports modal mode via `?mode=modal&nonce=...&tool=...&tabId=...` query params (for context menu triggered actions)

**ToolRouter** (`src/sidepanel/components/ToolRouter.tsx`) routes `currentTool` to the correct panel component. All panels are lazy-loaded via `lazyWithRetry()`.

### Offscreen Document

Used for GIF encoding which requires Canvas API (unavailable in service workers):
- Handles batch frame transfer (`GIF_SET_FRAMES`), fire-and-forget encoding (`GIF_ENCODE`), and progress reporting
- Fire-and-forget pattern prevents service worker termination during long encoding jobs

### Screenshot Capture Flow

Background script handles the privileged capture:
1. Content sends `CAPTURE_ELEMENT` with `bounds` → background receives via `_sender.tab.id`
2. Background calls `chrome.tabs.captureVisibleTab()` (only available in background)
3. Background sends `CROP_AND_CAPTURE` with `dataUrl` + `bounds` to content
4. Content crops using Canvas API and returns the result

**Bounds must be viewport-relative** (from `getBoundingClientRect()`), scaled by `devicePixelRatio`. Do NOT add `scrollX/Y` — `captureVisibleTab` captures the viewport, not the full page.

### Chrome Storage

Uses `chrome.storage.local` with namespaced keys defined in `src/constants/storage.ts`:
- `assetManager:settings`, `cssScan:*`, `fontAnalyzer:*`
- `screenshot:collections`, `textEdit:history`, `ruler:measurements`
- `appStatus` (kill switch), `collectedLinks`
- `theme:mode`, `theme:accent`

### Console Spy

Console interception works by injecting `public/console-spy-main-world.js` into the page's main world to intercept console calls, then relaying them to the content script via `window.postMessage`.

## Theme System

KLIC-FrontScope uses a shadcn/ui-based theme system with support for light/dark modes and 5 accent themes.

### Mode Selection

- **Light**: Bright background
- **Dark**: Dark background
- **System**: Follows OS preference

### Accent Themes

| Accent | Primary (Light) | Primary (Dark) |
|--------|-----------------|-----------------|
| **Blue** (default) | oklch(0.55 0.22 264) | oklch(0.65 0.24 264) |
| **Amber** | oklch(0.70 0.19 70) | oklch(0.75 0.17 70) |
| **Green** | oklch(0.58 0.19 149) | oklch(0.68 0.18 149) |
| **Violet** | oklch(0.56 0.24 292) | oklch(0.66 0.23 292) |
| **Rose** | oklch(0.60 0.23 16) | oklch(0.70 0.22 16) |

### ThemeProvider

The `ThemeProvider` in `src/lib/theme-provider.tsx`:
- Manages theme state with `useTheme()` hook
- Syncs theme changes across multiple contexts (popup ↔ sidepanel)
- Applies theme classes to `document.documentElement`
- Listens to system preference changes

### FOUC Prevention

Chrome MV3 CSP prohibits inline scripts. Theme is initialized before React mount via `public/theme-init.js` → loaded in `<head>`, reads from `chrome.storage.local` and applies `dark` class and `data-theme` attribute immediately.

### Content Script Theme

Content scripts are injected into web pages and cannot access extension CSS variables. Theme is auto-detected from page background luminance via `src/content/utils/detectTheme.ts`. Use `createThemedToast()` for themed notifications.

### shadcn/ui Components

To add new components:
```bash
npx shadcn@latest add <component-name>
```

When styling components, use theme-aware Tailwind classes:
- `bg-background`, `bg-card`, `bg-muted`, `bg-primary`
- `text-foreground`, `text-muted-foreground`, `text-primary-foreground`
- `border-border`, `hover:bg-primary/90`
- `bg-destructive`, `bg-warning`, `bg-success`, `bg-info` (with corresponding `-foreground` variants)

## Key Patterns

### Adding a New Tool

1. Add type to `ToolType` union and entry to `ALL_TOOLS` in `src/sidepanel/constants/tools.ts`
2. Add `case` in `activateTool()` switch in `src/content/index.ts`
3. Add `case` in `ToolRouter` switch in `src/sidepanel/components/ToolRouter.tsx`
4. Add context menu entry in `src/background/index.ts` TOOLS array
5. If tool needs message actions, add to `src/constants/messages.ts`
6. Types in `src/types/`, utils in `src/utils/newTool/`, hooks in `src/hooks/newTool/`
7. Add i18n keys to both `src/i18n/locales/ko.json` and `src/i18n/locales/en.json`

### Window Targeting

When sending messages from the side panel, always use the **current window**:
```typescript
const currentWindow = await chrome.windows.getCurrent();
const [targetTab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
```
Never iterate all windows — this sends messages to the wrong browser window.

### Content Script Injection Fallback

Content scripts may not be loaded if the page was opened before the extension was installed. The side panel PINGs first, then injects via `chrome.scripting.executeScript` if needed.

### Message Constants Pattern

Message actions use `as const` objects rather than string enums — this is the project-wide pattern:
```typescript
export const MESSAGE_ACTIONS = {
  TOGGLE_TOOL: 'TOGGLE_TOOL',
  TOOL_DATA: 'TOOL_DATA',
  // ...
} as const;
```

### Content Script CSS

Content script UI (hover overlays, scan results) uses inline styles injected via JS, not extension CSS files — because content scripts share the page's CSS context.

## Build Notes

- Manifest: `public/manifest.json` → copied to `dist/`
- Build output: `dist/assets/{entry}.js` (background, content, sidepanel, popup, offscreen)
- Path alias: `@` → `./src`
- TypeScript config: split into `tsconfig.app.json` (app code, ES2020 target, strict) and `tsconfig.node.json` (Vite config, ES2023 target)
- Both configs use `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`, `moduleResolution: "bundler"`

## Testing

**Unit tests:** Co-located `__tests__/*.test.{ts,tsx}` using vitest + @testing-library/react. Config in `vitest.config.ts`.

**E2E tests:** `e2e/*.spec.ts` using Playwright. Config in `playwright.config.ts`.

## Manifest Permissions

`activeTab`, `scripting`, `storage`, `alarms`, `contextMenus`, `sidePanel`, `offscreen`, `downloads`, `debugger` + `host_permissions: ["<all_urls>"]`

**Note:** No `tabs` permission — tab URL access comes from `host_permissions: <all_urls>`.

## Internationalization

Korean and English supported. Translation files at `src/i18n/locales/{ko,en}.json`. Use `useTranslation()` hook in components. Run `npm run i18n:check` to verify keys are synced.
