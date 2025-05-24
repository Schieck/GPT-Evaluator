import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  AIProviderType,
  type EvaluationInput,
  type EvaluationResult
} from '../types';
import { EvaluationService } from '../EvaluationService';

const mockEvaluationResult: EvaluationResult = {
  metrics: {
    relevance: 95,
    accuracy: 98,
    completeness: 90,
    coherence: 92,
    overall: 94
  },
  feedback: {
    strengths: ['Accurate', 'Clear'],
    weaknesses: ['Brief'],
    suggestions: ['Add more details'],
    summary: 'Good response but could be more detailed',
    promptRequestSuggestion: 'Please provide a more detailed response with specific examples and explanations',
    references: []
  },
  metadata: {
    providerId: AIProviderType.OPENAI,
    timestamp: Date.now(),
    processingTimeMs: 500,
    modelVersion: 'gpt-4'
  }
};

const mockOpenAIProvider = {
  id: AIProviderType.OPENAI,
  name: 'OpenAI',
  isConfigured: vi.fn().mockReturnValue(true),
  evaluate: vi.fn().mockResolvedValue(mockEvaluationResult)
};

const mockClaudeProvider = {
  id: AIProviderType.CLAUDE,
  name: 'Claude',
  isConfigured: vi.fn().mockReturnValue(true),
  evaluate: vi.fn().mockResolvedValue({
    ...mockEvaluationResult,
    metadata: {
      ...mockEvaluationResult.metadata,
      providerId: AIProviderType.CLAUDE,
      modelVersion: 'claude-3'
    }
  })
};

vi.mock('../providers/OpenAIProvider', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => mockOpenAIProvider)
}));

vi.mock('../providers/ClaudeProvider', () => ({
  ClaudeProvider: vi.fn().mockImplementation(() => mockClaudeProvider)
}));

vi.mock('../providers', async () => ({
  providerFactory: {
    getProvider: vi.fn().mockImplementation((type: AIProviderType) => {
      if (type === AIProviderType.OPENAI) {
        return mockOpenAIProvider;
      }
      if (type === AIProviderType.CLAUDE) {
        return mockClaudeProvider;
      }
      return undefined;
    }),
    getAvailableProviders: vi.fn().mockReturnValue([AIProviderType.OPENAI, AIProviderType.CLAUDE]),
    initializeProvider: vi.fn()
  }
}));

describe('EvaluationService', () => {
  let service: EvaluationService;

  beforeEach(() => {
    service = EvaluationService.getInstance();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    test('returns singleton instance', () => {
      const instance1 = EvaluationService.getInstance();
      const instance2 = EvaluationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('evaluateSync', () => {
    test('successfully evaluates input with OpenAI provider', async () => {
      const input: EvaluationInput = {
        userPrompt: 'Test prompt',
        aiResponse: 'Test response'
      };

      const startTime = 1000;
      const endTime = 1500;
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      const result = await service.evaluateSync(input, AIProviderType.OPENAI);
      expect(result).toEqual({
        ...mockEvaluationResult,
        metadata: {
          ...mockEvaluationResult.metadata,
          processingTimeMs: 500
        }
      });
      expect(mockOpenAIProvider.evaluate).toHaveBeenCalledWith(input);
      expect(mockOpenAIProvider.isConfigured).toHaveBeenCalled();
    });

    test('successfully evaluates input with Claude provider', async () => {
      const input: EvaluationInput = {
        userPrompt: 'Test prompt',
        aiResponse: 'Test response'
      };

      const startTime = 1000;
      const endTime = 1500;
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      const result = await service.evaluateSync(input, AIProviderType.CLAUDE);
      expect(result.metadata.providerId).toBe(AIProviderType.CLAUDE);
      expect(result.metadata.processingTimeMs).toBe(500);
      expect(mockClaudeProvider.evaluate).toHaveBeenCalledWith(input);
      expect(mockClaudeProvider.isConfigured).toHaveBeenCalled();
    });

    test('throws error for invalid input', async () => {
      const input: EvaluationInput = {
        userPrompt: '',
        aiResponse: 'Test response'
      };

      await expect(service.evaluateSync(input)).rejects.toThrow('User prompt is required');
    });

    test('throws error when no provider is configured', async () => {
      mockOpenAIProvider.isConfigured.mockReturnValueOnce(false);
      mockClaudeProvider.isConfigured.mockReturnValueOnce(false);

      const input: EvaluationInput = {
        userPrompt: 'Test prompt',
        aiResponse: 'Test response'
      };

      await expect(service.evaluateSync(input, AIProviderType.OPENAI))
        .rejects.toThrow('Provider openai is not properly configured');
      expect(mockOpenAIProvider.isConfigured).toHaveBeenCalled();

      await expect(service.evaluateSync(input, AIProviderType.CLAUDE))
        .rejects.toThrow('Provider claude is not properly configured');
      expect(mockClaudeProvider.isConfigured).toHaveBeenCalled();
    });
  });

  describe('getAvailableProviders', () => {
    test('returns list of available providers', () => {
      const providers = service.getAvailableProviders();
      expect(providers).toEqual([AIProviderType.OPENAI, AIProviderType.CLAUDE]);
    });
  });

  describe('edge cases', () => {
    test('throws error for unknown provider type', async () => {
      const input: EvaluationInput = {
        userPrompt: 'Test prompt',
        aiResponse: 'Test response'
      };
      await expect(service.evaluateSync(input, 'UNKNOWN_PROVIDER' as any)).rejects.toThrow();
    });
    test('processingTimeMs is calculated correctly', async () => {
      const input: EvaluationInput = {
        userPrompt: 'Test prompt',
        aiResponse: 'Test response'
      };
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1600);
      const result = await service.evaluateSync(input, AIProviderType.OPENAI);
      expect(result.metadata.processingTimeMs).toBe(600);
    });
  });
}); 