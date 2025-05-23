import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { useStore } from '../store/useStore';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import { DynamicEvaluationService } from '../services/DynamicEvaluationService';
import { EvaluationHistoryService } from '../services/EvaluationHistoryService';
import { MetricsDisplay } from './evaluation/MetricsDisplay';
import { ProviderSummary } from './evaluation/ProviderSummary';
import { ConversationApproval } from './evaluation/ConversationApproval';
import { useFeedback } from '../hooks/useFeedback';
import { useHistoryStore } from '../store/useHistoryStore';
import type { EvaluationResult, CombinedEvaluationResult } from '../services/types';
import { AIProviderType, EvaluationStatus } from '../services/types';
import type { FoundConversation } from '../store/useStore';

interface MessageResponse {
    success: boolean;
    error?: string;
}

type ScanStatus = 'idle' | 'scanning' | 'error';

export default function LiveScanner() {
    const {
        isScanning,
        setIsScanning,
        foundConversations,
        addFoundConversation,
        updateConversationStatus,
        clearFoundConversations
    } = useStore();

    const historyService = EvaluationHistoryService.getInstance();

    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
    const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
    const [evaluationResult, setEvaluationResult] = useState<Record<AIProviderType, EvaluationResult> | null>(null);
    const [combinedResult, setCombinedResult] = useState<CombinedEvaluationResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    const {
        userFeedback,
        isEditingFeedback,
        handleFeedbackSubmit,
        handleFeedbackEdit,
        handleFeedbackChange
    } = useFeedback();

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
            const messageType = isScanning ? 'STOP_SCANNING' : 'START_SCANNING';

            const response = await new Promise<MessageResponse>((resolve) => {
                chrome.runtime.sendMessage({ type: messageType }, (response) => {
                    resolve(response as MessageResponse);
                });
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to toggle scanning');
            }

            setIsScanning(!isScanning);
            setScanStatus(isScanning ? 'idle' : 'scanning');

            if (!isScanning) {
                setLastScanTime(new Date());
                clearFoundConversations();
            }
        } catch (error) {
            handleError(error, 'toggleScanning');
        }
    };

    const evaluateConversation = async (conversation: FoundConversation) => {
        try {
            setIsEvaluating(true);
            const evaluationService = DynamicEvaluationService.getInstance();
            const result = await evaluationService.evaluateWithAllProviders({
                userPrompt: conversation.userPrompt,
                aiResponse: conversation.aiResponse
            });

            setEvaluationResult(result.providerResults);
            setCombinedResult(result);
            setLastScanTime(new Date());

            // Add to history using the history service
            historyService.addToHistory(
                conversation.userPrompt,
                conversation.aiResponse,
                {
                    status: EvaluationStatus.COMPLETED,
                    id: crypto.randomUUID(),
                    result: result.providerResults,
                    combinedMetrics: result.metrics,
                    combinedFeedback: result.feedback
                }
            );
        } catch (error) {
            handleError(error, 'evaluateConversation');
            setScanStatus('error');
            setIsScanning(false);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleConversationApproval = (conversation: FoundConversation) => {
        updateConversationStatus(conversation.id, 'approved');
        evaluateConversation(conversation);
    };

    const handleConversationRejection = (conversation: FoundConversation) => {
        updateConversationStatus(conversation.id, 'rejected');
    };

    const handleFeedbackSubmitWithSave = (provider: AIProviderType) => {
        const feedback = userFeedback[provider];
        if (combinedResult) {
            const historyEntry = historyService.findDuplicate(
                foundConversations[0]?.userPrompt || '',
                foundConversations[0]?.aiResponse || ''
            ).duplicateEntry;

            if (historyEntry) {
                // Update feedback in the store
                const { updateFeedback } = useHistoryStore.getState();
                updateFeedback(historyEntry.id, provider, feedback);
            }
        }
        handleFeedbackSubmit(provider);
    };

    useEffect(() => {
        const messageListener = (message: any) => {
            console.log('message', message);
            if (message.type === 'CONVERSATION_READY') {
                addFoundConversation(message.data.conversation);
            } else if (message.type === 'SCAN_ERROR') {
                setScanStatus('error');
                setIsScanning(false);
                handleError(new Error(message.error), 'scanListener');
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, []);

    // Sort conversations by timestamp in descending order (newest first)
    const sortedConversations = [...foundConversations].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleScanning}
                        className={`p-3 rounded-full ${isScanning
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-orange-500 hover:bg-orange-600'
                            } transition-colors`}
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
                                Last scan: {lastScanTime.toLocaleTimeString()}
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
                {isEvaluating && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-zinc-400">Evaluating conversation...</span>
                        </div>
                    </motion.div>
                )}

                {foundConversations.length > 0 && (
                    <div className="space-y-3">
                        {sortedConversations
                            .filter(conv => conv.status === 'pending')
                            .map(conversation => (
                                <ConversationApproval
                                    key={conversation.id}
                                    conversation={conversation}
                                    onApprove={() => handleConversationApproval(conversation)}
                                    onReject={() => handleConversationRejection(conversation)}
                                />
                            ))}
                    </div>
                )}

                {evaluationResult && combinedResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 backdrop-blur-sm"
                    >
                        <div className="space-y-4">
                            <MetricsDisplay
                                metrics={combinedResult.metrics}
                                feedback={combinedResult.feedback}
                            />

                            {Object.entries(evaluationResult).map(([provider, result]) => (
                                <ProviderSummary
                                    key={provider}
                                    provider={provider as AIProviderType}
                                    feedback={result.feedback}
                                    metrics={result.metrics}
                                    userFeedback={userFeedback[provider as AIProviderType]}
                                    isEditingFeedback={isEditingFeedback[provider as AIProviderType]}
                                    onFeedbackEdit={handleFeedbackEdit}
                                    onFeedbackSubmit={handleFeedbackSubmitWithSave}
                                    onFeedbackChange={handleFeedbackChange}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 