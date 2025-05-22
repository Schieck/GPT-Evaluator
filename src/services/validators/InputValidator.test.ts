import { describe, test, expect } from 'vitest';
import { InputValidator } from './InputValidator';
import type { EvaluationInput } from '../types';

describe('InputValidator', () => {
  test('valid input passes validation', () => {
    const input: EvaluationInput = {
      userPrompt: 'What is the capital of France?',
      aiResponse: 'The capital of France is Paris.'
    };
    expect(() => InputValidator.validateInput(input)).not.toThrow();
    expect(InputValidator.isValidInput(input)).toBe(true);
  });

  test('empty prompt throws and isValidInput returns false', () => {
    const input: EvaluationInput = {
      userPrompt: '',
      aiResponse: 'The capital of France is Paris.'
    };
    expect(() => InputValidator.validateInput(input)).toThrow(/User prompt is required/);
    expect(InputValidator.isValidInput(input)).toBe(false);
  });

  test('empty response throws and isValidInput returns false', () => {
    const input: EvaluationInput = {
      userPrompt: 'What is the capital of France?',
      aiResponse: ''
    };
    expect(() => InputValidator.validateInput(input)).toThrow(/AI response is required/);
    expect(InputValidator.isValidInput(input)).toBe(false);
  });

  test('null input throws and isValidInput returns false', () => {
    const input = null as unknown as EvaluationInput;
    expect(() => InputValidator.validateInput(input)).toThrow(/Input is required/);
    expect(InputValidator.isValidInput(input)).toBe(false);
  });

  test('getValidationResults returns correct results', () => {
    const validInput: EvaluationInput = {
      userPrompt: 'Valid prompt',
      aiResponse: 'Valid response'
    };
    const validResults = InputValidator.getValidationResults(validInput);
    expect(validResults.isValid).toBe(true);
    expect(validResults.errors.length).toBe(0);

    const invalidInput: EvaluationInput = {
      userPrompt: '',
      aiResponse: ''
    };
    const invalidResults = InputValidator.getValidationResults(invalidInput);
    expect(invalidResults.isValid).toBe(false);
    expect(invalidResults.errors.length).toBe(2);
    expect(invalidResults.errors).toContain('User prompt is required');
    expect(invalidResults.errors).toContain('AI response is required');
  });
}); 