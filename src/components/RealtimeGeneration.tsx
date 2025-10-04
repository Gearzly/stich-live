/**
 * Real-time Generation Component
 * Demonstrates live AI generation with real-time progress updates
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeGeneration } from '@/hooks/useRealtimeGeneration';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Play, 
  Square, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Code, 
  FileText,
  Loader2 
} from 'lucide-react';

export function RealtimeGeneration() {
  const { user } = useAuth();
  const {
    isGenerating,
    progress,
    messages,
    error,
    startGeneration,
    stopGeneration,
    clearGeneration,
  } = useRealtimeGeneration();

  const [sessionId, setSessionId] = useState<string | null>(null);

  /**
   * Start a new generation
   */
  const handleStartGeneration = async () => {
    if (!user) {
      alert('Please login to start generation');
      return;
    }

    try {
      const newSessionId = await startGeneration(user.uid);
      setSessionId(newSessionId);
    } catch (error) {
      console.error('Failed to start generation:', error);
    }
  };

  /**
   * Stop current generation
   */
  const handleStopGeneration = () => {
    stopGeneration();
  };

  /**
   * Clear generation results
   */
  const handleClearGeneration = () => {
    clearGeneration();
    setSessionId(null);
  };

  /**
   * Get status badge
   */
  const getStatusBadge = () => {
    if (!progress) return null;

    const statusConfig = {
      initializing: { variant: 'secondary' as const, icon: Clock, text: 'Initializing' },
      analyzing: { variant: 'default' as const, icon: Loader2, text: 'Analyzing' },
      generating: { variant: 'default' as const, icon: Code, text: 'Generating' },
      reviewing: { variant: 'default' as const, icon: FileText, text: 'Reviewing' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      error: { variant: 'destructive' as const, icon: XCircle, text: 'Error' },
    };

    const config = statusConfig[progress.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className={`h-3 w-3 ${progress.status === 'analyzing' || progress.status === 'generating' ? 'animate-spin' : ''}`} />
        <span>{config.text}</span>
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real-time AI Generation</span>
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
              {sessionId && (
                <Badge variant="outline" className="font-mono text-xs">
                  {sessionId}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This demonstrates real-time AI generation with live progress updates using Firebase Realtime Database.
          </p>

          {/* Control Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleStartGeneration}
              disabled={isGenerating || !user}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Generation</span>
            </Button>

            {isGenerating && (
              <Button
                variant="destructive"
                onClick={handleStopGeneration}
                className="flex items-center space-x-2"
              >
                <Square className="h-4 w-4" />
                <span>Stop</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleClearGeneration}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear</span>
            </Button>
          </div>

          {/* Progress Display */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progress.currentStep}</span>
                <span className="text-muted-foreground">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive text-sm">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-destructive whitespace-pre-wrap">
                  {error}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Generated Files */}
      {progress?.files && progress.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Files ({progress.files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progress.files.map((file, index) => (
                <Card key={index} className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Code className="h-4 w-4" />
                      <span className="font-mono">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.language}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32 w-full">
                      <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-2 rounded">
                        {file.content}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Messages */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Live Updates ({messages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <div className="space-y-2">
                {messages.map((message, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="text-xs">
                      {message.type}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-sm">
                        {message.type === 'file' ? (
                          <span className="font-mono">{message.data.name}</span>
                        ) : (
                          <span>{message.data.message || JSON.stringify(message.data)}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Auth Notice */}
      {!user && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Please login to test the real-time generation features.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}