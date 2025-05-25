import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/16/solid';
import { useStore } from '../store/useStore';
import type { ProviderInstance } from '../services';
import {
    getAllProviderTemplates,
    ProviderInstanceConfigService
} from '../services';

/**
 * Component for managing provider instances
 * Demonstrates the UI integration of the multi-instance provider system
 */
export function ProviderInstanceManager() {
    const {
        providerInstances,
        addProviderInstance,
        removeProviderInstance,
        updateProviderInstance,
        getProviderInstances
    } = useStore();

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

    const templates = getAllProviderTemplates();
    const configService = ProviderInstanceConfigService.getInstance();

    useEffect(() => {
        const instances = getProviderInstances();
        if (instances.length === 0) {
            setIsAddingNew(true);
        }
    }, []);

    const handleAddNew = () => {
        if (!selectedTemplate) return;

        const newInstance = configService.createDefaultInstance(selectedTemplate);
        addProviderInstance(newInstance);
        setIsAddingNew(false);
        setSelectedTemplate('');
    };

    const handleDelete = (instanceId: string) => {
        if (confirm('Are you sure you want to delete this provider instance?')) {
            removeProviderInstance(instanceId);
        }
    };

    const handleToggleEnabled = (instanceId: string, enabled: boolean) => {
        updateProviderInstance(instanceId, { enabled });
    };

    const handleUpdateConfig = (instanceId: string, config: Partial<ProviderInstance['config']>) => {
        const instance = providerInstances.find(inst => inst.id === instanceId);
        if (!instance) return;

        updateProviderInstance(instanceId, {
            config: {
                ...instance.config,
                ...config
            }
        });
    };

    const renderInstanceCard = (instance: ProviderInstance) => {
        const template = templates.find(t => t.type === instance.type);
        const isEditing = editingId === instance.id;

        return (
            <motion.div
                key={instance.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 bg-zinc-800 rounded-lg border border-zinc-700"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-white">{instance.name}</h3>

                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setEditingId(isEditing ? null : instance.id)}
                            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => handleDelete(instance.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={instance.enabled}
                                onChange={(e) => handleToggleEnabled(instance.id, e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>
                </div>

                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-3 overflow-hidden"
                        >
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Instance Name
                                </label>
                                <input
                                    type="text"
                                    value={instance.name}
                                    onChange={(e) => updateProviderInstance(instance.id, { name: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={instance.config.apiKey}
                                    onChange={(e) => handleUpdateConfig(instance.id, { apiKey: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                                    placeholder="Enter your API key"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Model
                                </label>
                                <select
                                    value={instance.config.model}
                                    onChange={(e) => handleUpdateConfig(instance.id, { model: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                                >
                                    {template?.models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                                        Temperature
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={instance.config.temperature || 0.3}
                                        onChange={(e) => handleUpdateConfig(instance.id, { temperature: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                                        Max Tokens
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="4000"
                                        value={instance.config.maxTokens || 1000}
                                        onChange={(e) => handleUpdateConfig(instance.id, { maxTokens: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                                    />
                                </div>
                            </div>

                            {instance.type === 'openai-compatible' && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                                        Custom Endpoint
                                    </label>
                                    <input
                                        type="url"
                                        value={instance.config.endpoint || ''}
                                        onChange={(e) => handleUpdateConfig(instance.id, { endpoint: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                                        placeholder="https://api.example.com/v1/chat/completions"
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Provider Instances</h2>
                <button
                    onClick={() => setIsAddingNew(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Instance</span>
                </button>
            </div>

            <AnimatePresence>
                {isAddingNew && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-zinc-800 rounded-lg border border-zinc-700"
                    >
                        <h3 className="text-lg font-medium text-white mb-3">Add New Provider Instance</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Provider Type
                                </label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                                >
                                    <option value="">Select a provider...</option>
                                    {templates.map(template => (
                                        <option key={template.type} value={template.type}>
                                            {template.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setIsAddingNew(false);
                                        setSelectedTemplate('');
                                    }}
                                    className="px-3 py-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddNew}
                                    disabled={!selectedTemplate}
                                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 text-white rounded-md transition-colors"
                                >
                                    Create Instance
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                <AnimatePresence>
                    {providerInstances.map(instance => renderInstanceCard(instance))}
                </AnimatePresence>

                {providerInstances.length === 0 && !isAddingNew && (
                    <div className="text-center py-8 text-zinc-400">
                        <p>No provider instances configured.</p>
                        <p className="text-sm mt-1">Click "Add Instance" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 