import type { EvaluationFeedback } from '../../services/types';

interface FeedbackDisplayProps {
    feedback: EvaluationFeedback;
    className?: string;
}

export const FeedbackDisplay = ({ feedback, className = '' }: FeedbackDisplayProps) => (
    <div className={`space-y-3 ${className}`}>
        <div className="p-3 bg-zinc-800/50 rounded-md">
            <h3 className="text-xs font-medium text-orange-400 mb-2">Summary</h3>
            <p className="text-sm text-white">{feedback.summary}</p>
        </div>

        {feedback.strengths.length > 0 && (
            <div className="p-3 bg-zinc-800/50 rounded-md">
                <h4 className="text-xs font-medium text-green-400 mb-2">Strengths</h4>
                <ul className="space-y-1">
                    {feedback.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-white flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{strength}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {feedback.weaknesses.length > 0 && (
            <div className="p-3 bg-zinc-800/50 rounded-md">
                <h4 className="text-xs font-medium text-red-400 mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                    {feedback.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-white flex items-start gap-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>{weakness}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
); 