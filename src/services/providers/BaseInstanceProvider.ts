import type {
    EvaluationResult,
    ProviderInstance,
    InstanceAIProvider,
    AIProviderType
} from '../types';
import { BaseProvider } from './BaseProvider';

/**
 * Base class for instance-based providers following SOLID principles
 * Single Responsibility: Manages instance-specific provider logic
 * Open/Closed: Can be extended for new providers without modification
 */
export abstract class BaseInstanceProvider extends BaseProvider implements InstanceAIProvider {
    readonly instanceId: string;
    readonly instanceConfig: ProviderInstance['config'];
    private readonly instanceName: string;

    // For backward compatibility, map provider types to enum
    abstract id: AIProviderType;

    constructor(instance: ProviderInstance) {
        super();
        this.instanceId = instance.id;
        this.instanceConfig = { ...instance.config };
        this.instanceName = instance.name;

        // Auto-initialize if API key is provided
        if (instance.config.apiKey) {
            this.initialize(instance.config.apiKey);
        }
    }

    /**
     * Override name to return instance name
     */
    get name(): string {
        return this.instanceName;
    }

    /**
     * Get the provider type as a string (not enum)
     */
    abstract getProviderType(): string;

    /**
     * Override to use instance configuration
     */
    protected getModel(): string {
        return this.instanceConfig.model;
    }

    protected getEndpoint(): string | undefined {
        return this.instanceConfig.endpoint;
    }

    protected getTemperature(): number {
        return this.instanceConfig.temperature ?? 0.3;
    }

    protected getMaxTokens(): number {
        return this.instanceConfig.maxTokens ?? 1000;
    }

    protected getCustomHeaders(): Record<string, string> {
        return this.instanceConfig.customHeaders ?? {};
    }

    protected createMetadata(startTime: number): EvaluationResult['metadata'] {
        return {
            providerId: this.instanceId,
            timestamp: Date.now(),
            processingTimeMs: Date.now() - startTime,
            modelVersion: this.getModel()
        };
    }
} 