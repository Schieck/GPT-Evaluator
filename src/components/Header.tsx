import React from 'react';
import { Cog6ToothIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    onOpenInWindow: () => void;
    onToggleConfig: () => void;
    isConfigActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    onOpenInWindow,
    onToggleConfig,
    isConfigActive,
}) => {
    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
                <img src="/favicon/favicon-96x96.png" alt="GPT Evaluator" className="w-10 h-10" />
                <h2 className="text-lg font-semibold text-white">Evaluator</h2>
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={onOpenInWindow}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Open in window"
                >
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={onToggleConfig}
                    className={`p-2 transition-colors ${isConfigActive ? 'text-orange-400' : 'text-gray-400 hover:text-white'
                        }`}
                    title="Settings"
                >
                    <Cog6ToothIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}; 