import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { useStore } from '../store/useStore';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import { EvaluationService } from '../services/EvaluationService';
import type { EvaluationResult } from '../services/types';
import { AIProviderType } from '../services/types';

interface MessageResponse {
    success: boolean;
    error?: string;
}

interface Conversation {
    userPrompt: string;
    aiResponse: string;
    timestamp: string;
}

type ScanStatus = 'idle' | 'scanning' | 'error';

export default function LiveScanner() {
    const { isScanning, setIsScanning } = useStore();
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
    const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
    const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);

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
            }
        } catch (error) {
            handleError(error, 'toggleScanning');
        }
    };

    const evaluateConversation = async (conversation: Conversation) => {
        try {
            const evaluationService = EvaluationService.getInstance();
            const result = await evaluationService.evaluateSync(conversation, AIProviderType.OPENAI);
            setCurrentEvaluation(result);
            setLastScanTime(new Date());
        } catch (error) {
            handleError(error, 'evaluateConversation');
            setScanStatus('error');
            setIsScanning(false);
        }
    };

    useEffect(() => {
        const messageListener = (message: any) => {
            if (message.type === 'CONVERSATION_READY') {
                evaluateConversation(message.data.conversation);
            } else if (message.type === 'SCAN_ERROR') {
                setScanStatus('error');
                setIsScanning(false);
                handleError(new Error(message.error), 'scanListener');
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, []);

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

            {currentEvaluation && (
                <div className="p-4 rounded-lg bg-zinc-900/50 backdrop-blur-sm border border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Latest Evaluation</h3>
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(currentEvaluation.metrics).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">{key}</span>
                                    <span className="text-sm text-white">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 