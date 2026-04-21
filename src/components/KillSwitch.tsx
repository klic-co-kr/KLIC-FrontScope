/// <reference types="chrome" />
import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AppStatus {
    active: boolean; // active means KILL SWITCH IS ACTIVE (disabled app)
    updateRequired: boolean;
    message: string;
    link: string;
}

export const KillSwitch: React.FC = () => {
    const [status, setStatus] = useState<AppStatus | null>(null);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: 'getAppStatus' }, (response) => {
            if (response) {
                setStatus(response);
            }
        });
    }, []);

    if (!status || (!status.active && !status.updateRequired)) {
        return null;
    }

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3 text-center">
            <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                ⚠️ 중요 알림
            </div>
            <p className="text-xs text-red-600 mb-3 leading-relaxed">
                {status.message}
            </p>
            {status.link && (
                <a
                    href={status.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                >
                    새 버전 받으러 가기
                </a>
            )}
        </div>
    );
};
