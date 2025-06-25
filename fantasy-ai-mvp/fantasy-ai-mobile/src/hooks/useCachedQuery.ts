import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { CacheManager, CacheDuration } from '../lib/storage';

interface UseCachedQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryFn'> {
  cacheKey: string;
  cacheDuration?: number;
  queryFn: () => Promise<TData>;
}

export function useCachedQuery<TData>({
  cacheKey,
  cacheDuration = CacheDuration.MEDIUM,
  queryFn,
  ...options
}: UseCachedQueryOptions<TData>) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Check initial state
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  }, []);

  return useQuery({
    ...options,
    queryFn: async () => {
      return CacheManager.getCachedData(cacheKey, queryFn, cacheDuration);
    },
    // Retry less aggressively when offline
    retry: isOffline ? false : options.retry,
    // Keep stale data longer when offline
    staleTime: isOffline ? Infinity : options.staleTime,
    // Don't refetch on window focus when offline
    refetchOnWindowFocus: isOffline ? false : options.refetchOnWindowFocus,
    // Custom error message for offline state
    meta: {
      ...options.meta,
      isOffline,
    },
  });
}

// Hook for mutations with offline support
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { Storage, StorageKeys } from '../lib/storage';

interface UseOfflineMutationOptions<TData, TVariables> extends UseMutationOptions<TData, Error, TVariables> {
  offlineAction: {
    type: string;
    endpoint: string;
    method: string;
  };
}

export function useOfflineMutation<TData = unknown, TVariables = unknown>({
  offlineAction,
  mutationFn,
  onSuccess,
  ...options
}: UseOfflineMutationOptions<TData, TVariables>) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  }, []);

  return useMutation({
    ...options,
    mutationFn: async (variables: TVariables) => {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        // Queue the action for later
        await Storage.addToOfflineQueue({
          ...offlineAction,
          data: variables,
        });
        
        // Return a placeholder response
        return { queued: true, variables } as TData;
      }
      
      // If online, execute normally
      if (mutationFn) {
        return mutationFn(variables);
      }
      
      throw new Error('No mutation function provided');
    },
    onSuccess: (data, variables, context) => {
      // Only call onSuccess if not queued
      if (!(data as any)?.queued && onSuccess) {
        onSuccess(data, variables, context);
      }
    },
  });
}