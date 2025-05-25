import type { ValidatorConfig } from '../../types/messages';

export interface ILiveValidator {
    config: ValidatorConfig;
    validate(element: Element): Promise<any>;
    createTooltipContent(data: any): HTMLElement;
    onCustomMessage?(message: any): void;
    onElementChanged?(element: Element): void;
}

export class ValidatorRegistry {
    private static instance: ValidatorRegistry;
    private validators = new Map<string, ILiveValidator>();
    private isInitialized = false;

    static getInstance(): ValidatorRegistry {
        if (!ValidatorRegistry.instance) {
            ValidatorRegistry.instance = new ValidatorRegistry();
        }
        return ValidatorRegistry.instance;
    }

    private constructor() {
        this.init();
    }

    private init() {
        if (this.isInitialized) return;

        console.log('[ValidatorRegistry] Initializing validator registry');
        this.isInitialized = true;
    }

    register(validator: ILiveValidator): void {
        const name = validator.config.name;

        if (this.validators.has(name)) {
            console.warn(`[ValidatorRegistry] Validator '${name}' is already registered. Overwriting.`);
        }

        this.validators.set(name, validator);
        console.log(`[ValidatorRegistry] ✅ Registered validator: ${name}`);

        this.notifyValidatorRegistration(validator);
    }

    unregister(name: string): boolean {
        const success = this.validators.delete(name);
        if (success) {
            console.log(`[ValidatorRegistry] ❌ Unregistered validator: ${name}`);
        }
        return success;
    }

    getValidator(name: string): ILiveValidator | undefined {
        return this.validators.get(name);
    }

    getAllValidators(): ILiveValidator[] {
        return Array.from(this.validators.values());
    }

    getValidatorNames(): string[] {
        return Array.from(this.validators.keys());
    }

    hasValidator(name: string): boolean {
        return this.validators.has(name);
    }

    private notifyValidatorRegistration(validator: ILiveValidator): void {
        try {
            chrome.runtime.sendMessage({
                type: 'VALIDATOR_REGISTER',
                validatorName: validator.config.name,
                timestamp: Date.now(),
                payload: {
                    name: validator.config.name,
                    selectors: validator.config.targetSelectors,
                    config: validator.config
                }
            });
        } catch (error) {
            console.error(`[ValidatorRegistry] Failed to notify registration for ${validator.config.name}:`, error);
        }
    }

    handleMessage(message: any): boolean {
        if (!message.validatorName) {
            return false;
        }

        const validator = this.getValidator(message.validatorName);
        if (!validator) {
            console.warn(`[ValidatorRegistry] No validator found for: ${message.validatorName}`);
            return false;
        }

        if (validator.onCustomMessage) {
            validator.onCustomMessage(message);
            return true;
        }

        return false;
    }

    cleanup(): void {
        console.log('[ValidatorRegistry] Cleaning up validators');
        this.validators.clear();
        this.isInitialized = false;
    }
} 