import React from 'react';
import type { EvaluationResult } from '../../services/types';

interface BaseEvaluatorProps {
    isEvaluating: boolean;
    evaluationResult: EvaluationResult | null;
    onClear: () => void;
}

export const BaseEvaluator: React.FC<BaseEvaluatorProps> = ({
    isEvaluating,
    evaluationResult,
    onClear,
}) => {
    return (
        <div className="p-4 border rounded-lg shadow-sm">
            <div className="space-y-4">
                {isEvaluating && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Evaluating response...</p>
                    </div>
                )}

                {evaluationResult && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Evaluation Results</h3>
                            <pre className="whitespace-pre-wrap text-sm">
                                {JSON.stringify(evaluationResult, null, 2)}
                            </pre>
                        </div>
                        <button
                            onClick={onClear}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Clear Results
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}; 