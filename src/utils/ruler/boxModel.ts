import { BoxModel } from '../../types/ruler';

/**
 * Box Model 정보 추출
 */
export function getBoxModel(element: HTMLElement): BoxModel {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  const padding = {
    top: parseFloat(computedStyle.paddingTop),
    right: parseFloat(computedStyle.paddingRight),
    bottom: parseFloat(computedStyle.paddingBottom),
    left: parseFloat(computedStyle.paddingLeft),
  };

  const border = {
    top: parseFloat(computedStyle.borderTopWidth),
    right: parseFloat(computedStyle.borderRightWidth),
    bottom: parseFloat(computedStyle.borderBottomWidth),
    left: parseFloat(computedStyle.borderLeftWidth),
  };

  const margin = {
    top: parseFloat(computedStyle.marginTop),
    right: parseFloat(computedStyle.marginRight),
    bottom: parseFloat(computedStyle.marginBottom),
    left: parseFloat(computedStyle.marginLeft),
  };

  const contentWidth = rect.width - padding.left - padding.right - border.left - border.right;
  const contentHeight = rect.height - padding.top - padding.bottom - border.top - border.bottom;

  const content = new DOMRect(
    rect.left + border.left + padding.left,
    rect.top + border.top + padding.top,
    contentWidth,
    contentHeight
  );

  const total = {
    width: rect.width + margin.left + margin.right,
    height: rect.height + margin.top + margin.bottom,
  };

  return {
    content,
    padding,
    border,
    margin,
    total,
  };
}

/**
 * Box Model 영역별 DOMRect 반환
 */
export function getBoxModelRects(element: HTMLElement): {
  content: DOMRect;
  padding: DOMRect;
  border: DOMRect;
  margin: DOMRect;
} {
  const rect = element.getBoundingClientRect();
  const boxModel = getBoxModel(element);

  const { border, margin } = boxModel;

  // Padding box
  const paddingRect = new DOMRect(
    rect.left + border.left,
    rect.top + border.top,
    rect.width - border.left - border.right,
    rect.height - border.top - border.bottom
  );

  // Border box (= element rect)
  const borderRect = rect;

  // Margin box
  const marginRect = new DOMRect(
    rect.left - margin.left,
    rect.top - margin.top,
    rect.width + margin.left + margin.right,
    rect.height + margin.top + margin.bottom
  );

  return {
    content: boxModel.content,
    padding: paddingRect,
    border: borderRect,
    margin: marginRect,
  };
}
