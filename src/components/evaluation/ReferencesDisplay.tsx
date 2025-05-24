import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LinkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    BeakerIcon,
    ChevronDownIcon
} from '@heroicons/react/16/solid';
import type { EvaluationReference } from '../../services/types';

interface ReferencesDisplayProps {
    references: EvaluationReference[];
    className?: string;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'fact-check':
            return <CheckCircleIcon className="w-4 h-4" />;
        case 'contradiction':
            return <ExclamationTriangleIcon className="w-4 h-4" />;
        case 'source':
            return <DocumentTextIcon className="w-4 h-4" />;
        case 'supporting-evidence':
            return <CheckCircleIcon className="w-4 h-4" />;
        case 'methodology':
            return <BeakerIcon className="w-4 h-4" />;
        default:
            return <DocumentTextIcon className="w-4 h-4" />;
    }
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'fact-check':
            return 'text-green-400 bg-green-500/10 border-green-500/30';
        case 'contradiction':
            return 'text-red-400 bg-red-500/10 border-red-500/30';
        case 'source':
            return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        case 'supporting-evidence':
            return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        case 'methodology':
            return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
        default:
            return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    }
};

const getScoreColor = (score: string) => {
    switch (score) {
        case 'accuracy':
            return 'text-red-300 bg-red-500/20';
        case 'relevance':
            return 'text-blue-300 bg-blue-500/20';
        case 'completeness':
            return 'text-green-300 bg-green-500/20';
        case 'coherence':
            return 'text-purple-300 bg-purple-500/20';
        default:
            return 'text-zinc-300 bg-zinc-500/20';
    }
};

export function ReferencesDisplay({ references, className = '' }: ReferencesDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!references || references.length === 0) {
        return null;
    }

    return (
        <div className={`${className}`}>
            <div
                className="flex items-center justify-between cursor-pointer p-3 bg-zinc-800/30 rounded-md border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-zinc-400" />
                    <h4 className="text-sm font-medium text-zinc-300">
                        References & Sources ({references.length})
                    </h4>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
                </motion.div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-2">
                            {references.map((reference, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-3 rounded-md border ${getCategoryColor(reference.category)}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            {getCategoryIcon(reference.category)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h5 className="text-sm font-medium text-white truncate">
                                                        {reference.title}
                                                    </h5>
                                                    {reference.url && (
                                                        <a
                                                            href={reference.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                                            title="Open reference"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <LinkIcon className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
                                                    {reference.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-300 capitalize">
                                                        {reference.category.replace('-', ' ')}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreColor(reference.relevanceToScore)} capitalize`}>
                                                        {reference.relevanceToScore}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 