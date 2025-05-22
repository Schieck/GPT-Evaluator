import { useHistoryStore } from '../../store/useHistoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/16/solid';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { HistoryDetailModal } from './HistoryDetailModal';
import { ValidationScore } from '../evaluation/ValidationScore';
import type { HistoryEntry } from '../../services/types';

export default function HistoryComponent() {
    const { entries, removeEntry, clearHistory } = useHistoryStore();
    const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 mb-4 text-zinc-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-400">No evaluations yet</h3>
                <p className="mt-2 text-sm text-zinc-500">
                    Your evaluation history will appear here
                </p>
            </div>
        );
    }

    const getOverallScore = (entry: HistoryEntry) => {
        const scores = Object.values(entry.evaluation.result)
            .filter(result => result?.metrics?.overall)
            .map(result => result.metrics.overall);
        return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-medium text-sm text-orange-400">Evaluation History</h2>
                <button
                    onClick={clearHistory}
                    className="text-sm text-zinc-500 hover:text-zinc-300"
                >
                    Clear all
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {entries.map((entry) => {
                        const overallScore = getOverallScore(entry);
                        return (
                            <motion.div
                                key={entry.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 cursor-pointer hover:bg-zinc-900/70 transition-colors"
                                onClick={() => setSelectedEntry(entry)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm mb-4 text-zinc-500 line-clamp-2">{entry.userInput}</p>
                                        <ValidationScore score={overallScore} size="sm" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">

                                        <span className="text-xs text-zinc-500">
                                            {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeEntry(entry.id);
                                            }}
                                            className="p-1 text-zinc-500 hover:text-red-400 rounded-full hover:bg-zinc-800"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <HistoryDetailModal
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                entry={selectedEntry}
            />
        </div>
    );
} 