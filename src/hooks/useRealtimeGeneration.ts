/**
 * Real-time Generation Hook
 * React hook for managing real-time AI generation with live updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeService, GenerationProgress, StreamMessage } from '@/services/RealtimeService';

interface GenerationState {
  isGenerating: boolean;
  progress: GenerationProgress | null;
  messages: StreamMessage[];
  error: string | null;
}

export const useRealtimeGeneration = () => {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: null,
    messages: [],
    error: null,
  });

  const realtimeService = RealtimeService.getInstance();
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  /**
   * Start a new generation session with real-time updates
   */
  const startGeneration = useCallback(async (userId: string): Promise<string> => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: null,
      messages: [],
      error: null,
    }));

    try {
      // Set up real-time listeners
      const unsubscribeProgress = realtimeService.subscribeToGeneration(sessionId, (progress) => {
        setState(prev => ({
          ...prev,
          progress,
          error: progress.error || null,
        }));

        // If generation is complete or has error, stop generating
        if (progress.status === 'completed' || progress.status === 'error') {
          setState(prev => ({
            ...prev,
            isGenerating: false,
          }));
        }
      });

      const unsubscribeMessages = realtimeService.subscribeToMessages(sessionId, (message) => {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
      });

      // Store unsubscribe functions
      unsubscribeRefs.current = [unsubscribeProgress, unsubscribeMessages];

      // Start the generation stream
      await realtimeService.streamGeneration(
        sessionId,
        userId,
        (progress) => {
          console.log('Progress update:', progress);
        },
        (message) => {
          console.log('Message received:', message);
        }
      );

      return sessionId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      }));
      throw error;
    }
  }, [realtimeService]);

  /**
   * Stop the current generation
   */
  const stopGeneration = useCallback(() => {
    // Unsubscribe from all listeners
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    unsubscribeRefs.current = [];

    setState(prev => ({
      ...prev,
      isGenerating: false,
    }));
  }, []);

  /**
   * Clear generation state
   */
  const clearGeneration = useCallback(() => {
    setState({
      isGenerating: false,
      progress: null,
      messages: [],
      error: null,
    });
  }, []);

  /**
   * Get generation status by session ID
   */
  const getGenerationStatus = useCallback(async (sessionId: string): Promise<GenerationProgress | null> => {
    return await realtimeService.getGenerationStatus(sessionId);
  }, [realtimeService]);

  /**
   * Resume watching an existing generation session
   */
  const resumeGeneration = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    const unsubscribeProgress = realtimeService.subscribeToGeneration(sessionId, (progress) => {
      setState(prev => ({
        ...prev,
        progress,
        error: progress.error || null,
      }));

      if (progress.status === 'completed' || progress.status === 'error') {
        setState(prev => ({
          ...prev,
          isGenerating: false,
        }));
      }
    });

    const unsubscribeMessages = realtimeService.subscribeToMessages(sessionId, (message) => {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
    });

    unsubscribeRefs.current = [unsubscribeProgress, unsubscribeMessages];
  }, [realtimeService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      realtimeService.disconnectAll();
    };
  }, [realtimeService]);

  return {
    ...state,
    startGeneration,
    stopGeneration,
    clearGeneration,
    getGenerationStatus,
    resumeGeneration,
  };
};