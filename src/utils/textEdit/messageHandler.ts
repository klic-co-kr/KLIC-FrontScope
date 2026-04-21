/**
 * Text Edit Message Handlers
 *
 * 텍스트 편집과 관련된 메시지 핸들러
 */

import type { TextEditMessage, TextEditStats } from '../../types/textEdit';

/**
 * 메시지 핸들러
 */
export class TextEditMessageHandler {
  /**
   * 메시지 처리
   */
  static async handle(message: TextEditMessage): Promise<unknown> {
    switch (message.action) {
      case 'TEXT_EDIT_TOGGLE':
        return this.handleToggle(message.data as { active: boolean });

      case 'TEXT_EDIT_SAVE':
        return this.handleSave(message.data);

      case 'TEXT_EDIT_UNDO':
        return this.handleUndo(message.data as { selector: string; originalText: string });

      case 'TEXT_EDIT_GET_STATS':
        return this.handleGetStats();

      case 'TEXT_EDIT_HIGHLIGHT':
        return this.handleHighlight(message.data as { selector: string; type: 'hover' | 'editing' | 'edited' });

      default:
        throw new Error(`Unknown action: ${message.action}`);
    }
  }

  /**
   * 토글 핸들러
   */
  private static async handleToggle(data?: { active: boolean }): Promise<{
    success: boolean;
    active: boolean;
  }> {
    const isActive = data?.active ?? false;

    // Content Script에 메시지 전송
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tabs[0]?.id) {
      throw new Error('No active tab');
    }

    await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'TEXT_EDIT_TOGGLE',
      data: { active: isActive },
    });

    return { success: true, active: isActive };
  }

  /**
   * 저장 핸들러
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async handleSave(_data?: unknown): Promise<{
    success: boolean;
  }> {
    // 저장 로직은 Content Script에서 자동으로 처리됨
    return { success: true };
  }

  /**
   * 되돌리기 핸들러
   */
  private static async handleUndo(data: {
    selector: string;
    originalText: string;
  }): Promise<{ success: boolean }> {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tabs[0]?.id) {
      throw new Error('No active tab');
    }

    await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'TEXT_EDIT_UNDO',
      data,
    });

    return { success: true };
  }

  /**
   * 통계 가져오기
   */
  private static async handleGetStats(): Promise<{
    success: boolean;
    stats?: TextEditStats;
  }> {
    const result = await chrome.storage.local.get('textEdit:stats');
    return {
      success: true,
      stats: result['textEdit:stats'] as TextEditStats | undefined,
    };
  }

  /**
   * 하이라이트 핸들러
   */
  private static async handleHighlight(data: {
    selector: string;
    type: 'hover' | 'editing' | 'edited';
  }): Promise<{ success: boolean }> {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tabs[0]?.id) {
      throw new Error('No active tab');
    }

    await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'TEXT_EDIT_HIGHLIGHT',
      data,
    });

    return { success: true };
  }
}
