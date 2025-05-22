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

interface EvaluationState {
  userInput: string;
  aiResponse: string;
  isScanning: boolean;
  apiConfigs: ProviderConfig[];
  activeTab: ActiveTab;
  setUserInput: (input: string) => void;
  setAiResponse: (response: string) => void;
  setIsScanning: (isScanning: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
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

        setUserInput: (input: string) => set({ userInput: input }),
        setAiResponse: (response: string) => set({ aiResponse: response }),
        setIsScanning: (isScanning: boolean) => set({ isScanning }),
        setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),

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
          apiConfigs: state.apiConfigs
        })
      }
    )
  )
); 