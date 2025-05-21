import type { ApiConfig } from '../components/Configurations';

const API_CONFIG_KEY = 'gpt-evaluator-api-configs';

export const saveApiConfigs = (configs: ApiConfig[]): void => {
  try {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error('Failed to save API configurations:', error);
  }
};

export const loadApiConfigs = (): ApiConfig[] => {
  try {
    const configs = localStorage.getItem(API_CONFIG_KEY);
    if (configs) {
      return JSON.parse(configs) as ApiConfig[];
    }
  } catch (error) {
    console.error('Failed to load API configurations:', error);
  }

  return [
    { type: 'openai', key: '' },
    { type: 'claude', key: '' }
  ];
};

export const getApiKey = (type: 'openai' | 'claude'): string => {
  const configs = loadApiConfigs();
  const config = configs.find(c => c.type === type);
  return config?.key || '';
}; 