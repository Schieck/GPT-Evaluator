import type { EvaluationInput, ValidationResult } from '../types';

export class InputValidator {
  static validateInput(input: EvaluationInput): void {
    const result = this.getValidationResults(input);
    if (!result.isValid) {
      throw new Error(result.errors.join(', '));
    }
  }

  static isValidInput(input: EvaluationInput): boolean {
    return this.getValidationResults(input).isValid;
  }

  static getValidationResults(input: EvaluationInput): ValidationResult {
    const errors: string[] = [];

    if (!input) {
      errors.push('Input is required');
      return { isValid: false, errors };
    }

    if (!input.userPrompt?.trim()) {
      errors.push('User prompt is required');
    }

    if (!input.aiResponse?.trim()) {
      errors.push('AI response is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 