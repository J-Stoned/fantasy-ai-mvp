import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ConnectedClient {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private liveGames: Map<string, any> = new Map();

  constructor(port: number = 3001) {
    const httpServer = createServer();
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupHandlers();
    
    httpServer.listen(port, () => {
      console.log(`🚀 WebSocket server running on port ${port}`);
    });

    // Start simulation for demo
    this.startDataSimulation();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 Client connected: ${socket.id}`);
      
      // Track connected client
      this.clients.set(socket.id, {
        id: socket.id,
        subscriptions: new Set()
      });

      // Handle subscriptions
      socket.on('subscribe', (channel: string) => {
        const client = this.clients.get(socket.id);
        if (client) {
          client.subscriptions.add(channel);
          socket.join(channel);
          console.log(`Client ${socket.id} subscribed to ${channel}`);
        }
      });

      socket.on('unsubscribe', (channel: string) => {
        const client = this.clients.get(socket.id);
        if (client) {
          client.subscriptions.delete(channel);
          socket.leave(channel);
          console.log(`Client ${socket.id} unsubscribed from ${channel}`);
        }
      });

      // Handle data requests
      socket.on('request_live_scores', async (data) => {
        const scores = await this.getLiveScores(data.sport);
        socket.emit('live_scores', scores);
      });

      socket.on('request_player_status', async (data) => {
        const status = await this.getPlayerStatus(data.playerId);
        socket.emit('player_status', status);
      });

      socket.on('request_league_updates', async (data) => {
        const updates = await this.getLeagueUpdates(data.leagueId);
        socket.emit('league_updates', updates);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`👋 Client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });
  }

  // Data fetching methods
  private async getLiveScores(sport?: string) {
    // In production, fetch from real APIs
    return Array.from(this.liveGames.values()).filter(game => 
      !sport || game.sport === sport
    );
  }

  private async getPlayerStatus(playerId: string) {
    try {
      const player = await prisma.player.findUnique({
        where: { id: playerId }
      });
      return player;
    } catch (error) {
      console.error('Error fetching player:', error);
      return null;
    }
  }

  private async getLeagueUpdates(leagueId: string) {
    // Fetch league-specific updates
    return {
      leagueId,
      recentTransactions: [],
      standings: [],
      upcomingGames: []
    };
  }

  // Broadcasting methods
  broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  broadcastToChannel(channel: string, event: string, data: any) {
    this.io.to(channel).emit(event, data);
  }

  broadcastScoreUpdate(gameId: string, scoreData: any) {
    this.liveGames.set(gameId, scoreData);
    this.broadcastToAll('score_update', scoreData);
  }

  broadcastPlayerUpdate(update: any) {
    this.broadcastToAll('player_update', update);
    
    // Also broadcast to player-specific channel
    this.broadcastToChannel(`player:${update.playerId}`, 'player_update', update);
  }

  broadcastTradeAlert(trade: any) {
    this.broadcastToAll('trade_alert', trade);
    
    // Broadcast to league-specific channel
    this.broadcastToChannel(`league:${trade.leagueId}`, 'trade_alert', trade);
  }

  broadcastAchievement(achievement: any) {
    this.broadcastToChannel(`user:${achievement.userId}`, 'achievement_unlocked', achievement);
  }

  // Data simulation for demo
  private startDataSimulation() {
    // Simulate live game scores
    setInterval(() => {
      const games = [
        { id: 'nfl-1', sport: 'NFL', home: 'Chiefs', away: 'Bills' },
        { id: 'nfl-2', sport: 'NFL', home: 'Eagles', away: 'Cowboys' },
        { id: 'nba-1', sport: 'NBA', home: 'Lakers', away: 'Celtics' }
      ];

      games.forEach(game => {
        const isLive = Math.random() > 0.3;
        if (isLive) {
          const scoreUpdate = {
            gameId: game.id,
            sport: game.sport,
            homeTeam: game.home,
            awayTeam: game.away,
            homeScore: Math.floor(Math.random() * 35) + 7,
            awayScore: Math.floor(Math.random() * 35) + 7,
            quarter: `Q${Math.floor(Math.random() * 4) + 1}`,
            timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            isLive: true
          };
          
          this.broadcastScoreUpdate(game.id, scoreUpdate);
        }
      });
    }, 5000);

    // Simulate player updates
    setInterval(() => {
      const players = [
        { id: 'p1', name: 'Patrick Mahomes', position: 'QB' },
        { id: 'p2', name: 'Christian McCaffrey', position: 'RB' },
        { id: 'p3', name: 'Tyreek Hill', position: 'WR' },
        { id: 'p4', name: 'Travis Kelce', position: 'TE' }
      ];

      const player = players[Math.floor(Math.random() * players.length)];
      const updateTypes = ['touchdown', 'big_play', 'injury_update'];
      const type = updateTypes[Math.floor(Math.random() * updateTypes.length)];

      let message = '';
      let points = 0;

      switch (type) {
        case 'touchdown':
          points = player.position === 'QB' ? 4 : 6;
          message = `${player.name} scores a ${player.position === 'QB' ? 'passing' : 'rushing'} TD!`;
          break;
        case 'big_play':
          points = Math.floor(Math.random() * 5) + 2;
          message = `${player.name} with a ${Math.floor(Math.random() * 50) + 20}-yard ${player.position === 'QB' ? 'pass' : 'gain'}!`;
          break;
        case 'injury_update':
          message = `${player.name} is being evaluated for a possible injury`;
          break;
      }

      const update = {
        playerId: player.id,
        playerName: player.name,
        type: type === 'injury_update' ? 'injury' : 'performance',
        points,
        message,
        timestamp: new Date().toISOString()
      };

      this.broadcastPlayerUpdate(update);
    }, 8000);

    // Simulate occasional trade alerts
    setInterval(() => {
      if (Math.random() > 0.95) {
        const teams = ['Algorithm Assassins', 'Data Destroyers', 'Trophy Hunters', 'Dynasty Builders'];
        const players = ['Justin Jefferson', 'Nick Chubb', 'Davante Adams', 'Travis Etienne'];
        
        const trade = {
          id: `trade-${Date.now()}`,
          leagueId: 'league-123',
          team1: teams[Math.floor(Math.random() * teams.length)],
          team2: teams[Math.floor(Math.random() * teams.length)],
          players: [
            players[Math.floor(Math.random() * players.length)],
            players[Math.floor(Math.random() * players.length)]
          ],
          status: 'proposed',
          timestamp: new Date().toISOString()
        };

        this.broadcastTradeAlert(trade);
      }
    }, 30000);

    // Simulate achievement unlocks
    setInterval(() => {
      if (Math.random() > 0.98) {
        const achievements = [
          { name: 'First Win', description: 'Won your first matchup' },
          { name: 'High Scorer', description: 'Scored 150+ points in a week' },
          { name: 'Trade Master', description: 'Completed 5 trades' }
        ];

        const achievement = achievements[Math.floor(Math.random() * achievements.length)];
        
        this.broadcastAchievement({
          userId: 'demo-user',
          achievement,
          timestamp: new Date().toISOString()
        });
      }
    }, 45000);

    console.log('📡 WebSocket simulation started');
  }
}

// Export function to start server
export function startWebSocketServer(port?: number) {
  return new WebSocketServer(port);
}