import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RealTimeEvaluator from '../components/RealTimeEvaluator';
import Configurations from '../components/Configurations';
import type { ApiConfig } from '../components/Configurations';
import { saveApiConfigs, loadApiConfigs } from '../utils/storage';
import HistorySkeleton from '../components/history/HistorySkeleton';
import { BoltIcon, ClockIcon } from '@heroicons/react/16/solid';

type TabType = 'evaluator' | 'history' | 'config';

export default function App() {
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('evaluator');
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);

  useEffect(() => {
    setApiConfigs(loadApiConfigs());
  }, []);

  const handleSaveConfigs = (configs: ApiConfig[]) => {
    setApiConfigs(configs);
    saveApiConfigs(configs);
  };

  return (
    <div className="w-[360px] max-h-[600px] overflow-auto bg-black text-white">
      <div className="h-[3px] bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500"></div>

      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div> <div className='flex items-center gap-2'>
          <img src='/favicon/favicon-96x96.png' className='w-10 h-10 rounded-full'></img>
          <h1 className="text-lg font-bold text-white">Evaluator</h1>
        </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={`p-2 rounded-full ${activeTab === 'config' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
          onClick={() => setActiveTab(activeTab === 'config' ? 'evaluator' : 'config')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </header>

      {activeTab !== 'config' && (
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('evaluator')}
            className={`relative flex-1 py-3 text-sm font-medium transition-all duration-300 ${activeTab === 'evaluator' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              <BoltIcon className='w-4 h-4' />
              On live
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
            onClick={() => setActiveTab('history')}
            className={`relative flex-1 py-3 text-sm font-medium transition-all duration-300 ${activeTab === 'history' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
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

          {activeTab === 'history' && <HistorySkeleton />}

          {activeTab === 'config' && (
            <Configurations onSave={handleSaveConfigs} initialConfigs={apiConfigs} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-orange-500"></div>
    </div>
  );
}