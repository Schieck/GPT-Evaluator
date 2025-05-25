import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIProviderType } from '../../services/types';
import type { EvaluationFeedback, EvaluationMetrics } from '../../services/types';
import { FeedbackDisplay } from './FeedbackDisplay';
import { ValidationScore } from './ValidationScore';
import { ClipboardIcon } from '@heroicons/react/16/solid';

interface ProviderSummaryProps {
    provider: AIProviderType | string;
    feedback: EvaluationFeedback;
    metrics: EvaluationMetrics;
    instanceName?: string;
    instanceModel?: string;
}

const formatProviderName = (provider: string) => {
    return provider.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const getMetricColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 70) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
};

const getMetricLabel = (key: string) => {
    const labels: Record<string, string> = {
        relevance: 'Relevance Score',
        accuracy: 'Accuracy Score',
        completeness: 'Completeness Score',
        coherence: 'Coherence Score',
        overall: 'Overall Score'
    };
    return labels[key] || key;
};

export function ProviderSummary({
    provider,
    feedback,
    metrics,
    instanceName,
    instanceModel,
}: ProviderSummaryProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopySuggestion = async () => {
        try {
            await navigator.clipboard.writeText(feedback.promptRequestSuggestion);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy suggestion:', err);
        }
    };

    return (
        <div className="p-4 bg-zinc-800/50 rounded-md">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col">
                        <h3 className="text-xs font-medium text-orange-400 whitespace-nowrap">
                            {instanceName || formatProviderName(provider as string)}
                        </h3>
                        {instanceModel && (
                            <span className="text-xs text-zinc-500">{instanceModel}</span>
                        )}
                    </div>
                    <div className="w-full max-w-2xl">
                        <ValidationScore score={metrics.overall} size="sm" />
                    </div>
                </div>

                <button className="text-zinc-400 hover:text-zinc-300 transition-colors">
                    {isExpanded ? (
                        <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </button>
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
                        <div className="mt-4">
                            <div className="flex justify-center mb-4">
                                <div className="flex gap-2">
                                    {Object.entries(metrics).map(([key, value]) => (
                                        key !== 'overall' && (
                                            <span
                                                key={key}
                                                className={`text-xs px-2 py-0.5 rounded-full border ${getMetricColor(value)}`}
                                                title={`${getMetricLabel(key)}: ${value}/100`}
                                            >
                                                {value}
                                            </span>
                                        )
                                    ))}
                                </div>
                            </div>

                            {feedback.promptRequestSuggestion && (
                                <div className="mt-4 mb-4 p-3 bg-zinc-800/50 rounded-md border border-blue-500/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-medium text-blue-400">Prompt Suggestion</h4>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopySuggestion();
                                            }}
                                            className="text-xs px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                        >
                                            {isCopied ? 'Copied!' : <ClipboardIcon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-sm text-white whitespace-pre-wrap">{feedback.promptRequestSuggestion}</p>
                                </div>
                            )}

                            <FeedbackDisplay feedback={feedback} references={feedback.references || []} />

                            {feedback.suggestions.length > 0 && (
                                <div className="mt-4 p-3 bg-zinc-800/50 rounded-md border border-purple-500/20">
                                    <h4 className="text-xs font-medium text-purple-400 mb-2">Suggestions for Improvement</h4>
                                    <ul className="space-y-1">
                                        {feedback.suggestions.map((suggestion, index) => (
                                            <li key={index} className="text-sm text-white flex items-start gap-2">
                                                <span className="text-purple-400 mt-1">•</span>
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 