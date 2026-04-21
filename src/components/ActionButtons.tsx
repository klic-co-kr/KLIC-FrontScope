import React from 'react';
import { FileText, MonitorPlay, Layers, Scissors, FileCode } from 'lucide-react';

interface ActionButtonsProps {
    onCopyPageContent: () => void;
    onClipFullPage: () => void;
    onClipSelection: () => void;
    onClipVisibleVideos: () => void;
    onClipAllVideos: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onCopyPageContent,
    onClipFullPage,
    onClipSelection,
    onClipVisibleVideos,
    onClipAllVideos
}) => {
    return (
        <div className="space-y-2">
            <button
                onClick={onClipSelection}
                className="w-full bg-amber-50 border border-amber-200 text-amber-900 py-2.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2 group mb-2"
            >
                <Scissors className="w-4 h-4 text-amber-600" />
                선택 영역 텍스트 복사
            </button>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onCopyPageContent}
                    className="bg-white border border-gray-200 text-gray-700 py-3 rounded-lg text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                >
                    <FileText className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
                    본문(기사) 복사
                </button>
                <button
                    onClick={onClipFullPage}
                    className="bg-white border border-gray-200 text-gray-700 py-3 rounded-lg text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                >
                    <FileCode className="w-4 h-4 text-gray-500 group-hover:text-green-500 transition-colors" />
                    전체 페이지 복사
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onClipVisibleVideos}
                    className="bg-white border border-gray-200 text-gray-700 py-3 rounded-lg text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                >
                    <MonitorPlay className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                    화면 내 영상
                </button>
                <button
                    onClick={onClipAllVideos}
                    className="bg-white border border-gray-200 text-gray-700 py-3 rounded-lg text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                >
                    <Layers className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                    전체 영상
                </button>
            </div>
        </div>
    );
};
