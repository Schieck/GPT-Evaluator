import { v4 as uuidv4 } from 'uuid';
import { AIProviderType, EvaluationStatus } from './types';
import type { 
  EvaluationInput, 
  EvaluationResult, 
  EvaluationResponse
} from './types';
import { providerFactory } from './providers';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ValidationError } from '../utils/ValidationError';

export class EvaluationService {
  private static instance: EvaluationService;
  private evaluations: Map<string, EvaluationResponse> = new Map();
  private readonly errorHandler = ErrorHandlingService.getInstance();
  
  public static getInstance(): EvaluationService {
    if (!EvaluationService.instance) {
      EvaluationService.instance = new EvaluationService();
    }
    return EvaluationService.instance;
  }
  
  private constructor() {}
  
  private validateInput(input: EvaluationInput): void {
    if (!input) {
      throw new ValidationError('Input is required');
    }
    if (!input.userPrompt || typeof input.userPrompt !== 'string') {
      throw new ValidationError('User prompt is required and must be a string');
    }
    if (!input.aiResponse || typeof input.aiResponse !== 'string') {
      throw new ValidationError('AI response is required and must be a string');
    }
  }
  
  public async evaluate(
    input: EvaluationInput,
    providerType?: AIProviderType
  ): Promise<{ id: string }> {
    try {
      this.validateInput(input);
      
      const id = uuidv4();
      this.evaluations.set(id, {
        status: EvaluationStatus.PROCESSING,
        id,
        result: {} as Record<AIProviderType, EvaluationResult>,
      });

      this.processEvaluation(id, input, providerType).catch(error => {
        this.handleEvaluationError(id, error);
      });
      
      return { id };
    } catch (error) {
      this.errorHandler.handleError(error, 'EvaluationService.evaluate');
      throw error;
    }
  }
  
  private handleEvaluationError(id: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.evaluations.set(id, {
      status: EvaluationStatus.FAILED,
      id,
      error: errorMessage,
      result: {} as Record<AIProviderType, EvaluationResult>,
    });
    this.errorHandler.handleError(error, 'EvaluationService.processEvaluation');
  }
  
  private async processEvaluation(
    id: string,
    input: EvaluationInput,
    providerType?: AIProviderType
  ): Promise<void> {
    try {
      const result = await this.evaluateSync(input, providerType);
      this.evaluations.set(id, {
        status: EvaluationStatus.COMPLETED,
        id,
        result: {
          openai: result,
          claude: result,
        }
      });
    } catch (error) {
      this.handleEvaluationError(id, error);
    }
  }

  public getEvaluation(id: string): EvaluationResponse | null {
    return this.evaluations.get(id) || null;
  }
  
  public async evaluateSync(
    input: EvaluationInput,
    providerType?: AIProviderType
  ): Promise<EvaluationResult> {
    try {
      this.validateInput(input);
      
      if (!providerType) {
        throw new ValidationError('Provider type must be specified for synchronous evaluation');
      }
      
      const provider = providerFactory.getProvider(providerType);
      if (!provider) {
        throw new ValidationError(`Provider ${providerType} is not available`);
      }

      if (!provider.isConfigured()) {
        throw new ValidationError(`Provider ${providerType} is not properly configured`);
      }
      
      const startTime = Date.now();
      const result = await provider.evaluate(input);
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          processingTimeMs: Date.now() - startTime
        }
      };
    } catch (error) {
      this.errorHandler.handleError(error, 'EvaluationService.evaluateSync');
      throw error;
    }
  }
  
  public async initializeProvider(type: AIProviderType): Promise<void> {
    try {
      const provider = providerFactory.getProvider(type);
      if (!provider) {
        throw new Error(`Unsupported provider type: ${type}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to initialize ${type} provider: ${errorMessage}`);
    }
  }
  
  public getAvailableProviders(): AIProviderType[] {
    return providerFactory.getAvailableProviders();
  }
} 