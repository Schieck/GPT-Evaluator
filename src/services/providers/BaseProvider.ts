import type { 
  AIProvider, 
  AIProviderType, 
  EvaluationInput, 
  EvaluationResult 
} from '../types';
import { ErrorHandlingService } from '../ErrorHandlingService';

export abstract class BaseProvider implements AIProvider {
  abstract id: AIProviderType;
  abstract name: string;
  protected apiKey: string = '';
  protected _isInitialized: boolean = false;
  protected readonly errorHandler = ErrorHandlingService.getInstance();

  initialize(apiKey: string): void {
    try {
      this.apiKey = apiKey;
      this._isInitialized = true;
    } catch (error) {
      this.errorHandler.handleError(error, `${this.name}.initialize`);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this._isInitialized && !!this.apiKey;
  }

  abstract evaluate(input: EvaluationInput): Promise<EvaluationResult>;

  protected validateInput(input: EvaluationInput): void {
    try {
      if (!input.userPrompt || input.userPrompt.trim() === '') {
        throw new Error('User prompt is required');
      }
      if (!input.aiResponse || input.aiResponse.trim() === '') {
        throw new Error('AI response is required');
      }
      if (!this.isConfigured()) {
        throw new Error(`${this.name} provider is not properly configured`);
      }
    } catch (error) {
      this.errorHandler.handleError(error, `${this.name}.validateInput`);
      throw error;
    }
  }

  protected createMetadata(startTime: number, modelVersion?: string): EvaluationResult['metadata'] {
    const endTime = Date.now();
    return {
      providerId: this.id,
      timestamp: endTime,
      processingTimeMs: endTime - startTime,
      modelVersion
    };
  }
} 