import toast from 'react-hot-toast';

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
 * Parse error object and extract meaningful information
 */
export function parseError(error) {
  if (!error) {
    return {
      type: ErrorTypes.UNKNOWN,
      message: 'An unknown error occurred',
      details: null
    };
  }

  // If error is already structured
  if (error.type) {
    return {
      type: error.type,
      message: error.message || 'An error occurred',
      details: error.details || null,
      status: error.status || null
    };
  }

  // Network errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      type: ErrorTypes.TIMEOUT,
      message: 'Request timed out. Please try again.',
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

  // HTTP status-based errors
  if (error.status === 401 || error.status === 403) {
    return {
      type: ErrorTypes.AUTHORIZATION,
      message: 'You do not have permission to perform this action.',
      details: error.details || null,
      status: error.status
    };
  }

  if (error.status === 404) {
    return {
      type: ErrorTypes.NOT_FOUND,
      message: 'The requested resource was not found.',
      details: error.details || null,
      status: error.status
    };
  }

  if (error.status === 409) {
    return {
      type: ErrorTypes.CONFLICT,
      message: error.message || 'A scheduling conflict was detected.',
      details: error.details || null,
      status: error.status
    };
  }

  if (error.status === 400) {
    return {
      type: ErrorTypes.VALIDATION,
      message: error.message || 'Invalid input. Please check your data.',
      details: error.details || null,
      status: error.status
    };
  }

  // Default case
  return {
    type: ErrorTypes.UNKNOWN,
    message: error.message || 'An unexpected error occurred',
    details: error.details || null,
    status: error.status || null
  };
}

/**
 * Display error toast with appropriate styling
 */
export function showErrorToast(error, customMessage = null) {
  const parsedError = parseError(error);
  const message = customMessage || parsedError.message;

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
  console.error('Error:', parsedError);
  
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
    style: {
      background: '#FEF3C7',
      color: '#92400E',
    },
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
        parsedError.type === ErrorTypes.NOT_FOUND
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
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
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
    loadingMessage = 'Processing...',
    successMessage = 'Operation completed successfully',
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
    const message = errorMessage || parsedError.message;
    
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
    return 'A scheduling conflict was detected.';
  }

  const details = conflict.details;
  
  if (details.teacherName && details.conflictingClass) {
    return `${details.teacherName} is already assigned to ${details.conflictingClass} at this time.`;
  }
  
  if (details.message) {
    return details.message;
  }
  
  return 'A scheduling conflict was detected.';
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
