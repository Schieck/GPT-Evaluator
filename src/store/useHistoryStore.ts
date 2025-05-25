import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { EvaluationResponse, HistoryEntry } from '../services/types';
import { ErrorHandlingService, ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (userInput: string, aiResponse: string, evaluation: EvaluationResponse) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getEntry: (id: string) => HistoryEntry | undefined;
  getRecentEntries: (limit?: number) => HistoryEntry[];
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
        }
      }),
      {
        name: 'evaluator-history',
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            try {
              const parsed = JSON.parse(str);
              // Convert instanceResults back to Map objects
              if (parsed?.state?.entries) {
                parsed.state.entries = parsed.state.entries.map((entry: any) => {
                  if (entry.evaluation?.instanceResults) {
                    // Convert from array of [key, value] pairs back to Map
                    if (Array.isArray(entry.evaluation.instanceResults)) {
                      entry.evaluation.instanceResults = new Map(entry.evaluation.instanceResults);
                    } else if (typeof entry.evaluation.instanceResults === 'object') {
                      // Handle legacy format or object format
                      entry.evaluation.instanceResults = new Map(Object.entries(entry.evaluation.instanceResults));
                    }
                  }
                  return entry;
                });
              }
              return parsed;
            } catch {
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              // Convert Map objects to arrays before serializing
              const serializable = {
                ...value,
                state: {
                  ...value.state,
                  entries: value.state.entries.map((entry: HistoryEntry) => ({
                    ...entry,
                    evaluation: {
                      ...entry.evaluation,
                      instanceResults: entry.evaluation.instanceResults instanceof Map
                        ? Array.from(entry.evaluation.instanceResults.entries())
                        : entry.evaluation.instanceResults
                    }
                  }))
                }
              };
              localStorage.setItem(name, JSON.stringify(serializable));
            } catch (error) {
              console.error('Error serializing history data:', error);
            }
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          }
        }
      }
    )
  )
); 