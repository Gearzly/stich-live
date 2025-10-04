/**
 * Code Preview Component
 * Provides live code execution and preview using WebContainers
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useWebContainer } from '@/hooks/useWebContainer';
import { FileSystemTree } from '@webcontainer/api';
import { Play, Terminal, Globe, Code, Loader2, RefreshCw } from 'lucide-react';

interface CodePreviewProps {
  files: FileSystemTree;
  className?: string;
}

export function CodePreview({ files, className }: CodePreviewProps) {
  const {
    isReady,
    isLoading,
    error,
    output,
    previewUrl,
    mountProject,
    installDependencies,
    startDevServer,
    executeCommand,
    clearOutput,
  } = useWebContainer();

  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(false);

  /**
   * Load the project into WebContainer
   */
  const loadProject = async () => {
    if (!isReady) return;

    try {
      const mounted = await mountProject(files);
      if (mounted) {
        setIsProjectLoaded(true);
        
        // Auto-install dependencies
        const installed = await installDependencies();
        if (installed) {
          // Auto-start dev server
          const started = await startDevServer();
          if (started) {
            setIsServerRunning(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  /**
   * Restart the development server
   */
  const restartServer = async () => {
    setIsServerRunning(false);
    const started = await startDevServer();
    if (started) {
      setIsServerRunning(true);
    }
  };

  /**
   * Run custom command
   */
  const runCommand = async (command: string) => {
    const [cmd, ...args] = command.split(' ');
    await executeCommand(cmd, args);
  };

  // Load project when WebContainer is ready and we have files
  useEffect(() => {
    if (isReady && files && !isProjectLoaded) {
      loadProject();
    }
  }, [isReady, files, isProjectLoaded]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Badge variant={isReady ? 'default' : 'secondary'}>
            {isReady ? 'Ready' : 'Initializing'}
          </Badge>
          {isProjectLoaded && (
            <Badge variant="outline">Project Loaded</Badge>
          )}
          {isServerRunning && (
            <Badge variant="default">Server Running</Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadProject}
            disabled={!isReady || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Load Project
          </Button>
          
          {isProjectLoaded && (
            <Button
              size="sm"
              variant="outline"
              onClick={restartServer}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
              Restart Server
            </Button>
          )}
        </div>
      </div>

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

      {/* Main Content */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
          <TabsTrigger value="terminal" className="flex items-center space-x-2">
            <Terminal className="h-4 w-4" />
            <span>Terminal</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Files</span>
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Live Preview</span>
                {previewUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    Open in New Tab
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-96 border-0 rounded-b-lg"
                  title="Live Preview"
                />
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  {isServerRunning ? 'Loading preview...' : 'Start the development server to see preview'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminal Tab */}
        <TabsContent value="terminal" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Terminal Output</CardTitle>
              <Button size="sm" variant="outline" onClick={clearOutput}>
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {output || 'No output yet...'}
                </pre>
              </ScrollArea>
              
              {/* Command Input */}
              <div className="mt-4 flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter command (e.g., npm run build)"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const command = (e.target as HTMLInputElement).value;
                      if (command.trim()) {
                        runCommand(command);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  disabled={!isReady || isLoading}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Enter command"]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      runCommand(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={!isReady || isLoading}
                >
                  Run
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-2">
                  {Object.entries(files).map(([name, content]) => (
                    <div key={name} className="border rounded p-2">
                      <div className="font-mono text-sm font-medium">{name}</div>
                      {'file' in content && content.file && 'contents' in content.file && (
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap overflow-hidden">
                          {typeof content.file.contents === 'string' ? (
                            <>
                              {content.file.contents.substring(0, 200)}
                              {content.file.contents.length > 200 && '...'}
                            </>
                          ) : (
                            '[Binary file]'
                          )}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}