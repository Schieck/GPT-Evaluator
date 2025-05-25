import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { useStore } from '../store/useStore';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useLiveScannerEvaluation } from '../hooks/useLiveScannerEvaluation';
import { useEvaluationProgressPresets } from '../hooks/useEvaluationProgress';
import { EvaluationProgressBar } from './evaluation/EvaluationProgressBar';
import { NoProvidersWarning } from './evaluation/NoProvidersWarning';
import { ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import { MetricsDisplay } from './evaluation/MetricsDisplay';
import { ProviderSummary } from './evaluation/ProviderSummary';
import type { FoundConversation } from '../store/useStore';

interface MessageResponse {
    success: boolean;
    error?: string;
    isScanning?: boolean;
    data?: any;
}

type ScanStatus = 'idle' | 'scanning' | 'error';

export default function LiveScanner() {
    const {
        isScanning,
        setIsScanning,
        clearFoundConversations,
        lastScanTime,
        setLastScanTime,
        providerInstances
    } = useStore();

    const {
        isEvaluating,
        instanceEvaluationResults,
        combinedMetrics,
        combinedFeedback,
        currentConversation,
        isCachedResult,
        evaluateConversation,
        enabledInstances
    } = useLiveScannerEvaluation();

    const { evaluationProgress, evaluationStage } = useEvaluationProgressPresets.liveScanner(isEvaluating, isCachedResult);

    const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');

    const { handleError } = useErrorHandler({
        context: 'LiveScanner',
        category: ErrorCategory.UI,
        severity: ErrorSeverity.MEDIUM,
        onError: (error) => {
            console.error('LiveScanner error:', error);
            setScanStatus('error');
            setIsScanning(false);
        }
    });

    const toggleScanning = async () => {
        try {
            console.log('[LiveScanner] toggleScanning - current isScanning:', isScanning);
            const messageType = isScanning ? 'STOP_SCANNING' : 'START_SCANNING';

            const newScanningState = !isScanning;
            setIsScanning(newScanningState);
            setScanStatus(newScanningState ? 'scanning' : 'idle');

            const response = await new Promise<MessageResponse>((resolve) => {
                chrome.runtime.sendMessage({ type: messageType }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[LiveScanner] Message port error:', chrome.runtime.lastError);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                        return;
                    }
                    console.log(`[LiveScanner] ${messageType} response:`, response);
                    resolve(response as MessageResponse);
                });
            });

            if (!response.success) {
                setIsScanning(!newScanningState);
                setScanStatus(!newScanningState ? 'scanning' : 'idle');
                throw new Error(response.error || 'Failed to toggle scanning');
            }

            if (isScanning) {
                await Promise.all([
                    new Promise<void>((resolve) => {
                        chrome.runtime.sendMessage({ type: 'HIDE_EVALUATION_TOOLTIP' }, () => resolve());
                    }),
                    new Promise<void>((resolve) => {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]?.id) {
                                chrome.tabs.sendMessage(tabs[0].id, { type: 'HIDE_EVALUATION_TOOLTIP' }, () => resolve());
                            } else {
                                resolve();
                            }
                        });
                    })
                ]);
                setLastScanTime(new Date());
                clearFoundConversations();
            }
        } catch (error) {
            handleError(error, 'toggleScanning');
        }
    };

    const handleEvaluateConversation = async (conversation: FoundConversation) => {
        if (enabledInstances.length === 0) {
            setScanStatus('error');
            handleError(new Error('No enabled provider instances available'), 'evaluateConversation');
            return;
        }

        setScanStatus('scanning');

        try {
            await evaluateConversation(conversation);
            setScanStatus('idle');
            setLastScanTime(new Date());
        } catch (error) {
            handleError(error, 'evaluateConversation');
            setScanStatus('error');
            setIsScanning(false);
        }
    };

    useEffect(() => {
        const getInitialStatus = async () => {
            try {
                const response = await new Promise<MessageResponse>((resolve) => {
                    chrome.runtime.sendMessage({ type: 'GET_SCANNING_STATUS' }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn('[LiveScanner] Message port error:', chrome.runtime.lastError);
                            resolve({ success: false, error: chrome.runtime.lastError.message });
                            return;
                        }
                        resolve(response as MessageResponse);
                    });
                });

                console.log('[LiveScanner] GET_SCANNING_STATUS response:', response);
                if (response?.success && response.isScanning !== undefined && response.isScanning !== isScanning) {
                    console.log('[LiveScanner] Setting isScanning to:', response.isScanning);
                    setIsScanning(response.isScanning);
                    setScanStatus(response.isScanning ? 'scanning' : 'idle');
                }
            } catch (error) {
                console.error('[LiveScanner] Error getting initial status:', error);
            }
        };

        getInitialStatus();

        const messageListener = (message: any) => {
            console.log('[LiveScanner] Received message:', message);
            if (message.type === 'CONVERSATION_READY') {
                const conversation = message.data.conversation;
                if (message.data.location) {
                    (conversation as any).location = message.data.location;
                }
            } else if (message.type === 'CONVERSATION_APPROVED') {
                const conversation = message.data.conversation;
                if (conversation) {
                    handleEvaluateConversation(conversation);
                }
            } else if (message.type === 'SCAN_ERROR') {
                setScanStatus('error');
                setIsScanning(false);
                handleError(new Error(message.error), 'scanListener');
            } else if (message.type === 'SCANNING_STATE_CHANGED') {
                console.log('[LiveScanner] Scanning state changed to:', message.isScanning);
                if (message.isScanning !== isScanning) {
                    setIsScanning(message.isScanning);
                    setScanStatus(message.isScanning ? 'scanning' : 'idle');
                }
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, [setIsScanning, handleEvaluateConversation, isScanning]);

    return (
        <div className="space-y-6">
            {enabledInstances.length === 0 && <NoProvidersWarning />}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleScanning}
                        disabled={enabledInstances.length === 0}
                        className={`p-3 rounded-full transition-colors ${enabledInstances.length === 0
                            ? 'bg-zinc-700 cursor-not-allowed'
                            : isScanning
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                    >
                        {isScanning ? (
                            <StopIcon className="w-6 h-6 text-white" />
                        ) : (
                            <PlayIcon className="w-6 h-6 text-white" />
                        )}
                    </motion.button>

                    <div className="space-y-1">
                        <h2 className="text-lg font-medium text-white">
                            {isScanning ? 'Scanning Active' : 'Scanner Idle'}
                        </h2>
                        {lastScanTime && (
                            <p className="text-sm text-zinc-400">
                                Last scan: {new Date(lastScanTime).toLocaleTimeString()}
                            </p>
                        )}
                        {enabledInstances.length > 0 && (
                            <p className="text-xs text-zinc-500">
                                {enabledInstances.length} provider{enabledInstances.length !== 1 ? 's' : ''} enabled
                            </p>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative"
                    >
                        <motion.div
                            animate={{
                                scale: isScanning ? [1, 1.2, 1] : 1,
                                opacity: isScanning ? [0.5, 1, 0.5] : 1
                            }}
                            transition={{
                                duration: 2,
                                repeat: isScanning ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                            className={`w-4 h-4 rounded-full ${isScanning
                                ? 'bg-orange-500'
                                : scanStatus === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-zinc-500'}`}
                        />
                        {isScanning && (
                            <div className="absolute inset-0 w-4 h-4 rounded-full bg-orange-500/20 animate-ping" />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                {isEvaluating && currentConversation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg"
                    >
                        <div className="space-y-4">
                            <EvaluationProgressBar
                                progress={evaluationProgress}
                                stage={evaluationStage}
                                variant="orange"
                            />
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-xs text-zinc-500 max-w-md mx-auto space-y-1 p-3 bg-zinc-800/30 rounded-md"
                            >
                                <p className="truncate">
                                    <span className="text-zinc-600">User:</span> {currentConversation.userPrompt}
                                </p>
                                <p className="truncate">
                                    <span className="text-zinc-600">AI:</span> {currentConversation.aiResponse}
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {instanceEvaluationResults && combinedMetrics && combinedFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 backdrop-blur-sm"
                    >
                        <div className="space-y-4">
                            {isCachedResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-sm text-blue-400 bg-blue-400/10 px-3 py-2 rounded-md"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Using cached evaluation from history</span>
                                </motion.div>
                            )}

                            <MetricsDisplay
                                metrics={combinedMetrics}
                                feedback={combinedFeedback}
                            />

                            {instanceEvaluationResults && instanceEvaluationResults.size > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-zinc-400">Provider Results</h4>
                                    {Array.from(instanceEvaluationResults.entries()).map(([instanceId, result]) => {
                                        const instance = providerInstances.find(inst => inst.id === instanceId);
                                        if (!instance) return null;

                                        return (
                                            <ProviderSummary
                                                key={instanceId}
                                                provider={instance.type}
                                                feedback={result.feedback}
                                                metrics={result.metrics}
                                                instanceName={instance.name}
                                                instanceModel={instance.config.model}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 