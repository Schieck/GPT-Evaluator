import { motion } from 'framer-motion';
import { BeakerIcon } from '@heroicons/react/16/solid';
import { EvaluationProgressBar } from './EvaluationProgressBar';

interface EvaluationButtonProps {
    isEvaluating: boolean;
    isDisabled: boolean;
    enabledInstancesCount: number;
    evaluationProgress?: number;
    evaluationStage?: string;
    onClick: () => void;
    variant?: 'default' | 'orange';
    className?: string;
}

/**
 * Reusable evaluation button with progress state
 */
export function EvaluationButton({
    isEvaluating,
    isDisabled,
    enabledInstancesCount,
    evaluationProgress = 0,
    evaluationStage = '',
    onClick,
    variant = 'default',
    className = ''
}: EvaluationButtonProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'orange':
                return {
                    enabled: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white',
                    disabled: 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                };
            default:
                return {
                    enabled: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white',
                    disabled: 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                };
        }
    };

    const styles = getVariantStyles();
    const buttonClass = isDisabled
        ? styles.disabled
        : styles.enabled;

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            disabled={isDisabled}
            className={`w-full px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden ${buttonClass} ${className}`}
        >
            {isEvaluating ? (
                <EvaluationProgressBar
                    progress={evaluationProgress}
                    stage={evaluationStage}
                    variant="white"
                />
            ) : (
                <div className="flex items-center justify-center space-x-2">
                    <BeakerIcon className="w-5 h-5" />
                    <span>
                        Validate with {enabledInstancesCount} Provider{enabledInstancesCount !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </motion.button>
    );
} 