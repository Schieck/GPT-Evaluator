import { ValidatorRegistry } from '../base/ValidatorRegistry';

import './ChatGPTMonitorValidator';

const validatorModules: (() => Promise<any>)[] = [
    // Add dynamic imports here if needed
    // () => import('./ConditionalValidator'),
];

export async function loadValidators(): Promise<void> {
    const currentUrl = window.location.href;
    console.log('[ValidatorIndex] Loading validators for:', currentUrl);

    try {
        for (const loadValidator of validatorModules) {
            try {
                await loadValidator();
            } catch (error) {
                console.error('[ValidatorIndex] Failed to load validator:', error);
            }
        }

        const registry = ValidatorRegistry.getInstance();
        const loadedValidators = registry.getValidatorNames();
        console.log('[ValidatorIndex] ✅ Loaded validators:', loadedValidators);

    } catch (error) {
        console.error('[ValidatorIndex] Failed to load validators:', error);
    }
}

loadValidators();

window.addEventListener('beforeunload', () => {
    console.log('[ValidatorIndex] Cleaning up validators...');
    const registry = ValidatorRegistry.getInstance();
    registry.cleanup();
});

export { ValidatorRegistry }; 