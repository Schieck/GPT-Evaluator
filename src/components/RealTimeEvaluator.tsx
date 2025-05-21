import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DynamicEvaluationService } from '../services/DynamicEvaluationService';
import { HistoryService } from '../services/HistoryService';
import { AIProviderType } from '../services/types';
import type { EvaluationResult, CombinedEvaluationResult } from '../services/types';
import { v4 as uuidv4 } from 'uuid';
import EvaluationResults from './evaluation/EvaluationResults';
import ProviderCountTag from './evaluation/ProviderCountTag';

interface RealTimeEvaluatorProps {
  userInput: string;
  aiResponse: string;
}

const saveToHistory = (
  userPrompt: string,
  aiResponse: string,
  result: CombinedEvaluationResult
) => {
  try {
    const historyData = localStorage.getItem('gpt-evaluator-history');
    const history = historyData ? JSON.parse(historyData) : [];

    const newEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      userPrompt,
      aiResponse,
      result
    };

    history.unshift(newEntry);

    const limitedHistory = history.slice(0, 20);

    localStorage.setItem('gpt-evaluator-history', JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
};

export default function RealTimeEvaluator({ userInput, aiResponse }: RealTimeEvaluatorProps) {
  const [result, setResult] = useState<CombinedEvaluationResult | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userInput && aiResponse) {
      const historyService = HistoryService.getInstance();
      const recentEvaluation = historyService.findRecentEvaluation(userInput, aiResponse);
      if (recentEvaluation) {
        setResult(recentEvaluation.result as CombinedEvaluationResult);
        setFeedback(recentEvaluation.userFeedback || '');
        setIsFeedbackSubmitted(!!recentEvaluation.userFeedback);
        setIsFromHistory(true);
      } else {
        setResult(null);
        setFeedback('');
        setIsFeedbackSubmitted(false);
        setIsFromHistory(false);
      }
    }
  }, [userInput, aiResponse]);

  const handleFeedbackSubmit = (newFeedback: string) => {
    if (!result) return;
    try {
      const historyService = HistoryService.getInstance();
      const recentEvaluation = historyService.findRecentEvaluation(userInput, aiResponse);
      if (recentEvaluation) {
        historyService.updateFeedback(recentEvaluation.id, newFeedback);
        setFeedback(newFeedback);
        setIsFeedbackSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  const generateOutput = async () => {
    setLoading(true);
    setError(null);
    setIsFromHistory(false);
    try {
      const evaluationService = DynamicEvaluationService.getInstance();
      const evaluationResults = await evaluationService.evaluateWithAllProviders({
        userPrompt: userInput,
        aiResponse: aiResponse,
        parameters: {}
      });

      setResult(evaluationResults);
      setLoading(false);

      // Save the combined result to history
      saveToHistory(userInput, aiResponse, evaluationResults);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const renderScore = (score: number) => {
    let colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';
    if (score >= 90) {
      colorClass = 'bg-green-500/20 text-green-400 border-green-500/30';
    } else if (score >= 70) {
      colorClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    } else if (score >= 50) {
      colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
        {score}
      </span>
    );
  };

  const toggleDetails = (providerId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  return (
    <div className="space-y-4">
      {isFromHistory && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-md flex items-center justify-between"
        >
          <p className="text-sm text-orange-400">Showing evaluation from history</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="py-1 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs rounded-md transition-all duration-300"
            onClick={generateOutput}
          >
            Regenerate
          </motion.button>
        </motion.div>
      )}
      {!isFromHistory && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-md transition-all duration-300 flex items-center justify-center"
          onClick={generateOutput}
          disabled={loading || !userInput || !aiResponse}
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {loading ? 'Processing...' : 'Generate Evaluation'}
        </motion.button>
      )}
      {(!loading && result) && (
        <div className="space-y-6">
          <div className="p-4 border border-zinc-800 rounded-md bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">Combined</h3>
              </div>
              <div className="flex items-center gap-2">
                <ProviderCountTag count={Object.keys(result.providerResults).length} />
                {renderScore(result.metrics.overall)}
              </div>
            </div>
            <EvaluationResults
              result={{
                metrics: result.metrics,
                feedback: result.feedback,
                metadata: {
                  providerId: 'combined',
                  timestamp: Date.now(),
                  processingTimeMs: 0
                }
              }}
              showDetails={showDetails['combined'] || false}
              onToggleDetails={() => toggleDetails('combined')}
              onFeedbackSubmit={handleFeedbackSubmit}
              initialFeedback={feedback}
              providerName="Combined"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(result.providerResults).map(([provider, providerResult]) => (
              <div key={provider} className="p-4 border border-zinc-800 rounded-md bg-zinc-900/50 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white capitalize">{provider}</h3>
                    <span className="text-xs text-zinc-400">Score:</span>
                    {renderScore(providerResult.metrics.overall)}
                  </div>
                </div>
                <EvaluationResults
                  result={providerResult as EvaluationResult}
                  showDetails={showDetails[provider] || false}
                  onToggleDetails={() => toggleDetails(provider)}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  initialFeedback={feedback}
                  providerName={provider}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 