# GIF Recording Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GIF screen recording capability to the KLIC-Tool Chrome Extension, integrated as a tab alongside existing screenshot functionality.

**Architecture:** 4-component model following Chrome MV3 constraints: Side Panel (React UI with Screenshot/GIF tabs) -> Background Service Worker (frame capture orchestrator via `captureVisibleTab` + `setInterval`) -> Offscreen Document (Canvas + gifenc encoding, the only context with DOM access) -> Content Script (recording indicator overlay). ShareX-inspired 2-pass pattern: collect frames first, encode GIF post-recording.

**Tech Stack:** React 19, TypeScript 5.9, gifenc (~8KB GIF encoder), Chrome Extension MV3 APIs (offscreen, downloads, tabs.captureVisibleTab), shadcn/ui Tabs/Slider/Select/Progress, Vite 7, vitest + jest-chrome

---

## Logical Review of Design Document

Before implementation, the following issues in `docs/plans/gif-recording-design.md` were identified and are addressed in this plan:

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | `estimateGifSize()` referenced in GifRecordingTab but never defined | HIGH | Phase 2 Task 7 creates utility function |
| 2 | `captureVisibleTab` callback overlap — if capture takes >interval ms, captures queue | HIGH | Phase 3 Task 10 adds `isCapturing` guard flag |
| 3 | Offscreen Document never closed after encoding (memory leak) | MEDIUM | Phase 3 Task 10 adds `chrome.offscreen.closeDocument()` |
| 4 | Existing `RecordingPanel.tsx` not referenced in design | LOW | Phase 5 Task 20에서 `@deprecated` 주석 추가 + barrel export 미포함 |
| 5 | `onValueChange` destructuring could yield `undefined` | LOW | Phase 5 Task 16 adds guard |
| 6 | Progress relay: `ENCODING_PROGRESS` from Offscreen broadcasts to all listeners including Side Panel | INFO | Documented in Phase 5 Task 15 — `useGifRecording` listens directly |
| 7 | `chrome.downloads.download` with large data URLs (10MB+) | INFO | Within Chrome's practical limit (~30MB); max scenario is ~11MB data URL |
| 8 | `<Progress>` 컴포넌트 (`@/components/ui/progress`) 미설치 | CRITICAL | Phase 1 Task 6에 `npx shadcn@latest add progress` 추가 |
| 9 | `GIF_ENCODE_COMPLETE` 메시지를 아무도 전송하지 않음 → 인코딩 후 UI 정지 | CRITICAL | Offscreen이 인코딩 완료 시 `GIF_ENCODE_COMPLETE` 직접 전송 (fire-and-forget 패턴) |
| 10 | `ensureOffscreenDocument()` 후 즉시 메시지 전송 → offscreen 리스너 미등록 경쟁 상태 | MEDIUM | Phase 3 Task 10에 `waitForOffscreenReady()` ping-pong 메커니즘 추가 |
| 11 | `height = width * 0.75` 하드코딩 → 16:9 뷰포트에서 GIF 찌그러짐 | MEDIUM | Phase 5 Task 15에서 content script `GET_PAGE_DIMENSIONS`로 실제 종횡비 조회 |
| 12 | `GIF_RECORDING_STATUS`, `GIF_GET_FRAME_COUNT` 상수 누락 (코드에서 사용하나 정의 안 됨) | LOW | Phase 1 Task 2 상수 목록에 추가 |
| 13 | ScreenshotPanel이 ScreenshotTab 리팩토링 후 데드 코드로 잔존 | LOW | Phase 5 Task 20 barrel export에서 deprecated 표기 |
| 14 | `ensureOffscreenDocument()`에 동시 생성 가드 없음 → 동시 `startRecording` 호출 시 Chrome 에러 (공식 docs 패턴 미적용) | LOW | Phase 3 Task 10에 `creatingOffscreen` Promise 가드 추가 |
| 15 | `captureVisibleTab` 콜백 스타일 (MV2 레거시) → MV3 Promise 스타일 불일치 | LOW | Phase 3 Task 10에서 `.then().catch()` Promise 체인으로 교체 |
| 16 | **`offscreen.html` classic script에서 ESM 로드 불가** — Vite는 ES module 출력하지만 `public/offscreen.html`의 `<script>` 태그는 classic script | **CRITICAL** | `offscreen.html`을 프로젝트 루트로 이동, Vite HTML entry로 등록 (`<script type="module">`) |
| 17 | **ScreenshotTab에서 default export 컴포넌트를 named import** — `{ CaptureButton }` 등이 컴파일 에러 | **CRITICAL** | `import CaptureButton from './CaptureButton'` 등 default import로 수정 |
| 18 | **프레임별 `sendMessage` 브로드캐스트 성능 병목** — 40KB×15FPS가 모든 extension context에 전달 | **HIGH** | 프레임을 background에 버퍼링 후 인코딩 시 일괄 전송 (`GIF_SET_FRAMES`) |
| 19 | **Service Worker 인코딩 대기 중 종료 위험** — `await sendMessage(ENCODE_GIF)` 가 30-60초+ 대기 | **HIGH** | Fire-and-forget 패턴으로 전환. Offscreen이 `GIF_ENCODE_COMPLETE` 전송 |
| 20 | **`stopRecording()` 후 pending capture 콜백이 프레임 추가** — clearInterval 후에도 진행 중인 captureVisibleTab 콜백이 실행 | **HIGH** | `isStopping` 플래그 추가, capture 콜백에서 확인 |
| 21 | **Side Panel 재오픈 시 녹화 상태 동기화 누락** — hook이 INITIAL_STATE로 시작 | **MEDIUM** | `useGifRecording` mount 시 `GIF_RECORDING_STATUS` 조회 추가 |
| 22 | `RecordingPanel.tsx` 미처리 데드 코드 | MEDIUM | Phase 5 Task 20에서 `@deprecated` 표기 + 삭제 안내 |

