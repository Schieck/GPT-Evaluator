// Why: This script monitors ChatGPT conversations
//      and sends them to the background script for processing
console.log('[GPT Evaluator Monitor] Content script starting initialization');

if (window.location.hostname !== 'chatgpt.com') {
  console.debug('[GPT Monitor] Not on ChatGPT, skipping initialization');
  throw new Error('Not on ChatGPT');
}

interface ChatMessage {
  type: 'new' | 'processed';
  role?: 'user' | 'assistant';
  content?: string;
  messageId?: string;
  userMessage?: string;
  assistantMessage?: string;
}

interface ControlMessage {
  type: 'START_SCANNING' | 'STOP_SCANNING';
}

type Message = ChatMessage | ControlMessage;

interface MessageResponse {
  success: boolean;
  error?: string;
}

let isMonitoring = false;
let lastMessageId: string | null = null;
let lastProcessedUserMessage: string = '';
let lastProcessedAssistantMessage: string = '';

const logDebug = (message: string, data?: any) => {
  if (data) {
    console.debug(`[GPT Monitor] ${message}`, data);
  } else {
    console.debug(`[GPT Monitor] ${message}`);
  }
};

const sendMessageToBackground = (message: any): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response as MessageResponse);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Why: Complex message extraction logic that handles both user and assistant messages, including streaming state
const getLatestMessage = (): ChatMessage | null => {
  const messages = document.querySelectorAll('[data-message-author-role]');
  
  if (!messages.length) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  const role = lastMessage.getAttribute('data-message-author-role') as 'user' | 'assistant' | null;
  const messageId = lastMessage.getAttribute('data-message-id');
  
  if (!role || !messageId) {
    return null;
  }

  if (messageId === lastMessageId && lastProcessedUserMessage && lastProcessedAssistantMessage) {
    return {
      type: 'processed',
      userMessage: lastProcessedUserMessage,
      assistantMessage: lastProcessedAssistantMessage
    };
  }
  
  let content = '';
  let userMessage = '';
  
  if (role === 'user') {
    const contentElement = lastMessage.querySelector('.whitespace-pre-wrap');
    content = contentElement?.textContent || '';
  } else if (role === 'assistant') {
    if (lastMessage.querySelector('.streaming-animation') !== null) {
      return null;
    }
    
    const contentElement = lastMessage.querySelector('.markdown');
    content = contentElement?.textContent || '';

    const userMessages = Array.from(messages).filter(msg => 
      msg.getAttribute('data-message-author-role') === 'user'
    );
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      const userContentElement = lastUserMessage.querySelector('.whitespace-pre-wrap');
      userMessage = userContentElement?.textContent || '';
    }
  }

  if (!content) {
    return null;
  }

  if (role === 'assistant' && userMessage) {
    lastProcessedUserMessage = userMessage;
    lastProcessedAssistantMessage = content;
  }

  return { 
    type: 'new',
    role,
    content,
    messageId,
    userMessage: userMessage || undefined
  };
};

// Why: Retry logic for finding chat container with fallback mechanism
const startMonitoring = () => {
  if (isMonitoring) {
    return;
  }
  
  isMonitoring = true;
  const maxAttempts = 5;
  let attempts = 0;

  const tryFindContainer = () => {
    attempts++;
    const conversationTurns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
    const latestTurn = conversationTurns[conversationTurns.length - 1];
    const chatContainer = latestTurn?.parentElement;
    
    if (!chatContainer) {
      if (attempts < maxAttempts) {
        setTimeout(tryFindContainer, 2000);
        return;
      }
      
      console.warn('[GPT Monitor] Chat container not found after all attempts');
      const fallbackContainer = document.querySelector('[data-testid^="conversation-turn-"]')?.parentElement;
      if (fallbackContainer) {
        startObserving(fallbackContainer);
      }
      return;
    }

    startObserving(chatContainer);
  };

  tryFindContainer();
};

const startObserving = (container: Element) => {
  const observer = new MutationObserver(() => {
    if (!isMonitoring) return;

    const message = getLatestMessage();
    if (!message) return;

    if (message.type === 'processed') {
      sendMessageToBackground({
        type: 'NEW_MESSAGE',
        data: {
          userMessage: message.userMessage,
          assistantMessage: message.assistantMessage
        }
      }).catch(error => {
        console.error('[GPT Monitor] Failed to send processed message:', error);
      });
      return;
    }

    if (message.messageId === lastMessageId) {
      return;
    }

    lastMessageId = message.messageId || null;

    sendMessageToBackground({
      type: 'NEW_MESSAGE',
      data: {
        role: message.role,
        content: message.content,
        userMessage: message.userMessage,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      console.error('[GPT Monitor] Failed to send new message:', error);
    });
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true
  });
};

const stopMonitoring = () => {
  isMonitoring = false;
  lastMessageId = null;
};

const initialize = () => {
  sendMessageToBackground({ type: 'CONTENT_SCRIPT_READY' })
    .catch(error => {
      console.error('[GPT Monitor] Failed to send ready notification:', error);
    });
};

chrome.runtime.onMessage.addListener((message: Message, _, sendResponse) => {
  try {
    if (message.type === 'START_SCANNING') {
      startMonitoring();
      sendResponse({ success: true });
    } else if (message.type === 'STOP_SCANNING') {
      stopMonitoring();
      sendResponse({ success: true });
    }
  } catch (error: any) {
    console.error('[GPT Monitor] Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

logDebug('Content script initialization complete'); 