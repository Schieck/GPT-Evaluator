import { vi } from 'vitest';
import { AIProviderType } from '../types';

export const mockEvaluationResult = {
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
    references: [
      {
        title: 'Official Documentation Source',
        url: 'https://example.com/docs',
        description: 'Verified technical accuracy against official documentation',
        category: 'source' as const,
        relevanceToScore: 'accuracy' as const
      },
      {
        title: 'Completeness Assessment',
        description: 'Response covers all key aspects mentioned in the prompt',
        category: 'methodology' as const,
        relevanceToScore: 'completeness' as const
      }
    ]
  },
  metadata: {
    providerId: AIProviderType.OPENAI,
    timestamp: Date.now(),
    processingTimeMs: 500,
    modelVersion: 'gpt-4'
  }
};

export const mockOpenAIProvider = {
  id: AIProviderType.OPENAI,
  name: 'OpenAI',
  isConfigured: vi.fn().mockReturnValue(true),
  evaluate: vi.fn().mockResolvedValue(mockEvaluationResult)
};

export const mockClaudeProvider = {
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

export function getMockConfigService() {
  return {
    getProviderConfig: vi.fn(),
    updateProviderConfig: vi.fn(),
    getEnabledProviders: vi.fn(),
    isProviderEnabled: vi.fn(),
    toggleProvider: vi.fn(),
    setProviderConfig: vi.fn()
  };
} 