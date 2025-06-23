import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from './AuthContext';
import { useStore } from '../store';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latency: number;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback?: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WS_URL || 'wss://api.fantasy.ai';
const RECONNECT_INTERVAL = 5000;
const HEARTBEAT_INTERVAL = 30000;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const appStateRef = useRef(AppState.currentState);
  
  const { user, isAuthenticated } = useAuth();
  const { setOffline, addNotification } = useStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    // Handle app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Handle network state changes
    const netInfoSubscription = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      appStateSubscription.remove();
      netInfoSubscription();
      disconnect();
    };
  }, [isAuthenticated, user]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      if (isAuthenticated && !isConnected) {
        connect();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to the background
      // Keep connection alive for important updates
    }
    appStateRef.current = nextAppState;
  };

  const handleNetworkChange = (state: any) => {
    setOffline(!state.isConnected);
    
    if (state.isConnected && isAuthenticated && !isConnected) {
      connect();
    } else if (!state.isConnected) {
      disconnect();
    }
  };

  const connect = () => {
    if (socketRef.current?.connected) return;

    const newSocket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token: user?.token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: RECONNECT_INTERVAL,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setOffline(false);
      startHeartbeat();
      
      // Auto-join user rooms
      if (user) {
        newSocket.emit('join:user', user.id);
        user.leagues?.forEach((leagueId: string) => {
          newSocket.emit('join:league', leagueId);
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      stopHeartbeat();
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        attemptReconnect();
      }
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Heartbeat for latency measurement
    newSocket.on('pong', (timestamp: number) => {
      const now = Date.now();
      setLatency(now - timestamp);
    });

    // Real-time events
    setupRealtimeListeners(newSocket);
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    stopHeartbeat();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    
    setIsConnected(false);
  };

  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isAuthenticated && !isConnected) {
        connect();
      }
    }, RECONNECT_INTERVAL);
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping', Date.now());
      }
    }, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
  };

  const setupRealtimeListeners = (socket: Socket) => {
    // Score updates
    socket.on('score:update', (data) => {
      console.log('Score update:', data);
      // Update store with new scores
    });

    // Player updates
    socket.on('player:update', (data) => {
      console.log('Player update:', data);
      // Update player data in store
    });

    // Injury alerts
    socket.on('injury:alert', (data) => {
      addNotification({
        id: `injury-${Date.now()}`,
        type: 'injury',
        title: 'Injury Alert',
        message: `${data.playerName} - ${data.status}`,
        timestamp: new Date(),
        read: false,
        priority: 'high',
        data,
      });
    });

    // Trade notifications
    socket.on('trade:offer', (data) => {
      addNotification({
        id: `trade-${data.tradeId}`,
        type: 'trade',
        title: 'New Trade Offer',
        message: `Trade offer from ${data.fromTeam}`,
        timestamp: new Date(),
        read: false,
        priority: 'high',
        actionUrl: `fantasyai://trade/${data.tradeId}`,
        data,
      });
    });

    // Lineup alerts
    socket.on('lineup:alert', (data) => {
      addNotification({
        id: `lineup-${Date.now()}`,
        type: 'lineup',
        title: 'Lineup Alert',
        message: data.message,
        timestamp: new Date(),
        read: false,
        priority: 'urgent',
        data,
      });
    });

    // Live game updates
    socket.on('game:live', (data) => {
      console.log('Live game update:', data);
      // Update live scores
    });
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const unsubscribe = (event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', event);
    }
  };

  const joinRoom = (room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:room', room);
    }
  };

  const leaveRoom = (room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:room', room);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        latency,
        subscribe,
        unsubscribe,
        emit,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}