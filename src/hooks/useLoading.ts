/**
 * Enhanced Loading States Hook
 * Manages various loading states and user feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: string;
  message?: string;
}

export function useLoadingState(initialLoading: boolean = false) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialLoading,
  });

  const startLoading = useCallback((message?: string, stage?: string) => {
    setLoadingState({
      isLoading: true,
      ...(message && { message }),
      ...(stage && { stage }),
      progress: 0,
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string, stage?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      ...(message && { message }),
      ...(stage && { stage }),
    }));
  }, []);

  const updateStage = useCallback((stage: string, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      stage,
      ...(message && { message }),
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
    });
  }, []);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
    });
  }, []);

  return {
    ...loadingState,
    startLoading,
    updateProgress,
    updateStage,
    stopLoading,
    reset,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((key: string, loading: boolean, options?: {
    message?: string;
    stage?: string;
    progress?: number;
  }) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: loading,
        ...(options?.message && { message: options.message }),
        ...(options?.stage && { stage: options.stage }),
        ...(options?.progress !== undefined && { progress: options.progress }),
      },
    }));
  }, []);

  const updateProgress = useCallback((key: string, progress: number, message?: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.max(0, Math.min(100, progress)),
        ...(message && { message }),
      },
    }));
  }, []);

  const getLoadingState = useCallback((key: string): LoadingState => {
    return loadingStates[key] || { isLoading: false };
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(state => state.isLoading);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setLoading,
    updateProgress,
    getLoadingState,
    isAnyLoading,
    clearLoading,
    clearAllLoading,
  };
}

// Hook for handling long-running operations with timeout
export function useOperationTimeout(defaultTimeout: number = 30000) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startOperation = useCallback((timeout?: number) => {
    setIsLoading(true);
    setHasTimedOut(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
    }, timeout || defaultTimeout);
  }, [defaultTimeout]);

  const completeOperation = useCallback(() => {
    setIsLoading(false);
    setHasTimedOut(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const resetTimeout = useCallback(() => {
    setHasTimedOut(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    hasTimedOut,
    startOperation,
    completeOperation,
    resetTimeout,
  };
}

// Hook for debounced loading states (useful for search/filter operations)
export function useDebouncedLoading(delay: number = 500) {
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLoading) {
      setDebouncedLoading(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setDebouncedLoading(false);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return {
    isLoading,
    debouncedLoading,
    setIsLoading,
  };
}

// Hook for optimistic UI updates
export function useOptimisticUpdate<T>() {
  const [optimisticState, setOptimisticState] = useState<T | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  const performOptimisticUpdate = useCallback(async (
    newState: T,
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      revertDelay?: number;
    }
  ) => {
    const { onSuccess, onError, revertDelay = 0 } = options || {};
    
    // Apply optimistic update immediately
    setOptimisticState(newState);

    try {
      // Perform the actual operation
      const result = await operation();
      
      // Update with real result
      setOptimisticState(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsReverting(true);
      
      if (revertDelay > 0) {
        setTimeout(() => {
          setOptimisticState(null);
          setIsReverting(false);
        }, revertDelay);
      } else {
        setOptimisticState(null);
        setIsReverting(false);
      }
      
      if (onError) {
        onError(error);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setOptimisticState(null);
    setIsReverting(false);
  }, []);

  return {
    optimisticState,
    isReverting,
    performOptimisticUpdate,
    reset,
  };
}

// Hook for handling file upload progress
export function useUploadProgress() {
  const [uploads, setUploads] = useState<Record<string, {
    progress: number;
    status: 'uploading' | 'completed' | 'error' | 'cancelled';
    file: File;
    error?: string;
  }>>({});

  const startUpload = useCallback((fileId: string, file: File) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        progress: 0,
        status: 'uploading',
        file,
      },
    }));
  }, []);

  const updateProgress = useCallback((fileId: string, progress: number) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        progress: Math.max(0, Math.min(100, progress)),
      },
    }));
  }, []);

  const completeUpload = useCallback((fileId: string) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        progress: 100,
        status: 'completed',
      },
    }));
  }, []);

  const errorUpload = useCallback((fileId: string, error: string) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        status: 'error',
        error,
      },
    }));
  }, []);

  const cancelUpload = useCallback((fileId: string) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        status: 'cancelled',
      },
    }));
  }, []);

  const removeUpload = useCallback((fileId: string) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[fileId];
      return newUploads;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => {
      const newUploads = { ...prev };
      Object.keys(newUploads).forEach(fileId => {
        if (newUploads[fileId].status === 'completed') {
          delete newUploads[fileId];
        }
      });
      return newUploads;
    });
  }, []);

  return {
    uploads,
    startUpload,
    updateProgress,
    completeUpload,
    errorUpload,
    cancelUpload,
    removeUpload,
    clearCompleted,
  };
}