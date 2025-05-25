import { useHistoryStore } from '../store/useHistoryStore';
import type { EvaluationResponse, HistoryEntry } from './types';

export class EvaluationHistoryService {
  private static instance: EvaluationHistoryService;
  private readonly ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  private constructor() { }

  static getInstance(): EvaluationHistoryService {
    if (!EvaluationHistoryService.instance) {
      EvaluationHistoryService.instance = new EvaluationHistoryService();
    }
    return EvaluationHistoryService.instance;
  }

  findDuplicate(userInput: string, aiResponse: string): {
    hasDuplicate: boolean;
    duplicateEntry: HistoryEntry | null;
  } {
    const { entries } = useHistoryStore.getState();
    const oneWeekAgo = Date.now() - this.ONE_WEEK_MS;

    const duplicate = entries.find(entry =>
      entry.timestamp > oneWeekAgo &&
      entry.userInput.trim() === userInput.trim() &&
      entry.aiResponse.trim() === aiResponse.trim()
    );

    return {
      hasDuplicate: !!duplicate,
      duplicateEntry: duplicate || null
    };
  }

  addToHistory(userInput: string, aiResponse: string, evaluation: EvaluationResponse) {
    const { addEntry } = useHistoryStore.getState();
    addEntry(userInput, aiResponse, evaluation);
  }
} 