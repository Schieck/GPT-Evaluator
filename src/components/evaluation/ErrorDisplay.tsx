import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/16/solid';

interface ErrorDisplayProps {
    error: string;
    onDismiss?: () => void;
    variant?: 'error' | 'warning';
    className?: string;
}

/**
 * Reusable error display component
 */
export function ErrorDisplay({
    error,
    onDismiss,
    variant = 'error',
    className = ''
}: ErrorDisplayProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'warning':
                return {
                    container: 'bg-yellow-500/10 border-yellow-500/20',
                    text: 'text-yellow-400',
                    icon: 'text-yellow-400'
                };
            default:
                return {
                    container: 'bg-red-500/10 border-red-500/20',
                    text: 'text-red-400',
                    icon: 'text-red-400'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 ${styles.container} border rounded-md ${className}`}
        >
            <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                    <p className={`text-sm ${styles.text}`}>{error}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={`${styles.text} hover:opacity-70 transition-opacity`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </motion.div>
    );
} 