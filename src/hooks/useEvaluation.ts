import { useState } from 'react';
import { DynamicEvaluationService } from '../services/DynamicEvaluationService';
import { EvaluationHistoryService } from '../services/EvaluationHistoryService';
import { useErrorHandler } from './useErrorHandler';
import { ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import type { EvaluationResult, CombinedEvaluationResult, HistoryEntry } from '../services/types';
import { AIProviderType, EvaluationStatus } from '../services/types';

interface UseEvaluationProps {
  userInput: string;
  aiResponse: string;
  onResultsChange?: (hasResults: boolean) => void;
}

export function useEvaluation({ userInput, aiResponse, onResultsChange }: UseEvaluationProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<Record<AIProviderType, EvaluationResult> | null>(null);
  const [combinedResult, setCombinedResult] = useState<CombinedEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasDuplicate, setHasDuplicate] = useState(false);
  const [duplicateEntry, setDuplicateEntry] = useState<HistoryEntry | null>(null);
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(null);

  const evaluationService = DynamicEvaluationService.getInstance();
  const historyService = EvaluationHistoryService.getInstance();

  const { handleError } = useErrorHandler({
    context: 'RealTimeEvaluator',
    category: ErrorCategory.UI,
    severity: ErrorSeverity.MEDIUM
  });

  const calculateCombinedMetrics = (results: Record<AIProviderType, EvaluationResult>) => {
    const combinedMetrics = {
      relevance: 0,
      accuracy: 0,
      completeness: 0,
      coherence: 0,
      overall: 0
    };

    Object.values(results).forEach(result => {
      combinedMetrics.relevance += result.metrics.relevance;
      combinedMetrics.accuracy += result.metrics.accuracy;
      combinedMetrics.completeness += result.metrics.completeness;
      combinedMetrics.coherence += result.metrics.coherence;
      combinedMetrics.overall += result.metrics.overall;
    });

    const providerCount = Object.keys(results).length;
    return {
      relevance: Math.round(combinedMetrics.relevance / providerCount),
      accuracy: Math.round(combinedMetrics.accuracy / providerCount),
      completeness: Math.round(combinedMetrics.completeness / providerCount),
      coherence: Math.round(combinedMetrics.coherence / providerCount),
      overall: Math.round(combinedMetrics.overall / providerCount)
    };
  };

  const handleSubmit = async () => {
    if (!userInput || !aiResponse) return;

    setIsEvaluating(true);
    setError(null);
    try {
      const result = await evaluationService.evaluateWithAllProviders({
        userPrompt: userInput,
        aiResponse
      });

      const evaluationId = crypto.randomUUID();
      setCurrentEvaluationId(evaluationId);

      setEvaluationResult(result.providerResults);
      setCombinedResult(result);
      onResultsChange?.(true);
      setHasDuplicate(false);
      setDuplicateEntry(null);

      historyService.addToHistory(userInput, aiResponse, {
        status: EvaluationStatus.COMPLETED,
        id: evaluationId,
        result: result.providerResults,
        combinedMetrics: result.metrics,
        combinedFeedback: result.feedback
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during evaluation';
      setError(errorMessage);
      handleError(error, 'evaluateResponse');
      onResultsChange?.(false);
    } finally {
      setIsEvaluating(false);
    }
  };

  const checkForDuplicates = () => {
    const { hasDuplicate, duplicateEntry } = historyService.findDuplicate(userInput, aiResponse);
    setHasDuplicate(hasDuplicate);
    if (duplicateEntry) {
      setDuplicateEntry(duplicateEntry);
      if (duplicateEntry.evaluation.result) {
        setEvaluationResult(duplicateEntry.evaluation.result);
        const combinedMetrics = duplicateEntry.evaluation.combinedMetrics || calculateCombinedMetrics(duplicateEntry.evaluation.result);
        const combinedFeedback = duplicateEntry.evaluation.combinedFeedback || {
          strengths: [],
          weaknesses: [],
          suggestions: [],
          summary: 'Combined evaluation from cached results',
          promptRequestSuggestion: ''
        };
        
        setCombinedResult({
          providerResults: duplicateEntry.evaluation.result,
          metrics: combinedMetrics,
          feedback: combinedFeedback
        });
        onResultsChange?.(true);
      }
    } else {
      onResultsChange?.(false);
      setDuplicateEntry(null);
      setEvaluationResult(null);
      setCombinedResult(null);
    }
  };

  return {
    isEvaluating,
    evaluationResult,
    combinedResult,
    error,
    hasDuplicate,
    duplicateEntry,
    currentEvaluationId,
    handleSubmit,
    checkForDuplicates
  };
} 