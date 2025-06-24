import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: 'score_update' | 'trade_alert' | 'injury_news' | 'lineup_change' | 'achievement' | 'system';
  data: any;
  timestamp: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface LiveScore {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter?: string;
  timeRemaining?: string;
  isLive: boolean;
}

export interface PlayerUpdate {
  playerId: string;
  playerName: string;
  type: 'injury' | 'performance' | 'news';
  status?: string;
  points?: number;
  message: string;
}

class WebSocketService extends EventEmitter {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private _isConnected = false;
  private subscriptions: Set<string> = new Set();

  constructor() {
    super();
    this.setMaxListeners(50); // Increase max listeners for multiple components
  }

  connect(url: string = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001') {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket server:', url);

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this._isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Re-subscribe to previous subscriptions
      this.subscriptions.forEach(channel => {
        this.subscribe(channel);
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this._isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Live score updates
    this.socket.on('score_update', (data: LiveScore) => {
      this.emit('score_update', data);
      this.emit('message', {
        type: 'score_update',
        data,
        timestamp: new Date().toISOString(),
        priority: 'high'
      } as WebSocketMessage);
    });

    // Player updates
    this.socket.on('player_update', (data: PlayerUpdate) => {
      this.emit('player_update', data);
      this.emit('message', {
        type: data.type === 'injury' ? 'injury_news' : 'score_update',
        data,
        timestamp: new Date().toISOString(),
        priority: data.type === 'injury' ? 'urgent' : 'normal'
      } as WebSocketMessage);
    });

    // Trade alerts
    this.socket.on('trade_alert', (data: any) => {
      this.emit('trade_alert', data);
      this.emit('message', {
        type: 'trade_alert',
        data,
        timestamp: new Date().toISOString(),
        priority: 'high'
      } as WebSocketMessage);
    });

    // Achievement unlocked
    this.socket.on('achievement_unlocked', (data: any) => {
      this.emit('achievement_unlocked', data);
      this.emit('message', {
        type: 'achievement',
        data,
        timestamp: new Date().toISOString(),
        priority: 'normal'
      } as WebSocketMessage);
    });

    // System messages
    this.socket.on('system_message', (data: any) => {
      this.emit('system_message', data);
      this.emit('message', {
        type: 'system',
        data,
        timestamp: new Date().toISOString(),
        priority: data.priority || 'low'
      } as WebSocketMessage);
    });

    // Reconnection events
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.emit('reconnecting', attempt);
    });

    this.socket.on('reconnect', () => {
      console.log('✅ WebSocket reconnected');
      this.emit('reconnected');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
      this.emit('reconnect_failed');
    });
  }

  subscribe(channel: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe', channel);
    this.subscriptions.add(channel);
    console.log(`Subscribed to channel: ${channel}`);
  }

  unsubscribe(channel: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    this.socket.emit('unsubscribe', channel);
    this.subscriptions.delete(channel);
    console.log(`Unsubscribed from channel: ${channel}`);
  }

  // Send custom messages
  send(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  // Request specific data
  requestLiveScores(sport?: string) {
    this.send('request_live_scores', { sport });
  }

  requestPlayerStatus(playerId: string) {
    this.send('request_player_status', { playerId });
  }

  requestLeagueUpdates(leagueId: string) {
    this.send('request_league_updates', { leagueId });
  }

  // Utility methods
  isConnected(): boolean {
    return this._isConnected && this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.subscriptions.clear();
    }
  }

  // Simulate data for testing (remove in production)
  simulateData() {
    if (!this._isConnected) return;

    // Simulate live score updates
    setInterval(() => {
      const liveScore: LiveScore = {
        gameId: 'game-123',
        homeTeam: 'Chiefs',
        awayTeam: 'Bills',
        homeScore: Math.floor(Math.random() * 35) + 7,
        awayScore: Math.floor(Math.random() * 35) + 7,
        quarter: 'Q3',
        timeRemaining: '8:42',
        isLive: true
      };
      this.emit('score_update', liveScore);
    }, 5000);

    // Simulate player updates
    setInterval(() => {
      const players = ['Mahomes', 'McCaffrey', 'Hill', 'Kelce'];
      const playerUpdate: PlayerUpdate = {
        playerId: `player-${Math.floor(Math.random() * 100)}`,
        playerName: players[Math.floor(Math.random() * players.length)],
        type: Math.random() > 0.8 ? 'injury' : 'performance',
        points: Math.floor(Math.random() * 30) + 5,
        message: 'TD pass to Hill for 42 yards!'
      };
      this.emit('player_update', playerUpdate);
    }, 8000);

    // Simulate trade alerts
    setInterval(() => {
      if (Math.random() > 0.9) {
        const tradeAlert = {
          id: `trade-${Date.now()}`,
          team1: 'Algorithm Assassins',
          team2: 'Manual Managers',
          players: ['Justin Jefferson', 'Nick Chubb'],
          status: 'proposed'
        };
        this.emit('trade_alert', tradeAlert);
      }
    }, 30000);
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// React Hook for WebSocket
import { useEffect, useState } from 'react';

export function useWebSocket(autoConnect = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (autoConnect && !webSocketService.isConnected()) {
      webSocketService.connect();
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleMessage = (message: WebSocketMessage) => setLastMessage(message);

    webSocketService.on('connected', handleConnect);
    webSocketService.on('disconnected', handleDisconnect);
    webSocketService.on('message', handleMessage);

    // Check initial connection state
    setIsConnected(webSocketService.isConnected());

    return () => {
      webSocketService.off('connected', handleConnect);
      webSocketService.off('disconnected', handleDisconnect);
      webSocketService.off('message', handleMessage);
    };
  }, [autoConnect]);

  return {
    isConnected,
    lastMessage,
    subscribe: (channel: string) => webSocketService.subscribe(channel),
    unsubscribe: (channel: string) => webSocketService.unsubscribe(channel),
    send: (event: string, data: any) => webSocketService.send(event, data),
    on: (event: string, handler: (...args: any[]) => void) => webSocketService.on(event, handler),
    off: (event: string, handler: (...args: any[]) => void) => webSocketService.off(event, handler),
  };
}