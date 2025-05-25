import { describe, it, expect } from 'vitest';
import { ResultValidator } from './ResultValidator';
import type { EvaluationResult } from '../types';

describe('ResultValidator', () => {
  const validResult: EvaluationResult = {
    metrics: {
      relevance: 85,
      accuracy: 90,
      completeness: 88,
      coherence: 92,
      overall: 89
    },
    feedback: {
      strengths: ['Clear response'],
      weaknesses: ['Could be more detailed'],
      suggestions: ['Add examples'],
      summary: 'Good response overall',
      promptRequestSuggestion: 'Consider adding context',
      references: []
    },
    metadata: {
      providerId: 'test-provider',
      timestamp: Date.now(),
      processingTimeMs: 1000
    }
  };

  describe('validateResult', () => {
    it('should pass validation for valid result', () => {
      expect(() => ResultValidator.validateResult(validResult)).not.toThrow();
    });

    it('should throw error for null result', () => {
      expect(() => ResultValidator.validateResult(null as any))
        .toThrow('Result is required');
    });

    it('should throw error for missing metadata', () => {
      const invalid = { ...validResult, metadata: undefined };
      expect(() => ResultValidator.validateResult(invalid as any))
        .toThrow('Result metadata is required');
    });

    it('should throw error for missing providerId', () => {
      const invalid = {
        ...validResult,
        metadata: { ...validResult.metadata, providerId: '' }
      };
      expect(() => ResultValidator.validateResult(invalid as any))
        .toThrow('Provider ID is required in metadata');
    });

    it('should throw error for missing timestamp', () => {
      const invalid = {
        ...validResult,
        metadata: { ...validResult.metadata, timestamp: 0 }
      };
      expect(() => ResultValidator.validateResult(invalid as any))
        .toThrow('Timestamp is required in metadata');
    });
  });

  describe('validateMetrics', () => {
    it('should pass validation for valid metrics', () => {
      expect(() => ResultValidator.validateMetrics(validResult.metrics)).not.toThrow();
    });

    it('should throw error for null metrics', () => {
      expect(() => ResultValidator.validateMetrics(null as any))
        .toThrow('Metrics are required');
    });

    it('should throw error for non-object metrics', () => {
      expect(() => ResultValidator.validateMetrics('invalid' as any))
        .toThrow('Cannot use \'in\' operator to search for \'relevance\' in string');
    });

    it('should throw error for missing metric field', () => {
      const invalid = { ...validResult.metrics };
      delete (invalid as any).relevance;
      expect(() => ResultValidator.validateMetrics(invalid as any))
        .toThrow('Metric \'relevance\' is required');
    });

    it('should throw error for non-numeric metric', () => {
      const invalid = { ...validResult.metrics, accuracy: 'high' as any };
      expect(() => ResultValidator.validateMetrics(invalid))
        .toThrow('Metric \'accuracy\' must be a number');
    });

    it('should throw error for metric below 0', () => {
      const invalid = { ...validResult.metrics, completeness: -10 };
      expect(() => ResultValidator.validateMetrics(invalid))
        .toThrow('Metric \'completeness\' must be between 0 and 100');
    });

    it('should throw error for metric above 100', () => {
      const invalid = { ...validResult.metrics, coherence: 150 };
      expect(() => ResultValidator.validateMetrics(invalid))
        .toThrow('Metric \'coherence\' must be between 0 and 100');
    });
  });

  describe('validateFeedback', () => {
    it('should pass validation for valid feedback', () => {
      expect(() => ResultValidator.validateFeedback(validResult.feedback)).not.toThrow();
    });

    it('should throw error for null feedback', () => {
      expect(() => ResultValidator.validateFeedback(null as any))
        .toThrow('Feedback is required');
    });

    it('should throw error for non-object feedback', () => {
      expect(() => ResultValidator.validateFeedback('invalid' as any))
        .toThrow('Cannot use \'in\' operator to search for \'strengths\' in string');
    });

    it('should throw error for non-array field', () => {
      const invalid = { ...validResult.feedback, strengths: 'good' as any };
      expect(() => ResultValidator.validateFeedback(invalid))
        .toThrow('Feedback strengths must be an array');
    });

    it('should throw error for missing summary', () => {
      const invalid = { ...validResult.feedback, summary: '' };
      expect(() => ResultValidator.validateFeedback(invalid))
        .toThrow('Feedback summary is required and must be a string');
    });

    it('should throw error for missing promptRequestSuggestion', () => {
      const invalid = { ...validResult.feedback, promptRequestSuggestion: '' };
      expect(() => ResultValidator.validateFeedback(invalid))
        .toThrow('Feedback promptRequestSuggestion is required and must be a string');
    });

    it('should validate reference structure', () => {
      const invalidRef = {
        ...validResult.feedback,
        references: [{
          title: '',
          description: 'test',
          category: 'fact-check' as const,
          relevanceToScore: 'accuracy' as const
        }]
      };
      expect(() => ResultValidator.validateFeedback(invalidRef))
        .toThrow('Reference 0 must have a valid title');
    });

    it('should validate reference category', () => {
      const invalidRef = {
        ...validResult.feedback,
        references: [{
          title: 'Test',
          description: 'test',
          category: 'invalid' as any,
          relevanceToScore: 'accuracy' as const
        }]
      };
      expect(() => ResultValidator.validateFeedback(invalidRef))
        .toThrow('Reference 0 must have a valid category');
    });

    it('should validate reference relevanceToScore', () => {
      const invalidRef = {
        ...validResult.feedback,
        references: [{
          title: 'Test',
          description: 'test',
          category: 'fact-check' as const,
          relevanceToScore: 'invalid' as any
        }]
      };
      expect(() => ResultValidator.validateFeedback(invalidRef))
        .toThrow('Reference 0 must have a valid relevanceToScore');
    });
  });

  describe('isValidResult', () => {
    it('should return true for valid result', () => {
      expect(ResultValidator.isValidResult(validResult)).toBe(true);
    });

    it('should return false for invalid result', () => {
      expect(ResultValidator.isValidResult(null as any)).toBe(false);
    });
  });
}); 