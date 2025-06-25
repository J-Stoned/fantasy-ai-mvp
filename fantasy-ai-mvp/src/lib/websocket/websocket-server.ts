import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/prisma';
import { redisClient } from '@/lib/redis/redis-client';

export class WebSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log('New WebSocket connection:', socket.id);

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        const { userId } = data;
        if (!userId) return;

        // Add socket to user's socket set
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Join user's league rooms
        const leagues = await prisma.league.findMany({
          where: { userId },
          select: { id: true }
        });

        for (const league of leagues) {
          socket.join(`league:${league.id}`);
        }

        // Send initial data
        socket.emit('authenticated', { 
          status: 'success',
          userId,
          socketId: socket.id
        });
      });

      // Handle league updates subscription
      socket.on('subscribe:league', async (data) => {
        const { leagueId, userId } = data;
        
        // Verify user has access to league
        const league = await prisma.league.findFirst({
          where: { id: leagueId, userId }
        });

        if (league) {
          socket.join(`league:${leagueId}`);
          socket.emit('subscribed:league', { leagueId });
        }
      });

      // Handle battle room join
      socket.on('join:battle', async (data) => {
        const { battleId, userId } = data;
        
        // Verify user is participant
        const participant = await prisma.battleParticipant.findFirst({
          where: { battleId, userId }
        });

        if (participant) {
          socket.join(`battle:${battleId}`);
          socket.emit('joined:battle', { battleId });
          
          // Notify other participants
          socket.to(`battle:${battleId}`).emit('user:joined:battle', {
            userId,
            battleId
          });
        }
      });

      // Handle chat messages
      socket.on('chat:message', async (data) => {
        const { battleId, userId, message } = data;
        
        // Verify user is participant
        const participant = await prisma.battleParticipant.findFirst({
          where: { battleId, userId }
        });

        if (participant) {
          const chatMessage = {
            id: Date.now().toString(),
            userId,
            message,
            timestamp: new Date(),
            battleId
          };

          // Broadcast to battle room
          this.io.to(`battle:${battleId}`).emit('chat:message', chatMessage);
          
          // Store in Redis for chat history
          await redisClient.lpush(
            `battle:${battleId}:chat`,
            JSON.stringify(chatMessage)
          );
          await redisClient.ltrim(`battle:${battleId}:chat`, 0, 99); // Keep last 100 messages
        }
      });

      // Handle lineup updates
      socket.on('lineup:update', async (data) => {
        const { leagueId, userId, lineup } = data;
        
        // Broadcast to league room
        socket.to(`league:${leagueId}`).emit('lineup:updated', {
          userId,
          lineup,
          timestamp: new Date()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('WebSocket disconnected:', socket.id);
        
        // Remove socket from all user sets
        for (const [userId, sockets] of this.userSockets.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.userSockets.delete(userId);
            }
            break;
          }
        }
      });
    });
  }

  // Send real-time score update
  public sendScoreUpdate(leagueId: string, scores: any) {
    this.io.to(`league:${leagueId}`).emit('scores:update', {
      leagueId,
      scores,
      timestamp: new Date()
    });
  }

  // Send player status update
  public sendPlayerUpdate(playerId: string, update: any) {
    this.io.emit('player:update', {
      playerId,
      update,
      timestamp: new Date()
    });
  }

  // Send notification to specific user
  public sendNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Broadcast achievement unlock
  public broadcastAchievement(userId: string, achievement: any) {
    // Send to user
    this.io.to(`user:${userId}`).emit('achievement:unlocked', achievement);
    
    // Send to user's friends
    this.broadcastToFriends(userId, 'friend:achievement', {
      userId,
      achievement
    });
  }

  // Send battle update
  public sendBattleUpdate(battleId: string, update: any) {
    this.io.to(`battle:${battleId}`).emit('battle:update', update);
  }

  // Broadcast to user's friends
  private async broadcastToFriends(userId: string, event: string, data: any) {
    const friendConnections = await prisma.friendConnection.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      }
    });

    const friendIds = friendConnections.map(fc => 
      fc.userId === userId ? fc.friendId : fc.userId
    );

    for (const friendId of friendIds) {
      this.io.to(`user:${friendId}`).emit(event, data);
    }
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

// Singleton instance
let websocketServer: WebSocketServer;

export function initializeWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  if (!websocketServer) {
    websocketServer = new WebSocketServer(httpServer);
  }
  return websocketServer;
}

export function getWebSocketServer(): WebSocketServer {
  if (!websocketServer) {
    throw new Error('WebSocket server not initialized');
  }
  return websocketServer;
}