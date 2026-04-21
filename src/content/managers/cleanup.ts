/**
 * Cleanup Manager
 *
 * 모든 도구의 리소스를 정리하고 메모리 누수 방지
 */

import { overlayManager } from './overlayManager';
import { eventManager } from './eventListeners';
import { styleInjector } from './styles';

class CleanupManager {
  private cleanupTasks = new Map<string, () => void>();

  register(taskId: string, cleanupFn: () => void) {
    this.cleanupTasks.set(taskId, cleanupFn);
  }

  unregister(taskId: string) {
    this.cleanupTasks.delete(taskId);
  }

  cleanup(toolId?: string) {
    if (toolId) {
      // 특정 도구만 cleanup
      const task = this.cleanupTasks.get(toolId);
      if (task) {
        try {
          task();
        } catch (error) {
          console.error(`Cleanup error for ${toolId}:`, error);
        }
      }
    } else {
      // 모든 도구 cleanup
      this.cleanupTasks.forEach((task, taskId) => {
        try {
          task();
        } catch (error) {
          console.error(`Cleanup error for ${taskId}:`, error);
        }
      });
    }
  }

  cleanupAll() {
    // 오버레이 정리
    try {
      overlayManager.destroyAll();
    } catch (error) {
      console.error('Overlay cleanup error:', error);
    }

    // 이벤트 리스너 정리
    try {
      eventManager.destroy();
    } catch (error) {
      console.error('Event listener cleanup error:', error);
    }

    // 스타일 정리
    try {
      styleInjector.destroy();
    } catch (error) {
      console.error('Style cleanup error:', error);
    }

    // 등록된 cleanup 태스크 실행
    this.cleanup();

    // 맵 비우기
    this.cleanupTasks.clear();
  }

  destroy() {
    this.cleanupAll();
  }

  hasTask(taskId: string): boolean {
    return this.cleanupTasks.has(taskId);
  }

  getTaskCount(): number {
    return this.cleanupTasks.size;
  }
}

export const cleanupManager = new CleanupManager();

// 페이지 언로드 시 자동 cleanup
window.addEventListener('beforeunload', () => {
  cleanupManager.destroy();
});

// 탭 변경 감지 (pagehide 이벤트 사용)
window.addEventListener('pagehide', () => {
  cleanupManager.destroy();
});
