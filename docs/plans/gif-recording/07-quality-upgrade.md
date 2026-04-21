# Phase 7: GIF Quality Upgrade (Tasks 24-30)

ShareX-comparative quality plan to produce cleaner high-resolution GIFs and stable recordings up to ~30 seconds.

---

## Why This Phase Exists

Current implementation is stable, but visual quality drops on complex pages and long clips because of three major bottlenecks:

1. **Per-frame palette quantization** in `src/offscreen/gifEncoder.ts` causes color flicker and gradient instability.
2. **Capture source is JPEG quality 80** in `src/background/recording.ts`, introducing compression artifacts before GIF encoding.
3. **Resolution/FPS ceiling and no adaptive budget control** makes 20-30s captures either soft or overly large.

ShareX handles this better by using a two-stage pipeline with FFmpeg palette generation + palette application and explicit GIF encoding options.

---

## Comparative Analysis (ShareX vs KLIC)

| Area | ShareX approach | Current KLIC approach | Gap |
|------|------------------|-----------------------|-----|
| Encode strategy | Two-stage, then GIF encode with palette filters (`palettegen` + `paletteuse`) | Two-stage capture->encode, but palette is regenerated each frame | Palette instability, color flicker |
| Source frame quality | Lossless/intermediate video path available | `captureVisibleTab({ format: 'jpeg', quality: 80 })` | Pre-encode artifact accumulation |
| GIF options | Dedicated dither/stats controls (`GIFStatsMode`, `GIFDither`, etc.) | Only `maxColors` (64/128/256) | Limited quality tuning |
| Long-duration handling | Mature pipeline and progress handling | Stable fire-and-forget + offscreen, but no quality/size budget governor | 30s quality-size tradeoff unmanaged |

Reference:
- ShareX: `ShareX/ScreenRecordManager.cs`, `ShareX.ScreenCaptureLib/ScreenRecording/ScreenRecorder.cs`, `ShareX.ScreenCaptureLib/ScreenRecording/FFmpegOptions.cs`
- KLIC: `src/background/recording.ts`, `src/offscreen/gifEncoder.ts`, `src/components/Screenshot/GifRecordingTab.tsx`

---

## Target Outcome

Deliver a "high quality" path that can produce usable GIFs for **up to ~30 seconds** with visibly better text/edge clarity and reduced color flicker.

### Quality Targets

- 30s recording succeeds without extension crash/hang on normal pages.
- High-quality mode has lower visible banding/flicker than current baseline.
- Resolution options include at least one tier above 800px (e.g. 960 / 1280).
- User sees expected size estimate and guardrails before starting recording.

### Profile-to-Downshift Mapping (Required)

To avoid ambiguity between Task 24 profiles and Task 28 budget downshift, use fixed rules:

| Profile | Capture format | Default colors | Default fps | Budget downshift order |
|---------|----------------|----------------|-------------|------------------------|
| `highFidelity` | PNG | 256 | 12 | width -> fps -> colors (`256 -> 128`) |
| `balanced` | JPEG (high quality) | 128 | 10 | width -> fps -> colors (`128 -> 64`) |

Constraint:
- Never auto-upshift quality settings during recording.
- Auto-downshift can happen only before recording starts (preflight) or at hard memory limit (Task 29).

### Recommended Presets (Default)

Set these as first-class defaults in UI/help text:

- **Quality-first 30s (default):** `960w / 10fps / balanced / 128 colors`
- **Size-safe 30s:** `800w / 8fps / balanced / 64 colors`
- **Detail-first short clip:** `1280w / 10fps / highFidelity / 256 colors` (recommend <=15s)

---

## Task 24: Add High-Resolution + Quality Profile Model

**Files:**
- Modify: `src/types/recording.ts`
- Modify: `src/hooks/useGifSettings.ts`
- Modify: `src/components/Screenshot/GifRecordingTab.tsx`

**Implement:**
- Extend width choices beyond `320 | 640 | 800` to include at least `960` and `1280`.
- Add quality profile concept (e.g. `balanced`, `highFidelity`) separate from simple color count.
- Keep backward compatibility for previously stored settings.

**Acceptance:**
- Existing users with old settings load without crash.
- UI can select higher resolution explicitly.

---

## Task 25: Improve Capture Source Fidelity

**Files:**
- Modify: `src/background/recording.ts`

