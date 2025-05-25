import { useState, useEffect } from 'react';

interface EvaluationStage {
    progress: number;
    text: string;
}

interface UseEvaluationProgressOptions {
    isEvaluating: boolean;
    isCachedResult?: boolean;
    stages?: EvaluationStage[];
    stageInterval?: number;
}

interface UseEvaluationProgressReturn {
    evaluationProgress: number;
    evaluationStage: string;
    resetProgress: () => void;
}

const DEFAULT_STAGES: EvaluationStage[] = [
    { progress: 20, text: 'Connecting to providers...' },
    { progress: 40, text: 'Analyzing conversation...' },
    { progress: 60, text: 'Evaluating response quality...' },
    { progress: 80, text: 'Computing metrics...' },
    { progress: 95, text: 'Finalizing evaluation...' }
];

const LIVE_SCANNER_STAGES: EvaluationStage[] = [
    { progress: 20, text: 'Connecting to AI providers...' },
    { progress: 40, text: 'Analyzing conversation context...' },
    { progress: 60, text: 'Evaluating response quality...' },
    { progress: 80, text: 'Computing trust metrics...' },
    { progress: 95, text: 'Finalizing evaluation...' }
];

const REAL_TIME_EVALUATOR_STAGES: EvaluationStage[] = [
    { progress: 20, text: 'Connecting to providers...' },
    { progress: 40, text: 'Analyzing prompt...' },
    { progress: 60, text: 'Evaluating response quality...' },
    { progress: 80, text: 'Calculating metrics...' },
    { progress: 90, text: 'Finalizing results...' }
];

/**
 * Custom hook for managing evaluation progress state and animations
 */
export function useEvaluationProgress({
    isEvaluating,
    isCachedResult = false,
    stages = DEFAULT_STAGES,
    stageInterval = 2000
}: UseEvaluationProgressOptions): UseEvaluationProgressReturn {
    const [evaluationProgress, setEvaluationProgress] = useState(0);
    const [evaluationStage, setEvaluationStage] = useState('');

    const resetProgress = () => {
        setEvaluationProgress(0);
        setEvaluationStage('');
    };

    useEffect(() => {
        if (isEvaluating && !isCachedResult) {
            setEvaluationProgress(0);
            setEvaluationStage('Initializing evaluation...');

            let currentStage = 0;
            const interval = setInterval(() => {
                if (currentStage < stages.length && isEvaluating) {
                    setEvaluationProgress(stages[currentStage].progress);
                    setEvaluationStage(stages[currentStage].text);
                    currentStage++;
                }
            }, stageInterval);

            return () => clearInterval(interval);
        }
    }, [isEvaluating, isCachedResult, stages, stageInterval]);

    return {
        evaluationProgress,
        evaluationStage,
        resetProgress
    };
}

/**
 * Preset configurations for different components
 */
export const useEvaluationProgressPresets = {
    liveScanner: (isEvaluating: boolean, isCachedResult?: boolean) =>
        useEvaluationProgress({
            isEvaluating,
            isCachedResult,
            stages: LIVE_SCANNER_STAGES,
            stageInterval: 2200
        }),

    realTimeEvaluator: (isEvaluating: boolean) =>
        useEvaluationProgress({
            isEvaluating,
            stages: REAL_TIME_EVALUATOR_STAGES,
            stageInterval: 2000
        })
}; 