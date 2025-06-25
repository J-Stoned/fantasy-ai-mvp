import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options;

  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect || !session?.user) return;

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket'],
      auth: {
        userId: session.user.id
      }
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
      
      // Authenticate after connection
      socket.emit('authenticate', { userId: session.user.id });
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
    });

    socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    // Re-attach all listeners
    listenersRef.current.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        socket.on(event, callback);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  // Subscribe to events
  const on = useCallback((event: string, callback: Function) => {
    // Add to listeners map
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    // Attach to socket if connected
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(event)?.delete(callback);
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Emit events
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event - socket not connected');
    }
  }, [isConnected]);

  // Join room
  const joinRoom = useCallback((room: string) => {
    emit(`join:${room}`, { userId: session?.user?.id });
  }, [emit, session]);

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    emit(`leave:${room}`, { userId: session?.user?.id });
  }, [emit, session]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    on,
    emit,
    joinRoom,
    leaveRoom
  };
}

// Specific hooks for different features

export function useLeagueUpdates(leagueId: string | null) {
  const { on, emit, isConnected } = useWebSocket();
  const [scores, setScores] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!leagueId || !isConnected) return;

    // Subscribe to league
    emit('subscribe:league', { leagueId });

    // Listen for score updates
    const unsubscribeScores = on('scores:update', (data: any) => {
      if (data.leagueId === leagueId) {
        setScores(data.scores);
        setLastUpdate(new Date(data.timestamp));
      }
    });

    // Listen for lineup updates
    const unsubscribeLineup = on('lineup:updated', (data: any) => {
      console.log('Lineup updated:', data);
    });

    return () => {
      unsubscribeScores();
      unsubscribeLineup();
    };
  }, [leagueId, on, emit, isConnected]);

  return { scores, lastUpdate };
}

export function useBattleChat(battleId: string | null) {
  const { on, emit, isConnected } = useWebSocket();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!battleId || !isConnected) return;

    // Join battle room
    emit('join:battle', { battleId, userId: session?.user?.id });

    // Listen for chat messages
    const unsubscribeChat = on('chat:message', (message: any) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing status
    const unsubscribeTyping = on('typing_status', (data: any) => {
      setTypingUsers(data.typingUsers);
    });

    return () => {
      unsubscribeChat();
      unsubscribeTyping();
    };
  }, [battleId, on, emit, isConnected, session]);

  const sendMessage = useCallback((message: string) => {
    if (!battleId || !session?.user?.id) return;
    
    emit('chat:message', {
      battleId,
      userId: session.user.id,
      message
    });
  }, [battleId, emit, session]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!battleId || !session?.user?.id) return;
    
    emit('typing:status', {
      battleId,
      userId: session.user.id,
      isTyping
    });
  }, [battleId, emit, session]);

  return {
    messages,
    typingUsers,
    sendMessage,
    setTyping
  };
}

export function useNotifications() {
  const { on, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    // Listen for notifications
    const unsubscribe = on('notification', (notification: any) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png'
        });
      }
    });

    return unsubscribe;
  }, [on, isConnected]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}

export function usePlayerUpdates() {
  const { on, isConnected } = useWebSocket();
  const [playerUpdates, setPlayerUpdates] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on('player:update', (data: any) => {
      setPlayerUpdates(prev => {
        const newMap = new Map(prev);
        newMap.set(data.playerId, data.update);
        return newMap;
      });
    });

    return unsubscribe;
  }, [on, isConnected]);

  return playerUpdates;
}

export function useAchievements() {
  const { on, isConnected } = useWebSocket();
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on('achievement:unlocked', (achievement: any) => {
      setUnlockedAchievements(prev => [...prev, achievement]);
      
      // Show achievement toast
      console.log('Achievement unlocked:', achievement);
    });

    return unsubscribe;
  }, [on, isConnected]);

  return unlockedAchievements;
}