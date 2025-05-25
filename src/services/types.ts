/**
 * Core evaluation types
 */
export interface EvaluationInput {
    userPrompt: string;
    aiResponse: string;
    parameters?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    };
}

export interface EvaluationMetrics {
    relevance: number;       // 0-100: How relevant the response is to the prompt
    accuracy: number;        // 0-100: Factual correctness
    completeness: number;    // 0-100: How thoroughly the response addresses the prompt
    coherence: number;       // 0-100: Logical flow and structure
    overall: number;         // 0-100: Weighted average of all metrics
}

export interface EvaluationReference {
    title: string;
    url?: string;
    description: string;
    category: 'fact-check' | 'source' | 'contradiction' | 'supporting-evidence' | 'methodology';
    relevanceToScore: 'relevance' | 'accuracy' | 'completeness' | 'coherence';
}

export interface EvaluationFeedback {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    summary: string;
    promptRequestSuggestion: string;
    references: EvaluationReference[];
}

/**
 * Provider-related types
 */
export enum AIProviderType {
    OPENAI = 'openai',
    CLAUDE = 'claude'
}

export interface AIProvider {
    id: AIProviderType;
    name: string;
    isConfigured(): boolean;
    evaluate(input: EvaluationInput): Promise<EvaluationResult>;
    initialize(apiKey: string, modelVersion?: string): void;
}

/**
 * Base interfaces for shared properties
 */
export interface BaseEvaluationResult {
    metrics: EvaluationMetrics;
    feedback: EvaluationFeedback;
}

export interface BaseProviderConfig {
    enabled: boolean;
    apiKey: string;
    modelVersion?: string;
    options?: Record<string, unknown>;
}

/**
 * Utility types
 */
export type ProviderResults = Record<AIProviderType, EvaluationResult>;
export type ProviderConfigMap = Map<AIProviderType, ProviderConfig>;
export type PartialProviderConfig = Partial<ProviderConfig>;

export interface ProviderConfig extends BaseProviderConfig {
    type: AIProviderType;
}

export interface EvaluationResult extends BaseEvaluationResult {
    metadata: {
        providerId: string;
        timestamp: number;
        processingTimeMs: number;
        modelVersion?: string;
    };
}

export interface CombinedEvaluationResult extends BaseEvaluationResult {
    providerResults: ProviderResults;
}

/**
 * Evaluation state types
 */
export enum EvaluationStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface EvaluationResponse {
    status: EvaluationStatus;
    id: string;
    instanceResults: Map<string, EvaluationResult>;
    error?: any;
    combinedMetrics?: EvaluationMetrics;
    combinedFeedback?: EvaluationFeedback;
}

/**
 * History and validation types
 */
export interface HistoryEntry {
    id: string;
    userInput: string;
    aiResponse: string;
    evaluation: EvaluationResponse;
    timestamp: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Provider instance types for multi-instance support
 */
export interface ProviderInstance {
    id: string; // Unique identifier like 'openai-gpt4-main'
    type: string; // 'openai', 'claude', 'deepseek'
    name: string; // User-friendly name: "GPT-4 Turbo"
    config: {
        apiKey: string;
        model: string;
        endpoint?: string; // Allow custom endpoints
        temperature?: number;
        maxTokens?: number;
        customHeaders?: Record<string, string>;
    };
    enabled: boolean;
}

export interface ProviderTemplate {
    type: string;
    displayName: string;
    models: {
        id: string;
        name: string;
        isDefault?: boolean;
    }[];
    defaultConfig: Partial<ProviderInstance['config']>;
    defaultEndpoint?: string;
    validateConfig?: (config: ProviderInstance['config']) => ValidationResult;
}

/**
 * Extended provider interface for instance-based providers
 */
export interface InstanceAIProvider extends AIProvider {
    readonly instanceId: string;
    readonly instanceConfig: ProviderInstance['config'];
}

export interface ResultWithProviderName {
    result: EvaluationResult;
    provider: string;
}