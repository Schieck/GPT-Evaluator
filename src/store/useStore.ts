import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AIProviderType } from '../services/types';
import type { ProviderConfig } from '../services/types';
import { ErrorHandlingService, ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import { providerFactory } from '../services/providers';

const DEFAULT_CONFIGS: ProviderConfig[] = [
  { type: AIProviderType.OPENAI, apiKey: '', enabled: false, modelVersion: 'gpt-4-turbo-preview' },
  { type: AIProviderType.CLAUDE, apiKey: '', enabled: false, modelVersion: 'claude-3-opus-20240229' }
];

type ActiveTab = 'live' | 'evaluator' | 'history' | 'config';

export interface FoundConversation {
  id: string;
  userPrompt: string;
  aiResponse: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface EvaluationState {
  userInput: string;
  aiResponse: string;
  isScanning: boolean;
  apiConfigs: ProviderConfig[];
  activeTab: ActiveTab;
  foundConversations: FoundConversation[];
  lastScanTime: number | null;
  setUserInput: (input: string) => void;
  setAiResponse: (response: string) => void;
  setIsScanning: (isScanning: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setLastScanTime: (time: Date | null) => void;
  addFoundConversation: (conversation: Omit<FoundConversation, 'id' | 'status'>) => void;
  updateConversationStatus: (id: string, status: 'approved' | 'rejected') => void;
  clearFoundConversations: () => void;
  initializeProviders: () => Promise<void>;
  saveConfigs: (configs: ProviderConfig[]) => Promise<void>;
  getApiKey: (type: 'openai' | 'claude') => string;
}

export const useStore = create<EvaluationState>()(
  devtools(
    persist(
      (set, get) => ({
        userInput: '',
        aiResponse: '',
        isScanning: false,
        apiConfigs: DEFAULT_CONFIGS,
        activeTab: 'live',
        foundConversations: [],
        lastScanTime: null,

        setUserInput: (input: string) => set({ userInput: input }),
        setAiResponse: (response: string) => set({ aiResponse: response }),
        setIsScanning: (isScanning: boolean) => set({ isScanning }),
        setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),
        setLastScanTime: (time: Date | null) => set({ lastScanTime: time ? time.getTime() : null }),

        addFoundConversation: (conversation) => {
          const { foundConversations } = get();
          // Check for duplicates
          const isDuplicate = foundConversations.some(
            fc => fc.userPrompt === conversation.userPrompt &&
              fc.aiResponse === conversation.aiResponse
          );

          if (!isDuplicate) {
            set({
              foundConversations: [
                ...foundConversations,
                {
                  ...conversation,
                  id: crypto.randomUUID(),
                  status: 'pending'
                }
              ]
            });
          }
        },

        updateConversationStatus: (id, status) => {
          const { foundConversations } = get();
          set({
            foundConversations: foundConversations.map(conv =>
              conv.id === id ? { ...conv, status } : conv
            )
          });
        },

        clearFoundConversations: () => set({ foundConversations: [] }),

        getApiKey: (type: 'openai' | 'claude') => {
          const configs = get().apiConfigs;
          const config = configs.find(c => c.type === type);
          return config?.apiKey || '';
        },

        initializeProviders: async () => {
          const errorHandler = ErrorHandlingService.getInstance();
          try {
            const configs = get().apiConfigs;

            const openAiConfig = configs.find(c => c.type === AIProviderType.OPENAI);
            if (openAiConfig?.apiKey) {
              providerFactory.initializeProvider(AIProviderType.OPENAI, openAiConfig.apiKey, openAiConfig.modelVersion);
            }

            const claudeConfig = configs.find(c => c.type === AIProviderType.CLAUDE);
            if (claudeConfig?.apiKey) {
              providerFactory.initializeProvider(AIProviderType.CLAUDE, claudeConfig.apiKey, claudeConfig.modelVersion);
            }
          } catch (error) {
            errorHandler.handleError(error, 'Store.initializeProviders', {
              category: ErrorCategory.STORAGE,
              severity: ErrorSeverity.MEDIUM
            });
          }
        },

        saveConfigs: async (configs: ProviderConfig[]) => {
          const errorHandler = ErrorHandlingService.getInstance();
          try {
            set({ apiConfigs: configs });

            const openAiConfig = configs.find(c => c.type === AIProviderType.OPENAI);
            if (openAiConfig?.apiKey) {
              providerFactory.initializeProvider(AIProviderType.OPENAI, openAiConfig.apiKey, openAiConfig.modelVersion);
            }

            const claudeConfig = configs.find(c => c.type === AIProviderType.CLAUDE);
            if (claudeConfig?.apiKey) {
              providerFactory.initializeProvider(AIProviderType.CLAUDE, claudeConfig.apiKey, claudeConfig.modelVersion);
            }
          } catch (error) {
            errorHandler.handleError(error, 'Store.saveConfigs', {
              category: ErrorCategory.STORAGE,
              severity: ErrorSeverity.MEDIUM
            });
          }
        }
      }),
      {
        name: 'evaluator-storage',
        partialize: (state) => ({
          userInput: state.userInput,
          aiResponse: state.aiResponse,
          apiConfigs: state.apiConfigs,
          foundConversations: state.foundConversations,
          isScanning: state.isScanning,
          lastScanTime: state.lastScanTime
        })
      }
    )
  )
); 