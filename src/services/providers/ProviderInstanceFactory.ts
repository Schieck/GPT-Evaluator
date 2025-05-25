import type { AIProvider, ProviderInstance } from '../types';
import { OpenAIInstanceProvider } from './OpenAIInstanceProvider';
import { ClaudeInstanceProvider } from './ClaudeInstanceProvider';
import { getProviderTemplate } from './ProviderTemplates';

export class ProviderInstanceFactory {
    private static instance: ProviderInstanceFactory;

    private providerCreators = new Map<string, (instance: ProviderInstance) => AIProvider>([
        ['openai', (instance) => new OpenAIInstanceProvider(instance)],
        ['claude', (instance) => new ClaudeInstanceProvider(instance)],
        ['openai-compatible', (instance) => new OpenAIInstanceProvider(instance)],
        ['deepseek', (instance) => new OpenAIInstanceProvider(instance)]
    ]);

    private providerInstances: Map<string, AIProvider> = new Map();

    private constructor() { }

    public static getInstance(): ProviderInstanceFactory {
        if (!ProviderInstanceFactory.instance) {
            ProviderInstanceFactory.instance = new ProviderInstanceFactory();
        }
        return ProviderInstanceFactory.instance;
    }

    public registerProviderCreator(type: string, creator: (instance: ProviderInstance) => AIProvider): void {
        this.providerCreators.set(type, creator);
    }

    public getProvider(instance: ProviderInstance): AIProvider {
        if (this.providerInstances.has(instance.id)) {
            return this.providerInstances.get(instance.id)!;
        }

        const provider = this.createProvider(instance);
        this.providerInstances.set(instance.id, provider);
        return provider;
    }


    private createProvider(instance: ProviderInstance): AIProvider {
        const creator = this.providerCreators.get(instance.type);
        if (!creator) {
            throw new Error(`Unknown provider type: ${instance.type}. Available types: ${Array.from(this.providerCreators.keys()).join(', ')}`);
        }

        const template = getProviderTemplate(instance.type);
        if (template?.validateConfig) {
            const validation = template.validateConfig(instance.config);
            if (!validation.isValid) {
                throw new Error(`Invalid configuration for ${instance.type}: ${validation.errors.join(', ')}`);
            }
        }

        return creator(instance);
    }

    public removeProvider(instanceId: string): void {
        this.providerInstances.delete(instanceId);
    }

    public updateProvider(instance: ProviderInstance): AIProvider {
        this.removeProvider(instance.id);
        return this.getProvider(instance);
    }

    public getAllProviders(): Map<string, AIProvider> {
        return new Map(this.providerInstances);
    }

    public clearAllProviders(): void {
        this.providerInstances.clear();
    }

    public isProviderTypeSupported(type: string): boolean {
        return this.providerCreators.has(type);
    }

    public getSupportedTypes(): string[] {
        return Array.from(this.providerCreators.keys());
    }
}

export const providerInstanceFactory = ProviderInstanceFactory.getInstance();