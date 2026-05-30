import toast from 'react-hot-toast';
import logger from './logger';

/**
 * Error types for timetable management
 */
export const ErrorTypes = {
  CONFLICT: 'ConflictError',
  VALIDATION: 'ValidationError',
  SYNC: 'SynchronizationError',
  NOT_FOUND: 'NotFoundError',
  AUTHORIZATION: 'AuthorizationError',
  NETWORK: 'NetworkError',
  TIMEOUT: 'TimeoutError',
  UNKNOWN: 'UnknownError'
};

/**
 * Check whether an error carries a specific message from the server
 * (as opposed to a generic client-side / network fallback).
 */
export function hasSpecificServerMessage(error) {
  if (!error?.message) return false;
  if (error.name === 'AbortError') return false;
  if (error.message === 'Request failed') return false;
  if (error.message.startsWith('Request failed with status')) return false;
  if (error.message.includes('Failed to fetch')) return false;
  if (error.message.includes('Load failed')) return false;
  if (error.message.includes('timed out')) return false;
  return true;
}

/**
 * Parse error object and extract meaningful information
 */
export function parseError(error) {
  if (!error) {
    return {
      type: ErrorTypes.UNKNOWN,
      message: 'Something went wrong. Refresh the page or try again later.',
      details: null
    };
  }

  // If error is already structured
  if (error.type) {
    return {
      type: error.type,
      message: error.message || 'Something went wrong. Refresh the page or try again later.',
      details: error.details || null,
      status: error.status || null
    };
  }

  // Network errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      type: ErrorTypes.TIMEOUT,
      message: 'Request timed out. Please try again in a moment.',
      details: null
    };
  }

  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    return {
      type: ErrorTypes.NETWORK,
      message: 'Network error. Please check your connection and try again.',
      details: null
    };
  }

  // HTTP status-based errors — prefer the server's message when available
  if (error.status === 401 || error.status === 403) {
    return {
      type: ErrorTypes.AUTHORIZATION,
      message: error.message || "You don't have permission to do this. Contact your administrator if you need access.",
      details: error.details || null,
      status: error.status
    };
  }

  if (error.status === 404) {
    return {
      type: ErrorTypes.NOT_FOUND,
      message: error.message || 'The requested resource was not found. Check the link or refresh the page.',
      details: error.details || null,
      status: error.status
    };
  }

  if (error.status === 409 || error.status === 422) {
    return {
      type: ErrorTypes.CONFLICT,
      message: error.message || 'A scheduling conflict was detected. Choose a different time or teacher.',
      details: error.details || null,
      status: error.status
    };
  }

  if (error.status === 400) {
    return {
      type: ErrorTypes.VALIDATION,
      message: error.message || 'Invalid input. Check the highlighted fields and try again.',
      details: error.details || null,
      status: error.status
    };
  }

  // Default case
  return {
    type: ErrorTypes.UNKNOWN,
    message: error.message || 'Something went wrong. Refresh the page or try again later.',
    details: error.details || null,
    status: error.status || null
  };
}

/**
 * Display error toast with appropriate styling
 */
export function showErrorToast(error, customMessage = null) {
  const parsedError = parseError(error);
  // Prefer server-specific error message over generic custom message.
  // Fall back to customMessage only when error has no meaningful server message.
  const message = hasSpecificServerMessage(error)
    ? parsedError.message
    : (customMessage || parsedError.message);

  const toastOptions = {
    duration: 5000,
    icon: '❌',
  };

  // Customize based on error type
  switch (parsedError.type) {
    case ErrorTypes.CONFLICT:
      toastOptions.icon = '⚠️';
      toastOptions.duration = 7000; // Longer for conflicts
      break;
    case ErrorTypes.VALIDATION:
      toastOptions.icon = '⚠️';
      break;
    case ErrorTypes.AUTHORIZATION:
      toastOptions.icon = '🔒';
      break;
    case ErrorTypes.NETWORK:
    case ErrorTypes.TIMEOUT:
      toastOptions.icon = '🌐';
      toastOptions.duration = 6000;
      break;
    default:
      break;
  }

  toast.error(message, toastOptions);
  
  // Log detailed error for debugging
  logger.error('Error:', parsedError);
  
  return parsedError;
}