---

## Phase Index

| Phase | File | Tasks | Description |
|-------|------|-------|-------------|
| 1 | [01-infrastructure.md](./01-infrastructure.md) | 1-6 | Types, constants, manifest, offscreen HTML, vite config, gifenc install |
| 2 | [02-offscreen-encoding.md](./02-offscreen-encoding.md) | 7-9 | GIF size estimator, gifEncoder module, offscreen entry point |
| 3 | [03-background-recording.md](./03-background-recording.md) | 10-11 | Recording orchestrator, background message handler integration |
| 4 | [04-content-indicator.md](./04-content-indicator.md) | 12-13 | Recording indicator, content script message handler integration |
| 5 | [05-ui-components.md](./05-ui-components.md) | 14-20 | Hooks, GifRecordingTab, ScreenshotTab, CapturePanel, ToolRouter, barrel exports |
| 6 | [06-verification.md](./06-verification.md) | 21-23 | gifenc types, full build verification, manual E2E checklist |
| 7 | [07-quality-upgrade.md](./07-quality-upgrade.md) | 24-30 | ShareX-comparative quality upgrade for high-res ~30s GIF recording |

---

## Pre-requisites

```bash
# Verify current build is clean
npm run build
npm run lint
```

---

## File Change Summary

| File | Change | Phase |
|------|--------|-------|
| `src/types/recording.ts` | Create | 1 |
| `src/types/__tests__/recording.test.ts` | Create | 1 |
| `src/constants/messages.ts` | Modify (add GIF actions) | 1 |
| `public/manifest.json` | Modify (add permissions) | 1 |
| `offscreen.html` (project root) | Create | 1 |
| `vite.config.ts` | Modify (add offscreen entry) | 1 |
| `package.json` | Modify (gifenc dependency) | 1 |
| `src/utils/gif/estimateGifSize.ts` | Create | 2 |
| `src/utils/gif/__tests__/estimateGifSize.test.ts` | Create | 2 |
| `src/offscreen/gifEncoder.ts` | Create | 2 |
| `src/offscreen/index.ts` | Create | 2 |
| `src/offscreen/gifenc.d.ts` | Create (if needed) | 2 |
| `src/background/recording.ts` | Create | 3 |
| `src/background/index.ts` | Modify (add GIF handlers) | 3 |
| `src/content/recording/recordingIndicator.ts` | Create | 4 |
| `src/content/index.ts` | Modify (add indicator handlers) | 4 |
| `src/hooks/useGifSettings.ts` | Create | 5 |
| `src/hooks/__tests__/useGifSettings.test.ts` | Create | 5 |
| `src/hooks/useGifRecording.ts` | Create | 5 |
| `src/components/Screenshot/GifRecordingTab.tsx` | Create | 5 |
| `src/components/Screenshot/ScreenshotTab.tsx` | Create | 5 |
| `src/components/Screenshot/CapturePanel.tsx` | Create | 5 |
| `src/sidepanel/components/ToolRouter.tsx` | Modify (CapturePanel) | 5 |
| `src/components/Screenshot/index.ts` | Modify (new exports) | 5 |

| `src/components/ui/progress.tsx` | Create (via shadcn CLI) | 1 |

**Total: 25 files (16 new, 9 modified)**
