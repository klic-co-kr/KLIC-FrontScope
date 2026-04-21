import React from 'react';
import { MousePointerClick } from 'lucide-react';

export const Onboarding: React.FC = () => {
    return (
        <div className="border border-gray-200 rounded-lg p-5 mb-3 text-center bg-gray-50/50">
            <div className="font-semibold text-sm mb-3">유튜브 영상 수집</div>

            <div className="flex items-center justify-center gap-2 mb-3">
                <span className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold">Alt</span>
                <span className="text-gray-400 text-xs">+</span>
                <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" />
                    클릭
                </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
                유튜브에서 썸네일을 Alt+클릭하면<br />
                링크가 자동으로 수집됩니다
            </p>
        </div>
    );
};
