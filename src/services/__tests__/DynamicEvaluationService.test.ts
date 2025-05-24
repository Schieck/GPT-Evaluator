import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DynamicEvaluationService } from '../DynamicEvaluationService';
import { AIProviderType } from '../types';
import type { EvaluationInput, EvaluationResult, AIProvider } from '../types';
import type { ProviderConfigService } from '../ProviderConfigService';
import type { EvaluationService } from '../EvaluationService';
import { providerFactory } from '../providers';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { ValidationError } from '../../utils/ValidationError';

describe('DynamicEvaluationService', () => {
  let service: DynamicEvaluationService;
  let mockConfigService: ProviderConfigService;
  let mockEvaluationService: EvaluationService;
  let mockErrorHandler: ErrorHandlingService;
  let mockOpenAIProvider: AIProvider;
  let mockClaudeProvider: AIProvider;

  const mockResultA: EvaluationResult = {
    metrics: {
      relevance: 85,
      accuracy: 87,
      completeness: 90,
      coherence: 88,
      overall: 87
    },
    feedback: {
      strengths: ['Clear', 'Concise'],
      weaknesses: ['Could be more detailed'],
      suggestions: ['Add examples'],
      summary: 'Good response',
      promptRequestSuggestion: 'Please provide more context',
      references: []
    },
    metadata: {
      providerId: AIProviderType.OPENAI,
      modelVersion: 'gpt-4',
      timestamp: 1,
      processingTimeMs: 100
    }
  };

  const mockResultB: EvaluationResult = {
    metrics: {
      relevance: 87,
      accuracy: 86,
      completeness: 89,
      coherence: 90,
      overall: 88
    },
    feedback: {
      strengths: ['Thorough'],
      weaknesses: ['Verbose'],
      suggestions: ['Summarize'],
      summary: 'Very good',
      promptRequestSuggestion: 'Please provide a more detailed and specific answer with examples',
      references: []
    },
    metadata: {
      providerId: AIProviderType.CLAUDE,
      modelVersion: 'claude-3',
      timestamp: 2,
      processingTimeMs: 120
    }
  };

  beforeEach(() => {
    mockConfigService = {
      getProviderConfig: vi.fn(),
      updateProviderConfig: vi.fn(),
      getEnabledProviders: vi.fn(),
      isProviderEnabled: vi.fn(),
      toggleProvider: vi.fn(),
      setProviderConfig: vi.fn()
    } as unknown as ProviderConfigService;

    mockEvaluationService = {
      getAvailableProviders: vi.fn().mockReturnValue([AIProviderType.OPENAI, AIProviderType.CLAUDE]),
      evaluateSync: vi.fn(),
      validateInput: vi.fn(),
      evaluate: vi.fn(),
      errorHandler: { handleError: vi.fn() },
      evaluations: new Map()
    } as unknown as EvaluationService;

    mockErrorHandler = {
      handleError: vi.fn(),
      getUserFriendlyMessage: vi.fn().mockReturnValue('User friendly error message')
    } as unknown as ErrorHandlingService;

    mockOpenAIProvider = {
      isConfigured: vi.fn().mockReturnValue(true),
      evaluate: vi.fn().mockResolvedValue(mockResultA),
      initialize: vi.fn()
    } as unknown as AIProvider;
    mockClaudeProvider = {
      isConfigured: vi.fn().mockReturnValue(true),
      evaluate: vi.fn().mockResolvedValue(mockResultB),
      initialize: vi.fn()
    } as unknown as AIProvider;
    vi.spyOn(providerFactory, 'getProvider').mockImplementation((type: AIProviderType) =>
      type === AIProviderType.OPENAI ? mockOpenAIProvider : mockClaudeProvider
    );

    service = new DynamicEvaluationService(
      mockEvaluationService,
      mockConfigService,
      mockErrorHandler
    );

    vi.mocked(mockConfigService.getProviderConfig).mockImplementation((providerId: AIProviderType) => ({
      type: providerId,
      enabled: true,
      apiKey: 'test-key',
      modelVersion: providerId === AIProviderType.OPENAI ? 'gpt-4-turbo-preview' : 'claude-3-opus-20240229'
    }));
    vi.mocked(mockConfigService.getEnabledProviders).mockReturnValue([AIProviderType.OPENAI]);
    vi.mocked(mockConfigService.isProviderEnabled).mockImplementation((providerId: AIProviderType) => providerId === AIProviderType.OPENAI);
    vi.mocked(mockEvaluationService.evaluateSync).mockImplementation((_, providerType?: AIProviderType) => {
      if (providerType === AIProviderType.OPENAI) {
        return Promise.resolve(mockResultA);
      }
      return Promise.reject(new Error('Provider failed'));
    });
  });

  describe('getInstance', () => {
    test('returns singleton instance', () => {
      const instance1 = DynamicEvaluationService.getInstance();
      const instance2 = DynamicEvaluationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('evaluateWithAllProviders', () => {
    test('successfully evaluates with single enabled provider', async () => {
      const input: EvaluationInput = { userPrompt: 'Prompt', aiResponse: 'Response' };
      vi.mocked(mockEvaluationService.evaluateSync).mockResolvedValueOnce(mockResultA);
      const result = await service.evaluateWithAllProviders(input);
      expect(result.providerResults[AIProviderType.OPENAI]).toBeDefined();
      expect(result.metrics.overall).toBe(mockResultA.metrics.overall);
      expect(result.feedback.strengths).toContain('Clear');
    });

    test('throws error when no providers are enabled', async () => {
      vi.mocked(mockEvaluationService.getAvailableProviders).mockReturnValue([]);
      vi.mocked(mockConfigService.getEnabledProviders).mockReturnValue([]);
      const input: EvaluationInput = { userPrompt: 'Prompt', aiResponse: 'Response' };
      await expect(service.evaluateWithAllProviders(input))
        .rejects
        .toThrow('No enabled providers available for evaluation');
    });

    test('handles provider evaluation failure gracefully', async () => {
      const input: EvaluationInput = { userPrompt: 'Prompt', aiResponse: 'Response' };
      vi.mocked(mockConfigService.getEnabledProviders).mockReturnValue([AIProviderType.OPENAI, AIProviderType.CLAUDE]);
      vi.mocked(mockConfigService.isProviderEnabled).mockImplementation(() => true);
      vi.mocked(mockConfigService.getProviderConfig).mockImplementation((providerId: AIProviderType) => ({
        type: providerId,
        enabled: true,
        apiKey: 'test-key',
        modelVersion: providerId === AIProviderType.OPENAI ? 'gpt-4-turbo-preview' : 'claude-3-opus-20240229'
      }));
      vi.mocked(mockEvaluationService.evaluateSync).mockImplementation((_, providerType?: AIProviderType) => {
        if (providerType === AIProviderType.OPENAI) {
          return Promise.resolve(mockResultA);
        }
        return Promise.reject(new Error('Provider failed'));
      });
      const result = await service.evaluateWithAllProviders(input);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
      expect(result.providerResults[AIProviderType.OPENAI]).toBeDefined();
      expect(result.providerResults[AIProviderType.CLAUDE]).toBeUndefined();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'DynamicEvaluationService.evaluateWithAllProviders.claude'
      );
    });

    test('throws error when all providers fail', async () => {
      const input: EvaluationInput = { userPrompt: 'Prompt', aiResponse: 'Response' };
      vi.mocked(mockEvaluationService.evaluateSync)
        .mockRejectedValueOnce(new Error('Provider A failed'))
        .mockRejectedValueOnce(new Error('Provider B failed'));
      await expect(service.evaluateWithAllProviders(input))
        .rejects
        .toThrow('All providers failed to evaluate');
    });

    test('validates provider results', async () => {
      const input: EvaluationInput = { userPrompt: 'Prompt', aiResponse: 'Response' };
      const invalidResult = {
        ...mockResultA,
        metrics: {
          ...mockResultA.metrics,
          relevance: 120 // Invalid value > 100
        }
      };
      vi.mocked(mockEvaluationService.evaluateSync).mockResolvedValueOnce(invalidResult);
      await expect(service.evaluateWithAllProviders(input))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('provider management', () => {
    test('correctly identifies enabled providers', () => {
      const enabledProviders = service.getEnabledProviders();
      expect(enabledProviders).toContain(AIProviderType.OPENAI);
      expect(enabledProviders).not.toContain(AIProviderType.CLAUDE);
    });

    test('correctly checks if provider is enabled', () => {
      expect(service.isProviderEnabled(AIProviderType.OPENAI)).toBe(true);
      expect(service.isProviderEnabled(AIProviderType.CLAUDE)).toBe(false);
    });

    test('toggles provider state', () => {
      service.toggleProvider(AIProviderType.OPENAI);
      expect(mockConfigService.setProviderConfig).toHaveBeenCalledWith(
        AIProviderType.OPENAI,
        expect.objectContaining({ enabled: false })
      );
    });
  });
}); 