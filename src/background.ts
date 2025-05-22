// Why: Manages communication between content script and popup,
//      handles message processing and API calls
interface Conversation {
  userPrompt: string;
  aiResponse: string;
  timestamp: string;
}

interface MessageResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface ApiRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
}

let isScanning = false;
let contentScriptReady = false;
let currentConversation: Conversation | null = null;

console.log('[Background] Background script loaded');

const sendMessageToContentScript = async (message: any, maxRetries = 3): Promise<MessageResponse> => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const response = await new Promise<MessageResponse>((resolve, reject) => {
        chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(response as MessageResponse);
        });
      });

      return response;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Failed to send message after all retries');
};

const handleApiCall = async (request: ApiRequest, sendResponse: (response: MessageResponse) => void) => {
  const requestHeaders = {
    ...request.headers,
    ...(request.url.includes('api.anthropic.com') && {
      'anthropic-dangerous-direct-browser-access': 'true'
    })
  };

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: requestHeaders,
      body: JSON.stringify(request.body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    sendResponse({ success: true, data });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
};

const handleNewMessage = (request: any, sendResponse: (response: MessageResponse) => void) => {
  if (!isScanning) {
    sendResponse({ success: false, error: 'Not scanning' });
    return;
  }

  const { assistantMessage, userMessage, timestamp } = request.data;

  currentConversation = {
    userPrompt: userMessage,
    aiResponse: assistantMessage,
    timestamp: timestamp || new Date().toISOString()
  };

  if (currentConversation.userPrompt?.length > 0 && currentConversation.aiResponse?.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CONVERSATION_READY',
      data: {
        conversation: currentConversation
      }
    }).catch(error => {
      console.error('[Background] Failed to forward conversation to popup:', error);
    });
  }

  sendResponse({ success: true });
};

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  switch (request.type) {
    case 'CONTENT_SCRIPT_READY':
      contentScriptReady = true;
      sendResponse({ success: true });
      break;

    case 'API_CALL':
      handleApiCall(request, sendResponse);
      break;

    case 'START_SCANNING':
      isScanning = true;
      sendMessageToContentScript({ type: 'START_SCANNING' })
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'STOP_SCANNING':
      isScanning = false;
      sendMessageToContentScript({ type: 'STOP_SCANNING' })
        .then(() => {
          currentConversation = null;
          sendResponse({ success: true });
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'NEW_MESSAGE':
      handleNewMessage(request, sendResponse);
      break;
  }

  return true;
}); 