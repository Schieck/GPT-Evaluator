// Why: Manages communication between content script and popup,
//      handles message processing and API calls
interface Conversation {
  userPrompt: string;
  aiResponse: string;
  timestamp: string;
  location?: { x: number; y: number };
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

  const { assistantMessage, userMessage, timestamp, location } = request.data;

  currentConversation = {
    userPrompt: userMessage,
    aiResponse: assistantMessage,
    timestamp: timestamp || new Date().toISOString(),
    location: location
  };

  if (currentConversation.userPrompt?.length > 0 && currentConversation.aiResponse?.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CONVERSATION_READY',
      data: {
        conversation: currentConversation,
        location
      }
    }).then(() => {
      if (location) {
        sendMessageToContentScript({
          type: 'SHOW_EVALUATION_TOOLTIP',
          data: {
            position: location,
            status: 'pending'
          }
        });
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
      sendResponse({ success: true });
      break;

    case 'API_CALL':
      handleApiCall(request, sendResponse);
      break;

    case 'GET_SCANNING_STATUS':
      sendResponse({ success: true, isScanning });
      break;

    case 'UPDATE_TOOLTIP_POSITION':
      if (request.data?.location) {
        sendMessageToContentScript({
          type: 'UPDATE_TOOLTIP_POSITION',
          data: { location: request.data.location }
        }).then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      } else {
        sendResponse({ success: false, error: 'No location provided' });
      }
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

    case 'APPROVE_EVALUATION':
      if (currentConversation) {
        // Update tooltip to show evaluating state
        sendMessageToContentScript({
          type: 'UPDATE_EVALUATION_TOOLTIP',
          data: {
            position: currentConversation.location || { x: 0, y: 0 },
            status: 'evaluating'
          }
        });

        // Forward the conversation to the popup for evaluation
        chrome.runtime.sendMessage({
          type: 'CONVERSATION_APPROVED',
          data: {
            conversation: currentConversation
          }
        }).then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          console.error('[Background] Failed to forward approved conversation:', error);
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'No conversation to approve' });
      }
      break;

    case 'REJECT_EVALUATION':
      currentConversation = null;
      // Hide the tooltip
      sendMessageToContentScript({
        type: 'HIDE_EVALUATION_TOOLTIP'
      }).then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'EVALUATION_COMPLETE':
      if (request.data?.metrics) {
        // Update tooltip with evaluation results
        sendMessageToContentScript({
          type: 'UPDATE_EVALUATION_TOOLTIP',
          data: {
            position: request.data.location || { x: 0, y: 0 },
            status: 'evaluated',
            metrics: request.data.metrics
          }
        }).then(() => {
          sendResponse({ success: true });
        }).catch(error => sendResponse({ success: false, error: error.message }));
      } else {
        sendResponse({ success: false, error: 'No metrics provided' });
      }
      break;
  }

  return true;
}); 