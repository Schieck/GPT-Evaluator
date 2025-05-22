import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    animate?: boolean;
    borderColor?: string;
}

export const Card = ({
    children,
    className = '',
    animate = false,
    borderColor = 'border-zinc-800'
}: CardProps) => {
    const baseClasses = 'p-4 bg-zinc-900/50 rounded-lg border';

    if (animate) {
        return (
            <motion.div
                className={`${baseClasses} ${borderColor} ${className}`}
                animate={{
                    borderColor: ['#f97316', '#fbbf24', '#f97316'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <div className={`${baseClasses} ${borderColor} ${className}`}>
            {children}
        </div>
    );
}; 