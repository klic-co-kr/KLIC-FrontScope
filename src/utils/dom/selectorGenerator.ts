/**
 * CSS Selector Generator Utilities
 *
 * 요소의 고유한 CSS 선택자를 생성하는 유틸리티 함수들
 */

/**
 * 요소의 고유한 CSS 선택자 생성
 *
 * @param element - 선택자를 생성할 요소
 * @returns CSS 선택자 문자열
 */
export function getSelector(element: Element): string {
  // 1순위: ID
  if (element.id && isValidId(element.id)) {
    const id = CSS.escape(element.id);
    if (document.querySelectorAll(`#${id}`).length === 1) {
      return `#${id}`;
    }
  }

  // 2순위: 유니크한 클래스 조합
  if (element.className && typeof element.className === 'string') {
    const classes = Array.from(element.classList)
      .filter(c => c.length > 0 && !c.startsWith('klic-'))
      .map(c => CSS.escape(c));

    if (classes.length > 0) {
      const selector = `.${classes.join('.')}`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }

      // 부모와 결합
      if (element.parentElement) {
        const parentSelector = getSimpleSelector(element.parentElement);
        const combined = `${parentSelector} > ${selector}`;
        if (document.querySelectorAll(combined).length === 1) {
          return combined;
        }
      }
    }
  }

  // 3순위: 속성 선택자
  const uniqueAttrs = findUniqueAttributes(element);
  for (const attr of uniqueAttrs) {
    const selector = `${element.tagName.toLowerCase()}[${attr.name}="${CSS.escape(attr.value)}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // 4순위: nth-child 경로
  return getNthChildPath(element);
}

/**
 * ID가 유효한지 확인
 *
 * @param id - ID 문자열
 * @returns 유효 여부
 */
function isValidId(id: string): boolean {
  return /^[a-zA-Z][\w-]*$/.test(id);
}

/**
 * 간단한 선택자 생성 (ID 또는 태그명)
 *
 * @param element - 요소
 * @returns 간단한 선택자
 */
function getSimpleSelector(element: Element): string {
  if (element.id && isValidId(element.id)) {
    return `#${CSS.escape(element.id)}`;
  }
  return element.tagName.toLowerCase();
}

/**
 * 유니크한 속성 찾기
 *
 * @param element - 요소
 * @returns 유니크한 속성 배열
 */
function findUniqueAttributes(element: Element): Array<{ name: string; value: string }> {
  const attrs: Array<{ name: string; value: string }> = [];
  const uniqueAttrs = ['data-id', 'data-testid', 'data-cy', 'name', 'aria-label'];

  for (const attrName of uniqueAttrs) {
    const value = element.getAttribute(attrName);
    if (value) {
      attrs.push({ name: attrName, value });
    }
  }

  return attrs;
}

/**
 * nth-child 기반 경로 생성
 *
 * @param element - 요소
 * @returns nth-child 경로
 */
function getNthChildPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // 같은 태그의 형제 중 몇 번째인지
    const siblings = Array.from(current.parentElement?.children || []);
    const sameTagSiblings = siblings.filter(
      s => s.tagName === current!.tagName
    );

    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);

    // 부모가 고유한 ID를 가지면 중단
    if (current.parentElement?.id && isValidId(current.parentElement.id)) {
      const parentId = CSS.escape(current.parentElement.id);
      path.unshift(`#${parentId}`);
      break;
    }

    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * 선택자가 유니크한지 검증
 *
 * @param selector - CSS 선택자
 * @returns 유니크 여부
 */
export function isSelectorUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

/**
 * 선택자로 요소 찾기 (안전)
 *
 * @param selector - CSS 선택자
 * @returns 요소 또는 null
 */
export function querySelector(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
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
 * Generate XPath from element
 * Alias for compatibility
 */
export function getXPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let index = 0;
    let sibling = current.previousSibling;

    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const pathIndex = index > 0 ? `[${index + 1}]` : '';
    parts.unshift(`${tagName}${pathIndex}`);

    current = current.parentElement;
  }

  return '/' + parts.join('/');
}
