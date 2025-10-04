import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileNode } from '@/components/chat/FileExplorer';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  phase?: string;
  model?: string;
  files?: FileNode[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  files: FileNode[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  agentMode?: 'deterministic' | 'smart';
}

interface UseChatOptions {
  onFileGenerated?: (file: FileNode) => void;
  onError?: (error: string) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load existing chat session
  useEffect(() => {
    if (chatId && user) {
      loadChatSession(chatId);
    } else if (!chatId) {
      // Create new session
      createNewSession();
    }
  }, [chatId, user]);

  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        setError('Failed to load chat session');
      }
    } catch (err) {
      setError('Network error loading chat session');
      console.error('Error loading chat session:', err);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      files: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      agentMode: 'deterministic'
    };
    setSession(newSession);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const sendMessage = useCallback(async (content: string, attachedFiles?: File[]) => {
    if (!session || !user) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to session
    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage],
      updatedAt: new Date()
    } : null);

    // Start AI generation
    setIsGenerating(true);
    setError(null);
    
    const aiMessageId = generateId();
    setStreamingMessageId(aiMessageId);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const formData = new FormData();
      formData.append('message', content);
      formData.append('sessionId', session.id);
      formData.append('agentMode', session.agentMode || 'deterministic');
      
      if (attachedFiles) {
        attachedFiles.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let aiContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setIsGenerating(false);
              setStreamingMessageId(null);
              setCurrentPhase('');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content') {
                aiContent += parsed.content;
                updateStreamingMessage(aiMessageId, aiContent, true);
              } else if (parsed.type === 'phase') {
                setCurrentPhase(parsed.phase);
              } else if (parsed.type === 'file') {
                const newFile: FileNode = {
                  id: generateId(),
                  name: parsed.name,
                  type: 'file',
                  content: parsed.content,
                  path: parsed.path,
                  size: parsed.content?.length || 0,
                  modified: new Date(),
                };
                
                addFileToSession(newFile);
                options.onFileGenerated?.(newFile);
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      // Finalize the AI message
      updateStreamingMessage(aiMessageId, aiContent, false);

      // Update session title if this is the first message
      if (session.messages.length === 1) {
        const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        setSession(prev => prev ? { ...prev, title } : null);
        
        // Update URL to include chat ID
        if (!chatId) {
          navigate(`/chat/${session.id}`, { replace: true });
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        const errorMessage = err.message || 'Failed to generate response';
        setError(errorMessage);
        options.onError?.(errorMessage);
        
        // Add error message to chat
        const errorMsg: ChatMessage = {
          id: generateId(),
          type: 'system',
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        };
        
        setSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, errorMsg]
        } : null);
      }
    } finally {
      setIsGenerating(false);
      setStreamingMessageId(null);
      setCurrentPhase('');
      abortControllerRef.current = null;
    }
  }, [session, user, chatId, navigate, options]);

  const updateStreamingMessage = (messageId: string, content: string, isStreaming: boolean) => {
    setSession(prev => {
      if (!prev) return null;

      const existingMessageIndex = prev.messages.findIndex(m => m.id === messageId);
      
      const message: ChatMessage = {
        id: messageId,
        type: 'ai',
        content,
        timestamp: new Date(),
        isStreaming,
        ...(currentPhase && { phase: currentPhase }),
        ...(session?.model && { model: session.model }),
      };

      if (existingMessageIndex >= 0) {
        // Update existing message
        const newMessages = [...prev.messages];
        newMessages[existingMessageIndex] = message;
        return { ...prev, messages: newMessages };
      } else {
        // Add new message
        return {
          ...prev,
          messages: [...prev.messages, message]
        };
      }
    });
  };

  const addFileToSession = (file: FileNode) => {
    setSession(prev => prev ? {
      ...prev,
      files: [...prev.files, file],
      updatedAt: new Date()
    } : null);
  };

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearChat = useCallback(() => {
    setSession(prev => prev ? {
      ...prev,
      messages: [],
      files: [],
      updatedAt: new Date()
    } : null);
    setError(null);
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setSession(prev => prev ? {
      ...prev,
      messages: prev.messages.filter(m => m.id !== messageId),
      updatedAt: new Date()
    } : null);
  }, []);

  return {
    session,
    isGenerating,
    currentPhase,
    streamingMessageId,
    error,
    sendMessage,
    stopGeneration,
    clearChat,
    deleteMessage,
  };
}