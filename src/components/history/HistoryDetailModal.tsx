import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProviderSummary } from '../evaluation/ProviderSummary';
import { MetricsDisplay } from '../evaluation/MetricsDisplay';
import { useStore } from '../../store/useStore';
import type { AIProviderType, HistoryEntry } from '../../services/types';

interface HistoryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: HistoryEntry | null;
}

export function HistoryDetailModal({ isOpen, onClose, entry }: HistoryDetailModalProps) {
    if (!isOpen || !entry) return null;

    const { providerInstances } = useStore();

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const combinedFeedback = entry.evaluation.combinedFeedback || {
        strengths: [],
        weaknesses: [],
        suggestions: [],
        summary: 'No feedback available',
        promptRequestSuggestion: '',
        references: []
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Evaluation Details</h2>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-zinc-400 hover:text-zinc-300 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-blue-400 mb-2">User Input</h3>
                                    <p className="text-sm text-white bg-zinc-800/50 p-3 rounded-md">
                                        {entry.userInput}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-green-400 mb-2">AI Response</h3>
                                    <p className="text-sm text-white bg-zinc-800/50 p-3 rounded-md">
                                        {entry.aiResponse}
                                    </p>
                                </div>
                            </div>

                            {entry.evaluation.combinedMetrics && (
                                <div className="border-t border-zinc-700 pt-6">
                                    <h3 className="text-lg font-medium text-white mb-4">Combined Results</h3>
                                    <MetricsDisplay
                                        metrics={entry.evaluation.combinedMetrics}
                                        feedback={combinedFeedback}
                                    />
                                </div>
                            )}

                            {entry.evaluation.instanceResults && entry.evaluation.instanceResults.size > 0 && (
                                <div className="border-t border-zinc-700 pt-6">
                                    <h3 className="text-lg font-medium text-white mb-4">Provider Results</h3>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-zinc-400">Individual Provider Results</h4>

                                        {/* Render instance-based results */}
                                        {entry.evaluation.instanceResults && Array.from(entry.evaluation.instanceResults.entries()).map(([instanceId, result]) => {
                                            const instance = providerInstances.find(inst => inst.id === instanceId);

                                            return (
                                                <ProviderSummary
                                                    key={instanceId}
                                                    provider={instance?.type as AIProviderType}
                                                    feedback={result.feedback}
                                                    metrics={result.metrics}
                                                    instanceName={instance?.name}
                                                    instanceModel={instance?.config.model}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 