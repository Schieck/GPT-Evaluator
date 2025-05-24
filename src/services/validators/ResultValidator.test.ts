import { describe, test, expect } from 'vitest';
import { ResultValidator } from './ResultValidator';
import type { EvaluationResult, EvaluationMetrics, EvaluationFeedback } from '../types';

describe('ResultValidator', () => {
  const validMetrics: EvaluationMetrics = {
    relevance: 90,
    accuracy: 95,
    completeness: 85,
    coherence: 88,
    overall: 89
  };

  const validFeedback: EvaluationFeedback = {
    strengths: ['Good response'],
    weaknesses: ['Could be more detailed'],
    suggestions: ['Add examples'],
    summary: 'Overall good response',
    promptRequestSuggestion: 'Consider adding more specific examples in your response',
    references: [
      {
        title: 'Test Reference',
        url: 'https://example.com',
        description: 'This is a test reference',
        category: 'source',
        relevanceToScore: 'accuracy'
      }
    ]
  };

  const validResult: EvaluationResult = {
    metrics: validMetrics,
    feedback: validFeedback,
    metadata: {
      providerId: 'test-provider',
      timestamp: Date.now(),
      processingTimeMs: 500
    }
  };

  describe('validateResult', () => {
    test('valid result passes validation', () => {
      expect(() => ResultValidator.validateResult(validResult)).not.toThrow();
    });

    test('throws error for missing metrics', () => {
      const invalidResult = { ...validResult, metrics: undefined as unknown as EvaluationMetrics };
      expect(() => ResultValidator.validateResult(invalidResult)).toThrow('Metrics are required');
    });

    test('throws error for missing feedback', () => {
      const invalidResult = { ...validResult, feedback: undefined as unknown as EvaluationFeedback };
      expect(() => ResultValidator.validateResult(invalidResult)).toThrow('Feedback is required');
    });
  });

  describe('validateMetrics', () => {
    test('valid metrics pass validation', () => {
      expect(() => ResultValidator.validateMetrics(validMetrics)).not.toThrow();
    });

    test('throws error for missing metrics', () => {
      expect(() => ResultValidator.validateMetrics(undefined as unknown as EvaluationMetrics))
        .toThrow('Metrics are required');
    });

    test('throws error for missing required metric', () => {
      const invalidMetrics = { ...validMetrics };
      delete (invalidMetrics as any).relevance;
      expect(() => ResultValidator.validateMetrics(invalidMetrics))
        .toThrow("Metric 'relevance' is required");
    });

    test('throws error for non-numeric metric', () => {
      const invalidMetrics = { ...validMetrics, relevance: '90' as unknown as number };
      expect(() => ResultValidator.validateMetrics(invalidMetrics))
        .toThrow("Metric 'relevance' must be a number");
    });

    test('throws error for metric out of range', () => {
      const invalidMetrics = { ...validMetrics, relevance: 150 };
      expect(() => ResultValidator.validateMetrics(invalidMetrics))
        .toThrow("Metric 'relevance' must be between 0 and 100");
    });
  });

  describe('validateFeedback', () => {
    test('valid feedback passes validation', () => {
      expect(() => ResultValidator.validateFeedback(validFeedback)).not.toThrow();
    });

    test('throws error for missing feedback', () => {
      expect(() => ResultValidator.validateFeedback(undefined as unknown as EvaluationFeedback))
        .toThrow('Feedback is required');
    });

    test('throws error for non-array strengths', () => {
      const invalidFeedback = { ...validFeedback, strengths: 'not an array' as unknown as string[] };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback strengths must be an array');
    });

    test('throws error for non-array weaknesses', () => {
      const invalidFeedback = { ...validFeedback, weaknesses: 'not an array' as unknown as string[] };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback weaknesses must be an array');
    });

    test('throws error for non-array suggestions', () => {
      const invalidFeedback = { ...validFeedback, suggestions: 'not an array' as unknown as string[] };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback suggestions must be an array');
    });

    test('throws error for missing summary', () => {
      const invalidFeedback = { ...validFeedback, summary: undefined as unknown as string };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback summary is required and must be a string');
    });

    test('throws error for non-string summary', () => {
      const invalidFeedback = { ...validFeedback, summary: 123 as unknown as string };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback summary is required and must be a string');
    });

    test('throws error for missing promptRequestSuggestion', () => {
      const invalidFeedback = { ...validFeedback, promptRequestSuggestion: undefined as unknown as string };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback promptRequestSuggestion is required and must be a string');
    });

    test('throws error for non-string promptRequestSuggestion', () => {
      const invalidFeedback = { ...validFeedback, promptRequestSuggestion: 123 as unknown as string };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback promptRequestSuggestion is required and must be a string');
    });

    test('throws error for non-array references', () => {
      const invalidFeedback = { ...validFeedback, references: 'not an array' as unknown as any[] };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Feedback references must be an array');
    });

    test('throws error for reference without title', () => {
      const invalidFeedback = {
        ...validFeedback,
        references: [{
          description: 'test',
          category: 'source',
          relevanceToScore: 'accuracy'
        } as any]
      };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Reference 0 must have a valid title');
    });

    test('throws error for reference with invalid category', () => {
      const invalidFeedback = {
        ...validFeedback,
        references: [{
          title: 'Test',
          description: 'test',
          category: 'invalid-category',
          relevanceToScore: 'accuracy'
        } as any]
      };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Reference 0 must have a valid category');
    });

    test('throws error for reference with invalid relevanceToScore', () => {
      const invalidFeedback = {
        ...validFeedback,
        references: [{
          title: 'Test',
          description: 'test',
          category: 'source',
          relevanceToScore: 'invalid-score'
        } as any]
      };
      expect(() => ResultValidator.validateFeedback(invalidFeedback))
        .toThrow('Reference 0 must have a valid relevanceToScore');
    });

    test('accepts empty references array', () => {
      const feedbackWithEmptyReferences = { ...validFeedback, references: [] };
      expect(() => ResultValidator.validateFeedback(feedbackWithEmptyReferences)).not.toThrow();
    });
  });

  describe('isValidResult', () => {
    test('returns true for valid result', () => {
      expect(ResultValidator.isValidResult(validResult)).toBe(true);
    });

    test('returns false for invalid result', () => {
      const invalidResult = { ...validResult, metrics: undefined as unknown as EvaluationMetrics };
      expect(ResultValidator.isValidResult(invalidResult)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('extra fields in feedback are ignored', () => {
      const feedbackWithExtra = { ...validFeedback, extraField: 'extra' } as any;
      expect(() => ResultValidator.validateFeedback(feedbackWithExtra)).not.toThrow();
    });
    test('extra fields in metrics are ignored', () => {
      const metricsWithExtra = { ...validMetrics, extraField: 123 } as any;
      expect(() => ResultValidator.validateMetrics(metricsWithExtra)).not.toThrow();
    });
    test('summary as array throws', () => {
      const invalidFeedback = { ...validFeedback, summary: ["not", "a", "string"] as unknown as string };
      expect(() => ResultValidator.validateFeedback(invalidFeedback)).toThrow('Feedback summary is required and must be a string');
    });
    test('promptRequestSuggestion as array throws', () => {
      const invalidFeedback = { ...validFeedback, promptRequestSuggestion: ["not", "a", "string"] as unknown as string };
      expect(() => ResultValidator.validateFeedback(invalidFeedback)).toThrow('Feedback promptRequestSuggestion is required and must be a string');
    });
    test('metrics as string throws', () => {
      expect(() => ResultValidator.validateMetrics('not an object' as unknown as EvaluationMetrics)).toThrow("Cannot use 'in' operator to search for 'relevance' in string");
    });
    test('feedback as string throws', () => {
      expect(() => ResultValidator.validateFeedback('not an object' as unknown as EvaluationFeedback)).toThrow("Cannot use 'in' operator to search for 'strengths' in string");
    });
  });
}); 