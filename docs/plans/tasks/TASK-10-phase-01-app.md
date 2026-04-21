# Phase 1: 전체 통합 - App.tsx 통합 ⚠️ **수정됨 - 통합 작업**

**태스크 범위**: Task #10.1 ~ #10.8 (8개)
**예상 시간**: 3시간
**작업 유형**: 🔧 **통합 및 리팩토링 (신규 작성 아님)**

---

## ⚠️ 중요 공지

**이 Phase의 모든 컴포넌트는 이미 완벽히 구현되어 있습니다!**

작업은 "새로 만드는 것"이 아닌 **기존 App.tsx를 리팩토링**하여 이미 존재하는 컴포넌트들을 **통합**하는 것입니다.

---

## 📋 이미 구현된 컴포넌트 목록

✅ **모두 구현 완료 (2000+ 줄)**:

| 컴포넌트 | 경로 | 상태 | 코드 줄수 |
|---------|------|------|----------|
| ToolRouter | `src/sidepanel/components/ToolRouter.tsx` | ✅ 완료 | 317줄 |
| Layout | `src/sidepanel/components/Layout.tsx` | ✅ 완료 | 57줄 |
| Header | `src/sidepanel/components/Header.tsx` | ✅ 완료 | 84줄 |
| Footer | `src/sidepanel/components/Footer.tsx` | ✅ 완료 | 37줄 |
| SettingsPanel | `src/sidepanel/components/SettingsPanel.tsx` | ✅ 완료 | 353줄 |
| LoadingStates | `src/sidepanel/components/LoadingStates.tsx` | ✅ 완료 | 172줄 |
| ToastContainer | `src/sidepanel/components/ToastContainer.tsx` | ✅ 완료 | 133줄 |
| constants/tools | `src/sidepanel/constants/tools.ts` | ✅ 완료 | 194줄 |

**총**: ~1,350줄의 완성된 코드가 이미 존재

---

## Task #10.1: App.tsx 리팩토링 (Main 작업)

- **파일**: `src/sidepanel/App.tsx`
- **시간**: 90분
- **작업**: 🔧 **리팩토링 (기존 260줄 → 새 구조로 변경)**

### 현재 상태 (App.tsx):
```typescript
// ❌ 기존: 모든 UI를 직접 렌더링 (260줄)
// - Layout, ToolRouter 사용 안 함
// - 인라인 JSX 직접 작성
// - 설정 모달 인라인 구현
```

### 목표 구조:
```typescript
// ✅ 새로운 구조: 컴포넌트 조합 (~150줄)
import { Layout } from './components/Layout';
import { SettingsPanel } from './components/SettingsPanel';
import { ToastProvider } from './components/ToastContainer';
import { ErrorBoundary } from './components/LoadingStates';
import { ToolType, ALL_TOOLS } from './constants/tools';

function App() {
  // 상태 관리 (기존 로직 유지)
  const [state, setState] = useState<AppState>({...});

  // 메시지 리스너 (기존 로직 유지)
  useEffect(() => {...}, []);

  // 도구 토글 (기존 로직 유지)
  const toggleTool = (toolId: ToolType) => {...};

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Layout
          currentTool={state.currentTool}
          tools={state.tools}
          toolData={state.toolData}
          activeToolCount={getActiveToolCount()}
          onToggle={toggleTool}
          onMarkUnsaved={markUnsavedChanges}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          onOpenSettings={() => setState({...state, showSettings: true})}
          onDeactivateAll={deactivateAllTools}
        />

        <SettingsPanel
          isOpen={state.showSettings}
          onClose={() => setState({...state, showSettings: false})}
        />
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### 작업 단계:
1. ✅ 기존 App.tsx 백업
2. ✅ Layout, ToolRouter 등 import 추가
3. ✅ JSX를 Layout 컴포넌트로 교체
4. ✅ 기존 로직(상태, 메시지, 토글) 유지
5. ✅ ErrorBoundary, ToastProvider로 감싸기
6. ✅ 테스트: 모든 기능 정상 작동 확인

**완료 조건**:
- [ ] App.tsx가 Layout 사용
- [ ] 모든 도구 버튼 클릭 시 패널 전환
- [ ] 설정 모달 열기/닫기
- [ ] 기존 기능 100% 유지

---

## Task #10.2~10.8: 검증 작업

나머지 Task들은 **이미 구현된 컴포넌트들의 검증**입니다:

### Task #10.2: ToolRouter 통합 검증 (15분)
- ✅ `ToolRouter.tsx` 이미 완성 (317줄)
- 검증: 10개 도구 패널 정상 렌더링 확인

### Task #10.3: useToolSwitcher 훅 (선택 사항)
- ⚠️ 현재 App.tsx에 인라인 로직 존재
- 필요 시 별도 훅으로 추출 (우선순위 낮음)

### Task #10.4: SettingsPanel 검증 (15분)
- ✅ `SettingsPanel.tsx` 이미 완성 (353줄)
- 검증: 3개 탭(일반/도구/단축키) 정상 작동 확인

### Task #10.5: Layout 검증 (10분)
- ✅ `Layout.tsx` 이미 완성 (57줄)
- 검증: Header, Footer, ToolRouter 배치 확인

### Task #10.6: Header 검증 (10분)
- ✅ `Header.tsx` 이미 완성 (84줄)
- 검증: 로고, 활성 카운터, 검색, 설정 버튼

### Task #10.7: Footer 검증 (10분)
- ✅ `Footer.tsx` 이미 완성 (37줄)
- 검증: 상태 표시, 전체 끄기 버튼

### Task #10.8: LoadingStates & Toast 검증 (20분)
- ✅ `LoadingStates.tsx` 완성 (172줄)
- ✅ `ToastContainer.tsx` 완성 (133줄)
- 검증: ErrorBoundary, Toast 알림 작동

---

## ✅ Phase 1 완료 조건

### 필수 체크리스트:
- [ ] App.tsx가 Layout/ToolRouter/SettingsPanel 사용
- [ ] ErrorBoundary로 앱 전체 감싸짐
- [ ] ToastProvider로 앱 전체 감싸짐
- [ ] Header에 활성 도구 수 표시
- [ ] Footer에 전체 끄기 버튼 작동
- [ ] 설정 모달 열기/닫기
- [ ] 모든 기존 기능 정상 작동

### 검증 방법:
```bash
# 1. 개발 서버 시작
npm run dev

# 2. 빌드 및 로드
npm run build
# chrome://extensions/ → 개발자 모드 → dist/ 폴더 로드

# 3. 테스트
# - 각 도구 버튼 클릭 → 패널 전환 확인
# - 설정 버튼 → 모달 열림 확인
# - 전체 끄기 버튼 작동 확인
# - Console 오류 없음 확인
```

---

## 📊 작업 시간 요약

| Task | 작업 유형 | 시간 |
|------|----------|------|
| #10.1 | App.tsx 리팩토링 | 90분 |
| #10.2-10.8 | 검증 작업 | 90분 |
| **합계** | | **3시간** |

---

**완료 후 다음 단계**: [Phase 2: Content Script 통합](./TASK-10-phase-02-content.md)
