import type {
    EvaluationInput,
    EvaluationResult,
    EvaluationMetrics,
    EvaluationFeedback,
} from './types';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ResultValidator } from './validators/ResultValidator';
import { ValidationError } from '../utils/ValidationError';
import { ProviderInstanceConfigService } from './ProviderInstanceConfigService';
import { providerInstanceFactory } from './providers/ProviderInstanceFactory';
import { MetricsCalculator } from '../utils/MetricsCalculator';


export class DynamicInstanceEvaluationService {
    private static instance: DynamicInstanceEvaluationService;

    private readonly errorHandler: ErrorHandlingService;
    private readonly configService: ProviderInstanceConfigService;

    private constructor() {
        this.errorHandler = ErrorHandlingService.getInstance();
        this.configService = ProviderInstanceConfigService.getInstance();
    }

    public static getInstance(): DynamicInstanceEvaluationService {
        if (!DynamicInstanceEvaluationService.instance) {
            DynamicInstanceEvaluationService.instance = new DynamicInstanceEvaluationService();
        }
        return DynamicInstanceEvaluationService.instance;
    }

    public async evaluateWithInstances(
        input: EvaluationInput,
        instanceIds: string[]
    ): Promise<{
        results: Map<string, EvaluationResult>;
        combinedResult: {
            metrics: EvaluationMetrics;
            feedback: EvaluationFeedback;
        };
    }> {
        if (instanceIds.length === 0) {
            throw new ValidationError('At least one provider instance must be specified');
        }

        const results = new Map<string, EvaluationResult>();
        const errors = new Map<string, string>();

        await Promise.all(
            instanceIds.map(async (instanceId) => {
                try {
                    const instance = this.configService.getProviderInstance(instanceId);
                    if (!instance) {
                        throw new Error(`Provider instance ${instanceId} not found`);
                    }

                    if (!instance.enabled || !instance.config.apiKey) {
                        throw new Error(`Provider instance ${instance.name} is not enabled or configured`);
                    }

                    const provider = providerInstanceFactory.getProvider(instance);
                    const result = await provider.evaluate(input);

                    ResultValidator.validateResult(result);
                    results.set(instanceId, result);
                } catch (error) {
                    this.errorHandler.handleError(error, `DynamicInstanceEvaluationService.evaluateWithInstances.${instanceId}`);
                    errors.set(instanceId, error instanceof Error ? error.message : 'Unknown error');
                }
            })
        );

        if (results.size === 0) {
            const errorMessages = Array.from(errors.values()).join(', ');
            throw new ValidationError(`All provider instances failed: ${errorMessages}`);
        }

        const combinedResult = this.combineResults(Array.from(results.values()));

        return {
            results,
            combinedResult
        };
    }

    public async evaluateWithAllEnabledInstances(input: EvaluationInput): Promise<{
        results: Map<string, EvaluationResult>;
        combinedResult: {
            metrics: EvaluationMetrics;
            feedback: EvaluationFeedback;
        };
    }> {
        const enabledInstances = this.configService.getEnabledProviderInstances();
        if (enabledInstances.length === 0) {
            throw new ValidationError('No enabled provider instances available');
        }

        const instanceIds = enabledInstances.map(instance => instance.id);
        return this.evaluateWithInstances(input, instanceIds);
    }

    public async evaluateWithProviderType(
        input: EvaluationInput,
        providerType: string
    ): Promise<{
        results: Map<string, EvaluationResult>;
        combinedResult: {
            metrics: EvaluationMetrics;
            feedback: EvaluationFeedback;
        };
    }> {
        const instances = this.configService.getProviderInstancesByType(providerType)
            .filter(instance => instance.enabled && instance.config.apiKey);

        if (instances.length === 0) {
            throw new ValidationError(`No enabled instances found for provider type: ${providerType}`);
        }

        const instanceIds = instances.map(instance => instance.id);
        return this.evaluateWithInstances(input, instanceIds);
    }

    private combineResults(results: EvaluationResult[]): {
        metrics: EvaluationMetrics;
        feedback: EvaluationFeedback;
    } {
        const metrics = MetricsCalculator.calculateFromArray(results);
        const feedback = this.generateCombinedFeedback(results);

        return { metrics, feedback };
    }

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
        return `Combined evaluation from ${providerCount} provider instance${providerCount > 1 ? 's' : ''} with an average score of ${Math.round(avgOverall)}/100. ` +
            `Key strengths include: ${Array.from(strengths).slice(0, 2).join(', ')}. ` +
            `Areas for improvement: ${Array.from(weaknesses).slice(0, 2).join(', ')}.`;
    }

    public getProviderInstanceStats(): {
        total: number;
        enabled: number;
        byType: Record<string, number>;
    } {
        const allInstances = this.configService.getAllProviderInstances();
        const enabledInstances = this.configService.getEnabledProviderInstances();

        const byType: Record<string, number> = {};
        allInstances.forEach(instance => {
            byType[instance.type] = (byType[instance.type] || 0) + 1;
        });

        return {
            total: allInstances.length,
            enabled: enabledInstances.length,
            byType
        };
    }
} 