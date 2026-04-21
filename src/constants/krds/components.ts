// src/constants/krds/components.ts
// KRDS Component Accessibility Guidelines

/**
 * KRDS component accessibility guideline
 */
export interface KRDSComponentGuideline {
  id: string;
  name: string;
  category: string;
  accessibilityRequirements: string[];
  keyboardSupport: string[];
  screenReaderSupport: string[];
  commonIssues: string[];
}

/**
 * KRDS component accessibility guidelines
 * Based on KRDS component documentation
 */
export const KRDS_COMPONENTS: Readonly<Record<string, KRDSComponentGuideline>> = {
  // Identity
  masthead: {
    id: 'masthead',
    name: '마스트헤드',
    category: 'identity',
    accessibilityRequirements: [
      '페이지 최상단에 위치',
      '정부 로고와 기관명 포함 필수',
      '높이는 40px 고정',
      '배경색은 정부 표준 색상 사용',
    ],
    keyboardSupport: ['불필요 (정보 표시 영역)'],
    screenReaderSupport: ['기관명을 screen-reader-text로 제공'],
    commonIssues: ['로고에 대체 텍스트 누락', '높이가 40px 미만'],
  },

  identifier: {
    id: 'identifier',
    name: '식별자',
    category: 'identity',
    accessibilityRequirements: [
      '푸터 영역에 필수 포함',
      '기관 정보와 인증 마크 표시',
      '저작권 및 라이선스 정보 포함',
    ],
    keyboardSupport: ['불필요'],
    screenReaderSupport: ['연락처 정보를 읽을 수 있도록 제공'],
    commonIssues: ['연락처 정보가 링크 형태가 아님'],
  },

  // Navigation
  'skip-link': {
    id: 'skip-link',
    name: '건너뛰기 링크',
    category: 'navigation',
    accessibilityRequirements: [
      '페이지 최상단에 위치',
      '포커스 시에만 표시',
      '주 콘텐츠로 바로 이동',
      'Tab 키로 접근 가능',
    ],
    keyboardSupport: ['Tab 키로 포커스 이동', 'Enter/Space 키로 활성화'],
    screenReaderSupport: ['스크린리더로 링크 텍스트 읽기'],
    commonIssues: ['포커스 시에도 보이지 않음', 'tabindex 누락'],
  },

  'main-menu': {
    id: 'main-menu',
    name: '주 메뉴',
    category: 'navigation',
    accessibilityRequirements: [
      '1단계 메뉴는 7개 이하 권장',
      '드롭다운 메뉴는 2단계까지',
      '현재 위치 표시 필수',
      '모바일 대응 햄버거 메뉴 제공',
    ],
    keyboardSupport: ['Tab 키로 메뉴 항목 이동', '화살표 키로 서브 메뉴 이동', 'Esc 키로 닫기'],
    screenReaderSupport: ['현재 메뉴 항목 aria-current="page" 표시', '서브 메뉴 열림/닫힘 상태 알림'],
    commonIssues: ['드롭다운 메뉴의 aria-expanded 누락', '현재 위치 표시 누락'],
  },

  breadcrumb: {
    id: 'breadcrumb',
    name: '브레드크럼',
    category: 'navigation',
    accessibilityRequirements: [
      '홈 > 카테고리 > 현재 페이지 형식',
      '현재 페이지는 링크 제외',
      '화살표(>) 구분자 사용',
      '3단계 이상 시 생략(...) 사용 가능',
    ],
    keyboardSupport: ['Tab 키로 각 단계 이동'],
    screenReaderSupport: ['nav aria-label="브레드크럼" 영역 표시', 'ol 리스트 구조 사용'],
    commonIssues: ['현재 페이지에 링크가 포함됨', '구분자가 screen reader로 읽힘'],
  },

  // Layout
  accordion: {
    id: 'accordion',
    name: '아코디언',
    category: 'layout-expression',
    accessibilityRequirements: [
      '한 번에 하나만 열기 옵션',
      '모두 닫힌 상태 허용',
      '섹션 제목 명확히 표시',
      '부드러운 전환 효과',
    ],
    keyboardSupport: ['Tab 키로 각 패널 이동', 'Enter/Space 키로 열기/닫기'],
    screenReaderSupport: ['aria-expanded 상태 표시', 'aria-controls로 패널 연결'],
    commonIssues: ['aria-expanded 속성 누락', '키보드로 제어 불가'],
  },

  modal: {
    id: 'modal',
    name: '모달',
    category: 'layout-expression',
    accessibilityRequirements: [
      '배경 딤 처리',
      'ESC 키로 닫기',
      '포커스 트랩 구현',
      '닫기 버튼 필수',
    ],
    keyboardSupport: ['Esc 키로 닫기', 'Tab 키로 모달 내 포커스 이동'],
    screenReaderSupport: ['role="dialog" 표시', 'aria-modal="true"', 'aria-labelledby로 제목 연결'],
    commonIssues: ['포커스 트랩 미구현', '닫기 버튼 누락'],
  },

  // Action
  button: {
    id: 'button',
    name: '버튼',
    category: 'action',
    accessibilityRequirements: [
      '명확한 레이블',
      'Primary/Secondary 구분',
      '적절한 크기 (최소 44px)',
      '비활성 상태 표시',
    ],
    keyboardSupport: ['Enter/Space 키로 활성화'],
    screenReaderSupport: ['버튼 텍스트 읽기', 'aria-pressed 토글 상태 표시'],
    commonIssues: ['이미지 버튼에 alt 누락', '높이/너비가 44px 미만'],
  },

  // Selection
  'radio-button': {
    id: 'radio-button',
    name: '라디오 버튼',
    category: 'selection',
    accessibilityRequirements: [
      '2개 이상 옵션 제공',
      '기본 선택값 설정',
      '그룹 레이블 필수',
      '충분한 터치 영역',
    ],
    keyboardSupport: ['화살표 키로 옵션 이동', 'Space 키로 선택'],
    screenReaderSupport: ['fieldset/legend 구조', 'aria-describedby로 설명 연결'],
    commonIssues: ['legend 누락', 'name 속성 누락'],
  },

  checkbox: {
    id: 'checkbox',
    name: '체크박스',
    category: 'selection',
    accessibilityRequirements: [
      '독립적 선택 가능',
      '전체 선택 옵션 제공',
      '명확한 레이블',
      '충분한 클릭 영역',
    ],
    keyboardSupport: ['Space 키로 체크/해제'],
    screenReaderSupport: ['label 연결 필수', 'aria-checked 상태 표시'],
    commonIssues: ['label 연결 누락', '체크 영역이 너무 작음'],
  },

  // Input
  'text-input': {
    id: 'text-input',
    name: '텍스트 입력',
    category: 'input',
    accessibilityRequirements: [
      '적절한 타입 지정',
      '플레이스홀더 제공',
      '유효성 검사 피드백',
      '필수 항목 표시',
    ],
    keyboardSupport: ['모든 키보드 입력 가능'],
    screenReaderSupport: ['aria-invalid로 오류 상태 표시', 'aria-describedby로 에러 메시지 연결'],
    commonIssues: ['input과 label 연결 누락', 'required aria-label 누락'],
  },

  'file-upload': {
    id: 'file-upload',
    name: '파일 업로드',
    category: 'input',
    accessibilityRequirements: [
      '드래그 앤 드롭 지원',
      '파일 형식 제한 표시',
      '파일 크기 제한 안내',
      '업로드 진행률 표시',
    ],
    keyboardSupport: ['Enter/Space 키로 파일 선택창 열기'],
    screenReaderSupport: ['aria-describedby로 형식/크기 제한 안내'],
    commonIssues: ['업로드 상태를 알 수 없음', '파일 정보를 읽을 수 없음'],
  },

  // Feedback
  'step-indicator': {
    id: 'step-indicator',
    name: '단계 표시기',
    category: 'feedback',
    accessibilityRequirements: [
      '현재 단계 강조',
      '완료/진행중/대기 구분',
      '단계 이름 표시',
      '클릭 가능 여부 명시',
    ],
    keyboardSupport: ['Tab 키로 각 단계 이동 가능'],
    screenReaderSupport: ['aria-current="step"로 현재 단계 표시', 'ol 리스트 구조 사용'],
    commonIssues: ['현재 단계 시각적 구분 누락', '완료된 단계 구분 안됨'],
  },

  spinner: {
    id: 'spinner',
    name: '스피너',
    category: 'feedback',
    accessibilityRequirements: [
      '적절한 크기 선택',
      '로딩 텍스트 함께 표시',
      '배경 오버레이 (선택적)',
      '타임아웃 처리',
    ],
    keyboardSupport: ['불필요 (로딩 표시)'],
    screenReaderSupport: ['role="status" 또는 "alert"', 'aria-live="polite"로 상태 변경 알림'],
    commonIssues: ['로딩 중임을 알 수 없음', '스크린리더로 읽히지 않음'],
  },
} as const;

/**
 * Get component guideline by ID
 */
export function getComponentGuideline(id: string): KRDSComponentGuideline | undefined {
  return KRDS_COMPONENTS[id];
}

/**
 * Check if button meets minimum KRDS size (44x44px)
 */
export function isButtonMinimumSize(width: number, height: number): boolean {
  return width >= 44 && height >= 44;
}

/**
 * Check if form input has proper label association
 */
export function hasProperLabel(input: HTMLInputElement): boolean {
  // Check for aria-label
  if (input.getAttribute('aria-label')) return true;

  // Check for aria-labelledby
  if (input.getAttribute('aria-labelledby')) return true;

  // Check for associated label element
  const id = input.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return true;
  }

  // Check if wrapped in label
  const parentLabel = input.closest('label');
  if (parentLabel) return true;

  return false;
}
