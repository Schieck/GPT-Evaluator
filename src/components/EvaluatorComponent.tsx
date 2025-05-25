import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/16/solid';
import { useStore } from '../store/useStore';
import { TextArea } from './atoms/TextArea';
import { RealTimeEvaluator } from './RealTimeEvaluator';

export default function EvaluatorComponent() {
    const {
        userInput,
        aiResponse,
        setUserInput,
        setAiResponse
    } = useStore();

    const [isInputCollapsed, setIsInputCollapsed] = useState(true);
    const [hasResults, setHasResults] = useState(false);

    const handleResultsChange = (hasResults: boolean) => {
        setHasResults(hasResults);
    };

    useEffect(() => {
        if (hasResults) {
            setIsInputCollapsed(true);
        }
    }, [hasResults]);

    return (
        <>
            <AnimatePresence mode="wait">
                {(!isInputCollapsed) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 mb-4 overflow-hidden"
                    >
                        <div className="space-y-2">
                            <h2 className="font-medium text-sm text-orange-400">User Input</h2>
                            <TextArea
                                value={userInput}
                                onChange={setUserInput}
                                placeholder="Enter your prompt here..."
                                rows={5}
                            />
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-medium text-sm text-orange-400">AI Response</h2>
                            <TextArea
                                value={aiResponse}
                                onChange={setAiResponse}
                                placeholder="Enter AI response to evaluate..."
                                rows={5}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {userInput && aiResponse && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="pt-4 border-t border-zinc-800">
                        {hasResults && (
                            <button
                                onClick={() => setIsInputCollapsed(!isInputCollapsed)}
                                className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-zinc-300 mb-4 transition-colors"
                            >
                                {isInputCollapsed ? (
                                    <>
                                        <ChevronDownIcon className="w-4 h-4" />
                                        <span>Show Input Fields</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronUpIcon className="w-4 h-4" />
                                        <span>Hide Input Fields</span>
                                    </>
                                )}
                            </button>
                        )}
                        <RealTimeEvaluator
                            userInput={userInput}
                            aiResponse={aiResponse}
                            onResultsChange={handleResultsChange}
                        />
                    </div>
                </motion.div>
            )}
        </>
    );
} 