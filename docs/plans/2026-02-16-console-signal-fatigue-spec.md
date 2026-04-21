# Console Signal Fatigue Reduction Spec

## Problem Statement

Console logs currently create high search fatigue due to indiscriminate stream volume.

- Low-signal `log/debug` entries bury high-signal `warn/error` entries.
- Repeated messages are shown as many separate rows.
- There is no dedicated "핵심요소" summary area for quick triage.
- Console implementation is split between two UI/data paths.

## Evidence (Current Code)

### Active constraints and gaps

1. Console data path mismatch

- `src/sidepanel/App.tsx` stores sidepanel console data as `{ level, content, time }[]` in `toolData.logs`.
- `src/types/console.ts` defines richer `ConsoleLog` with `id/timestamp/args/source/stackTrace/metadata/count`.
- Result: weak structure for object-aware triage and robust dedup fingerprints.

2. Duplicated UI path

- `src/sidepanel/components/ToolRouter.tsx` renders an inline local `ConsolePanel` for tool `console`.
- `src/components/Console/ConsolePanel.tsx` is a richer panel using `useConsoleStorage/useConsoleFilter/useConsoleStats`.
- Result: split behavior and incomplete reuse of advanced filtering/grouping.

3. Existing reusable filtering/grouping logic not fully applied to active sidepanel tool path

- `src/utils/console/filtering.ts` supports level/search/date/stack filters.
- `src/utils/console/grouping.ts` supports similarity grouping and `count` aggregation.
- `src/utils/console/interceptor.ts` supports structured capture (`args`, `stackTrace`, metadata, performance logs).
- Result: strong base exists but active console tab path is not using the full model end-to-end.

4. Trigger/action mismatch risk

- `src/components/Console/ConsolePanel.tsx` uses `CONSOLE_TOGGLE_INTERCEPT`.
- `src/content/index.ts` primarily activates spy through `TOGGLE_TOOL` -> `enableConsoleSpy(showToast)`.
- Result: potential dead-end if the wrong UI path is used.

## Target Outcome

Reduce search fatigue and surface key signals first by introducing:

1. Noise filtering defaults
- Default visible: `error`, `warn`, and object-heavy entries.
- Default collapsed: `log`, `debug`.

2. Dedup and grouping
- Time-window dedup (ex: 3-10 seconds configurable).
- Signature grouping: same level + normalized message + source key.
- Show grouped count (`xN`) and first/last observed timestamps.

3. Key-signal summary ("핵심요소")
- New error count since last clear.
- Top repeating signatures (Top 5).
- Last critical/warn occurrence.
- Most noisy source/module.

4. Fast triage controls
- One-click chips: `Errors only`, `Warnings+Errors`, `Objects`, `Hide debug`, `Only new`.
- Keyword include/exclude filter.
- Source file filter.

5. Object-first card rendering
- Object logs rendered as expandable card with concise preview.
- Keep raw JSON detail collapsible.

## Concrete Feature Spec

### A. Data model extension (minimal)

Keep `LogLevel` unchanged (`log|warn|error|info|debug`) and add derived presentation metadata.

- Add derived fields at ingestion or selector layer:
  - `fingerprint: string`
  - `signalType: 'text' | 'object' | 'performance'`
  - `firstSeen: number`
  - `lastSeen: number`
  - `count: number` (already supported in `ConsoleLog`)

Why minimal:
- avoids invasive enum change,
- reuses existing `ConsoleLog` shape,
- preserves compatibility with existing filters and stats.

### B. Dedup pipeline

1. Normalize message
- strip volatile values (timestamps/ids/uuids where possible).

2. Build fingerprint
- `{level}:{normalizedMessage}:{source.file or 'unknown'}`.

3. Aggregate in time window
- If same fingerprint appears within dedup window, increment `count`, update `lastSeen`.
- Else create new entry.

### C. Key-signal extraction rules

Priority score example:
- base score by level: `error=100`, `warn=70`, `info=40`, `log=20`, `debug=10`
- add `+20` if object contains keys `error|exception|code|status>=400`
- add `+min(count*2, 30)` for repeated bursts

Use score to drive:
- summary top list,
- default sort in "핵심요소" section.

### D. UI sections

1. `핵심요소` summary strip (top)
- cards: `새 에러`, `반복 경고`, `가장 noisy source`, `마지막 심각 이벤트`.

2. Log feed modes
- `All Logs`
- `핵심요소만`
- `Objects`

3. Row/card visuals
- warn/info/debug/error/object badge + icon
- grouped counter badge (`xN`)
- expandable object payload for object signalType

## File Mapping (Implementation Targets)

1. Capture and ingestion
- `src/content/consoleSpy/consoleSpyHandler.ts`
- `src/content/index.ts`
- `src/sidepanel/App.tsx`

2. Domain logic
- `src/types/console.ts`
- `src/utils/console/grouping.ts`
- `src/utils/console/filtering.ts`
- `src/hooks/console/useConsoleFilter.ts`
- `src/hooks/console/useConsoleStats.ts`

3. UI
- `src/sidepanel/components/ToolRouter.tsx` (remove split inline console path)
- `src/components/Console/ConsolePanel.tsx`
- `src/components/Console/LogEntry.tsx`
- `src/components/Console/LogList.tsx`

## Rollout Plan

### Phase 1 - Single console path
- Route console tool to one panel implementation only.

### Phase 2 - Structured ingestion
- Convert incoming simple payloads to internal `ConsoleLog` shape with defaults.

### Phase 3 - Dedup + signal scoring
- Add fingerprinted dedup window and score calculation.

### Phase 4 - Key-signal UI
- Add `핵심요소` summary and quick triage filter chips.

### Phase 5 - Verification
- Unit tests for dedup/signature grouping and score ordering.
- UI tests for filter chips and object cards.

## Verification Checklist

Manual
- `console.warn('W')` repeated 20 times -> one grouped card with `x20`.
- `console.log('User object', { name: 'nico', role: 'admin' })` -> object card with expandable payload.
- `console.debug(...)` hidden by default, visible when debug filter enabled.
- `핵심요소` mode shows only high-score entries.

Automated
- `npm run lint`
- `npm run build`
- console component tests for dedup/object/focus filters.

## External Patterns Referenced

1. OpenTelemetry log dedup processor
- https://opentelemetry.io/blog/2026/log-deduplication-processor/
- Pattern: dedup window + first/last seen + count.

2. Datadog log volume optimization
- https://www.datadoghq.com/knowledge-center/log-optimization/
- Pattern: source-side filtering, routing, and key-signal prioritization.

3. Grafana logs dedup strategy (schema-level concept)
- `grafana/grafana` references `LogsDedupStrategy` in logs schema usage.
- Pattern: configurable dedup strategy in viewer state.

4. Skyway SDK analytics log send priority
- `skyway/js-sdk` example logic sends `warn/error` immediately, others buffered.
- Pattern: severity-prioritized handling to improve signal responsiveness.

## Non-Goals

- No backend service introduction.
- No new storage engine; reuse current `chrome.storage.local` path.
- No destructive pruning of raw logs without grouped representation.
