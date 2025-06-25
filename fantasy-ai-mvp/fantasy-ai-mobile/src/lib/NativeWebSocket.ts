import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { Storage, StorageKeys } from './storage';

// Native module interface
interface NativeWebSocketModule {
  connect(url: string, protocols?: string[]): Promise<void>;
  send(data: string): Promise<void>;
  sendBinary(data: ArrayBuffer): Promise<void>;
  close(code?: number, reason?: string): Promise<void>;
  ping(): Promise<void>;
  getState(): Promise<number>;
}

// WebSocket ready states
export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

// Message types
export enum MessageType {
  PLAYER_UPDATE = 'player_update',
  SCORE_UPDATE = 'score_update',
  INJURY_ALERT = 'injury_alert',
  TRADE_NOTIFICATION = 'trade_notification',
  LINEUP_CHANGE = 'lineup_change',
  LIVE_CHAT = 'live_chat',
  GAME_EVENT = 'game_event',
  PREDICTION_UPDATE = 'prediction_update',
}

interface WebSocketMessage {
  type: MessageType;
  data: any;
  timestamp: number;
  id: string;
}

interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  binaryType?: 'arraybuffer' | 'blob';
  enableCompression?: boolean;
}

class NativeWebSocketManager {
  private static instance: NativeWebSocketManager;
  private nativeModule: NativeWebSocketModule;
  private eventEmitter: NativeEventEmitter;
  private config: WebSocketConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected: boolean = false;
  private listeners: Map<string, Set<Function>> = new Map();
  
  private constructor() {
    // Check if native module exists
    if (!NativeModules.RNNativeWebSocket) {
      console.warn('Native WebSocket module not found. Using fallback.');
      // Fallback to standard WebSocket
      this.nativeModule = this.createFallbackModule();
    } else {
      this.nativeModule = NativeModules.RNNativeWebSocket;
    }
    
    this.eventEmitter = new NativeEventEmitter(NativeModules.RNNativeWebSocket);
    this.setupEventListeners();
    
    // Default config
    this.config = {
      url: '',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      binaryType: 'arraybuffer',
      enableCompression: true,
    };
  }
  
  static getInstance(): NativeWebSocketManager {
    if (!NativeWebSocketManager.instance) {
      NativeWebSocketManager.instance = new NativeWebSocketManager();
    }
    return NativeWebSocketManager.instance;
  }
  
  private setupEventListeners() {
    this.eventEmitter.addListener('onOpen', this.handleOpen);
    this.eventEmitter.addListener('onMessage', this.handleMessage);
    this.eventEmitter.addListener('onError', this.handleError);
    this.eventEmitter.addListener('onClose', this.handleClose);
  }
  
  private handleOpen = () => {
    console.log('[NativeWebSocket] Connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued messages
    this.flushMessageQueue();
    
    // Emit event
    this.emit('open', {});
  };
  
  private handleMessage = (event: { data: string; isBinary: boolean }) => {
    try {
      const message: WebSocketMessage = event.isBinary 
        ? this.decodeBinaryMessage(event.data)
        : JSON.parse(event.data);
      
      // Update local cache based on message type
      this.updateLocalCache(message);
      
      // Emit typed event
      this.emit(message.type, message);
      this.emit('message', message);
      
    } catch (error) {
      console.error('[NativeWebSocket] Message parse error:', error);
    }
  };
  
  private handleError = (event: { message: string; code: number }) => {
    console.error('[NativeWebSocket] Error:', event);
    this.emit('error', event);
  };
  
  private handleClose = (event: { code: number; reason: string }) => {
    console.log('[NativeWebSocket] Closed:', event);
    this.isConnected = false;
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Attempt reconnection
    if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 10)) {
      this.scheduleReconnect();
    }
    
