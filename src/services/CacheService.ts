interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  strategy?: 'lru' | 'fifo'; // Eviction strategy
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Map<string, number>(); // For LRU
  private accessCounter = 0;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      strategy: 'lru',
      ...options,
    };
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.options.ttl;
    
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt: now + timeToLive,
    };

    // Remove expired entries before adding new one
    this.cleanup();

    // Check if we need to evict entries
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access order for LRU
    if (this.options.strategy === 'lru') {
      this.accessOrder.set(key, ++this.accessCounter);
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  keys(): string[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
      }
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;

    if (this.options.strategy === 'lru') {
      // Find least recently used
      let oldestAccess = Infinity;
      keyToEvict = '';
      
      for (const [key, accessTime] of this.accessOrder.entries()) {
        if (accessTime < oldestAccess) {
          oldestAccess = accessTime;
          keyToEvict = key;
        }
      }
    } else {
      // FIFO - remove first inserted (oldest timestamp)
      let oldestTimestamp = Infinity;
      keyToEvict = '';
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          keyToEvict = key;
        }
      }
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.accessOrder.delete(keyToEvict);
    }
  }

  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: this.accessCounter > 0 ? this.cache.size / this.accessCounter : 0,
      strategy: this.options.strategy,
      ttl: this.options.ttl,
    };
  }
}

// Browser storage cache with compression
class PersistentCache<T> {
  private prefix: string;
  private compress: boolean;

  constructor(prefix: string = 'app_cache_', compress: boolean = false) {
    this.prefix = prefix;
    this.compress = compress;
  }

  async set(key: string, value: T, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const entry = {
        data: value,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      let serialized = JSON.stringify(entry);
      
      if (this.compress && 'CompressionStream' in window) {
        // Use compression if available
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(serialized));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        serialized = btoa(String.fromCharCode(...compressed));
      }

      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  async get(key: string): Promise<T | null> {
    try {
      let serialized = localStorage.getItem(this.prefix + key);
      
      if (!serialized) {
        return null;
      }

      if (this.compress && 'DecompressionStream' in window) {
        // Decompress if compressed
        try {
          const compressed = Uint8Array.from(atob(serialized), c => c.charCodeAt(0));
          const stream = new DecompressionStream('gzip');
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();
          
          writer.write(compressed);
          writer.close();
          
          const chunks: Uint8Array[] = [];
          let done = false;
          
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }
          
          const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            decompressed.set(chunk, offset);
            offset += chunk.length;
          }
          
          serialized = new TextDecoder().decode(decompressed);
        } catch {
          // Fall back to uncompressed data
        }
      }

      const entry: CacheEntry<T> = JSON.parse(serialized);
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  async cleanup(): Promise<void> {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        try {
          const serialized = localStorage.getItem(key);
          if (serialized) {
            const entry: CacheEntry<any> = JSON.parse(serialized);
            if (now > entry.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// Cache service instances
export const memoryCache = new MemoryCache();
export const persistentCache = new PersistentCache();

// Cache decorators and utilities
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T {
  const cache = new MemoryCache<Awaited<ReturnType<T>>>(options);
  
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

export function cacheKey(...parts: (string | number | boolean)[]): string {
  return parts.map(part => String(part)).join(':');
}

// Cleanup expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    persistentCache.cleanup();
  }, 10 * 60 * 1000); // Every 10 minutes
}