import { motion, AnimatePresence } from 'framer-motion';
import { ValidationScore } from './ValidationScore';
import type { EvaluationMetrics } from '../../services/types';

interface EvaluationTooltipProps {
    isVisible: boolean;
    metrics?: EvaluationMetrics;
    onApprove: () => void;
    onReject: () => void;
    onOpenDetails: () => void;
    position?: { x: number; y: number };
}

export const EvaluationTooltip = ({
    isVisible,
    metrics,
    onApprove,
    onReject,
    onOpenDetails,
    position = { x: 0, y: 0 }
}: EvaluationTooltipProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="fixed z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-3 min-w-[200px]"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <img src="/favicon/favicon-96x96.png" alt="GPT Evaluator" className="w-6 h-6" />
                        <div className="flex space-x-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onReject}
                                className="p-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onApprove}
                                className="p-1 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>

                    {metrics && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="cursor-pointer"
                            onClick={onOpenDetails}
                        >
                            <ValidationScore score={metrics.overall} size="sm" showTrustLevel={true} />
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}; 