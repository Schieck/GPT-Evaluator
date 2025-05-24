import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BeakerIcon,
  BoltIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/16/solid';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import { useStore } from '../store/useStore';
import Configurations from '../components/Configurations';
import { TextArea } from '../components/atoms/TextArea';
import { ErrorBoundary } from '../components/ErrorBoundary';
import RealTimeEvaluator from '../components/RealTimeEvaluator';
import { Header } from '../components/Header';
import { TabGroup } from '../components/TabGroup';
import HistoryComponent from '../components/history/HistoryComponent';
import LiveScanner from '../components/LiveScanner';
import './App.css';

const tabs = [
  { id: 'live', label: 'Live', icon: <BoltIcon className="w-4 h-4" /> },
  { id: 'evaluator', label: 'Legacy', icon: <BeakerIcon className="w-4 h-4" /> },
  { id: 'history', label: 'History', icon: <ClockIcon className="w-4 h-4" /> }
] as const;

type TabId = typeof tabs[number]['id'];

export default function App() {
  const {
    userInput,
    aiResponse,
    apiConfigs,
    activeTab,
    setUserInput,
    setAiResponse,
    setActiveTab,
    initializeProviders,
    saveConfigs
  } = useStore();

  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);

  const { handleError } = useErrorHandler({
    context: 'App',
    category: ErrorCategory.UI,
    severity: ErrorSeverity.MEDIUM,
    onError: (error) => {
      console.error('App error:', error);
    }
  });

  const openInWindow = () => {
    try {
      chrome.windows.create({
        url: 'index.html',
        type: 'popup',
        width: 400,
        height: 650,
        focused: true
      });
    } catch (error) {
      handleError(error, 'openInWindow');
    }
  };

  useEffect(() => {
    initializeProviders().catch(error => {
      handleError(error, 'initializeProviders');
    });
  }, []);

  const handleResultsChange = (hasResults: boolean) => {
    setHasResults(hasResults);
    if (hasResults && !hasAutoCollapsed) {
      setIsInputCollapsed(true);
      setHasAutoCollapsed(true);
    } else if (!hasResults) {
      setHasAutoCollapsed(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'config') {
      return <Configurations onSave={saveConfigs} initialConfigs={apiConfigs} />;
    }

    if (activeTab === 'evaluator') {
      return (
        <>
          <AnimatePresence mode="wait">
            {(!isInputCollapsed || !hasResults) && (
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

    if (activeTab === 'live') {
      return <LiveScanner />;
    }

    if (activeTab === 'history') {
      return <HistoryComponent />;
    }

    return null;
  };

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('App error boundary caught:', error);
      }}
    >
      <div className="w-full h-full overflow-auto bg-black text-white popup-container">
        <div className="h-[3px] bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500"></div>

        <Header
          onOpenInWindow={openInWindow}
          onToggleConfig={() => setActiveTab(activeTab === 'config' ? 'evaluator' : 'config')}
          isConfigActive={activeTab === 'config'}
        />

        {activeTab !== 'config' && (
          <TabGroup
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId: TabId) => setActiveTab(tabId)}
          />
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
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-orange-500"></div>
      </div>
    </ErrorBoundary>
  );
}