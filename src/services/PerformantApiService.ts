import { memoryCache, cacheKey, withCache } from './CacheService';

interface RequestOptions {
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  deduplicate?: boolean;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

class PerformantApiService {
  private baseURL: string;
  private requestQueue = new Map<string, Promise<any>>();
  private defaultOptions: RequestOptions = {
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    deduplicate: true,
  };

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    apiOptions: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...apiOptions };
    const url = `${this.baseURL}${endpoint}`;
    const requestKey = cacheKey(endpoint, JSON.stringify(options));

    // Check cache first
    if (mergedOptions.cache && options.method === 'GET') {
      const cached = memoryCache.get(requestKey) as ApiResponse<T> | null;
      if (cached) {
        return cached;
      }
    }

    // Deduplicate identical requests
    if (mergedOptions.deduplicate) {
      const existingRequest = this.requestQueue.get(requestKey);
      if (existingRequest) {
        return existingRequest;
      }
    }

    const requestPromise = this.executeRequest<T>(url, options, mergedOptions);

    // Store request in queue for deduplication
    if (mergedOptions.deduplicate) {
      this.requestQueue.set(requestKey, requestPromise);
      
      // Clean up after request completes
      requestPromise.finally(() => {
        this.requestQueue.delete(requestKey);
      });
    }

    const response = await requestPromise;

    // Cache successful GET requests
    if (mergedOptions.cache && options.method === 'GET' && response.success) {
      memoryCache.set(requestKey, response, mergedOptions.cacheTTL);
    }

    return response;
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    apiOptions: RequestOptions
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (apiOptions.retries || 0); attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          {
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
            ...options,
          },
          apiOptions.timeout || 10000
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
          data,
          success: true,
          timestamp: Date.now(),
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            break; // Don't retry timeouts
          }
          if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
            break; // Don't retry client errors
          }
        }

        // Wait before retry
        if (attempt < (apiOptions.retries || 0)) {
          await new Promise(resolve => setTimeout(resolve, apiOptions.retryDelay || 1000));
        }
      }
    }

    return {
      data: null as T,
      success: false,
      error: lastError?.message || 'Request failed',
      timestamp: Date.now(),
    };
  }

  // HTTP methods with caching
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, options);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        ...(data && { body: JSON.stringify(data) }),
      },
      { ...options, cache: false } // Don't cache POST requests
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PUT',
        ...(data && { body: JSON.stringify(data) }),
      },
      { ...options, cache: false }
    );
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      { method: 'DELETE' },
      { ...options, cache: false }
    );
  }

  // Batch requests for efficiency
  async batch<T>(requests: Array<{ endpoint: string; options?: RequestOptions }>): Promise<ApiResponse<T>[]> {
    const promises = requests.map(({ endpoint, options }) => 
      this.get<T>(endpoint, options)
    );
    
    return Promise.all(promises);
  }

  // Prefetch for better perceived performance
  prefetch(endpoints: string[], options: RequestOptions = {}): void {
    endpoints.forEach(endpoint => {
      this.get(endpoint, { ...options, cache: true });
    });
  }

  // Clear cache
  clearCache(): void {
    memoryCache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return memoryCache.getStats();
  }
}

// Create cached versions of common functions
export const cachedApiCall = withCache(
  async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  (url, options) => cacheKey(url, JSON.stringify(options)),
  { ttl: 5 * 60 * 1000, maxSize: 50 }
);

export default PerformantApiService;