**Implement:**
- Introduce capture format strategy:
  - High-fidelity profile: `format: 'png'`
  - Balanced profile: tuned JPEG (higher quality than current 80)
- Keep `isCapturing`/`isStopping` guards unchanged.

**Acceptance:**
- High-fidelity mode visibly reduces block artifacts on text and UI edges.
- No regression in recording stability.

---

## Task 26: Global Palette Pipeline (ShareX-inspired)

**Files:**
- Modify: `src/offscreen/gifEncoder.ts`
- Create: `src/offscreen/paletteBuilder.ts`

**Implement:**
- Replace per-frame `quantize()` with a two-pass palette approach:
  1. Sample N frames (uniformly across timeline) to build one global palette.
  2. Encode all frames using that shared palette.
- Add optional dithering strategies for high-fidelity profile.

**Acceptance:**
- Reduced color flicker compared to per-frame palette baseline.
- Encoding still reports progress and completes reliably.

---

## Task 27: Motion-Aware Frame Reduction (Quality-preserving)

**Files:**
- Modify: `src/offscreen/gifEncoder.ts`
- Create: `src/offscreen/frameDiff.ts`

**Implement:**
- Compute lightweight frame-difference score.
- Skip near-identical frames and accumulate delay into next kept frame.
- Enable only when it improves size/quality tradeoff (profile-gated).

**Acceptance:**
- Long static segments produce smaller files with no visible stutter.
- Delay continuity preserved (playback timing remains natural).

---

## Task 28: Size Budget Governor for 30s Recordings

**Files:**
- Modify: `src/utils/gif/estimateGifSize.ts`
- Modify: `src/components/Screenshot/GifRecordingTab.tsx`

**Implement:**
- Add target size budget bands (example: 15MB/25MB/35MB).
- Preflight warns user when settings likely exceed budget.
- Auto-suggest downshift order: width -> fps -> colors.

**Acceptance:**
- 30s high-res settings provide clear warning/suggestion before record.
- Estimate reflects profile differences (PNG/high-fidelity vs balanced).

---

## Task 29: Encoding Memory Safeguards

**Files:**
- Modify: `src/offscreen/gifEncoder.ts`
- Modify: `src/background/recording.ts`

**Implement:**
- Process frames in chunks to avoid unbounded memory spikes.
- Ensure intermediate buffers are released aggressively after each chunk.
- Add background-side memory guard for `frameBuffer` (capture-time):
  - track buffered byte estimate while recording,
  - apply soft/hard limits,
  - auto-downshift capture settings or early-stop with user-visible reason when limit is exceeded.
- Keep `GIF_ENCODE_COMPLETE` contract unchanged.

**Acceptance:**
- 30s encoding avoids tab/offscreen instability on average hardware.
- 30s capture avoids runaway background memory growth before encoding starts.
- No change in message protocol observed by side panel.

---

## Task 30: Verification Matrix for Quality and Duration

**Files:**
- Modify: `docs/plans/gif-recording/06-verification.md`

**Add manual matrix:**
- 10s @ 800w / 15fps / high
- 20s @ 960w / 12fps / high-fidelity
- 30s @ 960w / 10fps / balanced
- 15s @ 1280w / 10fps / high-fidelity

**Measure per case:**
- Encode success/failure
- File size
- Visual checks: text edge clarity, gradient banding, color flicker
- Time-to-download

**Acceptance:**
- At least one 30s preset passes with acceptable visual quality and stable completion.

---

## Scope Guardrails

- Do NOT add server-side processing.
- Do NOT replace `gifenc` immediately unless quality target is impossible after Phase 7 tasks.
- Do NOT remove existing fire-and-forget/offscreen readiness safeguards.

---

## Risk Notes

| Risk | Impact | Mitigation |
|------|--------|------------|
| PNG capture increases memory/transfer size | High | Profile-based toggle + budget governor |
| Global palette harms scenes with abrupt color shifts | Medium | Hybrid sampling + fallback to segmented palette mode |
| Frame diff introduces timing jitter | Medium | Delay accumulation and strict min-delay clamp |

---

## Definition of Done

- Quality upgrade tasks 24-30 implemented.
- `npm run lint` and `npm run build` pass.
- Manual verification matrix recorded with before/after comparison notes.
- Documented presets for "quality-first 30s" and "size-safe 30s" in UI/help text.
