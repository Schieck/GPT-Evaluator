import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/16/solid';
import { MetricsDisplay } from './MetricsDisplay';
import { ProviderSummary } from './ProviderSummary';
import type { EvaluationResult, EvaluationMetrics, EvaluationFeedback } from '../../services/types';

interface EvaluationResultsProps {
    evaluationResults: Map<string, EvaluationResult>;
    combinedMetrics: EvaluationMetrics;
    combinedFeedback: EvaluationFeedback;
    providerInstances: any[];
    title?: string;
    showProviderResults?: boolean;
    className?: string;
}

/**
 * Reusable component for displaying evaluation results
 */
export function EvaluationResults({
    evaluationResults,
    combinedMetrics,
    combinedFeedback,
    providerInstances,
    title = "Combined Evaluation Results",
    showProviderResults = true,
    className = ''
}: EvaluationResultsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`space-y-4 ${className}`}
        >
            <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        <span>{title}</span>
                    </h3>
                    <span className="text-sm text-zinc-400">
                        {evaluationResults.size} provider{evaluationResults.size !== 1 ? 's' : ''}
                    </span>
                </div>

                <MetricsDisplay
                    metrics={combinedMetrics}
                    feedback={combinedFeedback}
                />
            </div>

            {showProviderResults && evaluationResults.size > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-400">Individual Provider Results</h4>
                    {Array.from(evaluationResults.entries()).map(([instanceId, result]) => {
                        const instance = providerInstances.find(inst => inst.id === instanceId);
                        if (!instance) return null;

                        return (
                            <ProviderSummary
                                key={instanceId}
                                provider={instanceId}
                                feedback={result.feedback}
                                metrics={result.metrics}
                                instanceName={instance.name}
                                instanceModel={instance.config.model}
                            />
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
} 