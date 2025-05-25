import { useState, useCallback } from 'react';
import { DynamicInstanceEvaluationService } from '../services';
import { EvaluationHistoryService } from '../services/EvaluationHistoryService';
import { useStore } from '../store/useStore';
import type { FoundConversation } from '../store/useStore';
import { EvaluationStatus, type EvaluationFeedback, type EvaluationMetrics, type EvaluationResult } from '../services/types';


interface UseLiveScannerEvaluationReturn {
    // Evaluation state
    isEvaluating: boolean;
    instanceEvaluationResults: Map<string, EvaluationResult> | null;
    combinedMetrics: EvaluationMetrics | null;
    combinedFeedback: EvaluationFeedback | null;
    currentConversation: FoundConversation | null;
    isCachedResult: boolean;

    // Actions
    evaluateConversation: (conversation: FoundConversation) => Promise<void>;
    clearEvaluationResults: () => void;

    // Utilities
    enabledInstances: any[];
}

export function useLiveScannerEvaluation(): UseLiveScannerEvaluationReturn {
    const { providerInstances } = useStore();
    const enabledInstances = providerInstances.filter(inst => inst.enabled && inst.config.apiKey);

    const [isEvaluating, setIsEvaluating] = useState(false);
    const [instanceEvaluationResults, setInstanceEvaluationResults] = useState<Map<string, EvaluationResult> | null>(null);
    const [combinedMetrics, setCombinedMetrics] = useState<EvaluationMetrics | null>(null);
    const [combinedFeedback, setCombinedFeedback] = useState<EvaluationFeedback | null>(null);
    const [currentConversation, setCurrentConversation] = useState<FoundConversation | null>(null);
    const [isCachedResult, setIsCachedResult] = useState(false);

    const evaluationService = DynamicInstanceEvaluationService.getInstance();
    const historyService = EvaluationHistoryService.getInstance();

    const clearEvaluationResults = useCallback(() => {
        setInstanceEvaluationResults(null);
        setCombinedMetrics(null);
        setCombinedFeedback(null);
        setCurrentConversation(null);
        setIsCachedResult(false);
    }, []);

    const evaluateConversation = useCallback(async (conversation: FoundConversation) => {
        if (enabledInstances.length === 0) {
            throw new Error('No enabled provider instances available');
        }

        setIsEvaluating(true);
        setCurrentConversation(conversation);

        try {
            // Check for duplicate first
            const { duplicateEntry } = historyService.findDuplicate(
                conversation.userPrompt,
                conversation.aiResponse
            );

            if (duplicateEntry) {
                // Use cached result
                setCombinedMetrics(duplicateEntry.evaluation.combinedMetrics || null);
                setCombinedFeedback(duplicateEntry.evaluation.combinedFeedback || null);
                setInstanceEvaluationResults(duplicateEntry.evaluation.instanceResults);
                setIsCachedResult(true);

                // Send EVALUATION_COMPLETE message for cached results
                chrome.runtime.sendMessage({
                    type: 'EVALUATION_COMPLETE',
                    data: {
                        metrics: duplicateEntry.evaluation.combinedMetrics,
                        location: (conversation as any).location
                    }
                });
            } else {
                // Perform new evaluation
                setIsCachedResult(false);

                const result = await evaluationService.evaluateWithAllEnabledInstances({
                    userPrompt: conversation.userPrompt,
                    aiResponse: conversation.aiResponse
                });

                setInstanceEvaluationResults(result.results);
                setCombinedMetrics(result.combinedResult.metrics);
                setCombinedFeedback(result.combinedResult.feedback);

                // Add to history
                historyService.addToHistory(conversation.userPrompt, conversation.aiResponse, {
                    status: EvaluationStatus.COMPLETED,
                    id: crypto.randomUUID(),
                    instanceResults: result.results,
                    combinedMetrics: result.combinedResult.metrics,
                    combinedFeedback: result.combinedResult.feedback,
                });

                // Send EVALUATION_COMPLETE message for new evaluation results
                chrome.runtime.sendMessage({
                    type: 'EVALUATION_COMPLETE',
                    data: {
                        metrics: result.combinedResult.metrics,
                        location: (conversation as any).location
                    }
                });
            }
        } catch (error) {
            setIsCachedResult(false);
            throw error;
        } finally {
            setIsEvaluating(false);
        }
    }, [enabledInstances, evaluationService, historyService]);

    return {
        // State
        isEvaluating,
        instanceEvaluationResults,
        combinedMetrics,
        combinedFeedback,
        currentConversation,
        isCachedResult,

        // Actions
        evaluateConversation,
        clearEvaluationResults,

        // Utilities
        enabledInstances
    };
} 