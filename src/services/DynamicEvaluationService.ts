import { AIProviderType } from './types';
import type {
  EvaluationInput,
  EvaluationResult,
  EvaluationMetrics,
  EvaluationFeedback,
  CombinedEvaluationResult,
} from './types';
import { EvaluationService } from './EvaluationService';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ResultValidator } from './validators/ResultValidator';
import { ValidationError } from "../utils/ValidationError";
import { ProviderConfigService } from './ProviderConfigService';

export class DynamicEvaluationService {
  private static instance: DynamicEvaluationService;

  private readonly errorHandler: ErrorHandlingService;
  private readonly configService: ProviderConfigService;

  constructor(
    private readonly evaluationService: EvaluationService,
    configService: ProviderConfigService,
    errorHandler: ErrorHandlingService
  ) {
    this.configService = configService;
    this.errorHandler = errorHandler;
  }

  public static getInstance(): DynamicEvaluationService {
    if (!DynamicEvaluationService.instance) {
      DynamicEvaluationService.instance = new DynamicEvaluationService(
        EvaluationService.getInstance(),
        ProviderConfigService.getInstance(),
        ErrorHandlingService.getInstance()
      );
    }
    return DynamicEvaluationService.instance;
  }

  public async evaluateWithAllProviders(input: EvaluationInput): Promise<CombinedEvaluationResult> {
    const enabledProviders = this.getEnabledProviders();
    if (enabledProviders.length === 0) {
      throw new Error('No enabled providers available for evaluation');
    }

    const results: Partial<Record<AIProviderType, EvaluationResult>> = {};
    const errors: Partial<Record<AIProviderType, string>> = {};

    await Promise.all(
      enabledProviders.map(async (providerType) => {
        try {
          const result = await this.evaluationService.evaluateSync(input, providerType);
          try {
            ResultValidator.validateResult(result);
            results[providerType] = result;
          } catch (validationError) {
            this.errorHandler.handleError(validationError, `DynamicEvaluationService.evaluateWithAllProviders.${providerType}`);
            errors[providerType] = validationError instanceof Error ? validationError.message : 'Validation error occurred';
          }
        } catch (error) {
          console.log('DynamicEvaluationService: error handler called', error, providerType);
          this.errorHandler.handleError(error, `DynamicEvaluationService.evaluateWithAllProviders.${providerType}`);
          errors[providerType] = error instanceof Error ? error.message : 'Unknown error occurred';
        }
      })
    );

    if (Object.keys(results).length === 0) {
      const errorMessage = Object.values(errors).join(', ');
      throw new ValidationError(`All providers failed to evaluate: ${errorMessage}`);
    }

    const combinedMetrics = this.calculateCombinedMetrics(Object.values(results) as EvaluationResult[]);
    const combinedFeedback = this.generateCombinedFeedback(Object.values(results) as EvaluationResult[]);

    return {
      metrics: combinedMetrics,
      feedback: combinedFeedback,
      providerResults: results as Record<AIProviderType, EvaluationResult>
    };
  }

  private calculateCombinedMetrics(results: EvaluationResult[]): EvaluationMetrics {
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
   * Combines feedback from all provider results.
   * - Uses the most detailed promptRequestSuggestion.
   * - Aggregates strengths, weaknesses, suggestions.
   * - Summary is a combined string.
   * - If only one provider, just returns its feedback.
   * - If all providers fail, throws.
   */
  private generateCombinedFeedback(results: EvaluationResult[]): EvaluationFeedback {
    const strengths = new Set<string>();
    const weaknesses = new Set<string>();
    const suggestions = new Set<string>();
    const allReferences: any[] = [];
    let promptRequestSuggestion = '';

    results.forEach(result => {
      result.feedback.strengths.forEach(s => strengths.add(s));
      result.feedback.weaknesses.forEach(w => weaknesses.add(w));
      result.feedback.suggestions.forEach(s => suggestions.add(s));

      // Combine references from all providers
      if (result.feedback.references) {
        allReferences.push(...result.feedback.references);
      }

      if (!promptRequestSuggestion || result.feedback.promptRequestSuggestion.length > promptRequestSuggestion.length) {
        promptRequestSuggestion = result.feedback.promptRequestSuggestion;
      }
    });

    const avgOverall = results.reduce((sum, r) => sum + r.metrics.overall, 0) / results.length;
    const summary = this.generateSummary(results.length, avgOverall, strengths, weaknesses);

    return {
      strengths: Array.from(strengths),
      weaknesses: Array.from(weaknesses),
      suggestions: Array.from(suggestions),
      summary,
      promptRequestSuggestion,
      references: allReferences
    };
  }

  private generateSummary(
    providerCount: number,
    avgOverall: number,
    strengths: Set<string>,
    weaknesses: Set<string>
  ): string {
    return `Combined evaluation from ${providerCount} providers with an average score of ${Math.round(avgOverall)}/100. ` +
      `Key strengths include: ${Array.from(strengths).slice(0, 2).join(', ')}. ` +
      `Areas for improvement: ${Array.from(weaknesses).slice(0, 2).join(', ')}.`;
  }

  /**
   * Returns only enabled providers (configured and enabled in config).
   * If all are disabled, throws in evaluateWithAllProviders.
   */
  public getEnabledProviders(): AIProviderType[] {
    return this.configService.getEnabledProviders();
  }

  public isProviderEnabled(providerType: AIProviderType): boolean {
    return this.configService.isProviderEnabled(providerType);
  }

  public toggleProvider(providerType: AIProviderType): void {
    const config = this.configService.getProviderConfig(providerType);
    this.configService.setProviderConfig(providerType, { enabled: !config.enabled });
  }
} 