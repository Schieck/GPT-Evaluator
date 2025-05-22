import { AIProviderType } from '../types';
import type { AIProvider } from '../types';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';

function hasInitialize(
  provider: AIProvider
): provider is AIProvider & { initialize: (apiKey: string, modelVersion?: string) => void } {
  return typeof (provider as any).initialize === 'function';
}

export class ProviderFactory {
  private static instance: ProviderFactory;
  private providers: Map<AIProviderType, AIProvider> = new Map();
  
  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }
  
  private constructor() {}

  public getProvider(type: AIProviderType): AIProvider {
    if (!this.providers.has(type)) {
      this.providers.set(type, this.createProvider(type));
    }
    return this.providers.get(type)!;
  }
  
  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case AIProviderType.OPENAI:
        return new OpenAIProvider();
      case AIProviderType.CLAUDE:
        return new ClaudeProvider();
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
  
  public initializeProvider(type: AIProviderType, apiKey: string, modelVersion?: string): void {
    const provider = this.getProvider(type);
    if (hasInitialize(provider)) {
      provider.initialize(apiKey, modelVersion);
    }
  }
  
  public getAvailableProviders(): AIProviderType[] {
    return Object.values(AIProviderType);
  }
}

export const providerFactory = ProviderFactory.getInstance();

export { OpenAIProvider, ClaudeProvider }; 