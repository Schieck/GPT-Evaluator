import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderInstanceConfigService } from './ProviderInstanceConfigService';
import { AIProviderType, type ProviderInstance, type ProviderConfig } from './types';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
Object.defineProperty(window.crypto, 'randomUUID', {
    value: vi.fn(() => 'mock-uuid-123')
});

describe('ProviderInstanceConfigService', () => {
    let service: ProviderInstanceConfigService;

    const mockInstance: ProviderInstance = {
        id: 'test-instance-1',
        name: 'Test Instance',
        type: 'openai',
        config: { apiKey: 'test-key', model: 'gpt-4' },
        enabled: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        // Force new instance creation
        (ProviderInstanceConfigService as any).instance = undefined;
        service = ProviderInstanceConfigService.getInstance();
    });

    describe('initialization', () => {
        it('should load instances from localStorage on init', () => {
            const storedInstances = [mockInstance];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(storedInstances));

            // Force new instance creation
            (ProviderInstanceConfigService as any).instance = undefined;
            const newService = ProviderInstanceConfigService.getInstance();

            expect(localStorageMock.getItem).toHaveBeenCalledWith('provider-instances');
            expect(newService.getAllProviderInstances()).toEqual(storedInstances);
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            // Force new instance creation
            (ProviderInstanceConfigService as any).instance = undefined;
            const newService = ProviderInstanceConfigService.getInstance();

            expect(newService.getAllProviderInstances()).toEqual([]);
        });
    });

    describe('addProviderInstance', () => {
        it('should add new instance and save to localStorage', () => {
            service.addProviderInstance(mockInstance);

            expect(service.getAllProviderInstances()).toContainEqual(mockInstance);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'provider-instances',
                JSON.stringify([mockInstance])
            );
        });

        it('should throw error for duplicate instance ID', () => {
            service.addProviderInstance(mockInstance);

            expect(() => service.addProviderInstance(mockInstance))
                .toThrow('Provider instance with ID test-instance-1 already exists');
        });
    });

    describe('removeProviderInstance', () => {
        it('should remove instance and update localStorage', () => {
            service.addProviderInstance(mockInstance);
            service.removeProviderInstance('test-instance-1');

            expect(service.getAllProviderInstances()).toEqual([]);
            expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
                'provider-instances',
                JSON.stringify([])
            );
        });
    });

    describe('updateProviderInstance', () => {
        it('should update existing instance', () => {
            service.addProviderInstance(mockInstance);
            service.updateProviderInstance('test-instance-1', { name: 'Updated Name' });

            const updated = service.getProviderInstance('test-instance-1');
            expect(updated?.name).toBe('Updated Name');
            expect(updated?.id).toBe('test-instance-1'); // ID should not change
        });

        it('should throw error if instance not found', () => {
            expect(() => service.updateProviderInstance('non-existent', {}))
                .toThrow('Provider instance with ID non-existent not found');
        });
    });

    describe('getEnabledProviderInstances', () => {
        it('should return only enabled instances', () => {
            const disabledInstance = { ...mockInstance, id: 'disabled', enabled: false };
            service.addProviderInstance(mockInstance);
            service.addProviderInstance(disabledInstance);

            const enabled = service.getEnabledProviderInstances();
            expect(enabled).toHaveLength(1);
            expect(enabled[0].id).toBe('test-instance-1');
        });
    });

    describe('migrateFromLegacyConfig', () => {
        it('should migrate OpenAI config', () => {
            const legacyConfigs: ProviderConfig[] = [{
                type: AIProviderType.OPENAI,
                apiKey: 'openai-key',
                modelVersion: 'gpt-4',
                enabled: true
            }];

            service.migrateFromLegacyConfig(legacyConfigs);

            const instances = service.getAllProviderInstances();
            expect(instances).toHaveLength(1);
            expect(instances[0].type).toBe(AIProviderType.OPENAI);
            expect(instances[0].config.apiKey).toBe('openai-key');
        });

        it('should migrate Claude config', () => {
            const legacyConfigs: ProviderConfig[] = [{
                type: AIProviderType.CLAUDE,
                apiKey: 'claude-key',
                modelVersion: 'claude-3',
                enabled: true
            }];

            service.migrateFromLegacyConfig(legacyConfigs);

            const instances = service.getAllProviderInstances();
            expect(instances).toHaveLength(1);
            expect(instances[0].type).toBe(AIProviderType.CLAUDE);
            expect(instances[0].config.apiKey).toBe('claude-key');
        });
    });

    describe('generateUniqueName', () => {
        it('should generate unique name with counter', () => {
            service.addProviderInstance({ ...mockInstance, name: 'OpenAI 1' });
            service.addProviderInstance({ ...mockInstance, id: 'id2', name: 'OpenAI 2' });

            const uniqueName = service.generateUniqueName('OpenAI');
            expect(uniqueName).toBe('OpenAI 3');
        });

        it('should use base name if provided', () => {
            service.addProviderInstance({ ...mockInstance, name: 'Custom Name' });

            const uniqueName = service.generateUniqueName('OpenAI', 'Custom Name');
            expect(uniqueName).toBe('Custom Name 2');
        });
    });

    describe('getProviderInstancesByType', () => {
        it('should filter instances by type', () => {
            const claudeInstance = { ...mockInstance, id: 'claude-1', type: 'claude' };
            service.addProviderInstance(mockInstance);
            service.addProviderInstance(claudeInstance);

            const openaiInstances = service.getProviderInstancesByType('openai');
            expect(openaiInstances).toHaveLength(1);
            expect(openaiInstances[0].type).toBe('openai');
        });
    });
}); 