import { useState, useCallback } from 'react';
import { DynamicInstanceEvaluationService } from '../services';
import { EvaluationHistoryService } from '../services/EvaluationHistoryService';
import { MetricsCalculator } from '../utils/MetricsCalculator';
import { useStore } from '../store/useStore';
import { EvaluationStatus, type EvaluationFeedback, type EvaluationMetrics, type EvaluationResult, type HistoryEntry } from '../services/types';

interface UseEvaluationEngineOptions {
    onResultsChange?: (hasResults: boolean) => void;
    onError?: (error: string) => void;
}

interface UseEvaluationEngineReturn {
    // State
    isEvaluating: boolean;
    evaluationResults: Map<string, EvaluationResult> | null;
    combinedMetrics: EvaluationMetrics | null;
    combinedFeedback: EvaluationFeedback | null;
    error: string | null;
    hasDuplicate: boolean;
    duplicateEntry: HistoryEntry | null;
    currentEvaluationId: string | null;

    // Actions
    evaluateConversation: (userInput: string, aiResponse: string) => Promise<void>;
    checkForDuplicates: (userInput: string, aiResponse: string) => void;
    clearResults: () => void;
    clearError: () => void;

    // Utilities
    enabledInstances: any[];
}

/**
 * Comprehensive hook for managing evaluation state and operations
 */
export function useEvaluationEngine({
    onResultsChange,
    onError
}: UseEvaluationEngineOptions = {}): UseEvaluationEngineReturn {
    const { providerInstances } = useStore();
    const enabledInstances = providerInstances.filter(inst => inst.enabled && inst.config.apiKey);

    // State
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResults, setEvaluationResults] = useState<Map<string, EvaluationResult> | null>(null);
    const [combinedMetrics, setCombinedMetrics] = useState<EvaluationMetrics | null>(null);
    const [combinedFeedback, setCombinedFeedback] = useState<EvaluationFeedback | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasDuplicate, setHasDuplicate] = useState(false);
    const [duplicateEntry, setDuplicateEntry] = useState<HistoryEntry | null>(null);
    const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(null);

    // Services
    const evaluationService = DynamicInstanceEvaluationService.getInstance();
    const historyService = EvaluationHistoryService.getInstance();

    const clearResults = useCallback(() => {
        setEvaluationResults(null);
        setCombinedMetrics(null);
        setCombinedFeedback(null);
        setHasDuplicate(false);
        setDuplicateEntry(null);
        setCurrentEvaluationId(null);
        onResultsChange?.(false);
    }, [onResultsChange]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const checkForDuplicates = useCallback((userInput: string, aiResponse: string) => {
        const { hasDuplicate, duplicateEntry } = historyService.findDuplicate(userInput, aiResponse);
        setHasDuplicate(hasDuplicate);

        if (duplicateEntry) {
            setDuplicateEntry(duplicateEntry);

            if (duplicateEntry.evaluation.instanceResults) {
                setEvaluationResults(duplicateEntry.evaluation.instanceResults);

                const combinedMetrics = duplicateEntry.evaluation.combinedMetrics ||
                    MetricsCalculator.calculateCombinedMetrics(duplicateEntry.evaluation.instanceResults);

                const combinedFeedback = duplicateEntry.evaluation.combinedFeedback ||
                    MetricsCalculator.getDefaultCombinedFeedback();

                setCombinedMetrics(combinedMetrics);
                setCombinedFeedback(combinedFeedback);
                onResultsChange?.(true);
            }
        } else {
            setDuplicateEntry(null);
            clearResults();
        }
    }, [historyService, onResultsChange, clearResults]);

    const evaluateConversation = useCallback(async (userInput: string, aiResponse: string) => {
        if (!userInput || !aiResponse || enabledInstances.length === 0) {
            const errorMessage = 'Missing required inputs or no enabled provider instances';
            setError(errorMessage);
            onError?.(errorMessage);
            return;
        }

        setIsEvaluating(true);
        setError(null);

        try {
            const result = await evaluationService.evaluateWithAllEnabledInstances({
                userPrompt: userInput,
                aiResponse
            });

            const evaluationId = crypto.randomUUID();
            setCurrentEvaluationId(evaluationId);

            setEvaluationResults(result.results);
            setCombinedMetrics(result.combinedResult.metrics);
            setCombinedFeedback(result.combinedResult.feedback);
            onResultsChange?.(true);

            // Clear duplicate state since this is a new evaluation
            setHasDuplicate(false);
            setDuplicateEntry(null);

            // Add to history
            historyService.addToHistory(userInput, aiResponse, {
                status: EvaluationStatus.COMPLETED,
                id: evaluationId,
                instanceResults: result.results,
                combinedMetrics: result.combinedResult.metrics,
                combinedFeedback: result.combinedResult.feedback
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred during evaluation';
            setError(errorMessage);
            onError?.(errorMessage);
            onResultsChange?.(false);
        } finally {
            // Add a small delay to show completion state
            setTimeout(() => setIsEvaluating(false), 500);
        }
    }, [
        enabledInstances,
        evaluationService,
        historyService,
        onResultsChange,
        onError
    ]);

    return {
        // State
        isEvaluating,
        evaluationResults,
        combinedMetrics,
        combinedFeedback,
        error,
        hasDuplicate,
        duplicateEntry,
        currentEvaluationId,

        // Actions
        evaluateConversation,
        checkForDuplicates,
        clearResults,
        clearError,

        // Utilities
        enabledInstances
    };
} 