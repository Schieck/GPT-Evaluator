import type { EvaluationResult, EvaluationMetrics } from '../services/types';

/**
 * Utility class for calculating combined metrics from multiple evaluation results
 */
export class MetricsCalculator {
    /**
     * Calculate combined metrics from a Map of evaluation results
     */
    static calculateCombinedMetrics(results: Map<string, EvaluationResult>): EvaluationMetrics {
        const validResults = Array.from(results.values()).filter(result => result?.metrics);
        return this.calculateFromArray(validResults);
    }

    /**
     * Calculate combined metrics from an array of evaluation results
     */
    static calculateFromArray(results: EvaluationResult[]): EvaluationMetrics {
        if (results.length === 0) {
            return {
                relevance: 0,
                accuracy: 0,
                completeness: 0,
                coherence: 0,
                overall: 0
            };
        }

        const metrics = {
            relevance: 0,
            accuracy: 0,
            completeness: 0,
            coherence: 0,
            overall: 0
        };

        results.forEach(result => {
            metrics.relevance += result.metrics.relevance;
            metrics.accuracy += result.metrics.accuracy;
            metrics.completeness += result.metrics.completeness;
            metrics.coherence += result.metrics.coherence;
            metrics.overall += result.metrics.overall;
        });

        const count = results.length;
        return {
            relevance: Math.round(metrics.relevance / count),
            accuracy: Math.round(metrics.accuracy / count),
            completeness: Math.round(metrics.completeness / count),
            coherence: Math.round(metrics.coherence / count),
            overall: Math.round(metrics.overall / count)
        };
    }

    /**
     * Get a default combined feedback for cached results
     */
    static getDefaultCombinedFeedback() {
        return {
            strengths: [],
            weaknesses: [],
            suggestions: [],
            summary: 'Combined evaluation from cached results',
            promptRequestSuggestion: '',
            references: []
        };
    }
} 