/**
 * WebContainer Hook
 * React hook for managing WebContainer instances and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { WebContainerService, ExecutionResult } from '@/services/WebContainerService';
import { FileSystemTree } from '@webcontainer/api';

interface WebContainerState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  output: string;
  previewUrl: string | null;
}

export const useWebContainer = () => {
  const [state, setState] = useState<WebContainerState>({
    isReady: false,
    isLoading: false,
    error: null,
    output: '',
    previewUrl: null,
  });

  const webContainerService = WebContainerService.getInstance();

  /**
   * Initialize WebContainer
   */
  const initialize = useCallback(async () => {
    if (state.isReady) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await webContainerService.initialize();
      setState(prev => ({ 
        ...prev, 
        isReady: true, 
        isLoading: false,
        output: prev.output + 'WebContainer initialized successfully\n'
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize WebContainer'
      }));
    }
  }, [state.isReady, webContainerService]);

  /**
   * Mount project files
   */
  const mountProject = useCallback(async (files: FileSystemTree): Promise<boolean> => {
    if (!state.isReady) {
      setState(prev => ({ ...prev, error: 'WebContainer not ready' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await webContainerService.mountFiles(files);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        output: prev.output + 'Project files mounted successfully\n'
      }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to mount files'
      }));
      return false;
    }
  }, [state.isReady, webContainerService]);

  /**
   * Install dependencies
   */
  const installDependencies = useCallback(async (): Promise<boolean> => {
    if (!state.isReady) {
      setState(prev => ({ ...prev, error: 'WebContainer not ready' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await webContainerService.installDependencies();
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        output: prev.output + (result.output || '') + '\n',
        error: result.error || null
      }));
      return result.success;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to install dependencies'
      }));
      return false;
    }
  }, [state.isReady, webContainerService]);

  /**
   * Start development server
   */
  const startDevServer = useCallback(async (): Promise<boolean> => {
    if (!state.isReady) {
      setState(prev => ({ ...prev, error: 'WebContainer not ready' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await webContainerService.startDevServer();
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        output: prev.output + (result.output || '') + '\n',
        previewUrl: result.url || null,
        error: result.error || null
      }));
      return result.success;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to start dev server'
      }));
      return false;
    }
  }, [state.isReady, webContainerService]);

  /**
   * Execute a command
   */
  const executeCommand = useCallback(async (command: string, args: string[] = []): Promise<ExecutionResult> => {
    if (!state.isReady) {
      const error = 'WebContainer not ready';
      setState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await webContainerService.executeCommand(command, args);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        output: prev.output + `$ ${command} ${args.join(' ')}\n` + (result.output || '') + '\n',
        error: result.error || null
      }));
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Command execution failed';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMsg
      }));
      return { success: false, error: errorMsg };
    }
  }, [state.isReady, webContainerService]);

  /**
   * Write file
   */
  const writeFile = useCallback(async (path: string, contents: string): Promise<boolean> => {
    if (!state.isReady) {
      setState(prev => ({ ...prev, error: 'WebContainer not ready' }));
      return false;
    }

    try {
      await webContainerService.writeFile(path, contents);
      setState(prev => ({ 
        ...prev,
        output: prev.output + `File written: ${path}\n`
      }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to write file'
      }));
      return false;
    }
  }, [state.isReady, webContainerService]);

  /**
   * Read file
   */
  const readFile = useCallback(async (path: string): Promise<string | null> => {
    if (!state.isReady) {
      setState(prev => ({ ...prev, error: 'WebContainer not ready' }));
      return null;
    }

    try {
      const contents = await webContainerService.readFile(path);
      setState(prev => ({ 
        ...prev,
        output: prev.output + `File read: ${path}\n`
      }));
      return contents;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to read file'
      }));
      return null;
    }
  }, [state.isReady, webContainerService]);

  /**
   * Clear output
   */
  const clearOutput = useCallback(() => {
    setState(prev => ({ ...prev, output: '', error: null }));
  }, []);

  /**
   * Cleanup
   */
  const cleanup = useCallback(async () => {
    await webContainerService.cleanup();
    setState({
      isReady: false,
      isLoading: false,
      error: null,
      output: '',
      previewUrl: null,
    });
  }, [webContainerService]);

  // Initialize on mount
  useEffect(() => {
    initialize();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  return {
    ...state,
    initialize,
    mountProject,
    installDependencies,
    startDevServer,
    executeCommand,
    writeFile,
    readFile,
    clearOutput,
    cleanup,
  };
};