import { useState, useCallback } from 'react';
import { 
  AIService, 
  type AIRequest, 
  type AIResponse, 
  type AIProvider,
  type AIMessage 
} from '../services';

export interface ChatSession {
  id: string;
  messages: AIMessage[];
  provider: AIProvider;
  model: string;
  totalCost: number;
  createdAt: Date;
}

export interface UseAIOptions {
  defaultProvider?: AIProvider;
  defaultModel?: string;
  maxTokens?: number;
  temperature?: number;
  onCostUpdate?: (cost: number) => void;
}

// Custom hook for AI interactions
export function useAI(options: UseAIOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  const aiService = new AIService();

  // Start a new chat session
  const startSession = useCallback((systemPrompt?: string): ChatSession => {
    const availableProviders = aiService.getAvailableProviders();
    const selectedProvider = options.defaultProvider || (availableProviders.length > 0 ? availableProviders[0] : 'openai');
    
    const session: ChatSession = {
      id: crypto.randomUUID(),
      messages: systemPrompt ? [{ role: 'system', content: systemPrompt }] : [],
      provider: selectedProvider as AIProvider,
      model: options.defaultModel || '',
      totalCost: 0,
      createdAt: new Date(),
    };

    setCurrentSession(session);
    setError(null);
    return session;
  }, [options.defaultProvider, options.defaultModel]);

  // Send a message in the current session
  const sendMessage = async (
    content: string,
    sessionId?: string,
    requestOptions: Partial<AIRequest> = {}
  ): Promise<AIResponse> => {
    if (!currentSession && !sessionId) {
      throw new Error('No active session. Start a session first.');
    }

    try {
      setLoading(true);
      setError(null);

      const session = currentSession || { messages: [] };
      const messages: AIMessage[] = [
        ...session.messages,
        { role: 'user', content },
      ];

      const availableProviders = aiService.getAvailableProviders();
      const selectedProvider = options.defaultProvider || (availableProviders.length > 0 ? availableProviders[0] : 'openai');

      const request: AIRequest = {
        messages,
        provider: selectedProvider as AIProvider,
        model: options.defaultModel || aiService.getDefaultModel(selectedProvider as AIProvider),
        maxTokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        ...requestOptions,
      };

      const response = await aiService.sendRequest(request);

      // Update session with new messages
      const updatedMessages: AIMessage[] = [
        ...messages,
        { role: 'assistant', content: response.content },
      ];

      const updatedSession: ChatSession = {
        id: sessionId || ('id' in session ? session.id : crypto.randomUUID()),
        messages: updatedMessages,
        provider: response.provider,
        model: response.model,
        totalCost: ('totalCost' in session ? session.totalCost || 0 : 0) + (response.cost || 0),
        createdAt: 'createdAt' in session ? session.createdAt : new Date(),
      };

      setCurrentSession(updatedSession);
      
      // Update total cost
      const newTotalCost = totalCost + (response.cost || 0);
      setTotalCost(newTotalCost);
      options.onCostUpdate?.(newTotalCost);

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Send a one-off request without session management
  const sendRequest = async (request: AIRequest): Promise<AIResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await aiService.sendRequest({
        maxTokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        ...request,
      });

      // Update total cost
      const newTotalCost = totalCost + (response.cost || 0);
      setTotalCost(newTotalCost);
      options.onCostUpdate?.(newTotalCost);

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get available providers
  const getAvailableProviders = useCallback(() => {
    return aiService.getAvailableProviders();
  }, []);

  // Get provider configuration
  const getProviderConfig = useCallback((provider: AIProvider) => {
    return aiService.getProviderConfig(provider);
  }, []);

  // Estimate request cost
  const estimateCost = useCallback((request: AIRequest) => {
    return aiService.estimateRequestCost(request);
  }, []);

  // Clear current session
  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setError(null);
  }, []);

  // Add message to current session (useful for user edits)
  const addMessage = useCallback((message: AIMessage) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, message],
    };

    setCurrentSession(updatedSession);
  }, [currentSession]);

  // Remove last messages from session
  const removeLastMessages = useCallback((count: number = 1) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      messages: currentSession.messages.slice(0, -count),
    };

    setCurrentSession(updatedSession);
  }, [currentSession]);

  // Edit a specific message in the session
  const editMessage = useCallback((messageIndex: number, newContent: string) => {
    if (!currentSession) return;

    const updatedMessages = [...currentSession.messages];
    const originalMessage = updatedMessages[messageIndex];
    
    updatedMessages[messageIndex] = {
      role: originalMessage?.role || 'user',
      content: newContent,
    };

    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
    };

    setCurrentSession(updatedSession);
  }, [currentSession]);

  return {
    // State
    loading,
    error,
    currentSession,
    totalCost,

    // Actions
    startSession,
    sendMessage,
    sendRequest,
    clearSession,
    addMessage,
    removeLastMessages,
    editMessage,

    // Utilities
    getAvailableProviders,
    getProviderConfig,
    estimateCost,
  };
}

// Hook for provider management and testing
export function useAIProviders() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [providerStatus, setProviderStatus] = useState<Record<AIProvider, boolean>>({} as Record<AIProvider, boolean>);
  const [loading, setLoading] = useState(false);

  const aiService = new AIService();

  // Load available providers
  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      
      const availableProviders = aiService.getAvailableProviders();
      setProviders(availableProviders);

      const status = await aiService.getProviderStatus();
      setProviderStatus(status);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Test a specific provider
  const testProvider = useCallback(async (provider: AIProvider) => {
    try {
      const isWorking = await aiService.testProvider(provider);
      setProviderStatus(prev => ({
        ...prev,
        [provider]: isWorking,
      }));
      return isWorking;
    } catch (error) {
      console.error(`Failed to test provider ${provider}:`, error);
      return false;
    }
  }, []);

  return {
    providers,
    providerStatus,
    loading,
    loadProviders,
    testProvider,
  };
}

// Hook for streaming AI responses
export function useAIStream() {
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const streamRequest = useCallback(async (
    request: AIRequest,
    onChunk?: (chunk: string) => void
  ) => {
    try {
      setStreaming(true);
      setStreamContent('');
      setError(null);

      // Note: This is a simplified streaming implementation
      // In a real implementation, you'd handle Server-Sent Events or WebSockets
      const response = await new AIService().sendRequest({
        ...request,
        stream: true,
      });

      // Simulate streaming by gradually revealing content
      const content = response.content;
      const chunks = content.split(' ');
      
      for (let i = 0; i < chunks.length; i++) {
        const partialContent = chunks.slice(0, i + 1).join(' ');
        setStreamContent(partialContent);
        const chunk = chunks[i];
        if (chunk && onChunk) {
          onChunk(chunk);
        }
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Streaming failed');
      throw err;
    } finally {
      setStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    setStreaming(false);
  }, []);

  return {
    streaming,
    streamContent,
    error,
    streamRequest,
    stopStream,
  };
}