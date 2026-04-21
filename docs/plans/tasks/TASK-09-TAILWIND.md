# 도구 #9: 테일윈드 스캔 - 완전 태스크 분해

**총 태스크**: 35개
**예상 시간**: 14-17시간 (1.5-2일)
**작성일**: 2026-02-09

---

## 📑 목차

- [개요](#개요)
- [완료 체크리스트](#완료-체크리스트)
- [Phase 1: 기반 설정](./TASK-09-PHASE1.md)
- [Phase 2: Tailwind 감지](./TASK-09-PHASE2.md)
- [Phase 3: CSS → Tailwind 변환](./TASK-09-PHASE3.md)
- [Phase 4: Config 추출](./TASK-09-PHASE4.md)
- [Phase 5: Storage](./TASK-09-PHASE5.md)
- [Phase 6: React 컴포넌트](./TASK-09-PHASE6.md)
- [Phase 7: 테스트](./TASK-09-PHASE7.md)

---

## 개요

테일윈드 스캔 도구는 페이지에서 Tailwind CSS 사용을 분석하고 CSS를 Tailwind 클래스로 변환하는 개발자 도구입니다.

### 주요 기능

1. **Tailwind 감지**: 페이지에서 Tailwind 사용 여부 및 버전 감지
2. **클래스 분석**: Tailwind 클래스 추출 및 카테고리 분류
3. **CSS → Tailwind 변환**: CSS 속성을 Tailwind 클래스로 변환
4. **Config 추출**: Tailwind 설정 파일 추론
5. **JIT 모드 감지**: JIT 모드 사용 여부 확인
6. **임의 값 분석**: Arbitrary Value 사용 패턴 분석

### Phase 개요

| Phase | 태스크 | 시간 | 설명 |
|-------|-------|------|------|
| Phase 1 | 6개 | 2시간 | 타입 정의, 상수, 기본 설정 |
| Phase 2 | 10개 | 5시간 | Tailwind 감지 및 분석 |
| Phase 3 | 8개 | 4시간 | CSS → Tailwind 변환 |
| Phase 4 | 4개 | 2시간 | 설정 추출 |
| Phase 5 | 2개 | 1시간 | Storage |
| Phase 6 | 4개 | 2.5시간 | React 컴포넌트 |
| Phase 7 | 1개 | 30분 | 테스트 |

---

## 완료 체크리스트

### Phase 1: 기반 설정 (6개 태스크)
- [ ] Task #9.1: 타입 정의 (`src/types/tailwindScanner.ts`)
- [ ] Task #9.2: Storage 상수
- [ ] Task #9.3: 메시지 액션
- [ ] Task #9.4: CSS 클래스
- [ ] Task #9.5: 에러 메시지
- [ ] Task #9.6: 기본 설정

### Phase 2: Tailwind 감지 (10개 태스크)
- [ ] Task #9.7: 유효성 검사
- [ ] Task #9.8: 클래스 추출
- [ ] Task #9.9: 버전 감지
- [ ] Task #9.10: 클래스 파싱
- [ ] Task #9.11: 카테고리 분석
- [ ] Task #9.12: 클래스 검증
- [ ] Task #9.13: 임의 값 찾기
- [ ] Task #9.14: JIT 모드 감지
- [ ] Task #9.15: 커스텀 클래스 추출
- [ ] Task #9.16: 사용 분석

### Phase 3: CSS → Tailwind 변환 (8개 태스크)
- [ ] Task #9.17: 기본 변환
- [ ] Task #9.18: Padding 변환
- [ ] Task #9.19: Margin 변환
- [ ] Task #9.20: 색상 변환
- [ ] Task #9.21: Font Size 변환
- [ ] Task #9.22: Border Radius 변환
- [ ] Task #9.23: Display 변환
- [ ] Task #9.24: 변환 리포트

### Phase 4: Config 추출 (4개 태스크)
- [ ] Task #9.25: 설정 추출
- [ ] Task #9.26: 색상 추출
- [ ] Task #9.27: 스페이싱 추출
- [ ] Task #9.28: 폰트 크기 추출

### Phase 5: Storage (2개 태스크)
- [ ] Task #9.29: Storage CRUD
- [ ] Task #9.30: 히스토리 관리

### Phase 6: React 컴포넌트 (4개 태스크)
- [ ] Task #9.31: TailwindScannerPanel
- [ ] Task #9.32: ScanResults
- [ ] Task #9.33: ConversionSuggestions
- [ ] Task #9.34: ConfigExtractor

### Phase 7: 테스트 (1개 태스크)
- [ ] Task #9.35: 단위 테스트 (80%+ 커버리지)

---

**다음 단계**: [Phase 1: 기반 설정](./TASK-09-PHASE1.md) 에서 시작하세요.
