import type { HistoryEntry } from './types';
import { ErrorHandlingService } from './ErrorHandlingService';

export class HistoryService {
    private static instance: HistoryService;
    private readonly STORAGE_KEY = 'evaluator-history';
    private readonly ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    private readonly errorHandler = ErrorHandlingService.getInstance();

    private constructor() {}

    public static getInstance(): HistoryService {
        if (!HistoryService.instance) {
            HistoryService.instance = new HistoryService();
        }
        return HistoryService.instance;
    }

    getHistory(): HistoryEntry[] {
        try {
            const historyData = localStorage.getItem(this.STORAGE_KEY);
            return historyData ? JSON.parse(historyData) : [];
        } catch (error) {
            this.errorHandler.handleError(error, 'HistoryService.getHistory');
            return [];
        }
    }

    findRecentEvaluation(userInput: string, aiResponse: string): HistoryEntry | null {
        try {
            const history = this.getHistory();
            const oneWeekAgo = Date.now() - this.ONE_WEEK_MS;
            
            return history.find(item => 
                item.timestamp > oneWeekAgo &&
                item.userInput.trim() === userInput.trim() &&
                item.aiResponse.trim() === aiResponse.trim()
            ) || null;
        } catch (error) {
            this.errorHandler.handleError(error, 'HistoryService.findRecentEvaluation');
            return null;
        }
    }

    saveToHistory(item: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
        try {
            const history = this.getHistory();
            const newItem: HistoryEntry = {
                ...item,
                id: crypto.randomUUID(),
                timestamp: Date.now()
            };
            history.unshift(newItem);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            this.errorHandler.handleError(error, 'HistoryService.saveToHistory');
        }
    }

    updateFeedback(id: string, feedback: string): void {
        try {
            const history = this.getHistory();
            let updated = false;
            const updatedHistory = history.map(item => {
                if (item.id === id) {
                    updated = true;
                    return {
                        ...item,
                        userFeedback: feedback
                    };
                }
                return item;
            });
            if (updated) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'HistoryService.updateFeedback');
        }
    }

    clearHistory(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            this.errorHandler.handleError(error, 'HistoryService.clearHistory');
        }
    }
} 