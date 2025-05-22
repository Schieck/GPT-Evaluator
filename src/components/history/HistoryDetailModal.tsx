import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MetricsDisplay } from '../evaluation/MetricsDisplay';
import { ProviderSummary } from '../evaluation/ProviderSummary';
import { useFeedback } from '../../hooks/useFeedback';
import { useHistoryStore } from '../../store/useHistoryStore';
import type { HistoryEntry } from '../../services/types';
import { AIProviderType } from '../../services/types';
import { useEffect } from 'react';

interface HistoryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: HistoryEntry | null;
}

export function HistoryDetailModal({ isOpen, onClose, entry }: HistoryDetailModalProps) {
    if (!isOpen || !entry) return null;

    const updateFeedback = useHistoryStore(state => state.updateFeedback);

    const {
        userFeedback,
        isEditingFeedback,
        handleFeedbackSubmit,
        handleFeedbackEdit,
        handleFeedbackChange,
        resetFeedback
    } = useFeedback();

    useEffect(() => {
        if (entry) {
            Object.entries(entry.evaluation.result).forEach(([provider, _]) => {
                if (entry.userFeedback) {
                    handleFeedbackChange(provider as AIProviderType, entry.userFeedback);
                }
            });
        }
        return () => resetFeedback();
    }, [entry?.id]);

    const handleFeedbackSubmitWithSave = (provider: AIProviderType) => {
        const feedback = userFeedback[provider];
        updateFeedback(entry.id, provider, feedback);
        handleFeedbackSubmit(provider);
    };

    const combinedMetrics = {
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        coherence: 0,
        overall: 0
    };

    Object.values(entry.evaluation.result).forEach(result => {
        combinedMetrics.relevance += result.metrics.relevance;
        combinedMetrics.accuracy += result.metrics.accuracy;
        combinedMetrics.completeness += result.metrics.completeness;
        combinedMetrics.coherence += result.metrics.coherence;
        combinedMetrics.overall += result.metrics.overall;
    });

    const providerCount = Object.keys(entry.evaluation.result).length;
    const metrics = {
        relevance: Math.round(combinedMetrics.relevance / providerCount),
        accuracy: Math.round(combinedMetrics.accuracy / providerCount),
        completeness: Math.round(combinedMetrics.completeness / providerCount),
        coherence: Math.round(combinedMetrics.coherence / providerCount),
        overall: Math.round(combinedMetrics.overall / providerCount)
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-orange-400">Evaluation Details</h2>
                            <button
                                onClick={onClose}
                                className="p-1 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-zinc-300">User Input</h3>
                                <p className="text-sm text-zinc-500 whitespace-pre-wrap">{entry.userInput}</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-zinc-300">AI Response</h3>
                                <p className="text-sm text-zinc-500 whitespace-pre-wrap">{entry.aiResponse}</p>
                            </div>

                            <div className="space-y-4">
                                <MetricsDisplay
                                    metrics={metrics}
                                    feedback={entry.evaluation.combinedFeedback}
                                />

                                {Object.entries(entry.evaluation.result).map(([provider, result]) => (
                                    <ProviderSummary
                                        key={provider}
                                        provider={provider as AIProviderType}
                                        feedback={result.feedback}
                                        metrics={result.metrics}
                                        userFeedback={userFeedback[provider as AIProviderType]}
                                        isEditingFeedback={isEditingFeedback[provider as AIProviderType]}
                                        onFeedbackEdit={handleFeedbackEdit}
                                        onFeedbackSubmit={handleFeedbackSubmitWithSave}
                                        onFeedbackChange={handleFeedbackChange}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
} 