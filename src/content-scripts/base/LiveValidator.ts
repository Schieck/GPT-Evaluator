import type { ValidatorConfig, BaseValidatorMessage } from '../../types/messages';
import { ValidatorRegistry, type ILiveValidator } from './ValidatorRegistry';

export abstract class LiveValidator implements ILiveValidator {
    protected tooltip: HTMLElement | null = null;
    protected isActive = false;
    protected observers: MutationObserver[] = [];
    protected debounceTimers = new Map<string, number>();

    constructor(public config: ValidatorConfig) {
        this.init();
    }

    private init(): void {
        this.setupMessageListeners();

        if (this.config.autoRegister !== false) {
            this.setupObservers();
            this.registerValidator();
        }
    }

    private setupMessageListeners(): void {
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    private registerValidator(): void {
        ValidatorRegistry.getInstance().register(this);
    }

    protected sendMessage(type: string, payload: any): void {
        const message: BaseValidatorMessage = {
            type,
            validatorName: this.config.name,
            timestamp: Date.now()
        };

        if (payload) {
            (message as any).payload = payload;
        }

        try {
            chrome.runtime.sendMessage(message);
        } catch (error) {
            console.error(`[${this.config.name}] Failed to send message:`, error);
        }
    }

    private handleMessage(message: BaseValidatorMessage): void {
        if (message.validatorName !== this.config.name) return;

        switch (message.type) {
            case 'SHOW_TOOLTIP':
                this.showTooltip((message as any).payload);
                break;
            case 'HIDE_TOOLTIP':
                this.hideTooltip();
                break;
            case 'UPDATE_TOOLTIP':
                this.updateTooltip((message as any).payload);
                break;
            case 'VALIDATE_REQUEST':
                this.handleValidateRequest((message as any).payload);
                break;
            default:
                this.onCustomMessage(message);
        }
    }

    private async handleValidateRequest(payload: any): Promise<void> {
        try {
            const element = document.querySelector(payload.element);
            if (!element) {
                console.warn(`[${this.config.name}] Element not found: ${payload.element}`);
                return;
            }

            const result = await this.validate(element);

            this.sendMessage('VALIDATE_RESPONSE', {
                ...result,
                element: payload.element,
                location: payload.location
            });
        } catch (error) {
            console.error(`[${this.config.name}] Validation error:`, error);
            this.sendMessage('VALIDATOR_ERROR', {
                error: error instanceof Error ? error.message : 'Unknown error',
                element: payload.element
            });
        }
    }

    abstract validate(element: Element): Promise<any>;
    abstract createTooltipContent(data: any): HTMLElement;

    public onCustomMessage(_: BaseValidatorMessage): void {
        // Override in subclasses to handle custom messages
    }

    public onElementChanged(_: Element): void {
        // Override in subclasses to handle element changes
    }

    protected showTooltip(data: any): void {
        if (!data.position) return;

        this.sendMessage('SHOW_VALIDATOR_TOOLTIP', {
            position: data.position,
            validatorName: this.config.name,
            data: data
        });
    }

    protected hideTooltip(): void {
        this.sendMessage('HIDE_VALIDATOR_TOOLTIP', {
            validatorName: this.config.name
        });
    }

    protected updateTooltip(data: any): void {
        if (!data.position) return;

        this.sendMessage('UPDATE_VALIDATOR_TOOLTIP', {
            position: data.position,
            validatorName: this.config.name,
            data: data
        });
    }

    protected showLegacyTooltip(data: any): void {
        if (!data.position) return;

        this.hideTooltip();

        this.tooltip = document.createElement('div');
        this.tooltip.className = `validator-tooltip validator-tooltip-${this.config.name}`;
        this.tooltip.style.cssText = `
            position: fixed;
            z-index: 999999;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 0.5rem;
            padding: 0.75rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: block;
            transition: all 0.2s ease;
            left: ${data.position.x}px;
            top: ${data.position.y - 60}px;
            transform: translateX(-50%);
        `;

        const content = this.createTooltipContent(data);
        this.tooltip.appendChild(content);
        document.body.appendChild(this.tooltip);
    }

    protected hideLegacyTooltip(): void {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    protected updateLegacyTooltip(data: any): void {
        if (!this.tooltip) {
            this.showLegacyTooltip(data);
            return;
        }

        if (data.position) {
            this.tooltip.style.left = `${data.position.x}px`;
            this.tooltip.style.top = `${data.position.y - 60}px`;
        }

        const content = this.createTooltipContent(data);
        this.tooltip.innerHTML = '';
        this.tooltip.appendChild(content);
    }

    private setupObservers(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initObservers());
        } else {
            this.initObservers();
        }
    }

    private initObservers(): void {
        this.config.targetSelectors.forEach(selector => {
            this.observeSelector(selector);
        });
    }

    private observeSelector(selector: string): void {
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            this.setupElementObserver(element);
        });

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        if (element.matches(selector)) {
                            this.setupElementObserver(element);
                        }
                        const children = element.querySelectorAll(selector);
                        children.forEach(child => this.setupElementObserver(child));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.push(observer);
    }

    private setupElementObserver(element: Element): void {
        this.config.triggerEvents.forEach(eventType => {
            if (eventType === 'DOMNodeInserted' || eventType === 'DOMSubtreeModified') {
                console.warn(`[${this.config.name}] Skipping deprecated event: ${eventType}`);
                return;
            }

            element.addEventListener(eventType, () => {
                this.debounceValidation(element);
            });
        });

        this.onElementChanged(element);
    }

    private debounceValidation(element: Element): void {
        const elementId = this.getElementId(element);
        const debounceMs = this.config.debounceMs || 500;

        const existingTimer = this.debounceTimers.get(elementId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = window.setTimeout(async () => {
            try {
                await this.validate(element);
            } catch (error) {
                console.error(`[${this.config.name}] Validation error:`, error);
            }
            this.debounceTimers.delete(elementId);
        }, debounceMs);

        this.debounceTimers.set(elementId, timer);
    }

    private getElementId(element: Element): string {
        return element.tagName + '_' + Array.from(element.parentNode?.children || []).indexOf(element);
    }

    public cleanup(): void {
        this.hideTooltip();

        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];

        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();

        ValidatorRegistry.getInstance().unregister(this.config.name);
    }
} 