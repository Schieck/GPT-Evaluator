import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamicInstanceEvaluationService } from './DynamicInstanceEvaluationService';
import { ProviderInstanceConfigService } from './ProviderInstanceConfigService';
import { ErrorHandlingService } from './ErrorHandlingService';
import { providerInstanceFactory } from './providers/ProviderInstanceFactory';
import type { EvaluationInput, EvaluationResult, ProviderInstance } from './types';

vi.mock('./ProviderInstanceConfigService');
vi.mock('./ErrorHandlingService');
vi.mock('./providers/ProviderInstanceFactory');
vi.mock('../utils/MetricsCalculator', () => ({
    MetricsCalculator: {
        calculateFromArray: vi.fn().mockReturnValue({
            relevance: 85,
            accuracy: 90,
            completeness: 88,
            coherence: 92,
            overall: 89
        })
    }
}));

describe('DynamicInstanceEvaluationService', () => {
    let service: DynamicInstanceEvaluationService;
    let mockConfigService: any;
    let mockErrorHandler: any;

    const mockInput: EvaluationInput = {
        userPrompt: 'Test prompt',
        aiResponse: 'Test response'
    };

    const mockInstance: ProviderInstance = {
        id: 'test-instance-1',
        name: 'Test Instance',
        type: 'openai',
        config: { apiKey: 'test-key', model: 'gpt-4' },
        enabled: true
    };

    const mockResult: EvaluationResult = {
        metrics: {
            relevance: 85,
            accuracy: 90,
            completeness: 88,
            coherence: 92,
            overall: 89
        },
        feedback: {
            strengths: ['Clear response'],
            weaknesses: ['Could be more detailed'],
            suggestions: ['Add examples'],
            summary: 'Good response overall',
            promptRequestSuggestion: 'Consider adding context',
            references: []
        },
        metadata: {
            providerId: 'test-instance-1',
            timestamp: Date.now(),
            processingTimeMs: 1000
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockConfigService = {
            getProviderInstance: vi.fn(),
            getEnabledProviderInstances: vi.fn(),
            getProviderInstancesByType: vi.fn(),
            getAllProviderInstances: vi.fn()
        };

        mockErrorHandler = {
            handleError: vi.fn()
        };

        vi.mocked(ProviderInstanceConfigService.getInstance).mockReturnValue(mockConfigService);
        vi.mocked(ErrorHandlingService.getInstance).mockReturnValue(mockErrorHandler);

        (DynamicInstanceEvaluationService as any).instance = undefined;
        service = DynamicInstanceEvaluationService.getInstance();
    });

    describe('evaluateWithInstances', () => {
        it('should throw error when no instance IDs provided', async () => {
            await expect(service.evaluateWithInstances(mockInput, []))
                .rejects.toThrow('At least one provider instance must be specified');
        });

        it('should successfully evaluate with valid instances', async () => {
            const mockProvider = {
                id: 'openai' as any,
                name: 'OpenAI',
                isConfigured: vi.fn().mockReturnValue(true),
                evaluate: vi.fn().mockResolvedValue(mockResult),
                initialize: vi.fn()
            };

            mockConfigService.getProviderInstance.mockReturnValue(mockInstance);
            vi.mocked(providerInstanceFactory.getProvider).mockReturnValue(mockProvider);

            const result = await service.evaluateWithInstances(mockInput, ['test-instance-1']);

            expect(result.results.size).toBe(1);
            expect(result.results.get('test-instance-1')).toEqual(mockResult);
            expect(result.combinedResult.metrics.overall).toBe(89);
        });

        it('should handle instance not found error', async () => {
            mockConfigService.getProviderInstance.mockReturnValue(undefined);

            await expect(service.evaluateWithInstances(mockInput, ['non-existent']))
                .rejects.toThrow('All provider instances failed');

            expect(mockErrorHandler.handleError).toHaveBeenCalled();
        });

        it('should handle disabled instance error', async () => {
            const disabledInstance = { ...mockInstance, enabled: false };
            mockConfigService.getProviderInstance.mockReturnValue(disabledInstance);

            await expect(service.evaluateWithInstances(mockInput, ['test-instance-1']))
                .rejects.toThrow('All provider instances failed');
        });

        it('should continue with partial failures', async () => {
            const mockProvider = {
                id: 'openai' as any,
                name: 'OpenAI',
                isConfigured: vi.fn().mockReturnValue(true),
                evaluate: vi.fn()
                    .mockResolvedValueOnce(mockResult)
                    .mockRejectedValueOnce(new Error('Provider error')),
                initialize: vi.fn()
            };

            mockConfigService.getProviderInstance.mockReturnValue(mockInstance);
            vi.mocked(providerInstanceFactory.getProvider).mockReturnValue(mockProvider);

            const result = await service.evaluateWithInstances(mockInput, ['instance-1', 'instance-2']);

            expect(result.results.size).toBe(1);
            expect(mockErrorHandler.handleError).toHaveBeenCalledTimes(1);
        });
    });

    describe('evaluateWithAllEnabledInstances', () => {
        it('should throw error when no enabled instances', async () => {
            mockConfigService.getEnabledProviderInstances.mockReturnValue([]);

            await expect(service.evaluateWithAllEnabledInstances(mockInput))
                .rejects.toThrow('No enabled provider instances available');
        });

        it('should evaluate with all enabled instances', async () => {
            const mockProvider = {
                id: 'openai' as any,
                name: 'OpenAI',
                isConfigured: vi.fn().mockReturnValue(true),
                evaluate: vi.fn().mockResolvedValue(mockResult),
                initialize: vi.fn()
            };

            mockConfigService.getEnabledProviderInstances.mockReturnValue([mockInstance]);
            mockConfigService.getProviderInstance.mockReturnValue(mockInstance);
            vi.mocked(providerInstanceFactory.getProvider).mockReturnValue(mockProvider);

            const result = await service.evaluateWithAllEnabledInstances(mockInput);

            expect(result.results.size).toBe(1);
            expect(mockProvider.evaluate).toHaveBeenCalledWith(mockInput);
        });
    });

    describe('evaluateWithProviderType', () => {
        it('should throw error when no instances for type', async () => {
            mockConfigService.getProviderInstancesByType.mockReturnValue([]);

            await expect(service.evaluateWithProviderType(mockInput, 'openai'))
                .rejects.toThrow('No enabled instances found for provider type: openai');
        });

        it('should evaluate with instances of specific type', async () => {
            const mockProvider = {
                id: 'openai' as any,
                name: 'OpenAI',
                isConfigured: vi.fn().mockReturnValue(true),
                evaluate: vi.fn().mockResolvedValue(mockResult),
                initialize: vi.fn()
            };

            mockConfigService.getProviderInstancesByType.mockReturnValue([mockInstance]);
            mockConfigService.getProviderInstance.mockReturnValue(mockInstance);
            vi.mocked(providerInstanceFactory.getProvider).mockReturnValue(mockProvider);

            const result = await service.evaluateWithProviderType(mockInput, 'openai');

            expect(result.results.size).toBe(1);
            expect(mockConfigService.getProviderInstancesByType).toHaveBeenCalledWith('openai');
        });
    });

    describe('getProviderInstanceStats', () => {
        it('should return correct statistics', () => {
            const instances = [
                { ...mockInstance, type: 'openai' },
                { ...mockInstance, id: 'instance-2', type: 'openai', enabled: false },
                { ...mockInstance, id: 'instance-3', type: 'claude' }
            ];

            mockConfigService.getAllProviderInstances.mockReturnValue(instances);
            mockConfigService.getEnabledProviderInstances.mockReturnValue([instances[0], instances[2]]);

            const stats = service.getProviderInstanceStats();

            expect(stats.total).toBe(3);
            expect(stats.enabled).toBe(2);
            expect(stats.byType).toEqual({ openai: 2, claude: 1 });
        });
    });
}); 