    this.emit('close', event);
  };
  
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.nativeModule.ping().catch(error => {
          console.error('[NativeWebSocket] Ping failed:', error);
        });
      }
    }, this.config.heartbeatInterval);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      60000 // Max 1 minute
    );
    
    console.log(`[NativeWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect(this.config);
    }, delay);
  }
  
  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()!;
      this.send(message).catch(error => {
        console.error('[NativeWebSocket] Failed to send queued message:', error);
        // Re-queue on failure
        this.messageQueue.unshift(message);
      });
    }
  }
  
  private updateLocalCache(message: WebSocketMessage) {
    switch (message.type) {
      case MessageType.PLAYER_UPDATE:
        // Update player cache
        const players = Storage.get<any[]>(StorageKeys.PLAYERS) || [];
        const updatedPlayers = players.map(p => 
          p.id === message.data.playerId ? { ...p, ...message.data.updates } : p
        );
        Storage.setWithExpiry(StorageKeys.PLAYERS, updatedPlayers, 5 * 60 * 1000);
        break;
        
      case MessageType.SCORE_UPDATE:
        // Update live scores
        const scores = Storage.get('live_scores') || {};
        scores[message.data.gameId] = message.data;
        Storage.setWithExpiry('live_scores', scores, 60 * 1000);
        break;
        
      case MessageType.LINEUP_CHANGE:
        // Update lineup
        Storage.setWithExpiry(StorageKeys.LINEUP, message.data, 5 * 60 * 1000);
        break;
    }
  }
  
  private decodeBinaryMessage(data: string): WebSocketMessage {
    // Decode base64 to binary
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Simple binary protocol: [type:1][timestamp:8][length:4][data:length]
    const type = bytes[0];
    const timestamp = new DataView(bytes.buffer, 1, 8).getFloat64(0);
    const length = new DataView(bytes.buffer, 9, 4).getUint32(0);
    const messageData = new TextDecoder().decode(bytes.slice(13, 13 + length));
    
    return {
      type: this.getMessageTypeFromByte(type),
      data: JSON.parse(messageData),
      timestamp,
      id: `${timestamp}-${Math.random()}`,
    };
  }
  
  private getMessageTypeFromByte(byte: number): MessageType {
    const types = Object.values(MessageType);
    return types[byte] || MessageType.GAME_EVENT;
  }
  
  private createFallbackModule(): NativeWebSocketModule {
    let ws: WebSocket | null = null;
    
    return {
      connect: async (url: string, protocols?: string[]) => {
        ws = new WebSocket(url, protocols);
        ws.binaryType = 'arraybuffer';
        
        ws.onopen = () => this.handleOpen();
        ws.onmessage = (e) => this.handleMessage({ 
          data: typeof e.data === 'string' ? e.data : btoa(String.fromCharCode(...new Uint8Array(e.data))),
          isBinary: typeof e.data !== 'string'
        });
        ws.onerror = (e) => this.handleError({ message: e.type, code: 0 });
        ws.onclose = (e) => this.handleClose({ code: e.code, reason: e.reason });
      },
      send: async (data: string) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(data);
        } else {
          throw new Error('WebSocket not connected');
        }
      },
      sendBinary: async (data: ArrayBuffer) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(data);
        } else {
          throw new Error('WebSocket not connected');
        }
      },
      close: async (code?: number, reason?: string) => {
        ws?.close(code, reason);
      },
      ping: async () => {
        // Fallback doesn't support ping
      },
      getState: async () => {
        return ws?.readyState || WebSocketState.CLOSED;
      },
    };
  }
  
  // Public API
  async connect(config: WebSocketConfig) {
    this.config = { ...this.config, ...config };
    
    try {
      const token = Storage.get(StorageKeys.AUTH_TOKEN);
      const url = new URL(this.config.url);
      if (token) {
        url.searchParams.set('token', token);
      }
      
      await this.nativeModule.connect(url.toString(), this.config.protocols);
    } catch (error) {
      console.error('[NativeWebSocket] Connection failed:', error);
      this.scheduleReconnect();
      throw error;
    }
  }
  
  async send(message: WebSocketMessage | any) {
    const messageToSend = message.type ? message : {
      type: MessageType.GAME_EVENT,
      data: message,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random()}`,
    };
    
    if (!this.isConnected) {
      // Queue message for later
      this.messageQueue.push(messageToSend);
      return;
    }
    
    try {
      if (this.config.binaryType === 'arraybuffer' && this.config.enableCompression) {
        // Send as binary for better performance
        const data = JSON.stringify(messageToSend);
        const encoded = new TextEncoder().encode(data);
        await this.nativeModule.sendBinary(encoded.buffer);
      } else {
        await this.nativeModule.send(JSON.stringify(messageToSend));
      }
    } catch (error) {
      console.error('[NativeWebSocket] Send failed:', error);
      this.messageQueue.push(messageToSend);
      throw error;
    }
  }
  
  async close(code?: number, reason?: string) {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    await this.nativeModule.close(code, reason);
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
  
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }
  
  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[NativeWebSocket] Event handler error for ${event}:`, error);
      }
    });
  }
  
  getState(): boolean {
    return this.isConnected;
  }
  
  getQueueSize(): number {
    return this.messageQueue.length;
  }
}

export const nativeWebSocket = NativeWebSocketManager.getInstance();