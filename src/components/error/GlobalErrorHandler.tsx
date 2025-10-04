/**
 * Global Error Handler Component
 * Sets up global error handling and provides error reporting
 */

import React, { useEffect } from 'react';
import { useGlobalErrorHandler } from '../../hooks/useError';
import { useNotifications } from '../../contexts/NotificationContext';

interface GlobalErrorHandlerProps {
  children: React.ReactNode;
  enableReporting?: boolean;
}

export function GlobalErrorHandler({ children, enableReporting = true }: GlobalErrorHandlerProps) {
  const { setupGlobalHandlers } = useGlobalErrorHandler();
  const { showError } = useNotifications();

  useEffect(() => {
    const cleanup = setupGlobalHandlers();

    // Setup additional error reporting if enabled
    if (enableReporting) {
      // Monitor for console errors in development
      if (process.env.NODE_ENV === 'development') {
        const originalError = console.error;
        console.error = (...args) => {
          originalError.apply(console, args);
          
          // Show notification for console errors that might be missed
          if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
            // Skip React warnings in development
            return;
          }
          
          showError(
            'Console Error',
            'An error was logged to the console. Check developer tools for details.',
            { duration: 3000 }
          );
        };

        return () => {
          console.error = originalError;
          cleanup();
        };
      }
    }

    return cleanup;
  }, [setupGlobalHandlers, showError, enableReporting]);

  return <>{children}</>;
}

// Error reporting service
export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private apiEndpoint = '/api/errors';

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  async reportError(error: {
    errorId: string;
    message: string;
    stack?: string;
    componentStack?: string;
    userAgent: string;
    url: string;
    timestamp: string;
    userId?: string;
    sessionId?: string;
    buildVersion?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          environment: process.env.NODE_ENV,
          buildVersion: process.env.VITE_BUILD_VERSION || 'unknown',
        }),
      });

      return response.ok;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      return false;
    }
  }

  async reportPerformanceIssue(issue: {
    type: 'slow_component' | 'memory_leak' | 'large_bundle' | 'slow_api';
    componentName?: string;
    duration?: number;
    memoryUsage?: number;
    bundleSize?: number;
    apiEndpoint?: string;
    details?: any;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...issue,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to report performance issue:', error);
      return false;
    }
  }
}