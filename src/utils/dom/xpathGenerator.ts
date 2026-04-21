/**
 * XPath Generator Utilities
 *
 * 요소의 XPath를 생성하는 유틸리티 함수들
 */

/**
 * 요소의 XPath 생성
 *
 * @param element - XPath를 생성할 요소
 * @returns XPath 문자열
 */
export function getXPath(element: Element): string {
  // ID가 있으면 간단한 XPath 사용
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let index = 0;
    let sibling: Element | null = current.previousElementSibling;

    // 같은 태그명을 가진 이전 형제 요소 개수 세기
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const position = index > 0 ? `[${index + 1}]` : '';
    path.unshift(`${tagName}${position}`);

    // 부모가 ID를 가지면 중단
    if (current.parentElement?.id) {
      path.unshift(`//*[@id="${current.parentElement.id}"]`);
      return path.join('/');
    }

    current = current.parentElement;
  }

  return '/' + path.join('/');
}

/**
 * XPath로 요소 찾기
 *
 * @param xpath - XPath 문자열
 * @returns 요소 또는 null
 */
export function getElementByXPath(xpath: string): Element | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue as Element | null;
  } catch {
    return null;
  }
}

/**
 * XPath가 유효한지 검증
 *
 * @param xpath - XPath 문자열
 * @returns 유효 여부
 */
export function isValidXPath(xpath: string): boolean {
  try {
    document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    return true;
  } catch {
    return false;
  }
}

/**
 * 요소의 전체 XPath 생성 (root부터)
 *
 * @param element - 요소
 * @returns 전체 XPath
 */
export function getFullXPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    let index = 0;
    let sibling: Element | null = current.previousElementSibling;

    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const position = index > 0 ? `[${index + 1}]` : '';
    path.unshift(`${tagName}${position}`);

    current = current.parentElement;
  }

  return '/' + path.join('/');
}
