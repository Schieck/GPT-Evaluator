import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface ApiConfig {
  type: 'openai' | 'claude';
  key: string;
}

interface ConfigurationsProps {
  onSave: (configs: ApiConfig[]) => void;
  initialConfigs?: ApiConfig[];
}

export default function Configurations({ onSave, initialConfigs = [] }: ConfigurationsProps) {
  const [configs, setConfigs] = useState<ApiConfig[]>(initialConfigs);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialConfigs.length === 0) {
      setConfigs([
        { type: 'openai', key: '' },
        { type: 'claude', key: '' }
      ]);
    }
  }, [initialConfigs]);

  const handleKeyChange = (index: number, key: string) => {
    const newConfigs = [...configs];
    newConfigs[index].key = key;
    setConfigs(newConfigs);
  };

  const handleSave = () => {
    onSave(configs);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-medium text-orange-400">API Configurations</h2>
        {!isEditing ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-orange-400 px-3 py-1.5 rounded-md transition-colors duration-200"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md transition-colors duration-200"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 py-1.5 rounded-md transition-all duration-300"
              onClick={handleSave}
            >
              Save
            </motion.button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {configs.map((config, index) => (
          <div
            key={config.type}
            className="p-4 border border-zinc-800 rounded-md bg-zinc-900/50 backdrop-blur-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium capitalize text-white">
                {config.type === 'openai' ? 'OpenAI' : 'Claude'} API
              </h3>
              {config.key && !isEditing && (
                <span className="text-xs bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                  Configured
                </span>
              )}
            </div>

            {isEditing ? (
              <input
                type="password"
                className="w-full p-3 text-sm border border-zinc-700 rounded-md bg-black text-white focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-zinc-600"
                placeholder={`Enter ${config.type === 'openai' ? 'OpenAI' : 'Claude'} API key`}
                value={config.key}
                onChange={(e) => handleKeyChange(index, e.target.value)}
              />
            ) : (
              <div className="text-xs text-zinc-400 font-mono">
                {config.key ?
                  `${config.key.substring(0, 3)}${'*'.repeat(10)}${config.key.substring(config.key.length - 3)}` :
                  'No API key configured'
                }
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-zinc-500 mt-2 italic">
        Your API keys are stored locally in your browser and are never sent to our servers.
      </div>
    </div>
  );
} 