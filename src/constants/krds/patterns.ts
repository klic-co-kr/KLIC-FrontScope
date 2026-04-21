// src/constants/krds/patterns.ts
// KRDS Global Pattern Accessibility Guidelines

/**
 * KRDS global pattern accessibility guideline
 */
export interface KRDSPatternGuideline {
  id: string;
  name: string;
  purpose: string;
  keyGuideline: string;
  usedComponents: string[];
  accessibilityNotes: string[];
  wcagCriteria?: string[];
}

/**
 * KRDS global pattern accessibility guidelines
 * Based on KRDS 11 global patterns
 */
export const KRDS_PATTERNS: Readonly<Record<string, KRDSPatternGuideline>> = {
  'personal-identification': {
    id: 'personal-identification',
    name: '개인정보 확인',
    purpose: '사용자의 신원을 확인하는 패턴',
    keyGuideline: '개인정보 수집이 꼭 필요한지 신중히 검토하세요',
    usedComponents: ['text-input', 'select', 'radio-button', 'button'],
    accessibilityNotes: [
      '필수 항목 명확히 표시',
      '오류 메시지 제공',
      '수집 목적과 보관 기간 명시',
      '선택 항목과 필수 항목 구분',
      '안전한 전송 및 저장 보장',
    ],
    wcagCriteria: ['1.1.1', '2.4.6', '3.3.2', '3.3.3'],
  },

  help: {
    id: 'help',
    name: '도움말',
    purpose: '서비스 사용 방법에 대한 안내 제공',
    keyGuideline: '사용자의 숙련도와 맥락에 맞는 도움말 컴포넌트를 설계하세요',
    usedComponents: ['help-panel', 'tooltip', 'contextual-help', 'modal'],
    accessibilityNotes: [
      '접근하기 쉬운 위치에 배치',
      '간결하고 명확한 설명',
      '단계별 안내 제공',
      '시각적 보조 자료 활용',
      '피드백 채널 안내',
    ],
    wcagCriteria: ['2.4.1', '2.5.3', '2.5.5'],
  },

  consent: {
    id: 'consent',
    name: '동의',
    purpose: '사용자의 동의를 받는 패턴',
    keyGuideline: '복잡한 약관을 이해하기 쉽게 구조화하여 제공하세요',
    usedComponents: ['checkbox', 'button', 'disclosure', 'modal'],
    accessibilityNotes: [
      '전체 동의와 개별 동의 구분',
      '필수와 선택 항목 명확히 구분',
      '약관 전문 보기 링크 제공',
      '동의 철회 방법 안내',
      '체크박스와 레이블 연결',
    ],
    wcagCriteria: ['1.3.1', '2.4.6', '3.2.2'],
  },

  'list-navigation': {
    id: 'list-navigation',
    name: '목록 탐색',
    purpose: '목록 형태의 정보를 탐색하는 패턴',
    keyGuideline: '일관된 형식과 논리적 순서로 목록을 구성하세요',
    usedComponents: ['structured-list', 'pagination', 'select', 'button'],
    accessibilityNotes: [
      '한 페이지 표시 개수 조절 옵션',
      '정렬 기준 명시',
      '선택된 항목 표시',
      '일관된 작업 기능 제공',
      '테이블 구조 활용',
      '현재 페이지 안내',
    ],
    wcagCriteria: ['1.3.1', '1.3.2', '2.4.1'],
  },

  'user-feedback': {
    id: 'user-feedback',
    name: '사용자 피드백',
    purpose: '서비스 개선을 위한 피드백 수집',
    keyGuideline: '사용자 작업을 방해하지 않으면서 피드백을 유도하세요',
    usedComponents: ['textarea', 'radio-button', 'button', 'modal'],
    accessibilityNotes: [
      '간단한 평가 방법 제공',
      '선택적 상세 의견 입력',
      '익명 제출 옵션',
      '피드백 반영 결과 공유',
      '폼 요소 레이블링',
      '제출 결과 알림',
    ],
    wcagCriteria: ['1.3.1', '2.4.1', '3.3.2'],
  },

  'detailed-information': {
    id: 'detailed-information',
    name: '상세 정보',
    purpose: '포괄적인 콘텐츠 제공',
    keyGuideline: '사용자가 기대하는 정보를 명확하고 간결하게 전달하세요',
    usedComponents: ['tab', 'accordion', 'table', 'image'],
    accessibilityNotes: [
      '정보 계층 구조화',
      '중요 정보 우선 배치',
      '시각 자료 활용',
      '관련 정보 링크 제공',
      '제목 계층 구조',
      '랜드마크 활용',
    ],
    wcagCriteria: ['1.3.1', '1.3.2', '2.4.1', '2.4.10'],
  },

  'error-handling': {
    id: 'error-handling',
    name: '오류 처리',
    purpose: '시스템 오류 및 사용자 실수 처리',
    keyGuideline: '사용자가 원래 하려던 작업을 완료할 수 있도록 안내하세요',
    usedComponents: ['critical-alerts', 'modal', 'button', 'link'],
    accessibilityNotes: [
      '친근한 어조 사용',
      '기술적 용어 자제',
      '구체적 해결 방법 제시',
      '지원 연락처 제공',
      'role="alert" 사용',
      '포커스 이동',
    ],
    wcagCriteria: ['2.5.5', '3.1.1', '3.3.3', '4.1.1'],
  },

  'input-forms': {
    id: 'input-forms',
    name: '입력 양식',
    purpose: '정보 입력 및 제출',
    keyGuideline: '여러 입력 컨트롤을 조합하여 완성된 양식을 구성하세요',
    usedComponents: ['text-input', 'select', 'checkbox', 'radio-button', 'button'],
    accessibilityNotes: [
      '논리적 그룹화',
      '진행 상황 표시',
      '실시간 유효성 검사',
      '자동 저장 기능',
      'fieldset/legend 사용',
      '오류 메시지 연결',
      '필수 항목 표시',
    ],
    wcagCriteria: ['1.3.1', '2.4.6', '3.2.2', '3.3.1', '3.3.3'],
  },

  'file-attachments': {
    id: 'file-attachments',
    name: '파일 첨부',
    purpose: '다운로드 가능한 콘텐츠 제공',
    keyGuideline: '접근 가능한 파일 형식 옵션을 제공하세요',
    usedComponents: ['file-upload', 'button', 'link', 'badge'],
    accessibilityNotes: [
      '허용 파일 형식 명시',
      '파일 크기 제한 안내',
      '업로드 진행률 표시',
      '대체 형식 제공',
      '파일 정보 읽기',
      '진행 상태 알림',
    ],
    wcagCriteria: ['1.1.1', '2.5.5', '4.1.2'],
  },

  'filtering-sorting': {
    id: 'filtering-sorting',
    name: '필터링 및 정렬',
    purpose: '데이터 탐색 및 정제',
    keyGuideline: '사용자가 원하는 정보를 빠르게 찾을 수 있도록 도와주세요',
    usedComponents: ['select', 'checkbox', 'radio-button', 'button', 'tag'],
    accessibilityNotes: [
      '자주 사용하는 필터 우선 배치',
      '적용된 필터 명확히 표시',
      '결과 수 실시간 표시',
      '필터 초기화 버튼 제공',
      '필터 상태 알림',
      '결과 업데이트 알림',
    ],
    wcagCriteria: ['1.4.1', '2.4.5', '3.2.1', '3.3.1'],
  },

  confirmation: {
    id: 'confirmation',
    name: '확인',
    purpose: '중요한 작업에 대한 사용자 확인',
    keyGuideline: '불확실성을 줄이고 실수를 방지할 수 있도록 설계하세요',
    usedComponents: ['modal', 'button', 'critical-alerts'],
    accessibilityNotes: [
      '작업의 결과 명확히 설명',
      '되돌릴 수 없는 작업 강조',
      '확인과 취소 버튼 구분',
      '실수 클릭 방지 (딜레이 등)',
      '포커스 트랩',
      '명확한 버튼 레이블',
    ],
    wcagCriteria: ['1.4.1', '2.4.11', '3.3.2'],
  },
} as const;

/**
 * Get pattern guideline by ID
 */
export function getPatternGuideline(id: string): KRDSPatternGuideline | undefined {
  return KRDS_PATTERNS[id];
}

/**
 * Get all WCAG criteria for a pattern
 */
export function getPatternWcagCriteria(patternId: string): string[] {
  return KRDS_PATTERNS[patternId]?.wcagCriteria || [];
}
