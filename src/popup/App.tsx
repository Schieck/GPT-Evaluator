import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RealTimeEvaluator from '../components/RealTimeEvaluator';
import Configurations from '../components/Configurations';
import type { ApiConfig } from '../components/Configurations';
import { saveApiConfigs, loadApiConfigs } from '../utils/storage';
import HistoryComponent from '../components/history/HistoryComponent';
import {
  BeakerIcon,
  BoltIcon,
  ClockIcon,
  HandRaisedIcon,
  ArrowsPointingOutIcon,
  PlayIcon,
  StopIcon,
  SignalIcon
} from '@heroicons/react/16/solid';
import { EvaluationService } from '../services/EvaluationService';
import { AIProviderType } from '../services/types';

type TabType = 'evaluator' | 'history' | 'config' | 'live';

export default function App() {
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('evaluator');
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const openInWindow = () => {
    chrome.windows.create({
      url: 'index.html',
      type: 'popup',
      width: 400,
      height: 650,
      focused: true
    });
  };

  useEffect(() => {
    const configs = loadApiConfigs();
    setApiConfigs(configs);

    const evaluationService = EvaluationService.getInstance();

    const openAiConfig = configs.find(c => c.type === 'openai');
    if (openAiConfig?.key) {
      evaluationService.initializeProvider(AIProviderType.OPENAI, openAiConfig.key);
    }

    const claudeConfig = configs.find(c => c.type === 'claude');
    if (claudeConfig?.key) {
      evaluationService.initializeProvider(AIProviderType.CLAUDE, claudeConfig.key);
    }
  }, []);

  const handleSaveConfigs = (configs: ApiConfig[]) => {
    setApiConfigs(configs);
    saveApiConfigs(configs);

    const evaluationService = EvaluationService.getInstance();

    const openAiConfig = configs.find(c => c.type === 'openai');
    if (openAiConfig?.key) {
      evaluationService.initializeProvider(AIProviderType.OPENAI, openAiConfig.key);
    }

    const claudeConfig = configs.find(c => c.type === 'claude');
    if (claudeConfig?.key) {
      evaluationService.initializeProvider(AIProviderType.CLAUDE, claudeConfig.key);
    }
  };

  return (
    <div className="w-[360px] max-h-[600px] overflow-auto bg-black text-white popup-container">
      <div className="h-[3px] bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500"></div>

      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div> <div className='flex items-center gap-2'>
          <img src='/favicon/favicon-96x96.png' className='w-10 h-10 rounded-full'></img>
          <h2 className="text-lg font-bold text-white">Evaluator</h2>
        </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"
            onClick={openInWindow}
            title="Open in window"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={`p-2 rounded-full ${activeTab === 'config' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
            onClick={() => setActiveTab(activeTab === 'config' ? 'evaluator' : 'config')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>
      </header>

      {activeTab !== 'config' && (
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('evaluator')}
            className={`relative flex-1 py-3 text-sm font-medium transition-all duration-300 ${activeTab === 'evaluator' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <span className="flex items-center justify-center gap-2">
              <BeakerIcon className='w-4 h-4' />
              Legacy
            </span>
            {activeTab === 'evaluator' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`relative flex-1 py-3 text-sm font-medium transition-all duration-300 ${activeTab === 'live' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <span className="flex items-center justify-center gap-2">
              <BoltIcon className='w-4 h-4' />
              Live
            </span>
            {activeTab === 'live' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`relative flex-1 py-3 text-sm font-medium transition-all duration-300 ${activeTab === 'history' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <span className="flex items-center justify-center gap-2">
              <ClockIcon className='w-4 h-4' />
              History
            </span>
            {activeTab === 'history' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          {activeTab === 'evaluator' && (
            <>
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <h2 className="font-medium text-sm text-orange-400">User Input</h2>
                  <textarea
                    className="w-full h-20 p-3 bg-zinc-900 text-sm resize-none border-0 rounded-md focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-zinc-600"
                    placeholder="Enter your prompt here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="font-medium text-sm text-orange-400">AI Response</h2>
                  <textarea
                    className="w-full h-20 p-3 bg-zinc-900 text-sm resize-none border-0 rounded-md focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-zinc-600"
                    placeholder="Enter AI response to evaluate..."
                    value={aiResponse}
                    onChange={(e) => setAiResponse(e.target.value)}
                  />
                </div>
              </div>

              {userInput && aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="pt-4 border-t border-zinc-800">
                    <RealTimeEvaluator userInput={userInput} aiResponse={aiResponse} />
                  </div>
                </motion.div>
              )}
            </>
          )}

          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-sm text-orange-400">Live Chat Scanner</h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsScanning(!isScanning)}
                  className={`p-2 rounded-full transition-all duration-300 ${isScanning
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  title={isScanning ? 'Stop Scanning' : 'Start Scanning'}
                >
                  {isScanning ? (
                    <StopIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              <div className="space-y-3">
                <motion.div
                  className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
                  animate={{
                    borderColor: isScanning ? ['#f97316', '#fbbf24', '#f97316'] : '#27272a',
                  }}
                  transition={{
                    duration: 2,
                    repeat: isScanning ? Infinity : 0,
                    ease: "linear"
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      animate={{
                        backgroundColor: isScanning ? ['#f97316', '#fbbf24', '#f97316'] : '#52525b',
                        scale: isScanning ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: isScanning ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    />
                    <span className="text-sm text-zinc-400">Scanning for GPT conversations...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SignalIcon className={`w-4 h-4 ${isScanning ? 'text-orange-400' : 'text-zinc-600'}`} />
                    <p className="text-sm text-zinc-500">
                      {isScanning
                        ? 'Actively monitoring for new messages in your ChatGPT conversations'
                        : 'Click the play button to begin monitoring your ChatGPT conversations'}
                    </p>
                  </div>
                </motion.div>

                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <motion.div
                      className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-400">Last Evaluation</span>
                        <motion.span
                          className="text-xs text-zinc-500"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          2 minutes ago
                        </motion.span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <p className="text-sm text-zinc-400">Response accuracy: 92%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <p className="text-sm text-zinc-400">Relevance score: 88%</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-400">Current Session</span>
                        <motion.span
                          className="text-xs text-green-400"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Active
                        </motion.span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <p className="text-sm text-zinc-400">Messages evaluated: 12</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <p className="text-sm text-zinc-400">Average score: 90%</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && <HistoryComponent />}

          {activeTab === 'config' && (
            <Configurations onSave={handleSaveConfigs} initialConfigs={apiConfigs} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-orange-500"></div>
    </div>
  );
}