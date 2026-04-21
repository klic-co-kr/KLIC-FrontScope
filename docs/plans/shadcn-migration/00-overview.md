# shadcn/ui + Dark Mode + Multi-Theme + i18n Migration

> Date: 2026-02-11
> Status: ✅ Complete
> Actual Duration: 1일 (shadcn) + 1일 (i18n)

## Overview

KLIC-Tool Chrome Extension에 shadcn/ui 컴포넌트 시스템과 Light/Dark/System 모드, 멀티 액센트 테마, 그리고 한국어/영어 다국어 지원을 도입한다.

### Requirements

#### shadcn/ui & Theme
- shadcn/ui 전체 마이그레이션
- Dark mode: System 기본 (light/dark/system 선택 가능)
- Multi accent theme: blue(기본), amber, green, violet, rose
- Tailwind CSS v4 공식 패턴 (`@theme inline`, oklch, CSS-first config)
- Chrome Storage 기반 테마 저장/복원
- Chrome MV3 CSP 준수

#### i18n (다국어)
- 한국어, 영어 지원
- 브라우저 언어 자동 감지 + 수동 변경
- 전체 UI 다국어 (도구 이름, 설명, 에러 메시지, 토스트, 설정, manifest)
- TypeScript 자동 완성 지원

### Tech Stack

- shadcn/ui (New York style)
- Tailwind CSS v4
- oklch color space
- React 19
- TypeScript 5.9
- Chrome Extension Manifest V3
- **i18n**: react-i18next, i18next-typescript-generator

### Architecture

```
4 Entry Points:
├── popup (index.html)          → ThemeProvider + I18nextProvider + theme-init.js
├── sidepanel (sidepanel.html)  → ThemeProvider + I18nextProvider + theme-init.js
├── background                  → i18next (core only, no React)
└── content script              → i18next (core only, isolated world)

i18n Structure:
├── src/i18n/
│   ├── locales/
│   │   ├── ko.json       # 한국어 번역
│   │   └── en.json       # 영어 번역
│   ├── config.ts         # 공통 i18n 설정
│   ├── react.ts          # React 용 (sidepanel, popup)
│   ├── core.ts           # 코어 용 (background, content)
│   └── types.ts          # 자동 생성 타입
└── public/_locales/       # 빌드 시 생성 (manifest용)
```

### Accent Themes

| Theme | Primary (Light) | Primary (Dark) | Foreground (Light) | Foreground (Dark) |
|-------|-----------------|----------------|--------------------|-------------------|
| Blue | oklch(0.55 0.22 264) | oklch(0.65 0.24 264) | oklch(0.98 0 0) | oklch(0.15 0.01 275) |
| Amber | oklch(0.70 0.19 70) | oklch(0.75 0.17 70) | oklch(0.20 0 0) | oklch(0.15 0.01 275) |
| Green | oklch(0.58 0.19 149) | oklch(0.68 0.18 149) | oklch(0.98 0 0) | oklch(0.15 0.01 275) |
| Violet | oklch(0.56 0.24 292) | oklch(0.66 0.23 292) | oklch(0.98 0 0) | oklch(0.15 0.01 275) |
| Rose | oklch(0.60 0.23 16) | oklch(0.70 0.22 16) | oklch(0.98 0 0) | oklch(0.15 0.01 275) |

### Semantic Colors (Accent Independent)

| Color | Light | Dark |
|-------|-------|------|
| Warning | oklch(0.769 0.188 70.08) | oklch(0.82 0.16 70.08) |
| Success | oklch(0.627 0.194 149) | oklch(0.72 0.17 149) |
| Info | oklch(0.623 0.214 259) | oklch(0.72 0.19 259) |
| Destructive | oklch(0.65 0.24 25) | oklch(0.60 0.22 25) |

## Phase Structure

### shadcn/ui 마이그레이션 (11일)

| Phase | Duration | Description |
|-------|----------|-------------|
| [Phase 0](./01-phase-0-infrastructure.md) | 1일 | 인프라 셋업 |
| [Phase 1](./02-phase-1-foundation.md) | 2일 | shadcn 기본 컴포넌트 + 공통 UI |
| [Phase 2](./03-phase-2-simple-panels.md) | 2일 | 단순 도구 패널 (5개) |
| [Phase 3](./04-phase-3-complex-panels.md) | 2일 | 복합 도구 패널 (4개) |
| [Phase 4](./05-phase-4-tabbed-panels.md) | 3일 | 탭 기반 복합 도구 (3개) |
| [Phase 5](./06-phase-5-finalization.md) | 1일 | 마무리 |

### i18n 다국어 지원 (3일)

| Phase | Duration | Description |
|-------|----------|-------------|
| [Phase i18n-0](./20-i18n-0-setup.md) | 1일 | i18n 인프라 셋업 |
| [Phase i18n-1](./21-i18n-1-ui-migration.md) | 1일 | UI 텍스트 번역 |
| [Phase i18n-2](./22-i18n-2-finalization.md) | 1일 | 마무리 및 테스트 |

**Total: 14 days (11 + 3)**

## Quick Start

```bash
# 1. Create feature branch
git checkout -b feature/shadcn-migration

# 2. Start with Phase 0
# See: ./01-phase-0-infrastructure.md
```

## Checklist

### shadcn/ui Migration ✅
- [x] Phase 0: 인프라 셋업 완료
- [x] Phase 1: shadcn 기본 컴포넌트 + 공통 UI 완료
- [x] Phase 2: 단순 도구 패널 완료
- [x] Phase 3: 복합 도구 패널 완료
- [x] Phase 4: 탭 기반 복합 도구 완료
- [x] Phase 5: 마무리 및 테스트 완료

### i18n Internationalization ✅
- [x] Phase i18n-0: i18n 인프라 셋업 완료
- [x] Phase i18n-1: UI 텍스트 번역 완료
- [x] Phase i18n-2: 마무리 및 테스트 완료

## References

- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui Manual Installation](https://ui.shadcn.com/docs/installation/manual)
- [shadcn/app-tailwind-v4 Reference Repo](https://github.com/shadcn/app-tailwind-v4)
