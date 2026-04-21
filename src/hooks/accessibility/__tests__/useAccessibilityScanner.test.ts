import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { AccessibilityIssue } from '../../../types/accessibility';
import { useAccessibilityScanner } from '../useAccessibilityScanner';

const sendMessageToActiveTab = vi.fn();

vi.mock('../../resourceNetwork/activeTabMessaging', () => ({
  sendMessageToActiveTab: (...args: unknown[]) => sendMessageToActiveTab(...args),
}));

describe('useAccessibilityScanner highlight payload', () => {
  beforeEach(() => {
    sendMessageToActiveTab.mockReset();
    sendMessageToActiveTab.mockResolvedValue({ success: true });
  });

  it('sends selector and issue details for element inspector popup', async () => {
    const { result } = renderHook(() => useAccessibilityScanner());

    const issue: AccessibilityIssue = {
      id: 'issue-1',
      category: 'html',
      severity: 'high',
      rule: 'link-purpose',
      message: '링크 목적을 알기 어렵습니다',
      suggestion: '링크 텍스트를 목적 중심으로 수정하세요',
      wcagCriteria: '2.4.4',
      krdsCriteria: 'link-purpose',
      element: {
        tagName: 'a',
        selector: '#docs-link',
        outerHTML: '<a id="docs-link">여기</a>',
      },
    };

    await act(async () => {
      await result.current.highlightElement('#docs-link', issue);
    });

    expect(sendMessageToActiveTab).toHaveBeenCalledTimes(1);
    expect(sendMessageToActiveTab).toHaveBeenCalledWith({
      action: 'A11Y_SCAN_ELEMENT',
      data: {
        selector: '#docs-link',
        issue: {
          category: 'html',
          severity: 'high',
          rule: 'link-purpose',
          message: '링크 목적을 알기 어렵습니다',
          suggestion: '링크 텍스트를 목적 중심으로 수정하세요',
          wcagCriteria: '2.4.4',
          krdsCriteria: 'link-purpose',
          element: {
            tagName: 'a',
            selector: '#docs-link',
            outerHTML: '<a id="docs-link">여기</a>',
          },
        },
      },
    });
  });
});
