import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { EvaluationResponse, HistoryEntry, AIProviderType } from '../services/types';
import { ErrorHandlingService, ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (userInput: string, aiResponse: string, evaluation: EvaluationResponse) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getEntry: (id: string) => HistoryEntry | undefined;
  getRecentEntries: (limit?: number) => HistoryEntry[];
  updateFeedback: (id: string, provider: AIProviderType, feedback: string) => void;
}

export const useHistoryStore = create<HistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        entries: [],

        addEntry: (userInput: string, aiResponse: string, evaluation: EvaluationResponse) => {
          const errorHandler = ErrorHandlingService.getInstance();
          try {
            const entry: HistoryEntry = {
              id: uuidv4(),
              userInput,
              aiResponse,
              evaluation,
              timestamp: Date.now()
            };

            set(state => ({
              entries: [entry, ...state.entries]
            }));
          } catch (error) {
            errorHandler.handleError(error, 'HistoryStore.addEntry', {
              category: ErrorCategory.STORAGE,
              severity: ErrorSeverity.LOW
            });
          }
        },

        removeEntry: (id: string) => {
          set(state => ({
            entries: state.entries.filter(entry => entry.id !== id)
          }));
        },

        clearHistory: () => {
          set({ entries: [] });
        },

        getEntry: (id: string) => {
          return get().entries.find(entry => entry.id === id);
        },

        getRecentEntries: (limit?: number) => {
          const entries = get().entries;
          return limit ? entries.slice(0, limit) : entries;
        },

        updateFeedback: (id: string, _, feedback: string) => {
          const errorHandler = ErrorHandlingService.getInstance();
          try {
            set(state => ({
              entries: state.entries.map(entry => {
                if (entry.id === id) {
                  return {
                    ...entry,
                    userFeedback: feedback
                  };
                }
                return entry;
              })
            }));
          } catch (error) {
            errorHandler.handleError(error, 'HistoryStore.updateFeedback', {
              category: ErrorCategory.STORAGE,
              severity: ErrorSeverity.LOW
            });
          }
        }
      }),
      {
        name: 'evaluator-history',
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            try {
              return JSON.parse(str);
            } catch {
              return null;
            }
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          }
        }
      }
    )
  )
); 