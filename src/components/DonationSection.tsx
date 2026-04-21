import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface DonationSectionProps {
    isVisible: boolean;
}

export const DonationSection: React.FC<DonationSectionProps> = ({ isVisible }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isVisible && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, "https://qr.kakaopay.com/FThfiaUou", { width: 150 }, (error: Error | null | undefined) => {
                if (error) console.error(error);
            });
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="border border-gray-200 rounded-lg p-4 mt-3 bg-white text-center shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="font-bold text-sm mb-2 text-gray-800">📷 핸드폰 카메라로 스캔하세요</div>
            <div className="flex justify-center mb-2">
                <canvas ref={canvasRef} />
            </div>
            <p className="text-[11px] text-gray-400">카카오페이 송금 페이지로 연결됩니다</p>
        </div>
    );
};
