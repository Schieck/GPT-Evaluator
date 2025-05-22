import { useState } from 'react';
import { AIProviderType } from '../services/types';

const initialFeedbackState: Record<AIProviderType, string> = {
  [AIProviderType.OPENAI]: '',
  [AIProviderType.CLAUDE]: ''
};

const initialEditingState: Record<AIProviderType, boolean> = {
  [AIProviderType.OPENAI]: false,
  [AIProviderType.CLAUDE]: false
};

export function useFeedback() {
  const [userFeedback, setUserFeedback] = useState<Record<AIProviderType, string>>(initialFeedbackState);
  const [isEditingFeedback, setIsEditingFeedback] = useState<Record<AIProviderType, boolean>>(initialEditingState);

  const handleFeedbackSubmit = (provider: AIProviderType) => {
    setIsEditingFeedback(prev => ({ ...prev, [provider]: false }));
  };

  const handleFeedbackEdit = (provider: AIProviderType) => {
    setIsEditingFeedback(prev => ({ ...prev, [provider]: true }));
  };

  const handleFeedbackChange = (provider: AIProviderType, value: string) => {
    setUserFeedback(prev => ({ ...prev, [provider]: value }));
  };

  const resetFeedback = () => {
    setUserFeedback(initialFeedbackState);
    setIsEditingFeedback(initialEditingState);
  };

  return {
    userFeedback,
    isEditingFeedback,
    handleFeedbackSubmit,
    handleFeedbackEdit,
    handleFeedbackChange,
    resetFeedback
  };
} 