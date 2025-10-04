import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentMounts: number;
  componentUpdates: number;
}

interface UsePerformanceOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  threshold?: number; // Threshold in ms for logging slow renders
}

/**
 * Hook for monitoring component performance
 */
export function usePerformance(
  componentName: string,
  options: UsePerformanceOptions = {}
) {
  const { enabled = process.env.NODE_ENV === 'development', logToConsole = false, threshold = 16 } = options;
  
  const renderStartTime = useRef<number>();
  const mountTime = useRef<number>();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMounts: 0,
    componentUpdates: 0,
  });

  // Track render start time
  if (enabled) {
    renderStartTime.current = performance.now();
  }

  // Track component lifecycle
  useEffect(() => {
    if (!enabled) return;

    const now = performance.now();
    
    if (!mountTime.current) {
      // Component mount
      mountTime.current = now;
      setMetrics(prev => ({
        ...prev,
        componentMounts: prev.componentMounts + 1,
      }));
    } else {
      // Component update
      setMetrics(prev => ({
        ...prev,
        componentUpdates: prev.componentUpdates + 1,
      }));
    }

    // Calculate render time
    if (renderStartTime.current) {
      const renderTime = now - renderStartTime.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      }));

      // Log slow renders
      if (logToConsole && renderTime > threshold) {
        console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  const getMetrics = useCallback(() => metrics, [metrics]);

  const resetMetrics = useCallback(() => {
    setMetrics({
      renderTime: 0,
      componentMounts: 0,
      componentUpdates: 0,
    });
    mountTime.current = undefined;
  }, []);

  return {
    metrics,
    getMetrics,
    resetMetrics,
  };
}

/**
 * Hook for measuring function execution time
 */
export function useExecutionTime() {
  const measureExecution = useCallback(async <T>(
    fn: () => Promise<T> | T,
    label?: string
  ): Promise<{ result: T; executionTime: number }> => {
    const start = performance.now();
    const result = await fn();
    const executionTime = performance.now() - start;

    if (label && process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${executionTime.toFixed(2)}ms`);
    }

    return { result, executionTime };
  }, []);

  return measureExecution;
}

/**
 * Hook for monitoring bundle size and loading times
 */
export function useBundleMetrics() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
  });

  useEffect(() => {
    const updateMetrics = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');

        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
        const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];

        setMetrics({
          loadTime,
          domContentLoaded,
          firstContentfulPaint: fcp?.startTime || 0,
          largestContentfulPaint: lcp?.startTime || 0,
        });
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      updateMetrics();
    } else {
      window.addEventListener('load', updateMetrics);
    }

    return () => {
      window.removeEventListener('load', updateMetrics);
    };
  }, []);

  return metrics;
}

/**
 * Hook for detecting slow network conditions
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    speed: 'unknown' as 'slow' | 'fast' | 'unknown',
    effectiveType: 'unknown',
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setNetworkStatus(prev => ({ ...prev, online: navigator.onLine }));
    };

    const updateNetworkStatus = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkStatus(prev => ({
          ...prev,
          speed: connection.effectiveType === '4g' ? 'fast' : 'slow',
          effectiveType: connection.effectiveType,
        }));
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
    }

    // Initial check
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}