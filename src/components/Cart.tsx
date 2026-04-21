import React from 'react';
import { X, Copy, Trash2, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartProps {
    items: string[];
    onRemove: (index: number) => void;
    onClear: () => void;
    onCopy: () => void;
}

export const Cart: React.FC<CartProps> = ({ items, onRemove, onClear, onCopy }) => {
    if (items.length === 0) return null;

    return (
        <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-white shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                <span className="text-sm font-semibold flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" />
                    수집된 영상
                </span>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                </span>
            </div>

            <div className="max-h-40 overflow-y-auto mb-3 scrollbar-thin scrollbar-thumb-gray-200">
                <AnimatePresence>
                    {items.map((link, index) => {
                        const videoId = link.split('v=')[1] || link;
                        return (
                            <motion.div
                                key={`${link}-${index}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-xs group"
                            >
                                <span className="truncate flex-1 text-gray-700 font-medium pr-2" title={link}>
                                    {videoId}
                                </span>
                                <button
                                    onClick={() => onRemove(index)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onCopy}
                    className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Copy className="w-3.5 h-3.5" />
                    링크 복사
                </button>
                <button
                    onClick={onClear}
                    className="px-3 text-gray-400 text-xs hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
