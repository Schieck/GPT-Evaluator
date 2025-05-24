import { createRoot } from 'react-dom/client';
import { EvaluationTooltip } from '../components/evaluation/EvaluationTooltip';

let tooltipRoot: ReturnType<typeof createRoot> | null = null;
let tooltipContainer: HTMLDivElement | null = null;
let isEvaluating = false;

const createTooltipContainer = () => {
    if (tooltipContainer) return;

    tooltipContainer = document.createElement('div');
    tooltipContainer.id = 'gpt-evaluator-tooltip';
    tooltipContainer.style.cssText = `
        position: fixed;
        z-index: 999999;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 0.5rem;
        padding: 0;
        min-width: auto;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: none;
        transition: all 0.2s ease;
    `;
    document.body.appendChild(tooltipContainer);
};

const createTooltipContent = (status: 'pending' | 'evaluated' | 'evaluating', metrics?: any) => {
    if (!tooltipContainer) return;

    // If evaluating, show only the evaluating state
    if (status === 'evaluating') {
        tooltipContainer.style.padding = '0.75rem';
        tooltipContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 0.5rem; min-width: 120px;">
                <style>
                    @keyframes pulse {
                        0%, 60%, 100% {
                            transform: scale(0.8);
                            opacity: 0.5;
                        }
                        30% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    .dot {
                        width: 0.5rem;
                        height: 0.5rem;
                        border-radius: 50%;
                        background: rgb(249, 115, 22);
                        margin: 0 0.125rem;
                        animation: pulse 1.4s ease-in-out infinite;
                        display: inline-block;
                    }
                    .dot:nth-child(1) { animation-delay: 0s; }
                    .dot:nth-child(2) { animation-delay: 0.2s; }
                    .dot:nth-child(3) { animation-delay: 0.4s; }
                </style>
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
                <span style="margin-left: 0.75rem; font-size: 0.875rem; color: rgb(249, 115, 22);">Evaluating</span>
            </div>
        `;
        return;
    }

    // If evaluated, show the results
    if (status === 'evaluated' && metrics) {
        tooltipContainer.style.padding = '0.75rem';
        tooltipContainer.innerHTML = `
            <div class="score-container" style="cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                    <div style="position: relative; flex: 1;">
                        <div style="height: 0.375rem; width: 100%; border-radius: 9999px; background: linear-gradient(to right, rgb(239, 68, 68), rgb(249, 115, 22), rgb(34, 197, 94));"></div>
                        <div style="position: absolute; width: 0.375rem; height: 0.75rem; top: -0.125rem; border-radius: 9999px; background: rgb(251, 191, 36); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); left: calc(${metrics.overall}% - 0.1875rem);"></div>
                    </div>
                    <span style="font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; border: 1px solid; ${getScoreColor(metrics.overall)}">
                        ${metrics.overall}%
                    </span>
                </div>
                <span style="font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; border: 1px solid; ${getScoreColor(metrics.overall)}; display: block; text-align: center; margin-top: 0.5rem;">
                    ${getTrustLevel(metrics.overall)}
                </span>
            </div>
        `;

        const scoreContainer = tooltipContainer.querySelector('.score-container');
        scoreContainer?.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'OPEN_EVALUATION_DETAILS' });
        });
        return;
    }

    // Default state: show logo only, with hover effect for buttons
    tooltipContainer.style.padding = '0';
    tooltipContainer.innerHTML = `
        <div class="tooltip-wrapper" style="position: relative;">
            <div class="logo-container" style="padding: 0.5rem; cursor: pointer;">
                <img src="${chrome.runtime.getURL('favicon/favicon-96x96.png')}" alt="GPT Evaluator" style="width: 1.5rem; height: 1.5rem; display: block;">
            </div>
            <div class="buttons-container" style="position: absolute; top: 0; right: 100%; margin-right: 0.5rem; display: none; padding: 0.5rem; background: #18181b; border: 1px solid #27272a; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <button class="reject-btn" style="padding: 0.25rem; border-radius: 9999px; background: rgba(239, 68, 68, 0.1); color: rgb(248, 113, 113); border: none; cursor: pointer; transition: all 0.2s;">
                        <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <button class="approve-btn" style="padding: 0.25rem; border-radius: 9999px; background: rgba(34, 197, 94, 0.1); color: rgb(74, 222, 128); border: none; cursor: pointer; transition: all 0.2s;">
                        <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <style>
            .reject-btn:hover {
                background: rgba(239, 68, 68, 0.2) !important;
            }
            .approve-btn:hover {
                background: rgba(34, 197, 94, 0.2) !important;
            }
        </style>
    `;

    // Add hover event listeners
    const tooltipWrapper = tooltipContainer.querySelector('.tooltip-wrapper');
    const buttonsContainer = tooltipContainer.querySelector('.buttons-container') as HTMLElement;
    const rejectBtn = tooltipContainer.querySelector('.reject-btn');
    const approveBtn = tooltipContainer.querySelector('.approve-btn');

    let hoverTimeout: number | null = null;

    const showButtons = () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (buttonsContainer) {
            buttonsContainer.style.display = 'block';
        }
    };

    const hideButtons = () => {
        hoverTimeout = window.setTimeout(() => {
            if (buttonsContainer) {
                buttonsContainer.style.display = 'none';
            }
        }, 100);
    };

    tooltipWrapper?.addEventListener('mouseenter', showButtons);
    tooltipWrapper?.addEventListener('mouseleave', hideButtons);
    buttonsContainer?.addEventListener('mouseenter', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
    });
    buttonsContainer?.addEventListener('mouseleave', hideButtons);

    rejectBtn?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'REJECT_EVALUATION' });
        hideTooltip();
    });

    approveBtn?.addEventListener('click', () => {
        isEvaluating = true;
        chrome.runtime.sendMessage({ type: 'APPROVE_EVALUATION' });
        // Show evaluating state immediately
        createTooltipContent('evaluating');
    });
};

const getScoreColor = (score: number) => {
    if (score >= 90) return 'background: rgba(34, 197, 94, 0.1); color: rgb(74, 222, 128); border-color: rgba(34, 197, 94, 0.3);';
    if (score >= 70) return 'background: rgba(249, 115, 22, 0.1); color: rgb(251, 146, 60); border-color: rgba(249, 115, 22, 0.3);';
    if (score >= 50) return 'background: rgba(234, 179, 8, 0.1); color: rgb(250, 204, 21); border-color: rgba(234, 179, 8, 0.3);';
    return 'background: rgba(239, 68, 68, 0.1); color: rgb(248, 113, 113); border-color: rgba(239, 68, 68, 0.3);';
};

const getTrustLevel = (score: number) => {
    if (score >= 90) return 'Highly Trustworthy';
    if (score >= 70) return 'Moderately Trustworthy';
    if (score >= 50) return 'Somewhat Trustworthy';
    return 'Not Trustworthy';
};

const showTooltip = (position: { x: number; y: number }, status: 'pending' | 'evaluated' | 'evaluating' = 'pending', metrics?: any) => {
    if (!tooltipContainer) {
        createTooltipContainer();
    }

    if (tooltipContainer) {
        createTooltipContent(status, metrics);
        tooltipContainer.style.display = 'block';

        // Position the tooltip above the response
        const tooltipHeight = 40; // Approximate height of logo-only tooltip
        tooltipContainer.style.left = `${position.x}px`;
        tooltipContainer.style.top = `${position.y - tooltipHeight - 10}px`; // 10px gap above the element
        tooltipContainer.style.transform = 'translateX(-50%)';
    }
};

const hideTooltip = () => {
    if (tooltipContainer) {
        tooltipContainer.style.display = 'none';
    }
    isEvaluating = false;
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[GPT Evaluator Tooltip] Received message:', message);
    if (message.type === 'SHOW_EVALUATION_TOOLTIP') {
        const { position, status } = message.data;
        showTooltip(position, status);
        sendResponse({ success: true });
    } else if (message.type === 'UPDATE_EVALUATION_TOOLTIP') {
        const { position, metrics, status } = message.data;
        // Only show evaluating or evaluated states if we're actually evaluating
        if (isEvaluating || status === 'evaluated') {
            showTooltip(position, status, metrics);
        }
        sendResponse({ success: true });
    } else if (message.type === 'UPDATE_TOOLTIP_POSITION') {
        const { location } = message.data;
        if (tooltipContainer && tooltipContainer.style.display !== 'none') {
            const tooltipHeight = 40; // Approximate height
            tooltipContainer.style.left = `${location.x}px`;
            tooltipContainer.style.top = `${location.y - tooltipHeight - 10}px`;
        }
        sendResponse({ success: true });
    } else if (message.type === 'HIDE_EVALUATION_TOOLTIP') {
        hideTooltip();
        sendResponse({ success: true });
    }
    return true;
});

// Clean up when the content script is unloaded
window.addEventListener('unload', () => {
    if (tooltipContainer) {
        tooltipContainer.remove();
        tooltipContainer = null;
    }
    tooltipRoot = null;
}); 