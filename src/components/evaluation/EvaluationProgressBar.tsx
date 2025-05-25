import { motion } from 'framer-motion';

interface EvaluationProgressBarProps {
    progress: number;
    stage: string;
    variant?: 'default' | 'orange' | 'white';
    className?: string;
}

/**
 * Reusable evaluation progress bar component
 */
export function EvaluationProgressBar({
    progress,
    stage,
    variant = 'default',
    className = ''
}: EvaluationProgressBarProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'orange':
                return {
                    spinner: 'border-orange-500 border-t-transparent',
                    text: 'text-zinc-400',
                    bar: 'bg-zinc-800',
                    fill: 'bg-gradient-to-r from-orange-500 to-amber-500'
                };
            case 'white':
                return {
                    spinner: 'border-white border-t-transparent',
                    text: 'text-white',
                    bar: 'bg-white/20',
                    fill: 'bg-white/80'
                };
            default:
                return {
                    spinner: 'border-blue-500 border-t-transparent',
                    text: 'text-zinc-400',
                    bar: 'bg-zinc-800',
                    fill: 'bg-gradient-to-r from-blue-500 to-purple-500'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-center space-x-2">
                <div className={`w-4 h-4 border-2 ${styles.spinner} rounded-full animate-spin`}></div>
                <span className={`text-sm ${styles.text}`}>{stage}</span>
            </div>
            <div className={`w-full ${styles.bar} rounded-full h-1.5 overflow-hidden`}>
                <motion.div
                    className={`h-full ${styles.fill}`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            </div>
        </div>
    );
} 