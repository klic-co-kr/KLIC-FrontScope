import React from 'react';
import { Coffee } from 'lucide-react';

interface FooterProps {
    onDonate: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onDonate }) => {
    return (
        <footer className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <span>Produced by KLIC-Clipper</span>
            <button
                onClick={onDonate}
                className="flex items-center gap-1 hover:text-gray-800 transition-colors"
            >
                <Coffee className="w-3 h-3" />
                후원하기
            </button>
        </footer>
    );
};
