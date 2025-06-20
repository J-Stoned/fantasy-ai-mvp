"use client";

import { useState, useEffect, useCallback } from 'react';

export interface LivePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  projectedPoints: number;
  lastWeekPoints: number;
  seasonAverage: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  matchupRating: 'excellent' | 'good' | 'average' | 'difficult';
  isStarter: boolean;
  ownership: number;
  injuryStatus?: string;
  fantasyRelevance?: 'elite' | 'solid' | 'flex' | 'bench';
  recentNews?: string[];
  weatherImpact?: number;
}

export interface LiveSportsData {
  players: LivePlayer[];
  meta: {
    total: number;
    generatedAt: string;
    dataSource: 'live' | 'fallback';
    nextUpdate?: string;
    note?: string;
  };
}

interface UseLiveSportsDataOptions {
  position?: string;
  team?: string;
  limit?: number;
  refreshInterval?: number; // milliseconds
  autoRefresh?: boolean;
}

interface UseLiveSportsDataReturn {
  data: LiveSportsData | null;
  players: LivePlayer[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isLive: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

export function useLiveSportsData(options: UseLiveSportsDataOptions = {}): UseLiveSportsDataReturn {
  const {
    position,
    team,
    limit = 50,
    refreshInterval = 30 * 1000, // 30 seconds default
    autoRefresh = true
  } = options;

  const [data, setData] = useState<LiveSportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (position) params.append('position', position);
      if (team) params.append('team', team);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/sports/live-players?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sports data: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('API returned error response');
      }

      setData(result);
      setLastUpdated(new Date());
      
      // Log data source for debugging
      console.log(`🏈 Sports data updated from ${result.meta.dataSource} source at ${new Date().toLocaleTimeString()}`);
      
    } catch (err) {
      console.error('❌ Failed to fetch live sports data:', err);
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [position, team, limit]);

  const startAutoRefresh = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    
    const timer = setInterval(() => {
      console.log('🔄 Auto-refreshing sports data (30s interval)...');
      fetchData();
    }, refreshInterval);
    
    setRefreshTimer(timer);
  }, [fetchData, refreshInterval, refreshTimer]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }
  }, [refreshTimer]);

  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered...');
    await fetchData();
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, []);

  const players = data?.players || [];
  const isLive = data?.meta?.dataSource === 'live';

  return {
    data,
    players,
    isLoading,
    isError,
    error,
    isLive,
    lastUpdated,
    refresh,
    startAutoRefresh,
    stopAutoRefresh
  };
}

// Specialized hooks for common use cases
export function useLiveTopPlayers(limit: number = 20) {
  return useLiveSportsData({ limit });
}

export function useLivePlayersByPosition(position: string, limit: number = 15) {
  return useLiveSportsData({ position, limit });
}

export function useLiveTeamPlayers(team: string) {
  return useLiveSportsData({ team });
}

// Hook for real-time player updates with WebSocket integration
export function useRealTimePlayerUpdates(playerIds: string[]) {
  const [updates, setUpdates] = useState<{ [playerId: string]: Partial<LivePlayer> }>({});
  
  useEffect(() => {
    // TODO: Integrate with WebSocket manager for real-time updates
    // This would connect to our real-time sports pipeline
    console.log('🔴 Real-time updates would be connected for players:', playerIds);
    
    return () => {
      // Cleanup WebSocket connections
    };
  }, [playerIds]);

  return updates;
}