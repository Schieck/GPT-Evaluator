import { useState } from 'react';
import { motion } from 'framer-motion';

interface RealTimeEvaluatorProps {
  userInput: string;
  aiResponse: string;
}

export default function RealTimeEvaluator({ userInput, aiResponse }: RealTimeEvaluatorProps) {
  const [outputText, setOutputText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const generateOutput = () => {
    setLoading(true);
    setTimeout(() => {
      const randomTexts = [
        "This is a randomly generated output for demonstration purposes.",
        "Here's some sample output text to show how the comparison works.",
        "The actual implementation would connect to an AI service.",
        "This placeholder will be replaced with real functionality."
      ];
      const randomIndex = Math.floor(Math.random() * randomTexts.length);
      setOutputText(randomTexts[randomIndex]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">

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

      {outputText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 border border-zinc-800 rounded-lg overflow-hidden"
        >
          <div className="grid grid-cols-1 divide-y divide-zinc-800">
            <div className="p-3 bg-zinc-900/30">
              <h3 className="text-xs font-medium uppercase text-orange-400 mb-1">Evaluation Result</h3>
              <p className="text-sm text-white">{outputText}</p>
            </div>

            <div className="p-3 bg-zinc-900/30">
              <h3 className="text-xs font-medium uppercase text-orange-400 mb-1">Your Feedback</h3>
              {feedback ? (
                <p className="text-sm text-white">{feedback}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full h-16 p-3 bg-zinc-900 text-sm resize-none border border-zinc-800 rounded-md focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-zinc-600 text-white"
                    placeholder="Enter your feedback..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="py-1 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs rounded-md self-end transition-all duration-300"
                    onClick={() => console.log("Feedback submitted")}
                  >
                    Submit Feedback
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 