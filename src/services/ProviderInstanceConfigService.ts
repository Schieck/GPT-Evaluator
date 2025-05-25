import type { ProviderInstance, ProviderConfig } from './types';
import { AIProviderType } from './types';
import { getAllProviderTemplates } from './providers/ProviderTemplates';

export class ProviderInstanceConfigService {
    private static instance: ProviderInstanceConfigService;
    private providerInstances: ProviderInstance[] = [];
    private readonly STORAGE_KEY = 'provider-instances';

    private constructor() {
        this.loadProviderInstances();
    }

    public static getInstance(): ProviderInstanceConfigService {
        if (!ProviderInstanceConfigService.instance) {
            ProviderInstanceConfigService.instance = new ProviderInstanceConfigService();
        }
        return ProviderInstanceConfigService.instance;
    }

    private loadProviderInstances(): void {
        try {
            const storedInstances = localStorage.getItem(this.STORAGE_KEY);
            if (storedInstances) {
                this.providerInstances = JSON.parse(storedInstances);
            }
        } catch (error) {
            console.error('Error loading provider instances:', error);
            this.providerInstances = [];
        }
    }

    private saveProviderInstances(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.providerInstances));
        } catch (error) {
            console.error('Error saving provider instances:', error);
        }
    }

    public getAllProviderInstances(): ProviderInstance[] {
        return [...this.providerInstances];
    }

    public getEnabledProviderInstances(): ProviderInstance[] {
        return this.providerInstances.filter(instance => instance.enabled);
    }

    public addProviderInstance(instance: ProviderInstance): void {
        // Check for duplicate IDs
        if (this.providerInstances.some(existing => existing.id === instance.id)) {
            throw new Error(`Provider instance with ID ${instance.id} already exists`);
        }

        this.providerInstances.push(instance);
        this.saveProviderInstances();
    }

    public removeProviderInstance(instanceId: string): void {
        this.providerInstances = this.providerInstances.filter(instance => instance.id !== instanceId);
        this.saveProviderInstances();
    }

    public updateProviderInstance(instanceId: string, updates: Partial<ProviderInstance>): void {
        const index = this.providerInstances.findIndex(instance => instance.id === instanceId);
        if (index === -1) {
            throw new Error(`Provider instance with ID ${instanceId} not found`);
        }

        this.providerInstances[index] = {
            ...this.providerInstances[index],
            ...updates,
            id: instanceId
        };

        this.saveProviderInstances();
    }

    public getProviderInstance(instanceId: string): ProviderInstance | undefined {
        return this.providerInstances.find(instance => instance.id === instanceId);
    }

    public migrateFromLegacyConfig(legacyConfigs: ProviderConfig[]): void {
        this.providerInstances = [];

        const openAiConfig = legacyConfigs.find(c => c.type === AIProviderType.OPENAI);
        if (openAiConfig?.apiKey) {
            this.addProviderInstance({
                id: crypto.randomUUID(),
                name: 'OpenAI',
                type: AIProviderType.OPENAI,
                config: {
                    apiKey: openAiConfig.apiKey,
                    model: openAiConfig.modelVersion || 'gpt-4-turbo-preview'
                },
                enabled: true
            });
        }

        const claudeConfig = legacyConfigs.find(c => c.type === AIProviderType.CLAUDE);
        if (claudeConfig?.apiKey) {
            this.addProviderInstance({
                id: crypto.randomUUID(),
                name: 'Claude',
                type: AIProviderType.CLAUDE,
                config: {
                    apiKey: claudeConfig.apiKey,
                    model: claudeConfig.modelVersion || 'claude-3-opus-20240229'
                },
                enabled: true
            });
        }

        this.saveProviderInstances();
    }

    public createDefaultInstance(type: string, name?: string): ProviderInstance {
        const templates = getAllProviderTemplates();
        const template = templates.find(t => t.type === type);

        if (!template) {
            throw new Error(`No template found for provider type: ${type}`);
        }

        const defaultModel = template.models.find(m => m.isDefault) || template.models[0];
        const instanceId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
            id: instanceId,
            type,
            name: name || `${template.displayName} (${defaultModel.name})`,
            config: {
                apiKey: '',
                model: defaultModel.id,
                endpoint: template.defaultEndpoint,
                ...template.defaultConfig
            },
            enabled: false
        };
    }

    public generateUniqueName(baseType: string, baseName?: string): string {
        const existingNames = new Set(
            this.getAllProviderInstances().map(instance => instance.name)
        );

        let counter = 1;
        let name = baseName || `${baseType} ${counter}`;

        while (existingNames.has(name)) {
            counter++;
            name = baseName ? `${baseName} ${counter}` : `${baseType} ${counter}`;
        }

        return name;
    }

    public getProviderInstancesByType(type: string): ProviderInstance[] {
        return this.getAllProviderInstances().filter(instance => instance.type === type);
    }
} 