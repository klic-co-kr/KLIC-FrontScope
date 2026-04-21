# Console Log Recovery + Categorized Card UI Plan

## Goal

- Restore Console tool capture so logs reliably appear in Side Panel.
- Render logs as categorized cards (warning/info/debug/object) similar to requested design.
- Unify duplicated console paths so runtime behavior and tests use the same implementation.

## Current Failure Analysis

### 1) Message action mismatch (high impact)

- `src/components/Console/ConsolePanel.tsx` sends `CONSOLE_TOGGLE_INTERCEPT`.
- `src/content/index.ts` has no handler for `CONSOLE_TOGGLE_INTERCEPT`.
- Active flow currently depends on `TOGGLE_TOOL` -> `activateTool('console')` -> `enableConsoleSpy(showToast)`.
- Result: one UI path can send a message that content script ignores.

### 2) Two console UIs are split (high impact)

- `src/sidepanel/components/ToolRouter.tsx` has an inline/local `ConsolePanel` using `toolData.logs`.
- `src/components/Console/ConsolePanel.tsx` uses `useConsoleStorage/useConsoleFilter/useConsoleStats`.
- Tests are built around the richer `src/components/Console/*` path, but runtime tool routing uses ToolRouter local panel.
- Result: behavior drift and "works in one path, broken in another" symptoms.

### 3) Payload model mismatch (medium impact)

- Current sidepanel message append is minimal: `{ level, content, time }` in `src/sidepanel/App.tsx`.
- Console domain model expects richer `ConsoleLog` (`id`, `timestamp`, `args`, `stackTrace`, `metadata`) in `src/types/console.ts`.
- Result: hard to classify object logs and render rich cards consistently.

### 4) Injection fragility risk on some pages (medium risk)

- `src/content/consoleSpy/consoleSpyHandler.ts` injects inline script via `script.textContent`.
- Some sites may block inline script in page context due to CSP/Trusted Types constraints.
- Result: Console spy may silently fail on stricter websites.

## Target UX (Requested)

- Card feed with clear per-entry type styling:
  - Warning card
  - Info card
  - Debug card
  - Object card (log args include object payload)
- Each card shows:
  - icon + label + timestamp
  - primary message text
  - optional object preview (collapsed/expandable)
  - dismiss action

## Implementation Plan

### Phase 1 - Stabilize capture trigger (must-do first)

1. Add `CONSOLE_TOGGLE_INTERCEPT` handling in `src/content/index.ts`.
2. Implement explicit enable/disable entrypoints in `src/content/consoleSpy/consoleSpyHandler.ts`:
   - `enableConsoleSpy(...)`
   - `disableConsoleSpy()`
   - avoid duplicate listener registration on repeated toggles.
3. Keep `TOGGLE_TOOL` compatibility path so existing tool activation still works.

Deliverable:
- Both activation paths (`TOGGLE_TOOL` and `CONSOLE_TOGGLE_INTERCEPT`) consistently control capture.

### Phase 2 - Unify UI path (remove split behavior)

1. Decide single runtime panel source of truth: `src/components/Console/*`.
2. Update `src/sidepanel/components/ToolRouter.tsx` console case to use shared Console panel component.
3. Remove or deprecate ToolRouter inline console panel implementation.

Deliverable:
- One console UI implementation used by runtime and tests.

### Phase 3 - Standardize data model for card rendering

1. Normalize incoming messages into `ConsoleLog` shape (at sidepanel ingestion boundary).
2. Preserve structured `args` for object logs.
3. Ensure storage hook path receives same normalized shape.

Deliverable:
- No mixed `{ level, content, time }` ad-hoc path for primary rendering.

### Phase 4 - Add categorized card renderer

1. Add derived `cardType` classification rule:
   - `error|warn|info|debug` from level
   - `object` when args contain non-null object/array payload
2. Implement card UI variants in `src/components/Console/LogEntry.tsx` (or a new `LogCard.tsx`).
3. Add compact object preview and expandable detail panel.

Deliverable:
- Requested visual classification style implemented with consistent type rules.

### Phase 5 - Hardening for page constraints

1. Add graceful fallback when spy injection fails (toast + status indicator).
2. Track intercept status in UI (enabled/disabled/error).
3. Avoid duplicate interception wrappers when toggled repeatedly.

Deliverable:
- Predictable behavior on strict pages and repeated toggles.

## Verification Plan

### Manual scenarios

1. Enable console capture and run in active tab:
   - `console.warn('Warning: This might cause issues')`
   - `console.info('Info: Process completed')`
   - `console.debug('Debug: Variable x = 42')`
   - `console.log('User object', { name: 'nico' })`
2. Confirm all entries appear immediately in Side Panel.
3. Confirm each entry uses correct card style/type.
4. Toggle off capture; verify no new logs stream.
5. Reload page and re-enable; verify no duplicate entries per call.

### Automated checks

- `npm run lint`
- `npm run build`
- Console component tests:
  - update/add tests in `src/components/Console/__tests__/ConsolePanel.test.tsx`
  - add classification tests for object card rendering.

## File-Level Worklist

- `src/content/index.ts`
- `src/content/consoleSpy/consoleSpyHandler.ts`
- `src/sidepanel/components/ToolRouter.tsx`
- `src/sidepanel/App.tsx`
- `src/components/Console/ConsolePanel.tsx`
- `src/components/Console/LogEntry.tsx` (or new `src/components/Console/LogCard.tsx`)
- `src/types/console.ts`
- `src/hooks/console/useConsoleStorage.ts`
- `src/hooks/console/useConsoleFilter.ts`
- `src/hooks/console/useConsoleStats.ts`
- `src/components/Console/__tests__/ConsolePanel.test.tsx`

## Risks and Mitigations

- Risk: breaking existing tool routing.
  - Mitigation: keep `TOGGLE_TOOL` path while introducing `CONSOLE_TOGGLE_INTERCEPT` handler.
- Risk: storage/state inconsistency during migration.
  - Mitigation: normalize logs at one ingestion point and keep backward compatibility mapper for old entries.
- Risk: CSP-restricted pages block injection.
  - Mitigation: explicit error state and fallback messaging in UI.

## Completion Criteria

- Console capture works from active tab reliably.
- Side panel renders categorized cards (warning/info/debug/object) with timestamps and expand details.
- Single console UI path is used in runtime.
- Lint/build pass and console tests updated for new behavior.
