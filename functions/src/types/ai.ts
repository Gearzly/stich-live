import { Timestamp } from 'firebase-admin/firestore';
import { AIProvider } from '../config/env';

/**
 * AI Generation related types
 */

export interface GenerationRequest {
  prompt: string;
  provider: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  appType?: string;
  framework?: string;
  features?: string[];
  customization?: {
    theme?: string;
    layout?: string;
    components?: string[];
  };
}

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  language: string;
  type: 'component' | 'page' | 'config' | 'style' | 'data' | 'test';
}

export interface GenerationSession {
  id: string;
  userId: string;
  request: GenerationRequest;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  files: GeneratedFile[];
  error?: string;
  metadata: {
    tokensUsed?: number;
    processingTime?: number;
    provider: AIProvider;
    model: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface StreamChunk {
  type: 'file' | 'status' | 'error' | 'completed';
  data: any;
  timestamp: number;
}

export interface AIResponse {
  success: boolean;
  files?: GeneratedFile[];
  error?: string;
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    model: string;
  };
}

export interface CodeGenerationPrompt {
  systemPrompt: string;
  userPrompt: string;
  context?: {
    previousFiles?: GeneratedFile[];
    requirements?: string[];
    constraints?: string[];
  };
}