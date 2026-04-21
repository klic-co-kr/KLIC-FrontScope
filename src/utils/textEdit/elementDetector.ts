/**
 * Element Detector Utilities
 *
 * 편집 가능한 텍스트 요소를 탐지하는 유틸리티 함수들
 */

/**
 * 페이지에서 편집 가능한 모든 텍스트 요소 탐지
 *
 * @param options - 탐지 옵션
 * @returns 편집 가능한 요소 배열
 */
export function getEditableElements(options?: {
  minTextLength?: number;
  excludeSelectors?: string[];
  includeHidden?: boolean;
}): HTMLElement[] {
  const {
    minTextLength = 1,
    excludeSelectors = [],
    includeHidden = false,
  } = options || {};

  // 편집 가능한 태그 선택자
  const selectors = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span:not(:empty)', 'a', 'li', 'td', 'th', 'label',
    'button', 'blockquote', 'figcaption', 'summary',
    'dd', 'dt', 'cite', 'q', 'mark', 'time',
    'div:not(:has(*))', // 자식이 없는 div만
  ];

  // 제외할 선택자 목록
  const excludeList = [
    'script', 'style', 'noscript', 'iframe',
    'textarea', 'input', 'select',
    '[contenteditable="false"]',
    '.klic-tool-overlay', // 우리 도구의 오버레이
    ...excludeSelectors,
  ];

  // 모든 요소 선택
  const elements = Array.from(
    document.querySelectorAll(selectors.join(','))
  );

  // 필터링
  return elements.filter((el): el is HTMLElement => {
    // 기본 타입 체크
    if (!(el instanceof HTMLElement)) return false;

    // 제외 목록 체크
    if (excludeList.some(selector => el.matches(selector))) {
      return false;
    }

    // 텍스트 길이 체크
    const text = el.textContent?.trim() || '';
    if (text.length < minTextLength) return false;

    // 숨겨진 요소 체크
    if (!includeHidden) {
      const style = window.getComputedStyle(el);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return false;
      }

      // 뷰포트 밖 체크
      const rect = el.getBoundingClientRect();
      if (
        rect.width === 0 ||
        rect.height === 0 ||
        rect.top < -1000 ||
        rect.left < -1000
      ) {
        return false;
      }
    }

    // contentEditable 체크
    if (el.contentEditable === 'false') return false;

    // 읽기 전용 체크
    if (el.hasAttribute('readonly')) return false;

    // SVG 텍스트 제외
    // if (el.ownerSVGElement) return false;

    return true;
  });
}

/**
 * 특정 요소가 편집 가능한지 확인
 *
 * @param element - 확인할 요소
 * @returns 편집 가능 여부
 */
export function isElementEditable(element: HTMLElement): boolean {
  try {
    const elements = getEditableElements({ minTextLength: 0 });
    return elements.includes(element);
  } catch {
    return false;
  }
}

/**
 * 요소 내의 편집 가능한 자식 요소 찾기
 *
 * @param parent - 부모 요소
 * @returns 편집 가능한 자식 요소 배열
 */
export function findEditableChildren(
  parent: HTMLElement
): HTMLElement[] {
  const children: HTMLElement[] = [];

  const walker = document.createTreeWalker(
    parent,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (
          node instanceof HTMLElement &&
          isElementEditable(node)
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    children.push(node as HTMLElement);
  }

  return children;
}

/**
 * 커서 근처의 편집 가능한 요소 찾기
 *
 * @param x - X 좌표
 * @param y - Y 좌표
 * @param threshold - 임계값 (px)
 * @returns 가장 가까운 편집 가능한 요소
 */
export function findNearestEditableElement(
  x: number,
  y: number,
  threshold: number = 50
): HTMLElement | null {
  const elements = getEditableElements();
  let nearest: HTMLElement | null = null;
  let minDistance = threshold;

  for (const el of elements) {
    const rect = el.getBoundingClientRect();

    // 요소 중심점 계산
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 거리 계산
    const distance = Math.sqrt(
      Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = el;
    }
  }

  return nearest;
}

/**
 * 편집 가능한 요소 수 카운트
 *
 * @returns 편집 가능한 요소 수
 */
export function countEditableElements(): number {
  return getEditableElements().length;
}

/**
 * 태그명으로 편집 가능한 요소 찾기
 *
 * @param tagName - 태그명
 * @returns 해당 태그의 편집 가능한 요소 배열
 */
export function findEditableByTagName(
  tagName: string
): HTMLElement[] {
  return getEditableElements().filter(
    el => el.tagName.toLowerCase() === tagName.toLowerCase()
  );
}

/**
 * 클래스명으로 편집 가능한 요소 찾기
 *
 * @param className - 클래스명
 * @returns 해당 클래스를 가진 편집 가능한 요소 배열
 */
export function findEditableByClassName(
  className: string
): HTMLElement[] {
  return getEditableElements().filter(el =>
    el.classList.contains(className)
  );
}
