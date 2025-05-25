import type { ProviderTemplate } from '../types';

/**
 * Provider templates following Open/Closed principle
 * New providers can be added without modifying existing code
 */
export const PROVIDER_TEMPLATES: Record<string, ProviderTemplate> = {
    openai: {
        type: 'openai',
        displayName: 'OpenAI',
        models: [
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' },
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-4-32k', name: 'GPT-4 32K' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
            { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', isDefault: true },
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
        ],
        defaultConfig: {
            temperature: 0.3,
            maxTokens: 1000
        },
        defaultEndpoint: 'https://api.openai.com/v1/chat/completions'
    },

    claude: {
        type: 'claude',
        displayName: 'Anthropic',
        models: [
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', isDefault: true },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }
        ],
        defaultConfig: {
            temperature: 0.3,
            maxTokens: 1000
        },
        defaultEndpoint: 'https://api.anthropic.com/v1/messages'
    },

    'openai-compatible': {
        type: 'openai-compatible',
        displayName: 'OpenAI Compatible',
        models: [
            { id: 'custom', name: 'Custom Model', isDefault: true }
        ],
        defaultConfig: {
            temperature: 0.3,
            maxTokens: 1000
        },
        validateConfig: (config) => {
            const errors: string[] = [];
            if (!config.endpoint) {
                errors.push('Endpoint URL is required for OpenAI-compatible providers');
            }
            if (!config.model) {
                errors.push('Model name is required');
            }
            return { isValid: errors.length === 0, errors };
        }
    },

    deepseek: {
        type: 'deepseek',
        displayName: 'DeepSeek',
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', isDefault: true },
            { id: 'deepseek-coder', name: 'DeepSeek Coder' }
        ],
        defaultConfig: {
            temperature: 0.3,
            maxTokens: 1000
        },
        defaultEndpoint: 'https://api.deepseek.com/v1/chat/completions'
    }
};

/**
 * Get a provider template by type
 */
export function getProviderTemplate(type: string): ProviderTemplate | undefined {
    return PROVIDER_TEMPLATES[type];
}

/**
 * Get all available provider templates
 */
export function getAllProviderTemplates(): ProviderTemplate[] {
    return Object.values(PROVIDER_TEMPLATES);
}

/**
 * Check if a provider type is supported
 */
export function isProviderTypeSupported(type: string): boolean {
    return type in PROVIDER_TEMPLATES;
} 