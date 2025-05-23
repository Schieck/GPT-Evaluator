import { createRoot } from 'react-dom/client';
import { EvaluationTooltip } from '../components/evaluation/EvaluationTooltip';

let tooltipRoot: ReturnType<typeof createRoot> | null = null;
let tooltipContainer: HTMLDivElement | null = null;

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
        padding: 0.75rem;
        min-width: 200px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: none;
    `;
    document.body.appendChild(tooltipContainer);
};

const createTooltipContent = (status: 'pending' | 'evaluated', metrics?: any) => {
    if (!tooltipContainer) return;

    tooltipContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <img src="${chrome.runtime.getURL('favicon/favicon-96x96.png')}" alt="GPT Evaluator" style="width: 1.5rem; height: 1.5rem;">
            <div style="display: flex; gap: 0.25rem;">
                <button class="reject-btn" style="padding: 0.25rem; border-radius: 9999px; background: rgba(239, 68, 68, 0.1); color: rgb(248, 113, 113); transition: background-color 0.2s;">
                    <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <button class="approve-btn" style="padding: 0.25rem; border-radius: 9999px; background: rgba(34, 197, 94, 0.1); color: rgb(74, 222, 128); transition: background-color 0.2s;">
                    <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </button>
            </div>
        </div>
        ${status === 'pending' ? `
            <div style="display: flex; align-items: center; justify-content: center; padding: 0.5rem;">
                <div style="width: 1rem; height: 1rem; border: 2px solid rgb(249, 115, 22); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="margin-left: 0.5rem; font-size: 0.875rem; color: rgb(249, 115, 22);">Evaluating...</span>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        ` : metrics ? `
            <div class="score-container" style="cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                    <div style="position: relative; flex: 1;">
                        <div style="height: 0.375rem; width: 100%; border-radius: 9999px; background: linear-gradient(to right, rgb(239, 68, 68), rgb(249, 115, 22), rgb(34, 197, 94));"></div>
                        <div style="position: absolute; width: 0.375rem; height: 0.75rem; top: -0.125rem; border-radius: 9999px; background: rgb(251, 191, 36); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);" 
                             style="left: calc(${metrics.overall}% - 0.1875rem);"></div>
                    </div>
                    <span style="font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; border: 1px solid; ${getScoreColor(metrics.overall)}">
                        ${metrics.overall}%
                    </span>
                </div>
                <span style="font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; border: 1px solid; ${getScoreColor(metrics.overall)}; display: block; text-align: center; margin-top: 0.5rem;">
                    ${getTrustLevel(metrics.overall)}
                </span>
            </div>
        ` : ''}
    `;

    // Add event listeners
    const rejectBtn = tooltipContainer.querySelector('.reject-btn');
    const approveBtn = tooltipContainer.querySelector('.approve-btn');
    const scoreContainer = tooltipContainer.querySelector('.score-container');

    rejectBtn?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'REJECT_EVALUATION' });
        hideTooltip();
    });

    approveBtn?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'APPROVE_EVALUATION' });
        hideTooltip();
    });

    scoreContainer?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_EVALUATION_DETAILS' });
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

const showTooltip = (position: { x: number; y: number }, status: 'pending' | 'evaluated' = 'pending', metrics?: any) => {
    if (!tooltipContainer) {
        createTooltipContainer();
    }

    if (tooltipContainer) {
        createTooltipContent(status, metrics);
        tooltipContainer.style.display = 'block';
        tooltipContainer.style.left = `${position.x}px`;
        tooltipContainer.style.top = `${position.y}px`;
        tooltipContainer.style.transform = 'translate(-50%, -100%)';
    }
};

const hideTooltip = () => {
    if (tooltipContainer) {
        tooltipContainer.style.display = 'none';
    }
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
        showTooltip(position, status, metrics);
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