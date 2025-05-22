import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIProviderType } from '../services/types';
import type { ProviderConfig } from '../services/types';
import { useStore } from '../store/useStore';

interface ConfigurationsProps {
  onSave: (configs: ProviderConfig[]) => void;
  initialConfigs?: ProviderConfig[];
}

export default function Configurations({ onSave, initialConfigs = [] }: ConfigurationsProps) {
  const [configs, setConfigs] = useState<ProviderConfig[]>(initialConfigs);
  const [showSuccess, setShowSuccess] = useState(false);
  const { apiConfigs, saveConfigs } = useStore();

  useEffect(() => {
    if (initialConfigs.length === 0) {
      if (apiConfigs.length > 0) {
        setConfigs(apiConfigs);
      } else {
        const defaultConfigs: ProviderConfig[] = [
          { type: AIProviderType.OPENAI, apiKey: '', enabled: true, modelVersion: 'gpt-4-turbo-preview' },
          { type: AIProviderType.CLAUDE, apiKey: '', enabled: true, modelVersion: 'claude-3-opus-20240229' }
        ];
        setConfigs(defaultConfigs);
      }
    }
  }, [initialConfigs, apiConfigs]);

  const handleConfigChange = async (index: number, field: keyof ProviderConfig, value: string | boolean) => {
    const newConfigs = [...configs];
    newConfigs[index] = {
      ...newConfigs[index],
      [field]: value
    };
    setConfigs(newConfigs);

    await saveConfigs(newConfigs);
    onSave(newConfigs);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };


  return (
    <div className="space-y-4">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 bg-green-800 text-white px-4 py-2 rounded-md shadow-lg"
          >
            Saved successfully
          </motion.div>
        )}
      </AnimatePresence>
      {configs.map((config, index) => (
        <div key={config.type} className="p-4 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              {config.type === AIProviderType.OPENAI ? 'OpenAI' : 'Claude'}
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleConfigChange(index, 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => handleConfigChange(index, 'apiKey', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your API key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Model Version</label>
              <input
                type="text"
                value={config.modelVersion || ''}
                onChange={(e) => handleConfigChange(index, 'modelVersion', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., gpt-4, claude-3"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 