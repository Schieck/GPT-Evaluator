import { LiveValidator } from '../base/LiveValidator';
import type { ValidatorConfig } from '../../types/messages';

/**
 * ChatGPT Monitor Validator
 * 
 * This validator monitors ChatGPT conversations and triggers the evaluation system
 * when complete conversations (user + assistant) are detected.
 * 
 * Replaces the legacy gpt-monitor.ts with the new validator architecture.
 */
export class ChatGPTMonitorValidator extends LiveValidator {
    private lastMessageId: string | null = null;
    private lastProcessedUserMessage: string = '';
    private lastProcessedAssistantMessage: string = '';
    private currentConversationElement: Element | null = null;
    private scrollUpdateInterval: number | null = null;
    private isMonitoring = false;

    constructor() {
        const config: ValidatorConfig = {
            name: 'chatgpt-monitor',
            targetSelectors: [
                '[data-message-author-role]',
                '[data-testid^="conversation-turn-"]'
            ],
            triggerEvents: [],
            debounceMs: 300,
            autoRegister: true
        };
        super(config);

        this.initialize();
    }

    private initialize(): void {
        if (window.location.hostname !== 'chatgpt.com') {
            console.debug('[ChatGPTMonitor] Not on ChatGPT, skipping initialization');
            return;
        }

        console.log('[ChatGPTMonitor] Initializing ChatGPT monitor validator');

        this.sendMessage('CONTENT_SCRIPT_READY', {});
        this.setupChatMonitoring();
    }

    async validate(_: Element): Promise<any> {
        if (!this.isMonitoring) {
            return { isValid: true, message: 'Not monitoring' };
        }

        const message = this.getLatestMessage();
        if (!message) {
            return { isValid: true, message: 'No message found' };
        }

        if (message.type === 'processed') {
            if (message.userMessage && message.assistantMessage) {
                await this.handleProcessedMessage(message.userMessage, message.assistantMessage);
            }
            return {
                isValid: true,
                message: 'Conversation processed',
                data: message
            };
        }

        if (message.messageId === this.lastMessageId) {
            return { isValid: true, message: 'Already processed' };
        }

        this.lastMessageId = message.messageId || null;

        if (message.content && message.role) {
            this.sendMessage('NEW_MESSAGE', {
                role: message.role,
                content: message.content,
                userMessage: message.userMessage,
                timestamp: new Date().toISOString(),
                location: message.location
            });

            return {
                isValid: true,
                message: `New ${message.role} message detected`,
                data: message
            };
        }

        return { isValid: true, message: 'No action needed' };
    }

    createTooltipContent(_: any): HTMLElement {
        const container = document.createElement('div');
        container.style.display = 'none';
        return container;
    }

    private getLatestMessage(): any {
        const messages = document.querySelectorAll('[data-message-author-role]');

        if (!messages.length) {
            return null;
        }

        const lastMessage = messages[messages.length - 1];
        const role = lastMessage.getAttribute('data-message-author-role') as 'user' | 'assistant' | null;
        const messageId = lastMessage.getAttribute('data-message-id');

        if (!role || !messageId) {
            return null;
        }

        if (messageId === this.lastMessageId && this.lastProcessedUserMessage && this.lastProcessedAssistantMessage) {
            return {
                type: 'processed',
                userMessage: this.lastProcessedUserMessage,
                assistantMessage: this.lastProcessedAssistantMessage
            };
        }

        let content = '';
        let userMessage = '';

        if (role === 'user') {
            const contentElement = lastMessage.querySelector('.whitespace-pre-wrap');
            content = contentElement?.textContent || '';
        } else if (role === 'assistant') {
            if (lastMessage.querySelector('.streaming-animation') !== null) {
                return null;
            }

            const contentElement = lastMessage.querySelector('.markdown');
            content = contentElement?.textContent || '';

            const userMessages = Array.from(messages).filter(msg =>
                msg.getAttribute('data-message-author-role') === 'user'
            );
            if (userMessages.length > 0) {
                const lastUserMessage = userMessages[userMessages.length - 1];
                const userContentElement = lastUserMessage.querySelector('.whitespace-pre-wrap');
                userMessage = userContentElement?.textContent || '';
            }
        }

        if (!content) {
            return null;
        }

        if (role === 'assistant' && userMessage) {
            this.lastProcessedUserMessage = userMessage;
            this.lastProcessedAssistantMessage = content;
        }

        const rect = lastMessage.getBoundingClientRect();
        const location = {
            x: rect.left + rect.width / 2,
            y: rect.top
        };

        return {
            type: 'new',
            role,
            content,
            messageId,
            userMessage: userMessage || undefined,
            location
        };
    }

