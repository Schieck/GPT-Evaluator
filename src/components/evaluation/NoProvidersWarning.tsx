import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/16/solid';

interface NoProvidersWarningProps {
    className?: string;
    message?: string;
}

/**
 * Reusable warning component for when no provider instances are enabled
 */
export function NoProvidersWarning({
    className = '',
    message = "No provider instances are enabled. Please configure at least one provider instance in the settings."
}: NoProvidersWarningProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg ${className}`}
        >
            <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-400">{message}</p>
            </div>
        </motion.div>
    );
} 