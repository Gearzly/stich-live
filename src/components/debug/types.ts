export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  details?: any;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'response_time' | 'token_usage' | 'memory' | 'network';
}

export interface ErrorInfo {
  id: string;
  timestamp: Date;
  error: string;
  stack?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface DebugSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  logs: LogEntry[];
  errors: ErrorInfo[];
  metrics: PerformanceMetric[];
  status: 'active' | 'completed' | 'failed';
  chatId?: string;
  generationId?: string;
}