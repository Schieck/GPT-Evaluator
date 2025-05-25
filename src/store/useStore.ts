import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AIProviderType, type ProviderConfig, type ProviderInstance } from '../services/types';
import { ErrorHandlingService, ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import { ProviderInstanceConfigService } from '../services/ProviderInstanceConfigService';

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
  providerInstances: ProviderInstance[];
  activeTab: ActiveTab;
  foundConversations: FoundConversation[];
  lastScanTime: number | null;
  hasLegacyConfigMigrated: boolean;
  setUserInput: (input: string) => void;
  setAiResponse: (response: string) => void;
  setIsScanning: (isScanning: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setLastScanTime: (time: Date | null) => void;
  updateConversationStatus: (id: string, status: 'approved' | 'rejected') => void;
  clearFoundConversations: () => void;
  initializeProviders: () => Promise<void>;
  saveConfigs: (configs: ProviderConfig[]) => Promise<void>;
  getApiKey: (type: 'openai' | 'claude') => string;

  // New instance-based methods
  addProviderInstance: (instance: ProviderInstance) => void;
  removeProviderInstance: (instanceId: string) => void;
  updateProviderInstance: (instanceId: string, updates: Partial<ProviderInstance>) => void;
  getProviderInstances: () => ProviderInstance[];
  migrateLegacyConfigs: () => void;
}

export const useStore = create<EvaluationState>()(
  devtools(
    persist(
      (set, get) => ({
        userInput: '',
        aiResponse: '',
        isScanning: false,
        apiConfigs: DEFAULT_CONFIGS,
        providerInstances: [],
        activeTab: 'live',
        foundConversations: [],
        lastScanTime: null,
        hasLegacyConfigMigrated: false,

        setUserInput: (input: string) => set({ userInput: input }),
        setAiResponse: (response: string) => set({ aiResponse: response }),
        setIsScanning: (isScanning: boolean) => set({ isScanning }),
        setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),
        setLastScanTime: (time: Date | null) => set({ lastScanTime: time ? time.getTime() : null }),

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

        addProviderInstance: (instance: ProviderInstance) => {
          const configService = ProviderInstanceConfigService.getInstance();
          configService.addProviderInstance(instance);
          set({ providerInstances: configService.getAllProviderInstances() });
        },

        removeProviderInstance: (instanceId: string) => {
          const configService = ProviderInstanceConfigService.getInstance();
          configService.removeProviderInstance(instanceId);
          set({ providerInstances: configService.getAllProviderInstances() });
        },

        updateProviderInstance: (instanceId: string, updates: Partial<ProviderInstance>) => {
          const configService = ProviderInstanceConfigService.getInstance();
          configService.updateProviderInstance(instanceId, updates);
          set({ providerInstances: configService.getAllProviderInstances() });
        },

        getProviderInstances: () => {
          const configService = ProviderInstanceConfigService.getInstance();
          const instances = configService.getAllProviderInstances();
          set({ providerInstances: instances });
          return instances;
        },

        migrateLegacyConfigs: () => {
          const { apiConfigs, hasLegacyConfigMigrated } = get();
          if (hasLegacyConfigMigrated) return;

          const configService = ProviderInstanceConfigService.getInstance();
          configService.migrateFromLegacyConfig(apiConfigs);
          set({
            providerInstances: configService.getAllProviderInstances(),
            hasLegacyConfigMigrated: true
          });
        },

        initializeProviders: async () => {
          const errorHandler = ErrorHandlingService.getInstance();
          try {
            const { migrateLegacyConfigs } = get();
            const configService = ProviderInstanceConfigService.getInstance();

            migrateLegacyConfigs();

            set({ providerInstances: configService.getAllProviderInstances() });
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

            const configService = ProviderInstanceConfigService.getInstance();
            set({ providerInstances: configService.getAllProviderInstances() });
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
          providerInstances: state.providerInstances,
          foundConversations: state.foundConversations,
          lastScanTime: state.lastScanTime,
          hasLegacyConfigMigrated: state.hasLegacyConfigMigrated
        })
      }
    )
  )
); 