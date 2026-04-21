import React from 'react';
import { Scissors } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="flex items-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-primary" />
            <h1 className="text-primary font-bold text-base">NotebookLM으로 가져오기</h1>
        </header>
    );
};
