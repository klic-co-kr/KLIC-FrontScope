import { useCallback } from 'react';
import { ToolType, ALL_TOOLS } from '../constants/tools';

interface UseToolSwitcherOptions {
  onStateChange: (toolId: ToolType, newState: boolean) => void;
}

export function useToolSwitcher({ onStateChange }: UseToolSwitcherOptions) {
  /**
   * 도구 활성화 (UI 상태만 변경, 메시지 전송은 App.tsx에서 처리)
   */
  const activateTool = useCallback(
    async (toolId: ToolType) => {
      onStateChange(toolId, true);
    },
    [onStateChange]
  );

  /**
   * 도구 비활성화 (UI 상태만 변경, 메시지 전송은 App.tsx에서 처리)
   */
  const deactivateTool = useCallback(
    async (toolId: ToolType) => {
      onStateChange(toolId, false);
    },
    [onStateChange]
  );

  /**
   * 도구 간 전환
   */
  const switchTool = useCallback(
    async (fromTool: ToolType | null, toTool: ToolType | null) => {
      // 같은 도구면 무시
      if (fromTool === toTool) return;

      // 이전 도구 비활성화
      if (fromTool) {
        await deactivateTool(fromTool);
      }

      // 새 도구 활성화
      if (toTool) {
        await activateTool(toTool);
      }
    },
    [activateTool, deactivateTool]
  );

  /**
   * 모든 도구 비활성화
   */
  const deactivateAllTools = useCallback(async () => {
    await Promise.all(
      ALL_TOOLS.map(tool => deactivateTool(tool.id))
    );
  }, [deactivateTool]);

  /**
   * 독점 도구만 모두 비활성화
   */
  const deactivateExclusiveTools = useCallback(
    async (exceptTool?: ToolType) => {
      await Promise.all(
        ALL_TOOLS
          .filter(tool => tool.exclusive && tool.id !== exceptTool)
          .map(tool => deactivateTool(tool.id))
      );
    },
    [deactivateTool]
  );

  return {
    switchTool,
    activateTool,
    deactivateTool,
    deactivateAllTools,
    deactivateExclusiveTools,
  };
}
