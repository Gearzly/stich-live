/**
 * Error Handling Hook
 * Centralized error handling for API calls and operations
 */

import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export interface APIError {
  message: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
}

export function useAsyncOperation<T = any>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { showError } = useNotifications();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      showErrorNotification?: boolean;
      errorMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: APIError) => void;
    }
  ): Promise<T | null> => {
    const {
      showErrorNotification = true,
      errorMessage,
      onSuccess,
      onError,
    } = options || {};

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      
      setState({
        data: result,
        loading: false,
        error: null,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const apiError: APIError = {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: (error as any)?.code || (error as any)?.status,
        details: error,
        timestamp: new Date(),
      };

      setState({
        data: null,
        loading: false,
        error: apiError,
      });

      if (showErrorNotification) {
        showError(
          'Operation Failed',
          errorMessage || apiError.message,
          {
            action: {
              label: 'Retry',
              onClick: () => execute(operation, options),
            },
          }
        );
      }

      if (onError) {
        onError(apiError);
      }

      return null;
    }
  }, [showError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

// Hook for handling form submissions with error handling
export function useFormSubmission<T = any>() {
  const { execute, loading, error } = useAsyncOperation<T>();

  const submitForm = useCallback(async (
    formData: any,
    submitFunction: (data: any) => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: APIError) => void;
      resetOnSuccess?: boolean;
    }
  ) => {
    const { showSuccess } = useNotifications();
    const {
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      // resetOnSuccess = false, // Not currently used
    } = options || {};

    const result = await execute(
      () => submitFunction(formData),
      {
        ...(errorMessage && { errorMessage }),
        onSuccess: (data) => {
          if (successMessage) {
            showSuccess('Success', successMessage);
          }
          if (onSuccess) {
            onSuccess(data);
          }
        },
        ...(onError && { onError }),
      }
    );

    return result;
  }, [execute]);

  return {
    submitForm,
    loading,
    error,
  };
}

// Hook for handling API calls with retry logic
export function useRetryableOperation<T = any>(maxRetries: number = 3) {
  const [retryCount, setRetryCount] = useState(0);
  const { execute, loading, error, data, reset } = useAsyncOperation<T>();

  const executeWithRetry = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      retryDelay?: number;
      showErrorNotification?: boolean;
      errorMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: APIError, attempts: number) => void;
    }
  ): Promise<T | null> => {
    const {
      retryDelay = 1000,
      showErrorNotification = true,
      errorMessage,
      onSuccess,
      onError,
    } = options || {};

    let attempts = 0;
    
    while (attempts <= maxRetries) {
      try {
        const result = await execute(operation, {
          showErrorNotification: attempts === maxRetries ? showErrorNotification : false,
          ...(errorMessage && { errorMessage }),
          ...(onSuccess && { onSuccess }),
          onError: (error) => {
            setRetryCount(attempts);
            if (onError) {
              onError(error, attempts);
            }
          },
        });

        if (result !== null) {
          setRetryCount(0);
          return result;
        }
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
      }

      attempts++;
      
      if (attempts <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
      }
    }

    return null;
  }, [execute, maxRetries]);

  return {
    executeWithRetry,
    loading,
    error,
    data,
    retryCount,
    reset,
  };
}

// Hook for handling network-related errors
export function useNetworkErrorHandler() {
  const { showError, showWarning } = useNotifications();

  const handleNetworkError = useCallback((error: any) => {
    if (!navigator.onLine) {
      showWarning(
        'No Internet Connection',
        'Please check your internet connection and try again.'
      );
      return;
    }

    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
      showError(
        'Network Error',
        'Unable to connect to the server. Please try again later.'
      );
      return;
    }

    if (error?.status === 500) {
      showError(
        'Server Error',
        'The server encountered an error. Our team has been notified.'
      );
      return;
    }

    if (error?.status === 403) {
      showError(
        'Access Denied',
        'You do not have permission to perform this action.'
      );
      return;
    }

    if (error?.status === 401) {
      showError(
        'Authentication Required',
        'Please log in to continue.'
      );
      return;
    }

    // Generic error fallback
    showError(
      'Something went wrong',
      error?.message || 'An unexpected error occurred. Please try again.'
    );
  }, [showError, showWarning]);

  return { handleNetworkError };
}

// Global error handler for unhandled promise rejections
export function useGlobalErrorHandler() {
  const { showError } = useNotifications();

  const setupGlobalHandlers = useCallback(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      showError(
        'Unexpected Error',
        'An unexpected error occurred. Please refresh the page if the problem persists.',
        { persistent: true }
      );
      
      // Prevent the default behavior (logging to console)
      event.preventDefault();
    };

    // Handle global JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      showError(
        'Application Error',
        'A critical error occurred. Please refresh the page.',
        { persistent: true }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [showError]);

  return { setupGlobalHandlers };
}