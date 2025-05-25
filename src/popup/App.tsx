import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BeakerIcon,
  BoltIcon,
  ClockIcon,
} from '@heroicons/react/16/solid';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorCategory, ErrorSeverity } from '../services/ErrorHandlingService';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Header } from '../components/Header';
import { TabGroup } from '../components/TabGroup';
import HistoryComponent from '../components/history/HistoryComponent';
import LiveScanner from '../components/LiveScanner';
import EvaluatorComponent from '../components/EvaluatorComponent';
import './App.css';
import { ProviderInstanceManager } from '../components/ProviderInstanceManager';

const tabs = [
  { id: 'live', label: 'Live', icon: <BoltIcon className="w-4 h-4" /> },
  { id: 'evaluator', label: 'Evaluator', icon: <BeakerIcon className="w-4 h-4" /> },
  { id: 'history', label: 'History', icon: <ClockIcon className="w-4 h-4" /> }
] as const;

type TabId = typeof tabs[number]['id'];

export default function App() {
  const {
    activeTab,
    setActiveTab,
    initializeProviders
  } = useStore();

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
        width: 320,
        height: 800,
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

  const renderContent = () => {
    if (activeTab === 'config') {
      return <ProviderInstanceManager />;
    }

    if (activeTab === 'evaluator') {
      return <EvaluatorComponent />;
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
      <div className="w-full h-full max-h-[600px] overflow-y-auto bg-black text-white popup-container">
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
            className="p-4 pb-8"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-orange-500"></div>
      </div>
    </ErrorBoundary>
  );
}