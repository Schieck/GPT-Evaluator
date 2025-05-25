import type { ValidatorConfig } from './types/messages';

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

interface RegisteredValidator {
  name: string;
  config: ValidatorConfig;
  tabId?: number;
}

let isScanning = false;
let currentConversation: Conversation | null = null;
let registeredValidators = new Map<string, RegisteredValidator>();

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

  const data = request.payload || request.data || {};
  const { assistantMessage, userMessage, timestamp, location } = data;

  if (!userMessage || !assistantMessage) {
    sendResponse({ success: false, error: 'Incomplete conversation data' });
    return;
  }

  currentConversation = {
    userPrompt: userMessage,
    aiResponse: assistantMessage,
    timestamp: timestamp || new Date().toISOString(),
    location: location
  };

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
    sendResponse({ success: true });
  }).catch(error => {
    console.error('[Background] Failed to forward conversation to popup:', error);
    sendResponse({ success: false, error: error.message });
  });
};

const handleValidatorRegistration = (request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
  const { validatorName, payload } = request;

  if (!validatorName || !payload?.config) {
    sendResponse({ success: false, error: 'Invalid validator registration data' });
    return;
  }

  const validator: RegisteredValidator = {
    name: validatorName,
    config: payload.config,
    tabId: sender.tab?.id
  };

  registeredValidators.set(validatorName, validator);
  console.log(`[Background] ✅ Registered validator: ${validatorName}`);

  sendResponse({ success: true });
};

const handleValidatorUnregistration = (request: any, sendResponse: (response: MessageResponse) => void) => {
  const { validatorName } = request;

  if (!validatorName) {
    sendResponse({ success: false, error: 'Validator name required' });
    return;
  }

  const removed = registeredValidators.delete(validatorName);
  if (removed) {
    console.log(`[Background] ❌ Unregistered validator: ${validatorName}`);
  }

  sendResponse({ success: true, data: { removed } });
};

const handleValidateRequest = (request: any, sendResponse: (response: MessageResponse) => void) => {
  const { validatorName, payload } = request;

  if (!validatorName || !payload) {
    sendResponse({ success: false, error: 'Invalid validation request' });
    return;
  }

  sendMessageToContentScript({
    type: 'VALIDATE_REQUEST',
    validatorName,
    payload
  }).then((response) => {
    sendResponse(response);
  }).catch(error => {
    sendResponse({ success: false, error: error.message });
  });
};

const handleValidateResponse = (request: any, sendResponse: (response: MessageResponse) => void) => {
  const { validatorName, payload } = request;

  console.log(`[Background] Validation response from ${validatorName}:`, payload);

  chrome.runtime.sendMessage({
    type: 'VALIDATOR_RESULT',
    validatorName,
    payload
  }).catch(error => {
    console.error('[Background] Failed to forward validation result:', error);
  });

  sendResponse({ success: true });
};

const handleValidatorError = (request: any, sendResponse: (response: MessageResponse) => void) => {
  const { validatorName, payload } = request;

  console.error(`[Background] Validator error from ${validatorName}:`, payload);

  chrome.runtime.sendMessage({
    type: 'VALIDATOR_ERROR_NOTIFICATION',
    validatorName,
    payload
  }).catch(error => {
    console.error('[Background] Failed to forward validator error:', error);
  });

  sendResponse({ success: true });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.validatorName) {
    switch (request.type) {
      case 'NEW_MESSAGE':
        handleNewMessage(request, sendResponse);
        return true;

      case 'CONTENT_SCRIPT_READY':
        console.log(`[Background] Validator ${request.validatorName} ready`);
        sendResponse({ success: true });
        return true;

      case 'UPDATE_TOOLTIP_POSITION':
        if (request.payload?.location) {
          sendMessageToContentScript({
            type: 'UPDATE_TOOLTIP_POSITION',
            data: { location: request.payload.location }
          }).then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        } else {
          sendResponse({ success: false, error: 'No location provided' });
        }
        return true;
    }
  }

  switch (request.type) {
    case 'VALIDATOR_REGISTER':
      handleValidatorRegistration(request, sender, sendResponse);
      break;

    case 'VALIDATOR_UNREGISTER':
      handleValidatorUnregistration(request, sendResponse);
      break;

    case 'VALIDATE_REQUEST':
      handleValidateRequest(request, sendResponse);
      break;

    case 'VALIDATE_RESPONSE':
      handleValidateResponse(request, sendResponse);
      break;

    case 'VALIDATOR_ERROR':
      handleValidatorError(request, sendResponse);
      break;

    case 'SHOW_VALIDATOR_TOOLTIP':
      sendMessageToContentScript({
        type: 'SHOW_VALIDATOR_TOOLTIP',
        data: request.data
      }).then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'UPDATE_VALIDATOR_TOOLTIP':
      sendMessageToContentScript({
        type: 'UPDATE_VALIDATOR_TOOLTIP',
        data: request.data
      }).then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'HIDE_VALIDATOR_TOOLTIP':
      sendMessageToContentScript({
        type: 'HIDE_VALIDATOR_TOOLTIP',
        data: request.data
      }).then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'API_CALL':
      handleApiCall(request, sendResponse);
      break;

    case 'GET_SCANNING_STATUS':
      sendResponse({ success: true, isScanning });
      break;

    case 'START_SCANNING':
      isScanning = true;
      sendMessageToContentScript({
        type: 'START_SCANNING',
        validatorName: 'chatgpt-monitor'
      })
        .then(() => {
          chrome.runtime.sendMessage({
            type: 'SCANNING_STATE_CHANGED',
            isScanning: true
          }).catch((e) => {
            console.error(e)
          });
          sendResponse({ success: true });
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'STOP_SCANNING':
      isScanning = false;
      currentConversation = null;
      sendMessageToContentScript({
        type: 'STOP_SCANNING',
        validatorName: 'chatgpt-monitor'
      })
        .then(() => {
          chrome.runtime.sendMessage({
            type: 'SCANNING_STATE_CHANGED',
            isScanning: false
          }).catch((e) => {
            console.error(e)
          });
          sendResponse({ success: true });
        })
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'APPROVE_EVALUATION':
      if (currentConversation) {
        sendMessageToContentScript({
          type: 'UPDATE_EVALUATION_TOOLTIP',
          data: {
            position: currentConversation.location || { x: 0, y: 0 },
            status: 'evaluating'
          }
        });

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
      sendMessageToContentScript({
        type: 'HIDE_EVALUATION_TOOLTIP'
      }).then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'EVALUATION_COMPLETE':
      if (request.data?.metrics) {
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