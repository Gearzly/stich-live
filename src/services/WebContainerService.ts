/**
 * WebContainer Service
 * Handles in-browser code execution and preview using WebContainers
 */

import { WebContainer, FileSystemTree } from '@webcontainer/api';

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  url?: string;
}

export class WebContainerService {
  private static instance: WebContainerService;
  private webContainer: WebContainer | null = null;
  private isBooting = false;

  private constructor() {}

  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  /**
   * Initialize WebContainer instance
   */
  async initialize(): Promise<void> {
    if (this.webContainer || this.isBooting) {
      return;
    }

    this.isBooting = true;

    try {
      // Boot WebContainer
      this.webContainer = await WebContainer.boot();
      console.log('WebContainer booted successfully');
    } catch (error) {
      console.error('Failed to boot WebContainer:', error);
      throw error;
    } finally {
      this.isBooting = false;
    }
  }

  /**
   * Check if WebContainer is ready
   */
  isReady(): boolean {
    return this.webContainer !== null;
  }

  /**
   * Mount files to WebContainer
   */
  async mountFiles(files: FileSystemTree): Promise<void> {
    if (!this.webContainer) {
      throw new Error('WebContainer not initialized');
    }

    await this.webContainer.mount(files);
  }

  /**
   * Install dependencies
   */
  async installDependencies(): Promise<ExecutionResult> {
    if (!this.webContainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const installProcess = await this.webContainer.spawn('npm', ['install']);
      const output = await this.streamOutput(installProcess);
      
      const exitCode = await installProcess.exit;
      
      return {
        success: exitCode === 0,
        output,
        ...(exitCode !== 0 && { error: `Install failed with exit code ${exitCode}` }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Install failed',
      };
    }
  }

  /**
   * Start development server
   */
  async startDevServer(): Promise<ExecutionResult> {
    if (!this.webContainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      // Start the dev server
      const serverProcess = await this.webContainer.spawn('npm', ['run', 'dev']);
      
      // Listen for server ready
      return new Promise((resolve) => {
        let output = '';
        
        serverProcess.output.pipeTo(
          new WritableStream({
            write: (data) => {
              output += data;
              console.log(data);
              
              // Check if server is ready
              if (data.includes('Local:') || data.includes('localhost')) {
                resolve({
                  success: true,
                  output,
                  url: 'http://localhost:3000',
                });
              }
            },
          })
        );

        // Fallback timeout
        setTimeout(() => {
          resolve({
            success: true,
            output,
            url: 'http://localhost:3000', // Default assumption
          });
        }, 10000);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Server start failed',
      };
    }
  }

  /**
   * Execute a command
   */
  async executeCommand(command: string, args: string[] = []): Promise<ExecutionResult> {
    if (!this.webContainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const process = await this.webContainer.spawn(command, args);
      const output = await this.streamOutput(process);
      
      const exitCode = await process.exit;
      
      return {
        success: exitCode === 0,
        output,
        ...(exitCode !== 0 && { error: `Command failed with exit code ${exitCode}` }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed',
      };
    }
  }

  /**
   * Create a new file
   */
  async writeFile(path: string, contents: string): Promise<void> {
    if (!this.webContainer) {
      throw new Error('WebContainer not initialized');
    }

    await this.webContainer.fs.writeFile(path, contents);
  }

  /**
   * Read a file
   */
  async readFile(path: string): Promise<string> {
    if (!this.webContainer) {
      throw new Error('WebContainer not initialized');
    }

    return this.webContainer.fs.readFile(path, 'utf-8');
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<string[]> {
    if (!this.webContainer) {
      throw new Error('WebContainer not initialized');
    }

    return this.webContainer.fs.readdir(path);
  }

  /**
   * Stream process output
   */
  private async streamOutput(process: any): Promise<string> {
    let output = '';
    
    const reader = process.output.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      output += value;
    }
    
    return output;
  }

  /**
   * Cleanup WebContainer
   */
  async cleanup(): Promise<void> {
    if (this.webContainer) {
      // WebContainer doesn't have explicit cleanup, but we can reset our reference
      this.webContainer = null;
    }
  }
}