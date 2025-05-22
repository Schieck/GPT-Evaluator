import { useState } from 'react';
import type { EvaluationMetrics, EvaluationFeedback } from '../../services/types';
import { ValidationScore } from './ValidationScore';
import { ClipboardIcon } from '@heroicons/react/16/solid';

interface MetricsDisplayProps {
    metrics: EvaluationMetrics;
    feedback?: EvaluationFeedback;
    className?: string;
}

export const MetricsDisplay = ({ metrics, feedback, className = '' }: MetricsDisplayProps) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopySuggestion = async () => {
        if (!feedback?.promptRequestSuggestion) return;
        try {
            await navigator.clipboard.writeText(feedback.promptRequestSuggestion);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy suggestion:', err);
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="w-full max-w-2xl mx-auto">
                <ValidationScore score={metrics.overall} showTrustLevel={true} />
                {feedback && feedback.promptRequestSuggestion && (
                    <div className="mt-4 p-3 bg-zinc-800/50 rounded-md border border-purple-500/20">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-medium text-purple-400">Suggested Prompt Improvement</h4>
                            <button
                                onClick={handleCopySuggestion}
                                className="text-xs px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                            >
                                {isCopied ? 'Copied!' : <ClipboardIcon className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">{feedback.promptRequestSuggestion}</p>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-800/50 rounded-md">
                    <h3 className="text-xs font-medium text-orange-400 mb-2">Relevance</h3>
                    <div className="text-2xl font-semibold text-white">{metrics.relevance}%</div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-md">
                    <h3 className="text-xs font-medium text-orange-400 mb-2">Accuracy</h3>
                    <div className="text-2xl font-semibold text-white">{metrics.accuracy}%</div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-md">
                    <h3 className="text-xs font-medium text-orange-400 mb-2">Completeness</h3>
                    <div className="text-2xl font-semibold text-white">{metrics.completeness}%</div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-md">
                    <h3 className="text-xs font-medium text-orange-400 mb-2">Coherence</h3>
                    <div className="text-2xl font-semibold text-white">{metrics.coherence}%</div>
                </div>
            </div>
        </div>
    );
}; 