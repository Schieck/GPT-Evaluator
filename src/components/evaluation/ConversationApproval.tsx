import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { FoundConversation } from '../../store/useStore';

interface ConversationApprovalProps {
    conversation: FoundConversation;
    onApprove: () => void;
    onReject: () => void;
}

export const ConversationApproval = ({ conversation, onApprove, onReject }: ConversationApprovalProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-orange-400 line-clamp-1">{conversation.userPrompt}</h3>
                    <span className="text-xs text-zinc-500">
                        {new Date(conversation.timestamp).toLocaleTimeString()}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500">AI Response</label>
                        <p className="text-sm text-zinc-300 line-clamp-2">{conversation.aiResponse}</p>
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReject}
                        className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onApprove}
                        className="p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                    >
                        <CheckIcon className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}; 