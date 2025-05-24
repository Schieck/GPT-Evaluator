import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetricsDisplay } from './evaluation/MetricsDisplay';
import { DuplicateWarning } from './evaluation/DuplicateWarning';
import { ProviderSummary } from './evaluation/ProviderSummary';
import { useEvaluation } from '../hooks/useEvaluation';
import { useFeedback } from '../hooks/useFeedback';
import { useHistoryStore } from '../store/useHistoryStore';
import { AIProviderType } from '../services/types';

interface Props {
  userInput: string;
  aiResponse: string;
  onResultsChange?: (hasResults: boolean) => void;
}

export default function RealTimeEvaluator({ userInput, aiResponse, onResultsChange }: Props) {
  const {
    isEvaluating,
    evaluationResult,
    combinedResult,
    error,
    hasDuplicate,
    duplicateEntry,
    currentEvaluationId,
    handleSubmit,
    checkForDuplicates
  } = useEvaluation({ userInput, aiResponse, onResultsChange });

  const updateFeedback = useHistoryStore(state => state.updateFeedback);

  const {
    userFeedback,
    isEditingFeedback,
    handleFeedbackSubmit,
    handleFeedbackEdit,
    handleFeedbackChange
  } = useFeedback();

  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [evaluationStage, setEvaluationStage] = useState('');

  useEffect(() => {
    checkForDuplicates();
  }, [userInput, aiResponse]);

  useEffect(() => {
    if (hasDuplicate && duplicateEntry?.userFeedback) {
      Object.keys(duplicateEntry.evaluation.result).forEach((provider) => {
        handleFeedbackChange(provider as AIProviderType, duplicateEntry.userFeedback || '');
      });
    }
  }, [hasDuplicate, duplicateEntry]);

  useEffect(() => {
    if (isEvaluating) {
      setEvaluationProgress(0);
      setEvaluationStage('Initializing...');

      const stages = [
        { progress: 25, text: 'Analyzing prompt...' },
        { progress: 50, text: 'Evaluating response quality...' },
        { progress: 75, text: 'Calculating metrics...' },
        { progress: 90, text: 'Finalizing results...' }
      ];

      let currentStage = 0;
      const interval = setInterval(() => {
        if (currentStage < stages.length) {
          setEvaluationProgress(stages[currentStage].progress);
          setEvaluationStage(stages[currentStage].text);
          currentStage++;
        }
      }, 2200);

      return () => clearInterval(interval);
    }
  }, [isEvaluating]);

  const showCachedWarning = hasDuplicate && duplicateEntry?.evaluation.id !== currentEvaluationId;

  const handleFeedbackSubmitWithSave = (provider: AIProviderType) => {
    const feedback = userFeedback[provider];
    if (duplicateEntry?.evaluation.id) {
      updateFeedback(duplicateEntry.evaluation.id, provider, feedback);
    }
    handleFeedbackSubmit(provider);
  };

  return (
    <div className="space-y-4">
      {showCachedWarning && (
        <DuplicateWarning onReevaluate={handleSubmit} isEvaluating={isEvaluating} />
      )}

      {!hasDuplicate && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!userInput || !aiResponse || isEvaluating}
          className={`w-full px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden ${isEvaluating || !userInput || !aiResponse
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'
            }`}
        >
          {isEvaluating ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{evaluationStage}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="h-full bg-white/80"
                  initial={{ width: '0%' }}
                  animate={{ width: `${evaluationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : (
            'Validate'
          )}
        </motion.button>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {evaluationResult && combinedResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 backdrop-blur-sm"
          >
            <div className="space-y-4">
              <MetricsDisplay
                metrics={combinedResult.metrics}
                feedback={combinedResult.feedback}
              />

              {Object.entries(evaluationResult).map(([provider, result]) => (
                <ProviderSummary
                  key={provider}
                  provider={provider as AIProviderType}
                  feedback={result.feedback}
                  metrics={result.metrics}
                  userFeedback={userFeedback[provider as AIProviderType]}
                  isEditingFeedback={isEditingFeedback[provider as AIProviderType]}
                  onFeedbackEdit={handleFeedbackEdit}
                  onFeedbackSubmit={handleFeedbackSubmitWithSave}
                  onFeedbackChange={handleFeedbackChange}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 