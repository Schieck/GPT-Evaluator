import { describe, it, expect } from 'vitest';
import { MetricsCalculator } from './MetricsCalculator';
import type { EvaluationResult } from '../services/types';

describe('MetricsCalculator', () => {
    const createMockResult = (metrics: Partial<EvaluationResult['metrics']>): EvaluationResult => ({
        metrics: {
            relevance: 80,
            accuracy: 85,
            completeness: 90,
            coherence: 88,
            overall: 86,
            ...metrics
        },
        feedback: {
            strengths: [],
            weaknesses: [],
            suggestions: [],
            summary: '',
            promptRequestSuggestion: '',
            references: []
        },
        metadata: {
            providerId: 'test',
            timestamp: Date.now(),
            processingTimeMs: 100
        }
    });

    describe('calculateFromArray', () => {
        it('should return zero metrics for empty array', () => {
            const result = MetricsCalculator.calculateFromArray([]);

            expect(result).toEqual({
                relevance: 0,
                accuracy: 0,
                completeness: 0,
                coherence: 0,
                overall: 0
            });
        });

        it('should calculate average metrics for single result', () => {
            const results = [createMockResult({})];
            const metrics = MetricsCalculator.calculateFromArray(results);

            expect(metrics).toEqual({
                relevance: 80,
                accuracy: 85,
                completeness: 90,
                coherence: 88,
                overall: 86
            });
        });

        it('should calculate average metrics for multiple results', () => {
            const results = [
                createMockResult({ relevance: 80, accuracy: 90, completeness: 85, coherence: 88, overall: 86 }),
                createMockResult({ relevance: 90, accuracy: 80, completeness: 95, coherence: 92, overall: 89 }),
                createMockResult({ relevance: 85, accuracy: 85, completeness: 90, coherence: 90, overall: 88 })
            ];

            const metrics = MetricsCalculator.calculateFromArray(results);

            expect(metrics).toEqual({
                relevance: 85, // (80 + 90 + 85) / 3 = 85
                accuracy: 85,  // (90 + 80 + 85) / 3 = 85
                completeness: 90, // (85 + 95 + 90) / 3 = 90
                coherence: 90, // (88 + 92 + 90) / 3 = 90
                overall: 88 // (86 + 89 + 88) / 3 = 87.67 ≈ 88
            });
        });

        it('should round metrics to nearest integer', () => {
            const results = [
                createMockResult({ relevance: 85, accuracy: 86, completeness: 87, coherence: 88, overall: 89 }),
                createMockResult({ relevance: 86, accuracy: 87, completeness: 88, coherence: 89, overall: 90 })
            ];

            const metrics = MetricsCalculator.calculateFromArray(results);

            expect(metrics).toEqual({
                relevance: 86, // (85 + 86) / 2 = 85.5 ≈ 86
                accuracy: 87,  // (86 + 87) / 2 = 86.5 ≈ 87
                completeness: 88, // (87 + 88) / 2 = 87.5 ≈ 88
                coherence: 89, // (88 + 89) / 2 = 88.5 ≈ 89
                overall: 90 // (89 + 90) / 2 = 89.5 ≈ 90
            });
        });

        it('should handle results with extreme values', () => {
            const results = [
                createMockResult({ relevance: 0, accuracy: 100, completeness: 50, coherence: 75, overall: 56 }),
                createMockResult({ relevance: 100, accuracy: 0, completeness: 50, coherence: 25, overall: 44 })
            ];

            const metrics = MetricsCalculator.calculateFromArray(results);

            expect(metrics).toEqual({
                relevance: 50,
                accuracy: 50,
                completeness: 50,
                coherence: 50,
                overall: 50
            });
        });
    });

    describe('calculateCombinedMetrics', () => {
        it('should calculate metrics from Map of results', () => {
            const resultsMap = new Map([
                ['provider1', createMockResult({ relevance: 80, accuracy: 85, completeness: 90, coherence: 88, overall: 86 })],
                ['provider2', createMockResult({ relevance: 90, accuracy: 95, completeness: 85, coherence: 92, overall: 91 })]
            ]);

            const metrics = MetricsCalculator.calculateCombinedMetrics(resultsMap);

            expect(metrics).toEqual({
                relevance: 85,
                accuracy: 90,
                completeness: 88,
                coherence: 90,
                overall: 89
            });
        });

        it('should filter out invalid results from Map', () => {
            const resultsMap = new Map([
                ['provider1', createMockResult({})],
                ['provider2', null as any],
                ['provider3', { feedback: {} } as any] // Missing metrics
            ]);

            const metrics = MetricsCalculator.calculateCombinedMetrics(resultsMap);

            // Should only calculate from provider1
            expect(metrics).toEqual({
                relevance: 80,
                accuracy: 85,
                completeness: 90,
                coherence: 88,
                overall: 86
            });
        });

        it('should return zero metrics for empty Map', () => {
            const resultsMap = new Map();
            const metrics = MetricsCalculator.calculateCombinedMetrics(resultsMap);

            expect(metrics).toEqual({
                relevance: 0,
                accuracy: 0,
                completeness: 0,
                coherence: 0,
                overall: 0
            });
        });
    });

    describe('getDefaultCombinedFeedback', () => {
        it('should return default feedback structure', () => {
            const feedback = MetricsCalculator.getDefaultCombinedFeedback();

            expect(feedback).toEqual({
                strengths: [],
                weaknesses: [],
                suggestions: [],
                summary: 'Combined evaluation from cached results',
                promptRequestSuggestion: '',
                references: []
            });
        });
    });
}); 