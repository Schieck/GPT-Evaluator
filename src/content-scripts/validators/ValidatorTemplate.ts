import { LiveValidator } from '../base/LiveValidator';
import type { ValidatorConfig } from '../../types/messages';

/**
 * Template for creating new validators
 * 
 * To create a new validator:
 * 1. Copy this file and rename it (e.g., MyNewValidator.ts)
 * 2. Update the class name and config
 * 3. Implement the validate() and createTooltipContent() methods
 * 4. Add the import to validators/index.ts
 * 5. That's it! Your validator will be automatically registered
 */
export class ValidatorTemplate extends LiveValidator {
    constructor() {
        const config: ValidatorConfig = {
            // Unique name for your validator
            name: 'template-validator',

            // CSS selectors for elements to monitor
            targetSelectors: [
                '.chat-message',
                '[data-message-author-role="assistant"]'
            ],

            // Events that trigger validation
            triggerEvents: ['input', 'change', 'DOMSubtreeModified'],

            // Debounce delay in milliseconds
            debounceMs: 500,

            // Auto-register on creation (default: true)
            autoRegister: true
        };
        super(config);
    }

    /**
     * Main validation logic - implement your validation here
     * @param element - The DOM element to validate
     * @returns Promise with validation result
     */
    async validate(element: Element): Promise<any> {
        // TODO: Implement your validation logic
        const text = element.textContent || '';

        // Example validation
        const result = {
            isValid: text.length > 0,
            score: Math.min(text.length / 10, 100),
            message: text.length > 50 ? 'Good length' : 'Too short',
            suggestions: text.length < 50 ? ['Add more detail'] : [],
            // Add any custom data you need
            customData: {
                wordCount: text.split(/\s+/).length,
                characterCount: text.length
            }
        };

        console.log(`[${this.config.name}] Validation result:`, result);
        return result;
    }

    /**
     * Create the tooltip content for displaying validation results
     * @param data - The validation result data
     * @returns HTMLElement to display in tooltip
     */
    createTooltipContent(data: any): HTMLElement {
        const container = document.createElement('div');
        container.className = 'template-validator-tooltip';
        container.style.cssText = `
      color: white;
      font-size: 0.875rem;
      min-width: 200px;
    `;

        // TODO: Customize your tooltip appearance
        container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <div style="font-weight: bold;">Template Validator</div>
        <div style="padding: 0.125rem 0.5rem; border-radius: 9999px; background: rgba(59, 130, 246, 0.2); color: rgb(96, 165, 250); border: 1px solid rgba(59, 130, 246, 0.3);">
          ${data.score}%
        </div>
      </div>
      <div style="font-size: 0.75rem; color: #a1a1aa; margin-bottom: 0.5rem;">
        ${data.message}
      </div>
      ${data.customData ? `
        <div style="font-size: 0.75rem; color: #a1a1aa;">
          Words: ${data.customData.wordCount} | Characters: ${data.customData.characterCount}
        </div>
      ` : ''}
      ${data.suggestions && data.suggestions.length > 0 ? `
        <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #27272a;">
          <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.25rem;">Suggestions:</div>
          ${data.suggestions.map((suggestion: string) => `
            <div style="font-size: 0.75rem; color: #a1a1aa;">• ${suggestion}</div>
          `).join('')}
        </div>
      ` : ''}
    `;

        return container;
    }

    /**
     * Optional: Handle custom messages sent to this validator
     * @param message - The message received
     */
    public onCustomMessage(message: any): void {
        console.log(`[${this.config.name}] Received custom message:`, message);

        // TODO: Handle custom message types
        switch (message.type) {
            case 'CUSTOM_ACTION':
                // Handle custom action
                break;
            default:
                // Unknown message type
                break;
        }
    }

    /**
     * Optional: Handle when monitored elements change
     * @param element - The element that changed
     */
    public onElementChanged(element: Element): void {
        console.log(`[${this.config.name}] Element changed:`, element);

        // TODO: Add custom logic for element changes
        // This is called whenever a monitored element is modified
    }
}

// NOTE: Uncomment the line below to auto-register this validator
// new ValidatorTemplate(); 