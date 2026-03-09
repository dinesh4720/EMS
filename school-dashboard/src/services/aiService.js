import { clearStoredUser } from '../utils/authSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PREBUILT_PROMPTS = [
  {
    id: 'search_staff',
    label: 'Find Staff',
    icon: 'Staff',
    prompt: 'Who are the teachers in the Mathematics department?'
  },
  {
    id: 'create_student',
    label: 'Create Student',
    icon: 'Add',
    prompt: 'Create a new student named [Name] in class [Class]'
  },
  {
    id: 'send_form',
    label: 'Send Form',
    icon: 'Form',
    prompt: 'Send the [Form Name] form to [Staff/Student Name]'
  },
  {
    id: 'school_notice',
    label: 'Draft Notice',
    icon: 'Note',
    prompt: 'Draft a formal school notice regarding: '
  },
  {
    id: 'fee_reminder',
    label: 'Fee Reminder',
    icon: 'Fees',
    prompt: 'Draft a polite but firm WhatsApp message to parents reminding them about the pending Term 2 fees due next week.'
  },
  {
    id: 'lesson_plan',
    label: 'Lesson Plan',
    icon: 'Plan',
    prompt: 'Create a 45-minute lesson plan for Grade [X] on the topic of: '
  }
];

let modelsCache = [];
let defaultModelIdCache = null;
let pendingModelsRequest = null;

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredUser();
    }

    throw new Error(payload.error || payload.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

async function aiRequest(endpoint, options = {}) {
  const hasFormDataBody = options.body instanceof FormData;
  const headers = {
    ...(hasFormDataBody ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  return parseJsonResponse(response);
}

function updateModelCache(payload) {
  modelsCache = Array.isArray(payload.models) ? payload.models : [];
  defaultModelIdCache = payload.defaultModelId || modelsCache.find((model) => model.default)?.id || modelsCache.find((model) => model.available)?.id || null;
  return modelsCache;
}

export const aiService = {
  async getAvailableModels(forceRefresh = false) {
    if (!forceRefresh && modelsCache.length > 0) {
      return modelsCache;
    }

    if (!forceRefresh && pendingModelsRequest) {
      return pendingModelsRequest;
    }

    pendingModelsRequest = aiRequest('/ai/models')
      .then((payload) => updateModelCache(payload))
      .finally(() => {
        pendingModelsRequest = null;
      });

    return pendingModelsRequest;
  },

  getDefaultModelId() {
    return defaultModelIdCache || modelsCache.find((model) => model.default)?.id || modelsCache.find((model) => model.available)?.id || null;
  },

  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await aiRequest('/ai/transcribe', {
      method: 'POST',
      body: formData
    });

    return response.text || '';
  },

  async sendMessage(messages, onFunctionCall, selectedModel) {
    const response = await aiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        selectedModel
      })
    });

    const lastToolCall = Array.isArray(response.toolCalls) ? response.toolCalls[response.toolCalls.length - 1] : null;
    if (lastToolCall && onFunctionCall) {
      onFunctionCall(lastToolCall.name, lastToolCall.args || {});
    }

    return {
      content: response.content || "I couldn't generate a response.",
      functionCalled: response.functionCalled || lastToolCall?.name || null,
      functionResult: response.functionResult || lastToolCall?.result || null,
      toolCalls: response.toolCalls || []
    };
  },

  getPrebuiltPrompts() {
    return PREBUILT_PROMPTS;
  }
};
