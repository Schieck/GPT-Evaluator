import type { AIProviderType, ProviderConfig } from './types';
import { providerFactory } from './providers';
import { useStore } from '../store/useStore';

export class ProviderConfigService {
  private static instance: ProviderConfigService;
  private readonly store = useStore.getState();

  private constructor() {}

  public static getInstance(): ProviderConfigService {
    if (!ProviderConfigService.instance) {
      ProviderConfigService.instance = new ProviderConfigService();
    }
    return ProviderConfigService.instance;
  }

  public getProviderConfig(provider: AIProviderType): ProviderConfig {
    const config = this.store.apiConfigs.find(c => c.type === provider);
    return config || { type: provider, enabled: false, apiKey: '' };
  }

  public setProviderConfig(provider: AIProviderType, config: Partial<ProviderConfig>): void {
    const currentConfig = this.getProviderConfig(provider);
    const newConfig = { ...currentConfig, ...config };
    
    // Update store
    const newConfigs = this.store.apiConfigs.map(c => 
      c.type === provider ? newConfig : c
    );
    this.store.saveConfigs(newConfigs);
    
    // Initialize provider if API key is provided
    if (newConfig.apiKey) {
      providerFactory.initializeProvider(provider, newConfig.apiKey, newConfig.modelVersion);
    }
  }

  public isProviderEnabled(provider: AIProviderType): boolean {
    const config = this.getProviderConfig(provider);
    return config.enabled && !!config.apiKey;
  }

  public getEnabledProviders(): AIProviderType[] {
    return this.store.apiConfigs
      .filter(config => config.enabled && !!config.apiKey)
      .map(config => config.type);
  }

  public getAllConfigs(): Map<AIProviderType, ProviderConfig> {
    return new Map(this.store.apiConfigs.map(config => [config.type, config]));
  }
} 