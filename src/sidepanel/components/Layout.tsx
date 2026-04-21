import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToolRouter } from './ToolRouter';
import { ToastContainer } from './ToastContainer';
import { ToolType } from '../constants/tools';
import { ToolData } from '../App';

interface LayoutProps {
  children?: ReactNode;
  currentTool: ToolType | null;
  tools: Record<ToolType, unknown>;
  toolData: unknown;
  activeToolCount: number;
  onToggle: (toolId: ToolType) => void;
  onMarkUnsaved: (toolId: ToolType, hasChanges: boolean) => void;
  onCopy: (text: string) => void;
  onReset: (toolId: ToolType) => void;
  onOpenSettings: () => void;
  onDeactivateAll: () => void;
}

export function Layout({
  children,
  currentTool,
  tools,
  toolData,
  activeToolCount,
  onToggle,
  onMarkUnsaved,
  onCopy,
  onReset,
  onOpenSettings,
  onDeactivateAll,
}: LayoutProps) {
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col font-sans text-gray-900 relative">
      <Header activeToolCount={activeToolCount} onOpenSettings={onOpenSettings} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children || (
          <ToolRouter
            currentTool={currentTool}
            tools={tools}
            toolData={toolData as ToolData}
            onToggle={onToggle}
            onMarkUnsaved={onMarkUnsaved}
            onCopy={onCopy}
            onReset={onReset}
          />
        )}
      </main>

      <Footer activeToolCount={activeToolCount} onDeactivateAll={onDeactivateAll} />

      <ToastContainer />
    </div>
  );
}