    private async handleProcessedMessage(userMessage: string, assistantMessage: string): Promise<void> {
        try {
            const messages = document.querySelectorAll('[data-message-author-role]');
            const lastMessage = messages[messages.length - 1];
            this.currentConversationElement = lastMessage;

            const rect = lastMessage.getBoundingClientRect();
            const location = {
                x: rect.left + rect.width / 2,
                y: rect.top
            };

            this.sendMessage('NEW_MESSAGE', {
                userMessage,
                assistantMessage,
                location
            });

            this.startScrollTracking();
        } catch (error) {
            console.error('[ChatGPTMonitor] Failed to handle processed message:', error);
        }
    }

    private setupChatMonitoring(): void {
        const maxAttempts = 5;
        let attempts = 0;

        const tryFindContainer = () => {
            attempts++;
            const conversationTurns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
            const latestTurn = conversationTurns[conversationTurns.length - 1];
            const chatContainer = latestTurn?.parentElement;

            if (!chatContainer) {
                if (attempts < maxAttempts) {
                    setTimeout(tryFindContainer, 2000);
                    return;
                }

                console.warn('[ChatGPTMonitor] Chat container not found after all attempts');
                const fallbackContainer = document.querySelector('[data-testid^="conversation-turn-"]')?.parentElement;
                if (fallbackContainer) {
                    this.startChatObservation(fallbackContainer);
                }
                return;
            }

            this.startChatObservation(chatContainer);
        };

        tryFindContainer();
    }

    private startChatObservation(container: Element): void {
        console.log('[ChatGPTMonitor] Starting chat observation on container:', container);

        const chatObserver = new MutationObserver(() => {
            if (!this.isMonitoring) return;

            this.debounceChatValidation(container);
        });

        chatObserver.observe(container, {
            childList: true,
            subtree: true,
            characterData: true
        });

        this.observers.push(chatObserver);
    }

    private debounceChatValidation(element: Element): void {
        const debounceMs = this.config.debounceMs || 300;

        if (this.debounceTimers.has('chat-validation')) {
            clearTimeout(this.debounceTimers.get('chat-validation')!);
        }

        const timer = window.setTimeout(async () => {
            try {
                await this.validate(element);
            } catch (error) {
                console.error('[ChatGPTMonitor] Validation error:', error);
            }
            this.debounceTimers.delete('chat-validation');
        }, debounceMs);

        this.debounceTimers.set('chat-validation', timer);
    }

    private updateTooltipPosition(): void {
        if (!this.currentConversationElement || !this.isMonitoring) return;

        const rect = (this.currentConversationElement as HTMLElement).getBoundingClientRect();
        const location = {
            x: rect.left + rect.width / 2,
            y: rect.top
        };

        if (rect.top > -rect.height && rect.top < window.innerHeight) {
            this.sendMessage('UPDATE_TOOLTIP_POSITION', { location });
        }
    }

    private startScrollTracking(): void {
        if (this.scrollUpdateInterval) return;

        window.addEventListener('scroll', () => this.updateTooltipPosition(), { passive: true });

        this.scrollUpdateInterval = window.setInterval(() => this.updateTooltipPosition(), 500);
    }

    private stopScrollTracking(): void {
        window.removeEventListener('scroll', () => this.updateTooltipPosition());
        if (this.scrollUpdateInterval) {
            clearInterval(this.scrollUpdateInterval);
            this.scrollUpdateInterval = null;
        }
    }

    public onCustomMessage(message: any): void {
        switch (message.type) {
            case 'START_SCANNING':
                this.isMonitoring = true;
                console.log('[ChatGPTMonitor] Started monitoring');
                break;

            case 'STOP_SCANNING':
                this.isMonitoring = false;
                this.lastMessageId = null;
                this.currentConversationElement = null;
                this.stopScrollTracking();
                console.log('[ChatGPTMonitor] Stopped monitoring');
                break;

            default:
                console.log('[ChatGPTMonitor] Unknown message:', message);
        }
    }

    public cleanup(): void {
        this.stopScrollTracking();
        this.isMonitoring = false;
        super.cleanup();
    }
}

new ChatGPTMonitorValidator(); 