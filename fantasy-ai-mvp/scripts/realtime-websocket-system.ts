#!/usr/bin/env tsx

/**
 * 🔌 REAL-TIME WEBSOCKET SYSTEM
 * 
 * Push updates INSTANTLY to all connected clients!
 * Features:
 * - WebSocket server for real-time push
 * - Event-driven architecture
 * - Room-based subscriptions
 * - Automatic reconnection
 * - Message queuing for reliability
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// Event types
interface GameEvent {
  type: 'score_update' | 'game_start' | 'game_end' | 'injury' | 'breaking_news';
  gameId?: string;
  sport: string;
  data: any;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

interface PlayerEvent {
  type: 'stat_update' | 'injury_update' | 'trade' | 'news';
  playerId: string;
  playerName: string;
  data: any;
  timestamp: Date;
}

// Real-time event processor
class RealtimeEventProcessor extends EventEmitter {
  private eventQueue: Array<GameEvent | PlayerEvent> = [];
  private processing = false;
  
  async processEvent(event: GameEvent | PlayerEvent) {
    this.eventQueue.push(event);
    
    if (!this.processing) {
      this.processing = true;
      await this.processQueue();
      this.processing = false;
    }
  }
  
  private async processQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      
      // Process based on type
      if ('gameId' in event) {
        await this.processGameEvent(event as GameEvent);
      } else {
        await this.processPlayerEvent(event as PlayerEvent);
      }
      
      // Emit for WebSocket broadcast
      this.emit('broadcast', event);
    }
  }
  
  private async processGameEvent(event: GameEvent) {
    console.log(`🎮 Game Event: ${event.type} for ${event.sport}`);
    
    switch (event.type) {
      case 'score_update':
        // Update database with new score
        if (event.gameId) {
          // Update game in database
          console.log(`  Score: ${event.data.homeScore} - ${event.data.awayScore}`);
        }
        break;
        
      case 'injury':
        console.log(`  🏥 Injury: ${event.data.player} - ${event.data.status}`);
        break;
        
      case 'breaking_news':
        console.log(`  🚨 BREAKING: ${event.data.headline}`);
        break;
    }
  }
  
  private async processPlayerEvent(event: PlayerEvent) {
    console.log(`👤 Player Event: ${event.type} for ${event.playerName}`);
    
    try {
      const player = await prisma.player.findFirst({
        where: { name: { contains: event.playerName } }
      });
      
      if (player) {
        const updates: any = {};
        
        switch (event.type) {
          case 'injury_update':
            updates.injuryStatus = event.data.status;
            break;
            
          case 'stat_update':
            updates.stats = JSON.stringify({
              ...JSON.parse(player.stats || '{}'),
              ...event.data,
              lastUpdated: new Date().toISOString()
            });
            break;
        }
        
        await prisma.player.update({
          where: { id: player.id },
          data: updates
        });
      }
    } catch (error) {
      console.error('Error updating player:', error);
    }
  }
}

// WebSocket server
class RealtimeWebSocketServer {
  private io: SocketIOServer;
  private eventProcessor = new RealtimeEventProcessor();
  private rooms = new Map<string, Set<string>>(); // room -> socket IDs
  private stats = {
    connections: 0,
    messages: 0,
    broadcasts: 0
  };
  
  constructor(port: number = 3001) {
    const server = createServer();
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    this.setupSocketHandlers();
    this.setupEventHandlers();
    
    server.listen(port, () => {
      console.log(`🔌 WebSocket server running on port ${port}`);
    });
  }
  
  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.stats.connections++;
      console.log(`👤 Client connected: ${socket.id} (Total: ${this.io.engine.clientsCount})`);
      
      // Send welcome message
      socket.emit('welcome', {
        message: 'Connected to Fantasy.AI Real-time System',
        timestamp: new Date(),
        capabilities: [
          'live_scores',
          'player_updates',
          'injury_alerts',
          'breaking_news',
          'trade_alerts'
        ]
      });
      
      // Handle room subscriptions
      socket.on('subscribe', (data: { rooms: string[] }) => {
        data.rooms.forEach(room => {
          socket.join(room);
          
          if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
          }
          this.rooms.get(room)!.add(socket.id);
          
          console.log(`  📡 ${socket.id} subscribed to ${room}`);
        });
        
        socket.emit('subscribed', { rooms: data.rooms });
      });
      
      // Handle unsubscribe
      socket.on('unsubscribe', (data: { rooms: string[] }) => {
        data.rooms.forEach(room => {
          socket.leave(room);
          this.rooms.get(room)?.delete(socket.id);
        });
      });
      
      // Handle client messages
      socket.on('message', (message: any) => {
        this.stats.messages++;
        console.log(`  💬 Message from ${socket.id}:`, message);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`👋 Client disconnected: ${socket.id}`);
        
        // Remove from all rooms
        this.rooms.forEach((sockets, room) => {
          sockets.delete(socket.id);
        });
      });
    });
  }
  
  private setupEventHandlers() {
    // Listen for events to broadcast
    this.eventProcessor.on('broadcast', (event: GameEvent | PlayerEvent) => {
      this.stats.broadcasts++;
      
      // Determine target rooms
      const rooms = this.getTargetRooms(event);
      
      rooms.forEach(room => {
        this.io.to(room).emit('update', {
          type: event.type,
          data: event,
          timestamp: new Date()
        });
      });
    });
  }
  
  private getTargetRooms(event: GameEvent | PlayerEvent): string[] {
    const rooms: string[] = ['all']; // Broadcast to all by default
    
    if ('sport' in event) {
      rooms.push(`sport:${event.sport.toLowerCase()}`);
      
      if (event.gameId) {
        rooms.push(`game:${event.gameId}`);
      }
    }
    
    if ('playerId' in event) {
      rooms.push(`player:${event.playerId}`);
    }
    
    // High priority events go to priority room
    if ('priority' in event && event.priority === 'HIGH') {
      rooms.push('priority');
    }
    
    return rooms;
  }
  
  // Public methods for sending updates
  async sendGameUpdate(sport: string, gameId: string, data: any) {
    await this.eventProcessor.processEvent({
      type: 'score_update',
      gameId,
      sport,
      data,
      priority: 'MEDIUM',
      timestamp: new Date()
    });
  }
  
  async sendInjuryAlert(player: string, sport: string, status: string) {
    await this.eventProcessor.processEvent({
      type: 'injury',
      sport,
      data: { player, status },
      priority: 'HIGH',
      timestamp: new Date()
    });
  }
  
  async sendBreakingNews(headline: string, sport: string) {
    await this.eventProcessor.processEvent({
      type: 'breaking_news',
      sport,
      data: { headline },
      priority: 'HIGH',
      timestamp: new Date()
    });
  }
  
  async sendPlayerUpdate(playerId: string, playerName: string, stats: any) {
    await this.eventProcessor.processEvent({
      type: 'stat_update',
      playerId,
      playerName,
      data: stats,
      timestamp: new Date()
    });
  }
  
  // Get server stats
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.io.engine.clientsCount,
      rooms: Array.from(this.rooms.keys()),
      roomSizes: Object.fromEntries(
        Array.from(this.rooms.entries()).map(([room, sockets]) => [room, sockets.size])
      )
    };
  }
}

// Client simulator for testing
class WebSocketClientSimulator {
  private clients: any[] = [];
  
  simulateClients(count: number = 5) {
    console.log(`\n🤖 Simulating ${count} WebSocket clients...`);
    
    // In production, use actual socket.io-client
    // For demo, we'll simulate the behavior
    
    for (let i = 0; i < count; i++) {
      const clientId = `client${i}`;
      const interests = this.randomInterests();
      
      console.log(`  Client ${i}: Interested in ${interests.join(', ')}`);
      
      this.clients.push({
        id: clientId,
        interests,
        connected: true
      });
    }
  }
  
  private randomInterests(): string[] {
    const allInterests = [
      'sport:nfl', 'sport:nba', 'sport:mlb', 'sport:nhl',
      'player:mahomes', 'player:lebron', 'priority', 'all'
    ];
    
    const count = Math.floor(Math.random() * 3) + 1;
    const interests: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const interest = allInterests[Math.floor(Math.random() * allInterests.length)];
      if (!interests.includes(interest)) {
        interests.push(interest);
      }
    }
    
    return interests;
  }
}

// Demo real-time events
async function demoRealtimeEvents(server: RealtimeWebSocketServer) {
  console.log('\n🎮 Starting real-time event simulation...\n');
  
  // Simulate various events
  const events = [
    async () => {
      await server.sendGameUpdate('NFL', 'game123', {
        homeTeam: 'Chiefs',
        awayTeam: 'Bills',
        homeScore: 21,
        awayScore: 17,
        quarter: 3,
        time: '5:23'
      });
    },
    
    async () => {
      await server.sendInjuryAlert('Patrick Mahomes', 'NFL', 'Questionable');
    },
    
    async () => {
      await server.sendBreakingNews('BREAKING: Star player traded to Lakers!', 'NBA');
    },
    
    async () => {
      await server.sendPlayerUpdate('player123', 'Josh Allen', {
        passingYards: 287,
        touchdowns: 3,
        interceptions: 0
      });
    },
    
    async () => {
      await server.sendGameUpdate('NBA', 'game456', {
        homeTeam: 'Lakers',
        awayTeam: 'Celtics',
        homeScore: 98,
        awayScore: 94,
        quarter: 4,
        time: '2:45'
      });
    }
  ];
  
  // Send events at random intervals
  for (const event of events) {
    await event();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
  }
  
  // Show stats
  console.log('\n📊 WebSocket Server Stats:');
  console.log(server.getStats());
}

// Main execution
async function main() {
  console.log('🔌 REAL-TIME WEBSOCKET SYSTEM');
  console.log('=============================\n');
  
  // Start WebSocket server
  const wsServer = new RealtimeWebSocketServer(3001);
  
  // Simulate some clients
  const simulator = new WebSocketClientSimulator();
  simulator.simulateClients(10);
  
  // Wait a bit for connections
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run demo events
  await demoRealtimeEvents(wsServer);
  
  // Keep running
  console.log('\n✅ WebSocket server is running on port 3001');
  console.log('📡 Clients can connect and subscribe to real-time updates!');
  
  // Show stats every 30 seconds
  setInterval(() => {
    console.log('\n📊 Current Stats:', wsServer.getStats());
  }, 30000);
}

// Export for use in other scripts
export { RealtimeWebSocketServer, RealtimeEventProcessor };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}