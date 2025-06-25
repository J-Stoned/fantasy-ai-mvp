import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { nativeWebSocket, MessageType } from '../lib/NativeWebSocket';
import { api } from '../services/api';
import { Storage, StorageKeys } from '../lib/storage';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnFocus?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, reconnectOnFocus = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const appState = useRef(AppState.currentState);
  const listeners = useRef<Map<string, Set<Function>>>(new Map());

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        reconnectOnFocus &&
        !isConnected
      ) {
        // App came to foreground, reconnect
        connect();
      } else if (nextAppState.match(/inactive|background/) && isConnected) {
        // App going to background, disconnect to save battery
        disconnect();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isConnected, reconnectOnFocus]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      const wsUrl = api.getWebSocketUrl();
      
      await nativeWebSocket.connect({
        url: wsUrl,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        enableCompression: true,
      });

      // Set up event listeners
      const unsubscribeOpen = nativeWebSocket.on('open', () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected');
      });

      const unsubscribeClose = nativeWebSocket.on('close', () => {
        setIsConnected(false);
        console.log('[WebSocket] Disconnected');
      });

      const unsubscribeMessage = nativeWebSocket.on('message', (message) => {
        setLastMessage(message);
        
        // Emit to specific listeners
        const typeListeners = listeners.current.get(message.type);
        if (typeListeners) {
          typeListeners.forEach(callback => callback(message));
        }
        
        // Emit to wildcard listeners
        const wildcardListeners = listeners.current.get('*');
        if (wildcardListeners) {
          wildcardListeners.forEach(callback => callback(message));
        }
      });

      const unsubscribeError = nativeWebSocket.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });

      // Store unsubscribe functions
      return () => {
        unsubscribeOpen();
        unsubscribeClose();
        unsubscribeMessage();
        unsubscribeError();
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      setIsConnected(false);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(async () => {
    await nativeWebSocket.close();
    setIsConnected(false);
  }, []);

  // Send message
  const send = useCallback((type: MessageType, data: any) => {
    return nativeWebSocket.send({
      type,
      data,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random()}`,
    });
  }, []);

  // Subscribe to specific message types
  const subscribe = useCallback((type: string, callback: Function) => {
    if (!listeners.current.has(type)) {
      listeners.current.set(type, new Set());
    }
    listeners.current.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.current.get(type)?.delete(callback);
    };
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      const user = Storage.get(StorageKeys.USER);
      if (user) {
        connect();
      }
    }

    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [autoConnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    send,
    subscribe,
  };
}

// Specific hooks for different features
export function usePlayerUpdates(playerId?: string) {
  const { subscribe, isConnected } = useWebSocket();
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    if (!isConnected || !playerId) return;

    const unsubscribe = subscribe(MessageType.PLAYER_UPDATE, (message: any) => {
      if (message.data.playerId === playerId) {
        setPlayerData(message.data);
      }
    });

    return unsubscribe;
  }, [isConnected, playerId, subscribe]);

  return playerData;
}

export function useLiveScores(gameId?: string) {
  const { subscribe, isConnected } = useWebSocket();
  const [scores, setScores] = useState<any>(null);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(MessageType.SCORE_UPDATE, (message: any) => {
      if (!gameId || message.data.gameId === gameId) {
        setScores(message.data);
      }
    });

    return unsubscribe;
  }, [isConnected, gameId, subscribe]);

  return scores;
}

export function useInjuryAlerts() {
  const { subscribe, isConnected } = useWebSocket();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(MessageType.INJURY_ALERT, (message: any) => {
      setAlerts(prev => [message.data, ...prev].slice(0, 10)); // Keep last 10
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  return alerts;
}