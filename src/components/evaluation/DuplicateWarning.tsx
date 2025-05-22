import { motion } from 'framer-motion';

interface DuplicateWarningProps {
    onReevaluate: () => void;
    isEvaluating: boolean;
}

export const DuplicateWarning = ({ onReevaluate, isEvaluating }: DuplicateWarningProps) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md"
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <span className="text-amber-400">⚠️</span>
                <p className="text-sm text-amber-400">
                    This is cached.
                </p>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onReevaluate}
                disabled={isEvaluating}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center space-x-2 ${isEvaluating
                    ? 'bg-amber-500/20 text-amber-400/50 cursor-not-allowed'
                    : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    }`}
            >
                {isEvaluating ? (
                    <>
                        <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Re-evaluating...</span>
                    </>
                ) : (
                    'Re-evaluate'
                )}
            </motion.button>
        </div>
    </motion.div>
); 