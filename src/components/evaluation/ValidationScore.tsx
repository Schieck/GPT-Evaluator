import { motion } from 'framer-motion';

interface ValidationScoreProps {
    score: number;
    size?: 'sm' | 'md';
    className?: string;
    showTrustLevel?: boolean;
}

export function ValidationScore({ score, size = 'md', className = '', showTrustLevel = false }: ValidationScoreProps) {
    const height = size === 'sm' ? 'h-1.5' : 'h-2';
    const indicatorSize = size === 'sm' ? 'w-1.5 h-3' : 'w-2 h-4';

    const indicatorPosition = `${score}%`;

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (score >= 70) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        if (score >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    const getTrustLevel = (score: number) => {
        if (score >= 90) return { text: 'Highly Trustworthy', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
        if (score >= 70) return { text: 'Moderately Trustworthy', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
        if (score >= 50) return { text: 'Somewhat Trustworthy', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
        return { text: 'Not Trustworthy', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    };

    const trustLevel = getTrustLevel(score);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex items-center gap-4 w-full">
                <div className="relative flex-1">
                    <div className={`${height} w-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500`} />
                    <motion.div
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute ${indicatorSize} -top-0.5 rounded-full bg-orange-200 shadow-sm`}
                        style={{ left: `calc(${indicatorPosition} - ${size === 'sm' ? '0.75px' : '1px'})` }}
                    />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getScoreColor(score)} whitespace-nowrap`}>
                    {score}%
                </span>
            </div>
            {showTrustLevel && <span className={`text-xs px-2 py-0.5 rounded-full border ${trustLevel.color} text-center`}>
                {trustLevel.text}
            </span>}
        </div>
    );
} 