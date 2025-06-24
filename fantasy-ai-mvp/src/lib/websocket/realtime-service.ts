/**
 * REAL-TIME WEBSOCKET SERVICE
 * Provides live updates for fantasy sports data
 * Handles player stats, scores, injuries, and notifications
 */

import { EventEmitter } from 'events';

export interface RealtimeConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface RealtimeMessage {
  id: string;
  type: MessageType;
  channel: string;
  data: any;
  timestamp: Date;
}

export enum MessageType {
  PLAYER_UPDATE = 'PLAYER_UPDATE',
  SCORE_UPDATE = 'SCORE_UPDATE',
  INJURY_UPDATE = 'INJURY_UPDATE',
  TRADE_UPDATE = 'TRADE_UPDATE',
  NEWS_UPDATE = 'NEWS_UPDATE',
  LINEUP_CHANGE = 'LINEUP_CHANGE',
  GAME_STATUS = 'GAME_STATUS',
  NOTIFICATION = 'NOTIFICATION',
  SYSTEM = 'SYSTEM'
}

export interface PlayerUpdate {
  playerId: string;
  stats: {
    points?: number;
    assists?: number;
    rebounds?: number;
    yards?: number;
    touchdowns?: number;
    [key: string]: any;
  };
  gameStatus: 'pregame' | 'active' | 'halftime' | 'final';
  fantasyPoints: number;
}

export interface InjuryUpdate {
  playerId: string;
  status: 'questionable' | 'doubtful' | 'out' | 'day-to-day' | 'injured-reserve';
  description: string;
  returnDate?: Date;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface ScoreUpdate {
  gameId: string;
  homeTeam: {
    id: string;
    name: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
  };
  quarter?: number;
  timeRemaining?: string;
  gameStatus: string;
}

export class RealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<RealtimeConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();
  private messageQueue: RealtimeMessage[] = [];
  private isConnected = false;

  constructor(config: RealtimeConfig = {}) {
    super();
    
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_WS_URL || 'wss://api.fantasy.ai/realtime',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected to WebSocket');
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isConnected = false;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.emit('disconnected');
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    
    if (this.isConnected) {
      this.send({
        type: 'SUBSCRIBE',
        channel,
        data: {}
      });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    
    if (this.isConnected) {
      this.send({
        type: 'UNSUBSCRIBE',
        channel,
        data: {}
      });
    }
  }

  /**
   * Send a message to the server
   */
  send(message: { type: string; channel?: string; data: any }): void {
    const msg: RealtimeMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      type: message.type as MessageType,
      channel: message.channel || 'default',
      data: message.data,
      timestamp: new Date()
    };

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      // Queue message for later
      this.messageQueue.push(msg);
    }
  }

  /**
   * Subscribe to player updates
   */
  subscribeToPlayer(playerId: string): void {
    this.subscribe(`player:${playerId}`);
  }

  /**
   * Subscribe to game updates
   */
  subscribeToGame(gameId: string): void {
    this.subscribe(`game:${gameId}`);
  }

  /**
   * Subscribe to league updates
   */
  subscribeToLeague(leagueId: string): void {
    this.subscribe(`league:${leagueId}`);
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(userId: string): void {
    this.subscribe(`user:${userId}:notifications`);
  }

  private handleOpen(): void {
    console.log('✅ WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Resubscribe to all channels
    for (const channel of this.subscriptions) {
      this.send({
        type: 'SUBSCRIBE',
        channel,
        data: {}
      });
    }
    
    // Send queued messages
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) {
        this.ws!.send(JSON.stringify(msg));
      }
    }
    
    // Start heartbeat
    this.startHeartbeat();
    
    this.emit('connected');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: RealtimeMessage = JSON.parse(event.data);
      
      // Emit general message event
      this.emit('message', message);
      
      // Emit typed events
      switch (message.type) {
        case MessageType.PLAYER_UPDATE:
          this.emit('playerUpdate', message.data as PlayerUpdate);
          break;
          
        case MessageType.SCORE_UPDATE:
          this.emit('scoreUpdate', message.data as ScoreUpdate);
          break;
          
        case MessageType.INJURY_UPDATE:
          this.emit('injuryUpdate', message.data as InjuryUpdate);
          break;
          
        case MessageType.TRADE_UPDATE:
          this.emit('tradeUpdate', message.data);
          break;
          
        case MessageType.NEWS_UPDATE:
          this.emit('newsUpdate', message.data);
          break;
          
        case MessageType.LINEUP_CHANGE:
          this.emit('lineupChange', message.data);
          break;
          
        case MessageType.GAME_STATUS:
          this.emit('gameStatus', message.data);
          break;
          
        case MessageType.NOTIFICATION:
          this.emit('notification', message.data);
          break;
          
        case MessageType.SYSTEM:
          this.handleSystemMessage(message.data);
          break;
      }
      
      // Emit channel-specific events
      if (message.channel) {
        this.emit(`channel:${message.channel}`, message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.emit('error', event);
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.isConnected = false;
    this.clearTimers();
    
    this.emit('disconnected', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // Attempt reconnection if not a clean close
    if (!event.wasClean && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleSystemMessage(data: any): void {
    if (data.type === 'PONG') {
      // Heartbeat response
      return;
    }
    
    if (data.type === 'ERROR') {
      console.error('System error:', data.message);
      this.emit('systemError', data);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * this.reconnectAttempts;
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'PING',
          data: { timestamp: Date.now() }
        });
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Get connection status
   */
  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get subscribed channels
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  /**
   * Mock real-time updates for demo
   */
  startMockUpdates(): void {
    // Simulate player updates
    setInterval(() => {
      if (this.isConnected) {
        const mockPlayerUpdate: PlayerUpdate = {
          playerId: `player_${Math.floor(Math.random() * 100)}`,
          stats: {
            points: Math.floor(Math.random() * 30),
            assists: Math.floor(Math.random() * 10),
            rebounds: Math.floor(Math.random() * 15)
          },
          gameStatus: 'active',
          fantasyPoints: Math.random() * 40
        };
        
        this.emit('playerUpdate', mockPlayerUpdate);
      }
    }, 5000);

    // Simulate score updates
    setInterval(() => {
      if (this.isConnected) {
        const mockScoreUpdate: ScoreUpdate = {
          gameId: `game_${Math.floor(Math.random() * 10)}`,
          homeTeam: {
            id: 'team_1',
            name: 'Lakers',
            score: Math.floor(Math.random() * 120)
          },
          awayTeam: {
            id: 'team_2',
            name: 'Warriors',
            score: Math.floor(Math.random() * 120)
          },
          quarter: Math.ceil(Math.random() * 4),
          timeRemaining: `${Math.floor(Math.random() * 12)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          gameStatus: 'active'
        };
        
        this.emit('scoreUpdate', mockScoreUpdate);
      }
    }, 10000);

    // Simulate injury updates
    setInterval(() => {
      if (this.isConnected && Math.random() < 0.1) {
        const statuses: InjuryUpdate['status'][] = ['questionable', 'doubtful', 'out', 'day-to-day'];
        const mockInjuryUpdate: InjuryUpdate = {
          playerId: `player_${Math.floor(Math.random() * 100)}`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          description: 'Lower body injury',
          severity: Math.random() < 0.5 ? 'minor' : 'moderate'
        };
        
        this.emit('injuryUpdate', mockInjuryUpdate);
      }
    }, 30000);
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();