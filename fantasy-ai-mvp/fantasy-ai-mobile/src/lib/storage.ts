import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

// Initialize MMKV instance
const storage = new MMKV({
  id: 'fantasy-ai-storage',
  encryptionKey: 'fantasy-ai-encryption-key', // In production, use a secure key
});

// Storage keys
export const StorageKeys = {
  USER: 'user',
  AUTH_TOKEN: 'auth_token',
  LEAGUES: 'leagues',
  PLAYERS: 'players',
  INSIGHTS: 'insights',
  LINEUP: 'lineup',
  PREFERENCES: 'preferences',
  CACHE_TIMESTAMP: 'cache_timestamp',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

// Cache durations (in milliseconds)
export const CacheDuration = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Storage utilities
export const Storage = {
  // Basic operations
  set: (key: string, value: any) => {
    try {
      storage.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  get: <T = any>(key: string): T | null => {
    try {
      const value = storage.getString(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  delete: (key: string) => {
    try {
      storage.delete(key);
      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  },

  clear: () => {
    try {
      storage.clearAll();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  // Cache operations with expiration
  setWithExpiry: (key: string, value: any, duration: number) => {
    const item = {
      value,
      expiry: Date.now() + duration,
    };
    return Storage.set(key, item);
  },

  getWithExpiry: <T = any>(key: string): T | null => {
    const item = Storage.get<{ value: T; expiry: number }>(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      Storage.delete(key);
      return null;
    }

    return item.value;
  },

  // Offline queue management
  addToOfflineQueue: async (action: {
    type: string;
    endpoint: string;
    method: string;
    data?: any;
  }) => {
    const queue = Storage.get<any[]>(StorageKeys.OFFLINE_QUEUE) || [];
    queue.push({
      ...action,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random()}`,
    });
    Storage.set(StorageKeys.OFFLINE_QUEUE, queue);
  },

  processOfflineQueue: async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const queue = Storage.get<any[]>(StorageKeys.OFFLINE_QUEUE) || [];
    if (queue.length === 0) return;

    const processed: string[] = [];

    for (const action of queue) {
      try {
        // Process the action (make API call)
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Storage.get(StorageKeys.AUTH_TOKEN)}`,
          },
          body: action.data ? JSON.stringify(action.data) : undefined,
        });

        if (response.ok) {
          processed.push(action.id);
        }
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }

    // Remove processed items from queue
    const remainingQueue = queue.filter(item => !processed.includes(item.id));
    Storage.set(StorageKeys.OFFLINE_QUEUE, remainingQueue);
  },
};

// Cache manager for API responses
export class CacheManager {
  static async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    duration: number = CacheDuration.MEDIUM
  ): Promise<T> {
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    
    // Try to get cached data
    const cached = Storage.getWithExpiry<T>(key);
    
    // If offline, return cached data even if expired
    if (!netInfo.isConnected && cached !== null) {
      return cached;
    }
    
    // If online and cache is valid, return it
    if (cached !== null) {
      return cached;
    }
    
    // If online, fetch fresh data
    if (netInfo.isConnected) {
      try {
        const fresh = await fetcher();
        Storage.setWithExpiry(key, fresh, duration);
        return fresh;
      } catch (error) {
        // If fetch fails but we have expired cache, return it
        const expiredCache = Storage.get<T>(key);
        if (expiredCache) {
          return expiredCache;
        }
        throw error;
      }
    }
    
    // If offline and no cache, throw error
    throw new Error('No cached data available and device is offline');
  }

  static invalidateCache(pattern?: string) {
    if (!pattern) {
      // Clear all cache
      const keys = storage.getAllKeys();
      keys.forEach(key => {
        if (key !== StorageKeys.USER && key !== StorageKeys.AUTH_TOKEN) {
          Storage.delete(key);
        }
      });
    } else {
      // Clear keys matching pattern
      const keys = storage.getAllKeys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          Storage.delete(key);
        }
      });
    }
  }
}

// Sync manager for background data updates
export class SyncManager {
  private static syncInterval: NodeJS.Timeout | null = null;

  static startBackgroundSync(interval: number = 5 * 60 * 1000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        // Process offline queue
        await Storage.processOfflineQueue();
        
        // Refresh critical data
        await this.refreshCriticalData();
      }
    }, interval);
  }

  static stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private static async refreshCriticalData() {
    try {
      // Refresh user leagues
      const leagues = await this.fetchWithCache('/api/leagues', StorageKeys.LEAGUES, CacheDuration.SHORT);
      
      // Refresh AI insights
      const insights = await this.fetchWithCache('/api/insights', StorageKeys.INSIGHTS, CacheDuration.SHORT);
      
      // Refresh lineup if exists
      const lineup = Storage.get(StorageKeys.LINEUP);
      if (lineup) {
        await this.fetchWithCache('/api/lineup', StorageKeys.LINEUP, CacheDuration.SHORT);
      }
    } catch (error) {
      console.error('Background sync error:', error);
    }
  }

  private static async fetchWithCache(endpoint: string, cacheKey: string, duration: number) {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${Storage.get(StorageKeys.AUTH_TOKEN)}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      Storage.setWithExpiry(cacheKey, data, duration);
      return data;
    }
    
    throw new Error(`Failed to fetch ${endpoint}`);
  }
}

// Network state listener
export const setupNetworkListener = () => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // Device came online, process offline queue
      Storage.processOfflineQueue();
    }
  });
};