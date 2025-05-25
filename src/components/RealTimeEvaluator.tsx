import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DuplicateWarning } from './evaluation/DuplicateWarning';
import { EvaluationButton } from './evaluation/EvaluationButton';
import { EvaluationResults } from './evaluation/EvaluationResults';
import { ErrorDisplay } from './evaluation/ErrorDisplay';
import { NoProvidersWarning } from './evaluation/NoProvidersWarning';
import { useEvaluationEngine } from '../hooks/useEvaluationEngine';
import { useEvaluationProgressPresets } from '../hooks/useEvaluationProgress';

interface Props {
    userInput: string;
    aiResponse: string;
    onResultsChange?: (hasResults: boolean) => void;
}

export function RealTimeEvaluator({ userInput, aiResponse, onResultsChange }: Props) {
    const {
        isEvaluating,
        evaluationResults,
        combinedMetrics,
        combinedFeedback,
        error,
        hasDuplicate,
        duplicateEntry,
        currentEvaluationId,
        evaluateConversation,
        checkForDuplicates,
        clearResults,
        clearError,
        enabledInstances
    } = useEvaluationEngine({ onResultsChange });

    const { evaluationProgress, evaluationStage } = useEvaluationProgressPresets.realTimeEvaluator(isEvaluating);

    useEffect(() => {
        clearResults();
        clearError();
        checkForDuplicates(userInput, aiResponse);
    }, [userInput, aiResponse, enabledInstances, checkForDuplicates, clearResults, clearError]);

    const handleEvaluate = async () => {
        await evaluateConversation(userInput, aiResponse);
    };

    const isButtonDisabled = !userInput || !aiResponse || isEvaluating || enabledInstances.length === 0;
    const showCachedWarning = hasDuplicate && duplicateEntry?.evaluation.id !== currentEvaluationId;
    const hasResults = evaluationResults && combinedMetrics && combinedFeedback;

    return (
        <div className="space-y-4">
            {enabledInstances.length === 0 && <NoProvidersWarning />}

            {showCachedWarning && (
                <DuplicateWarning onReevaluate={handleEvaluate} isEvaluating={isEvaluating} />
            )}

            {!hasDuplicate && (
                <EvaluationButton
                    isEvaluating={isEvaluating}
                    isDisabled={isButtonDisabled}
                    enabledInstancesCount={enabledInstances.length}
                    evaluationProgress={evaluationProgress}
                    evaluationStage={evaluationStage}
                    onClick={handleEvaluate}
                    variant="orange"
                />
            )}

            {error && (
                <ErrorDisplay
                    error={error}
                    onDismiss={clearError}
                />
            )}

            <AnimatePresence mode="wait">
                {hasResults && (
                    <EvaluationResults
                        evaluationResults={evaluationResults}
                        combinedMetrics={combinedMetrics}
                        combinedFeedback={combinedFeedback}
                        providerInstances={enabledInstances}
                    />
                )}
            </AnimatePresence>
        </div>
    );
} 