/**
 * Format Preservation Utilities
 *
 * HTML 포맷을 보존하면서 텍스트를 변경하는 유틸리티 함수들
 */

/**
 * HTML 포맷을 보존하면서 텍스트만 변경
 *
 * @param element - HTML 요소
 * @param newText - 새 텍스트
 */
export function preserveFormatting(
  element: HTMLElement,
  newText: string
): void {
  // 1. 현재 HTML 구조 분석
  const structure = analyzeStructure(element);

  // 2. 텍스트 노드들 수집
  const textNodes = collectTextNodes(element);

  if (textNodes.length === 0) {
    element.textContent = newText;
    return;
  }

  // 3. 새 텍스트를 기존 구조에 맞게 분배
  distributeText(textNodes, newText, structure);
}

/**
 * 요소의 HTML 구조 분석
 *
 * @param element - 요소
 * @returns 구조 정보
 */
interface ElementStructure {
  tagName: string;
  attributes: { [key: string]: string };
  textNodes: Array<{
    node: Text;
    originalLength: number;
    percentage: number;
  }>;
  childElements: ElementStructure[];
}

function analyzeStructure(element: HTMLElement): ElementStructure {
  const textNodes: Array<{
    node: Text;
    originalLength: number;
    percentage: number;
  }> = [];

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  let totalLength = 0;
  let node: Node | null;

  // 텍스트 노드 수집 및 길이 계산
  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    if (text.trim().length > 0) {
      textNodes.push({
        node: node as Text,
        originalLength: text.length,
        percentage: 0,
      });
      totalLength += text.length;
    }
  }

  // 각 노드의 비율 계산
  textNodes.forEach(tn => {
    tn.percentage = totalLength > 0 ? tn.originalLength / totalLength : 0;
  });

  return {
    tagName: element.tagName,
    attributes: getAttributes(element),
    textNodes,
    childElements: [], // 필요시 재귀적으로 수집
  };
}

/**
 * 텍스트 노드 수집
 *
 * @param element - 요소
 * @returns 텍스트 노드 배열
 */
function collectTextNodes(element: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.trim().length > 0) {
      textNodes.push(node as Text);
    }
  }

  return textNodes;
}

/**
 * 새 텍스트를 노드들에 분배
 *
 * @param textNodes - 텍스트 노드 배열
 * @param newText - 새 텍스트
 * @param structure - 구조 정보
 */
function distributeText(
  textNodes: Text[],
  newText: string,
  structure: ElementStructure
): void {
  if (textNodes.length === 1) {
    // 단일 텍스트 노드인 경우 간단히 대체
    textNodes[0].textContent = newText;
    return;
  }

  // 비율에 따라 분배
  let remainingText = newText;

  structure.textNodes.forEach((tn, index) => {
    if (index === structure.textNodes.length - 1) {
      // 마지막 노드는 남은 텍스트 전부
      tn.node.textContent = remainingText;
    } else {
      const length = Math.floor(newText.length * tn.percentage);
      const chunk = remainingText.substring(0, length);
      tn.node.textContent = chunk;
      remainingText = remainingText.substring(length);
    }
  });
}

/**
 * 요소의 속성 가져오기
 *
 * @param element - 요소
 * @returns 속성 객체
 */
function getAttributes(element: HTMLElement): { [key: string]: string } {
  const attrs: { [key: string]: string } = {};

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }

  return attrs;
}

/**
 * 인라인 스타일 보존
 *
 * @param element - 요소
 * @param newHTML - 새 HTML
 */
export function preserveInlineStyles(
  element: HTMLElement,
  newHTML: string
): void {
  const originalStyles = element.getAttribute('style');
  element.innerHTML = newHTML;

  if (originalStyles) {
    element.setAttribute('style', originalStyles);
  }
}

/**
 * 중첩된 태그 보존하면서 텍스트 변경
 *
 * @param html - HTML 문자열
 * @param newText - 새 텍스트
 * @returns 변경된 HTML
 */
export function replaceTextPreserveTags(
  html: string,
  newText: string
): string {
  // 모든 태그를 임시로 치환
  const tags: string[] = [];
  let index = 0;

  const withPlaceholders = html.replace(/<[^>]+>/g, match => {
    tags.push(match);
    return `__TAG_${index++}__`;
  });

  // 텍스트만 추출
  const textOnly = withPlaceholders.replace(/__TAG_\d+__/g, '');

  // 새 텍스트로 대체
  let result = newText;

  // 태그 다시 삽입 (비율 기반)
  const positions = calculateTagPositions(textOnly, newText, tags.length);
  positions.forEach((pos, i) => {
    result =
      result.substring(0, pos) + tags[i] + result.substring(pos);
  });

  return result;
}

/**
 * 태그 위치 계산
 *
 * @param oldText - 원본 텍스트
 * @param newText - 새 텍스트
 * @param tagCount - 태그 개수
 * @returns 위치 배열
 */
function calculateTagPositions(
  oldText: string,
  newText: string,
  tagCount: number
): number[] {
  const positions: number[] = [];
  const ratio = newText.length / oldText.length;

  for (let i = 0; i < tagCount; i++) {
    const oldPos = (oldText.length / (tagCount + 1)) * (i + 1);
    const newPos = Math.floor(oldPos * ratio);
    positions.push(newPos);
  }

  return positions;
}
