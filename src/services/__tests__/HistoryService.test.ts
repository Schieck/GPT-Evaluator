import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { HistoryService } from '../HistoryService';
import type { CombinedEvaluationResult, HistoryEntry } from '../types';
import { AIProviderType, EvaluationStatus } from '../types';

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => {
    console.log('getItem called with key:', key);
    console.log('Current store:', mockLocalStorage.store);
    return mockLocalStorage.store[key] || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    console.log('setItem called with key:', key);
    console.log('Value being set:', value);
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    console.log('removeItem called with key:', key);
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    console.log('clear called');
    mockLocalStorage.store = {};
  })
};

const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID
});

vi.stubGlobal('localStorage', mockLocalStorage);

describe('HistoryService', () => {
  let service: HistoryService;
  const mockEvaluationResult: CombinedEvaluationResult = {
    metrics: {
      relevance: 90,
      accuracy: 95,
      completeness: 85,
      coherence: 88,
      overall: 89
    },
    feedback: {
      strengths: ['Good response'],
      weaknesses: ['Could be more detailed'],
      suggestions: ['Add examples'],
      summary: 'Overall good response',
      promptRequestSuggestion: 'Please provide a more detailed response with specific examples and explanations'
    },
    providerResults: {
      [AIProviderType.OPENAI]: {
        metrics: {
          relevance: 90,
          accuracy: 95,
          completeness: 85,
          coherence: 88,
          overall: 89
        },
        feedback: {
          strengths: ['Good response'],
          weaknesses: ['Could be more detailed'],
          suggestions: ['Add examples'],
          summary: 'Overall good response',
          promptRequestSuggestion: 'Please provide a more detailed response with specific examples and explanations'
        },
        metadata: {
          providerId: AIProviderType.OPENAI,
          timestamp: Date.now(),
          processingTimeMs: 500,
          modelVersion: 'gpt-4'
        }
      },
      [AIProviderType.CLAUDE]: {
        metrics: {
          relevance: 92,
          accuracy: 94,
          completeness: 87,
          coherence: 90,
          overall: 91
        },
        feedback: {
          strengths: ['Well structured', 'Clear explanation'],
          weaknesses: ['Could use more examples'],
          suggestions: ['Include more specific examples'],
          summary: 'Good response with clear structure',
          promptRequestSuggestion: 'Please provide a more detailed response with specific examples and explanations'
        },
        metadata: {
          providerId: AIProviderType.CLAUDE,
          timestamp: Date.now(),
          processingTimeMs: 450,
          modelVersion: 'claude-3'
        }
      }
    }
  };

  const createMockHistoryEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
    id: '1',
    timestamp: Date.now(),
    userInput: 'test prompt',
    aiResponse: 'test response',
    evaluation: {
      status: EvaluationStatus.COMPLETED,
      id: '1',
      result: mockEvaluationResult.providerResults
    },
    ...overrides
  });

  beforeEach(() => {
    service = HistoryService.getInstance();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    test('returns singleton instance', () => {
      const instance1 = HistoryService.getInstance();
      const instance2 = HistoryService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getHistory', () => {
    test('returns empty array when no history exists', () => {
      const history = service.getHistory();
      expect(history).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('evaluator-history');
    });

    test('returns parsed history from localStorage', () => {
      const mockHistory = [createMockHistoryEntry()];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      const history = service.getHistory();
      expect(history).toEqual(mockHistory);
    });

    test('handles invalid JSON gracefully', () => {
      mockLocalStorage.setItem('evaluator-history', 'invalid-json');
      const history = service.getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('saveToHistory', () => {
    test('saves new item to history', () => {
      const newItem = {
        userInput: 'test prompt',
        aiResponse: 'test response',
        evaluation: {
          status: EvaluationStatus.COMPLETED,
          id: '1',
          result: mockEvaluationResult.providerResults
        }
      };
      service.saveToHistory(newItem);
      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedHistory).toHaveLength(1);
      expect(savedHistory[0]).toMatchObject({
        ...newItem,
        id: expect.any(String),
        timestamp: expect.any(Number)
      });
    });

    test('adds new items to beginning of history', () => {
      const existingHistory = [createMockHistoryEntry()];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(existingHistory));
      
      const newItem = {
        userInput: 'new prompt',
        aiResponse: 'new response',
        evaluation: {
          status: EvaluationStatus.COMPLETED,
          id: '2',
          result: mockEvaluationResult.providerResults
        }
      };
      service.saveToHistory(newItem);
      
      const lastSetItemCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
      const savedHistory = JSON.parse(lastSetItemCall[1]);
      
      expect(savedHistory).toHaveLength(2);
      expect(savedHistory[0]).toMatchObject({
        ...newItem,
        id: expect.any(String),
        timestamp: expect.any(Number)
      });
      expect(savedHistory[1]).toEqual(existingHistory[0]);
    });
  });

  describe('updateFeedback', () => {
    test('updates feedback for existing item', () => {
      const mockHistory = [createMockHistoryEntry()];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      
      service.updateFeedback('1', 'new feedback');
      
      const lastSetItemCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
      const savedHistory = JSON.parse(lastSetItemCall[1]);
      
      expect(savedHistory).toHaveLength(1);
      expect(savedHistory[0]).toEqual({
        ...mockHistory[0],
        userFeedback: 'new feedback'
      });
    });

    test('does not modify history when item not found', () => {
      const mockHistory = [createMockHistoryEntry()];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      
      service.updateFeedback('non-existent', 'new feedback');
      
      const lastSetItemCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
      const savedHistory = JSON.parse(lastSetItemCall[1]);
      expect(savedHistory).toEqual(mockHistory);
    });
  });

  describe('findRecentEvaluation', () => {
    test('finds recent evaluation for same input/output', () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const mockHistory = [createMockHistoryEntry({ timestamp: oneDayAgo })];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      const found = service.findRecentEvaluation('test prompt', 'test response');
      expect(found).toEqual(mockHistory[0]);
    });

    test('returns null for old evaluation', () => {
      const oneWeekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const mockHistory = [createMockHistoryEntry({ timestamp: oneWeekAgo })];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      const found = service.findRecentEvaluation('test prompt', 'test response');
      expect(found).toBeNull();
    });

    test('handles whitespace differences', () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const mockHistory = [createMockHistoryEntry({
        timestamp: oneDayAgo,
        userInput: '  test prompt  ',
        aiResponse: '  test response  '
      })];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      const found = service.findRecentEvaluation('test prompt', 'test response');
      expect(found).toEqual(mockHistory[0]);
    });
  });

  describe('clearHistory', () => {
    test('removes all history', () => {
      const mockHistory = [createMockHistoryEntry()];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      service.clearHistory();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('evaluator-history');
    });
  });

  describe('user feedback edge cases', () => {
    test('saves empty feedback', () => {
      const newItem = {
        userInput: 'test prompt',
        aiResponse: 'test response',
        evaluation: {
          status: EvaluationStatus.COMPLETED,
          id: '1',
          result: mockEvaluationResult.providerResults
        }
      };
      service.saveToHistory(newItem);
      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      const savedId = savedHistory[0].id;
      service.updateFeedback(savedId, '');
      const updatedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1]);
      expect(updatedHistory[0].userFeedback).toBe('');
    });

    test('saves long feedback', () => {
      const newItem = {
        userInput: 'test prompt',
        aiResponse: 'test response',
        evaluation: {
          status: EvaluationStatus.COMPLETED,
          id: '1',
          result: mockEvaluationResult.providerResults
        }
      };
      service.saveToHistory(newItem);
      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      const savedId = savedHistory[0].id;
      const longFeedback = 'a'.repeat(10000);
      service.updateFeedback(savedId, longFeedback);
      const updatedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1]);
      expect(updatedHistory[0].userFeedback).toBe(longFeedback);
    });

    test('saves feedback with special characters', () => {
      const newItem = {
        userInput: 'test prompt',
        aiResponse: 'test response',
        evaluation: {
          status: EvaluationStatus.COMPLETED,
          id: '1',
          result: mockEvaluationResult.providerResults
        }
      };
      service.saveToHistory(newItem);
      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      const savedId = savedHistory[0].id;
      const specialFeedback = '!@#$%^&*()_+-=[]{}|;:",.<>/?`~😊';
      service.updateFeedback(savedId, specialFeedback);
      const updatedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1]);
      expect(updatedHistory[0].userFeedback).toBe(specialFeedback);
    });

    test('update feedback for non-existent item with edge cases', () => {
      const mockHistory = [createMockHistoryEntry()];
      mockLocalStorage.setItem('evaluator-history', JSON.stringify(mockHistory));
      service.updateFeedback('non-existent', '');
      service.updateFeedback('non-existent', 'a'.repeat(10000));
      service.updateFeedback('non-existent', '!@#$%^&*()_+-=[]{}|;:",.<>/?`~😊');
      const savedHistory = JSON.parse(mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1]);
      expect(savedHistory).toEqual(mockHistory);
    });
  });
}); 