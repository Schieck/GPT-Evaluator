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
        clearFoundConversations,
        lastScanTime,
        setLastScanTime
    } = useStore();

    const historyService = EvaluationHistoryService.getInstance();

    const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
    const [evaluationResult, setEvaluationResult] = useState<Record<AIProviderType, EvaluationResult> | null>(null);
    const [combinedResult, setCombinedResult] = useState<CombinedEvaluationResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [currentConversation, setCurrentConversation] = useState<FoundConversation | null>(null);
    const [isCachedResult, setIsCachedResult] = useState(false);
    const [evaluationProgress, setEvaluationProgress] = useState(0);
    const [evaluationStage, setEvaluationStage] = useState('');

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
            setCurrentConversation(conversation);
            setIsCachedResult(false);
            setEvaluationProgress(0);
            setEvaluationStage('Checking cache...');

            // Check for duplicate evaluation in history first
            const { hasDuplicate, duplicateEntry } = historyService.findDuplicate(
                conversation.userPrompt,
                conversation.aiResponse
            );

            if (hasDuplicate && duplicateEntry && duplicateEntry.evaluation.result) {
                // Use cached result
                console.log('[LiveScanner] Found duplicate evaluation in history, using cached result');
                setIsCachedResult(true);
                setEvaluationStage('Loading from cache...');
                setEvaluationProgress(100);

                // Add small delay for better UX
                await new Promise(resolve => setTimeout(resolve, 300));

                setEvaluationResult(duplicateEntry.evaluation.result);

                // Calculate combined metrics if not already present
                const combinedMetrics = duplicateEntry.evaluation.combinedMetrics ||
                    calculateCombinedMetrics(duplicateEntry.evaluation.result);

                const combinedFeedback = duplicateEntry.evaluation.combinedFeedback || {
                    strengths: [],
                    weaknesses: [],
                    suggestions: [],
                    summary: 'Combined evaluation from cached results',
                    promptRequestSuggestion: '',
                    references: []
                };

                setCombinedResult({
                    providerResults: duplicateEntry.evaluation.result,
                    metrics: combinedMetrics,
                    feedback: combinedFeedback
                });

                setLastScanTime(new Date());

                // Send evaluation complete message to background with cached results
                chrome.runtime.sendMessage({
                    type: 'EVALUATION_COMPLETE',
                    data: {
                        metrics: combinedMetrics,
                        location: (conversation as any).location
                    }
                });

                return; // Exit early, no need to evaluate again
            }

            // No duplicate found, proceed with evaluation
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

            // Send evaluation complete message to background
            chrome.runtime.sendMessage({
                type: 'EVALUATION_COMPLETE',
                data: {
                    metrics: result.metrics,
                    location: (conversation as any).location
                }
            });
        } catch (error) {
            handleError(error, 'evaluateConversation');
            setScanStatus('error');
            setIsScanning(false);
        } finally {
            setIsEvaluating(false);
        }
    };

    // Helper function to calculate combined metrics from cached results
    const calculateCombinedMetrics = (results: Record<AIProviderType, EvaluationResult>) => {
        const combinedMetrics = {
            relevance: 0,
            accuracy: 0,
            completeness: 0,
            coherence: 0,
            overall: 0
        };

        const validResults = Object.values(results).filter(result => result?.metrics);

        validResults.forEach(result => {
            combinedMetrics.relevance += result.metrics.relevance;
            combinedMetrics.accuracy += result.metrics.accuracy;
            combinedMetrics.completeness += result.metrics.completeness;
            combinedMetrics.coherence += result.metrics.coherence;
            combinedMetrics.overall += result.metrics.overall;
        });

        const providerCount = validResults.length || 1;
        return {
            relevance: Math.round(combinedMetrics.relevance / providerCount),
            accuracy: Math.round(combinedMetrics.accuracy / providerCount),
            completeness: Math.round(combinedMetrics.completeness / providerCount),
            coherence: Math.round(combinedMetrics.coherence / providerCount),
            overall: Math.round(combinedMetrics.overall / providerCount)
        };
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
        // Sync with background script's scanning state on mount
        chrome.runtime.sendMessage({ type: 'GET_SCANNING_STATUS' }, (response) => {
            if (response?.success && response.isScanning !== undefined) {
                setIsScanning(response.isScanning);
                setScanStatus(response.isScanning ? 'scanning' : 'idle');
            }
        });

        const messageListener = (message: any) => {
            console.log('message', message);
            if (message.type === 'CONVERSATION_READY') {
                // Store the conversation but don't show it in UI
                const conversation = message.data.conversation;
                if (message.data.location) {
                    (conversation as any).location = message.data.location;
                }
                // Just keep the latest conversation in memory
                setCurrentConversation(conversation);
            } else if (message.type === 'CONVERSATION_APPROVED') {
                // User approved the evaluation from the tooltip
                const conversation = message.data.conversation;
                if (conversation) {
                    evaluateConversation(conversation);
                }
            } else if (message.type === 'SCAN_ERROR') {
                setScanStatus('error');
                setIsScanning(false);
                handleError(new Error(message.error), 'scanListener');
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, []);

    useEffect(() => {
        if (isEvaluating && !isCachedResult) {
            const stages = [
                { progress: 20, text: 'Connecting to AI providers...' },
                { progress: 40, text: 'Analyzing conversation context...' },
                { progress: 60, text: 'Evaluating response quality...' },
                { progress: 80, text: 'Computing trust metrics...' },
                { progress: 95, text: 'Finalizing evaluation...' }
            ];

            let currentStage = 0;
            const interval = setInterval(() => {
                if (currentStage < stages.length && isEvaluating) {
                    setEvaluationProgress(stages[currentStage].progress);
                    setEvaluationStage(stages[currentStage].text);
                    currentStage++;
                }
            }, 2200);

            return () => clearInterval(interval);
        }
    }, [isEvaluating, isCachedResult]);

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
                                Last scan: {new Date(lastScanTime).toLocaleTimeString()}
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
                            <div className="space-y-2">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-zinc-400">{evaluationStage}</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${evaluationProgress}%` }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
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

                {evaluationResult && combinedResult && (
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