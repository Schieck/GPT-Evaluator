import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    title?: string;
    disabled?: boolean;
}

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    title,
    disabled = false
}: ButtonProps) => {
    const baseClasses = 'rounded-full transition-all duration-300';

    const variantClasses = {
        primary: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
        secondary: 'hover:bg-zinc-800 text-zinc-400',
        danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
        success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
    };

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3'
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {children}
        </motion.button>
    );
}; 