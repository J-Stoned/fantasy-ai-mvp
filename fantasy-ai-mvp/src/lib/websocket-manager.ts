import { Server } from "socket.io";
import { createServer } from "http";
import { prisma } from "./prisma";
import { valueBalancingCalculator } from "./value-balancing-calculator";

export interface WagerUpdate {
  type: "score_update" | "value_change" | "status_change" | "new_bet" | "settlement";
  wagerId: string;
  data: any;
  timestamp: Date;
}

export interface BountyUpdate {
  type: "score_update" | "participant_joined" | "bounty_completed" | "leaderboard_change";
  bountyId: string;
  data: any;
  timestamp: Date;
}

export interface LiveBettingUpdate {
  type: "odds_change" | "new_prop_bet" | "market_movement";
  data: any;
  timestamp: Date;
}

export class WebSocketManager {
  private io: Server | null = null;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  initialize(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === "production" ? process.env.NEXTAUTH_URL : "http://localhost:3000",
        credentials: true,
      },
    });

    this.setupEventHandlers();
    this.startPeriodicUpdates();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Join user-specific room
      socket.on("join_user_room", (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join wager-specific room
      socket.on("join_wager_room", (wagerId: string) => {
        socket.join(`wager:${wagerId}`);
        console.log(`Client joined wager room: ${wagerId}`);
      });

      // Join bounty-specific room
      socket.on("join_bounty_room", (bountyId: string) => {
        socket.join(`bounty:${bountyId}`);
        console.log(`Client joined bounty room: ${bountyId}`);
      });

      // Join league-specific room
      socket.on("join_league_room", (leagueId: string) => {
        socket.join(`league:${leagueId}`);
        console.log(`Client joined league room: ${leagueId}`);
      });

      // Request live wager data
      socket.on("request_wager_data", async (wagerId: string) => {
        try {
          const wagerData = await this.getWagerLiveData(wagerId);
          socket.emit("wager_data", wagerData);
        } catch (error) {
          socket.emit("error", { message: "Failed to fetch wager data" });
        }
      });

      // Request live bounty data
      socket.on("request_bounty_data", async (bountyId: string) => {
        try {
          const bountyData = await this.getBountyLiveData(bountyId);
          socket.emit("bounty_data", bountyData);
        } catch (error) {
          socket.emit("error", { message: "Failed to fetch bounty data" });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  // Wager-related broadcasts
  async broadcastWagerUpdate(update: WagerUpdate) {
    if (!this.io) return;

    // Broadcast to wager-specific room
    this.io.to(`wager:${update.wagerId}`).emit("wager_update", update);

    // Also broadcast to participants' user rooms
    try {
      const wager = await prisma.wager.findUnique({
        where: { id: update.wagerId },
        include: { creator: true, opponent: true },
      });

      if (wager) {
        this.io.to(`user:${wager.creatorId}`).emit("wager_update", update);
        if (wager.opponentId) {
          this.io.to(`user:${wager.opponentId}`).emit("wager_update", update);
        }
      }
    } catch (error) {
      console.error("Error broadcasting wager update:", error);
    }
  }

  async broadcastBountyUpdate(update: BountyUpdate) {
    if (!this.io) return;

    // Broadcast to bounty-specific room
    this.io.to(`bounty:${update.bountyId}`).emit("bounty_update", update);

    // Also broadcast to participants' user rooms
    try {
      const bounty = await prisma.bounty.findUnique({
        where: { id: update.bountyId },
        include: { 
          creator: true, 
          participants: { include: { participant: true } } 
        },
      });

      if (bounty && this.io) {
        this.io.to(`user:${bounty.creatorId}`).emit("bounty_update", update);
        bounty.participants?.forEach(participant => {
          if (participant?.participantId && this.io) {
            this.io.to(`user:${participant.participantId}`).emit("bounty_update", update);
          }
        });
      }
    } catch (error) {
      console.error("Error broadcasting bounty update:", error);
    }
  }

  broadcastLiveBettingUpdate(update: LiveBettingUpdate, roomType: "global" | "league", roomId?: string) {
    if (!this.io) return;

    if (roomType === "global") {
      this.io.emit("live_betting_update", update);
    } else if (roomType === "league" && roomId) {
      this.io.to(`league:${roomId}`).emit("live_betting_update", update);
    }
  }

  // Send notification to specific user
  async sendUserNotification(userId: string, notification: {
    type: "wager_matched" | "bounty_won" | "payment_completed" | "settlement_ready";
    title: string;
    message: string;
    data?: any;
  }) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit("notification", {
      ...notification,
      timestamp: new Date(),
    });

    // Also save to database for persistence
    try {
      await prisma.alert.create({
        data: {
          userId,
          type: "WAGER_UPDATE", // Map to existing AlertType
          title: notification.title,
          message: notification.message,
          data: notification.data,
        },
      });
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  }

  // Periodic updates for live data
  private startPeriodicUpdates() {
    // Update wager values every 30 seconds
    const wagerUpdateInterval = setInterval(async () => {
      await this.updateAllActiveWagerValues();
    }, 30000);

    // Update bounty scores every 60 seconds
    const bountyUpdateInterval = setInterval(async () => {
      await this.updateAllActiveBountyScores();
    }, 60000);

    // Update market data every 10 seconds
    const marketUpdateInterval = setInterval(async () => {
      await this.updateMarketData();
    }, 10000);

    this.updateIntervals.set("wagers", wagerUpdateInterval);
    this.updateIntervals.set("bounties", bountyUpdateInterval);
    this.updateIntervals.set("market", marketUpdateInterval);
  }

  private async updateAllActiveWagerValues() {
    try {
      const activeWagers = await prisma.wager.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      for (const wager of activeWagers) {
        const updateResult = await valueBalancingCalculator.updateLivePlayerValues(wager.id);
        
        if (updateResult.success) {
          const valueChanges = await valueBalancingCalculator.calculateLiveValueChanges(wager.id);
          
          if (valueChanges.success && valueChanges.valueChanges) {
            await this.broadcastWagerUpdate({
              type: "value_change",
              wagerId: wager.id,
              data: valueChanges.valueChanges,
              timestamp: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating wager values:", error);
    }
  }

  private async updateAllActiveBountyScores() {
    try {
      const activeBounties = await prisma.bounty.findMany({
        where: { status: "ACTIVE" },
        include: { participants: true },
      });

      for (const bounty of activeBounties) {
        // Simulate score updates (replace with actual API calls to sports data)
        const scoreUpdates = bounty.participants.map(participant => ({
          participantId: participant.participantId,
          score: participant.currentScore + (Math.random() - 0.5) * 10, // Random score change
        }));

        // Update scores in database
        for (const update of scoreUpdates) {
          await prisma.bountyParticipant.updateMany({
            where: {
              bountyId: bounty.id,
              participantId: update.participantId,
            },
            data: { currentScore: Math.max(0, update.score) },
          });
        }

        // Broadcast leaderboard update
        await this.broadcastBountyUpdate({
          type: "leaderboard_change",
          bountyId: bounty.id,
          data: { scoreUpdates },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Error updating bounty scores:", error);
    }
  }

  private async updateMarketData() {
    try {
      // Simulate market movements (replace with actual market data)
      const marketUpdate: LiveBettingUpdate = {
        type: "market_movement",
        data: {
          trending_players: [
            { name: "Christian McCaffrey", priceChange: "+$12.50", volume: "2.3K" },
            { name: "Justin Jefferson", priceChange: "-$8.25", volume: "1.9K" },
          ],
          market_sentiment: "bullish",
          total_volume_24h: "$145,250",
        },
        timestamp: new Date(),
      };

      this.broadcastLiveBettingUpdate(marketUpdate, "global");
    } catch (error) {
      console.error("Error updating market data:", error);
    }
  }

  // Helper methods to get live data
  private async getWagerLiveData(wagerId: string) {
    const wager = await prisma.wager.findUnique({
      where: { id: wagerId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        opponent: { select: { id: true, name: true, image: true } },
        wagerPlayers: {
          include: {
            player: { select: { name: true, position: true, team: true } },
          },
        },
        escrow: { select: { totalAmount: true, status: true } },
        wagerUpdates: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wager) throw new Error("Wager not found");

    const valueChanges = await valueBalancingCalculator.calculateLiveValueChanges(wagerId);

    return {
      ...wager,
      liveValueChanges: valueChanges.success ? valueChanges.valueChanges : null,
    };
  }

  private async getBountyLiveData(bountyId: string) {
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        participants: {
          include: {
            participant: { select: { name: true, image: true } },
          },
          orderBy: { currentScore: "desc" },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!bounty) throw new Error("Bounty not found");

    return bounty;
  }

  // Cleanup method
  shutdown() {
    this.updateIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.updateIntervals.clear();

    if (this.io) {
      this.io.close();
    }
  }
}

export const webSocketManager = new WebSocketManager();