/**
 * Display success toast
 */
export function showSuccessToast(message, options = {}) {
  toast.success(message, {
    duration: 3000,
    icon: '✅',
    ...options
  });
}

/**
 * Display info toast
 */
export function showInfoToast(message, options = {}) {
  toast(message, {
    duration: 4000,
    icon: 'ℹ️',
    ...options
  });
}

/**
 * Display warning toast
 */
export function showWarningToast(message, options = {}) {
  toast(message, {
    duration: 5000,
    icon: '⚠️',
    ...options
  });
}

/**
 * Display loading toast
 */
export function showLoadingToast(message) {
  return toast.loading(message);
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId) {
  toast.dismiss(toastId);
}

/**
 * Update an existing toast
 */
export function updateToast(toastId, message, type = 'success') {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else if (type === 'error') {
    toast.error(message, { id: toastId });
  } else {
    toast(message, { id: toastId });
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      const parsedError = parseError(error);
      if (
        parsedError.type === ErrorTypes.AUTHORIZATION ||
        parsedError.type === ErrorTypes.VALIDATION ||
        parsedError.type === ErrorTypes.NOT_FOUND ||
        parsedError.type === ErrorTypes.CONFLICT
      ) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    }
  }
  
  throw lastError;
}

/**
 * Execute operation with loading toast and error handling
 */
export async function executeWithFeedback(
  operation,
  {
    loadingMessage = 'Processing…',
    successMessage = 'Operation completed',
    errorMessage = null,
    onSuccess = null,
    onError = null,
    retries = 0
  } = {}
) {
  const toastId = showLoadingToast(loadingMessage);
  
  try {
    const operationFn = retries > 0 
      ? () => retryWithBackoff(operation, retries)
      : operation;
    
    const result = await operationFn();
    
    updateToast(toastId, successMessage, 'success');
    
    if (onSuccess) {
      onSuccess(result);
    }
    
    return { success: true, data: result };
  } catch (error) {
    const parsedError = parseError(error);
    // Prefer server-specific error message over generic errorMessage fallback
    const message = hasSpecificServerMessage(error)
      ? parsedError.message
      : (errorMessage || parsedError.message);

    updateToast(toastId, message, 'error');
    
    if (onError) {
      onError(parsedError);
    }
    
    return { success: false, error: parsedError };
  }
}

/**
 * Format conflict error details for display
 */
export function formatConflictDetails(conflict) {
  if (!conflict || !conflict.details) {
    return conflict?.message || 'A scheduling conflict was detected.';
  }

  const details = conflict.details;

  if (details.teacherName && details.conflictingClass) {
    return `${details.teacherName} is already assigned to ${details.conflictingClass} at this time.`;
  }

  if (details.message) {
    return details.message;
  }

  return conflict.message || 'A scheduling conflict was detected.';
}

/**
 * Format validation error details for display
 */
export function formatValidationErrors(error) {
  if (!error || !error.details) {
    return ['Invalid input. Please check your data.'];
  }

  const details = error.details;
  
  // If details is an array of error messages
  if (Array.isArray(details)) {
    return details;
  }
  
  // If details is an object with field-specific errors
  if (typeof details === 'object') {
    return Object.entries(details).map(([field, message]) => {
      return `${field}: ${message}`;
    });
  }
  
  // If details is a string
  if (typeof details === 'string') {
    return [details];
  }
  
  return ['Invalid input. Please check your data.'];
}

/**
 * Show undoable toast with custom button
 * @param {string} message - Toast message
 * @param {Function} onUndo - Callback when undo is clicked
 * @param {string} undoLabel - Label for undo button (default: 'Undo')
 * @returns {string} Toast ID
 */
export function showUndoableToast(message, onUndo, undoLabel = 'Undo') {
  const toastId = toast((t) => (
    <div className="flex items-center gap-3">
      <span>{message}</span>
      <button
        onClick={() => {
          onUndo();
          toast.dismiss(t.id);
        }}
        style={{
          padding: '6px 12px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {undoLabel}
      </button>
    </div>
  ), {
    duration: 10000,
    icon: '🗑️'
  });

  return toastId;
}
