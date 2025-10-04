import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Bug,
  Monitor,
  Activity,
  AlertTriangle,
  Info,
  Search,
  Download,
  Trash2,
  Play,
  Pause,
  Clock,
  Zap,
  Server,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogEntry, PerformanceMetric, ErrorInfo } from './types';

interface DebugPanelProps {
  className?: string;
  isActive?: boolean;
  sessionId?: string;
  onToggleRecording?: (recording: boolean) => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  className,
  isActive = false,
  sessionId,
  onToggleRecording
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  // Mock data generation
  useEffect(() => {
    if (isActive) {
      setLogs(generateMockLogs());
      setErrors(generateMockErrors());
      setMetrics(generateMockMetrics());
    }
  }, [isActive, sessionId]);

  // Auto-refresh logs when recording
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setLogs(prev => [...prev, generateRandomLog()]);
        setMetrics(prev => [...prev.slice(-20), generateRandomMetric()]);
      }, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isRecording]);

  const handleToggleRecording = () => {
    const newRecording = !isRecording;
    setIsRecording(newRecording);
    onToggleRecording?.(newRecording);
  };

  const clearLogs = () => {
    setLogs([]);
    setErrors([]);
    setMetrics([]);
  };

  const exportLogs = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      sessionId,
      logs,
      errors,
      metrics
    };
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-session-${sessionId || 'unknown'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug': return <Bug className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getMetricIcon = (category: PerformanceMetric['category']) => {
    switch (category) {
      case 'response_time': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'token_usage': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'memory': return <Server className="h-4 w-4 text-green-500" />;
      case 'network': return <Wifi className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Debug Panel
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                Recording
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleRecording}
            >
              {isRecording ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRecording ? 'Stop' : 'Record'}
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="logs" className="h-full flex flex-col">
          <TabsList className="mx-4 mb-2">
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <Bug className="h-4 w-4" />
              Logs ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Errors ({errors.filter(e => !e.resolved).length})
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="flex-1 mx-4 mb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-3 space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-2 rounded border-l-2 border-l-blue-500 bg-muted/30"
                    >
                      {getLogIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.source}
                          </Badge>
                          <Badge 
                            variant={log.level === 'error' ? 'destructive' : 
                                    log.level === 'warning' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1 break-words">{log.message}</p>
                        {log.details && (
                          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedLevel !== 'all' 
                        ? 'No logs match your filters' 
                        : 'No logs recorded yet'
                      }
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="flex-1 mx-4 mb-4">
            <ScrollArea className="h-[500px] border rounded-md">
              <div className="p-3 space-y-3">
                {errors.map((error) => (
                  <Card key={error.id} className={cn(
                    "border-l-4",
                    error.severity === 'critical' ? 'border-l-red-600' :
                    error.severity === 'high' ? 'border-l-red-400' :
                    error.severity === 'medium' ? 'border-l-yellow-400' :
                    'border-l-blue-400'
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatTimestamp(error.timestamp)}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {error.severity.toUpperCase()}
                          </Badge>
                          {error.resolved && (
                            <Badge variant="outline" className="text-xs">
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm font-medium mb-2">{error.error}</p>
                      {error.stack && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {error.stack}
                        </pre>
                      )}
                      {error.context && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Context:</p>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {errors.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No errors recorded
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metrics" className="flex-1 mx-4 mb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {['response_time', 'token_usage', 'memory', 'network'].map((category) => {
                  const categoryMetrics = metrics.filter(m => m.category === category);
                  const latest = categoryMetrics[categoryMetrics.length - 1];
                  const average = categoryMetrics.length > 0 
                    ? categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length 
                    : 0;

                  return (
                    <Card key={category}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getMetricIcon(category as PerformanceMetric['category'])}
                          {category.replace('_', ' ').toUpperCase()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current:</span>
                            <span className="font-mono">
                              {latest ? `${latest.value}${latest.unit}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Average:</span>
                            <span className="font-mono">
                              {categoryMetrics.length > 0 
                                ? `${average.toFixed(1)}${latest?.unit || ''}` 
                                : 'N/A'
                              }
                            </span>
                          </div>
                          {latest && (
                            <Progress 
                              value={Math.min((latest.value / (average * 2)) * 100, 100)} 
                              className="h-2"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-3 space-y-2">
                  {metrics.slice(-50).reverse().map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        {getMetricIcon(metric.category)}
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatTimestamp(metric.timestamp)}
                        </span>
                      </div>
                      <span className="font-mono text-sm">
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                  ))}
                  {metrics.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No metrics recorded yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Mock data generators
const generateMockLogs = (): LogEntry[] => {
  const sources = ['AI Generator', 'Database', 'Authentication', 'File System', 'Network'];
  const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'debug'];
  const messages = [
    'Starting code generation process',
    'Database connection established',
    'User authentication successful',
    'File upload completed',
    'API request processed',
    'Cache miss - fetching from database',
    'Rate limit warning: approaching threshold',
    'Network timeout - retrying request',
    'Invalid API key provided',
    'Memory usage threshold exceeded'
  ];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - (25 - i) * 30000),
    level: levels[Math.floor(Math.random() * levels.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    details: Math.random() > 0.7 ? { requestId: `req-${i}`, duration: Math.floor(Math.random() * 1000) } : undefined
  }));
};

const generateMockErrors = (): ErrorInfo[] => {
  const errors = [
    'Network connection timeout',
    'Invalid API response format',
    'Database query failed',
    'Authentication token expired',
    'File permission denied'
  ];

  return Array.from({ length: 3 }, (_, i) => ({
    id: `error-${i}`,
    timestamp: new Date(Date.now() - (3 - i) * 120000),
    error: errors[Math.floor(Math.random() * errors.length)],
    stack: `Error: ${errors[i]}\n    at function1 (file1.js:10:5)\n    at function2 (file2.js:20:10)`,
    context: { userId: 'user123', requestId: `req-${i}` },
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as ErrorInfo['severity'],
    resolved: Math.random() > 0.5
  }));
};

const generateMockMetrics = (): PerformanceMetric[] => {
  const categories: PerformanceMetric['category'][] = ['response_time', 'token_usage', 'memory', 'network'];
  const names = {
    response_time: ['API Response', 'DB Query', 'File Read'],
    token_usage: ['Input Tokens', 'Output Tokens', 'Total Tokens'],
    memory: ['Heap Usage', 'RSS Memory', 'External Memory'],
    network: ['Download Speed', 'Upload Speed', 'Latency']
  };
  const units = {
    response_time: 'ms',
    token_usage: '',
    memory: 'MB',
    network: 'ms'
  };

  return Array.from({ length: 20 }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    return {
      id: `metric-${i}`,
      name: names[category][Math.floor(Math.random() * names[category].length)],
      value: Math.floor(Math.random() * 1000),
      unit: units[category],
      timestamp: new Date(Date.now() - (20 - i) * 15000),
      category
    };
  });
};

const generateRandomLog = (): LogEntry => {
  const sources = ['AI Generator', 'Database', 'Authentication', 'File System', 'Network'];
  const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'debug'];
  const messages = [
    'Real-time log entry generated',
    'Background process completed',
    'Cache refreshed successfully',
    'Webhook received and processed',
    'Scheduled task executed'
  ];

  return {
    id: `log-${Date.now()}`,
    timestamp: new Date(),
    level: levels[Math.floor(Math.random() * levels.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    message: messages[Math.floor(Math.random() * messages.length)]
  };
};

const generateRandomMetric = (): PerformanceMetric => {
  const categories: PerformanceMetric['category'][] = ['response_time', 'token_usage', 'memory', 'network'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    id: `metric-${Date.now()}`,
    name: `Live ${category.replace('_', ' ')}`,
    value: Math.floor(Math.random() * 1000),
    unit: category === 'response_time' ? 'ms' : category === 'memory' ? 'MB' : '',
    timestamp: new Date(),
    category
  };
};

export default DebugPanel;