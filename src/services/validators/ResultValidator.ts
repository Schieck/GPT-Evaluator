import type { EvaluationResult, EvaluationMetrics, EvaluationFeedback } from '../types';
import { ValidationError } from '../../utils/ValidationError';

export class ResultValidator {
  static validateResult(result: EvaluationResult): void {
    if (!result) {
      throw new ValidationError('Result is required');
    }

    this.validateMetrics(result.metrics);
    this.validateFeedback(result.feedback);

    if (!result.metadata) {
      throw new ValidationError('Result metadata is required');
    }

    if (!result.metadata.providerId) {
      throw new ValidationError('Provider ID is required in metadata');
    }

    if (!result.metadata.timestamp) {
      throw new ValidationError('Timestamp is required in metadata');
    }
  }

  static validateMetrics(metrics: EvaluationMetrics): void {
    if (!metrics) {
      throw new ValidationError('Metrics are required');
    }

    if (typeof metrics !== 'object') {
      throw new ValidationError('Cannot use \'in\' operator to search for \'relevance\' in ' + typeof metrics);
    }

    const requiredMetrics = ['relevance', 'accuracy', 'completeness', 'coherence', 'overall'];

    for (const metric of requiredMetrics) {
      if (!(metric in metrics)) {
        throw new ValidationError(`Metric '${metric}' is required`);
      }

      const value = metrics[metric as keyof EvaluationMetrics];

      if (typeof value !== 'number') {
        throw new ValidationError(`Metric '${metric}' must be a number`);
      }

      if (value < 0 || value > 100) {
        throw new ValidationError(`Metric '${metric}' must be between 0 and 100`);
      }
    }
  }

  static validateFeedback(feedback: EvaluationFeedback): void {
    if (!feedback) {
      throw new ValidationError('Feedback is required');
    }

    if (typeof feedback !== 'object') {
      throw new ValidationError('Cannot use \'in\' operator to search for \'strengths\' in ' + typeof feedback);
    }

    const arrayFields = ['strengths', 'weaknesses', 'suggestions', 'references'] as const;
    for (const field of arrayFields) {
      if (!Array.isArray(feedback[field])) {
        throw new ValidationError(`Feedback ${field} must be an array`);
      }
    }

    // Validate references structure
    if (feedback.references) {
      feedback.references.forEach((ref, index) => {
        if (!ref.title || typeof ref.title !== 'string') {
          throw new ValidationError(`Reference ${index} must have a valid title`);
        }
        if (!ref.description || typeof ref.description !== 'string') {
          throw new ValidationError(`Reference ${index} must have a valid description`);
        }
        if (!ref.category || !['fact-check', 'source', 'contradiction', 'supporting-evidence', 'methodology'].includes(ref.category)) {
          throw new ValidationError(`Reference ${index} must have a valid category`);
        }
        if (!ref.relevanceToScore || !['relevance', 'accuracy', 'completeness', 'coherence'].includes(ref.relevanceToScore)) {
          throw new ValidationError(`Reference ${index} must have a valid relevanceToScore`);
        }
      });
    }

    if (!feedback.summary || typeof feedback.summary !== 'string') {
      throw new ValidationError('Feedback summary is required and must be a string');
    }

    if (!feedback.promptRequestSuggestion || typeof feedback.promptRequestSuggestion !== 'string') {
      throw new ValidationError('Feedback promptRequestSuggestion is required and must be a string');
    }
  }

  static isValidResult(result: EvaluationResult): boolean {
    try {
      this.validateResult(result);
      return true;
    } catch (error) {
      return false;
    }
  }
} 