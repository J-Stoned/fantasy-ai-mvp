import { prisma } from "./prisma";
import { valueBalancingCalculator, PlayerWagerAsset, BalancedWager } from "./value-balancing-calculator";
import { stripeEscrowManager } from "./stripe-integration";
import { WagerType, WagerTimeframe, WagerStatus } from "@prisma/client";

export interface CreateWagerParams {
  creatorId: string;
  title: string;
  description: string;
  type: WagerType;
  timeframe: WagerTimeframe;
  startDate: Date;
  endDate: Date;
  creatorPlayers: Omit<PlayerWagerAsset, 'stockPrice'>[];
  creatorCashContribution: number;
  performanceMetrics: Record<string, any>;
  leagueId?: string;
  isPublic?: boolean;
  opponentId?: string; // For direct challenges
  opponentPlayers?: Omit<PlayerWagerAsset, 'stockPrice'>[];
  opponentCashContribution?: number;
}

export interface CreateWagerResult {
  success: boolean;
  wagerId?: string;
  balancedWager?: BalancedWager;
  escrowInfo?: {
    escrowId: string;
    creatorPaymentIntent?: string;
    opponentPaymentIntent?: string;
  };
  error?: string;
  suggestions?: string[];
}

export interface AcceptWagerParams {
  wagerId: string;
  opponentId: string;
  opponentPlayers: Omit<PlayerWagerAsset, 'stockPrice'>[];
  opponentCashContribution?: number;
}

export interface AcceptWagerResult {
  success: boolean;
  balancedWager?: BalancedWager;
  escrowInfo?: {
    opponentPaymentIntent: string;
  };
  error?: string;
}

export interface SettleWagerParams {
  wagerId: string;
  winnerId: string;
  performanceResults: Record<string, any>;
  settledBy?: string; // Admin or system
}

export interface SettleWagerResult {
  success: boolean;
  winnings?: number;
  error?: string;
}

export class WageringEngine {
  
  /**
   * Create a new wager with automatic value balancing
   */
  async createWager(params: CreateWagerParams): Promise<CreateWagerResult> {
    try {
      // Validate creator can afford the wager
      const affordability = await valueBalancingCalculator.validateWagerAffordability(
        params.creatorId,
        params.creatorCashContribution
      );

      if (!affordability.canAfford) {
        return {
          success: false,
          error: `Insufficient funds. You need $${affordability.shortfall?.toFixed(2)} more to create this wager.`
        };
      }

      let balancedWager: BalancedWager | undefined;
      let suggestions: string[] = [];

      // If opponent is specified, balance the wager immediately
      if (params.opponentId && params.opponentPlayers) {
        const balanceResult = await valueBalancingCalculator.balanceWager(
          params.creatorId,
          params.creatorPlayers,
          params.creatorCashContribution,
          params.opponentId,
          params.opponentPlayers,
          params.opponentCashContribution || 0
        );

        if (!balanceResult.success) {
          return {
            success: false,
            error: balanceResult.error,
          };
        }

        balancedWager = balanceResult.balancedWager;
        suggestions = balanceResult.suggestions || [];

        // Validate opponent can afford their stake
        const opponentAffordability = await valueBalancingCalculator.validateWagerAffordability(
          params.opponentId,
          balancedWager.opponentSide.cashContribution
        );

        if (!opponentAffordability.canAfford) {
          return {
            success: false,
            error: `Opponent has insufficient funds. They need $${opponentAffordability.shortfall?.toFixed(2)} more.`
          };
        }
      }

      // Create escrow account
      const creatorAmount = balancedWager?.creatorSide.cashContribution || params.creatorCashContribution;
      const opponentAmount = balancedWager?.opponentSide.cashContribution || 0;

      const escrowResult = await stripeEscrowManager.createWagerEscrow(
        `temp_wager_${Date.now()}`, // Temporary ID
        creatorAmount,
        opponentAmount,
        params.creatorId,
        params.opponentId
      );

      if (!escrowResult.success) {
        return {
          success: false,
          error: `Failed to create escrow: ${escrowResult.error}`,
        };
      }

      // Create wager in database
      const wager = await prisma.wager.create({
        data: {
          creatorId: params.creatorId,
          opponentId: params.opponentId,
          type: params.type,
          status: balancedWager ? "MATCHED" : "OPEN",
          title: params.title,
          description: params.description,
          totalValue: balancedWager?.totalValue || creatorAmount,
          creatorStake: creatorAmount,
          opponentStake: opponentAmount,
          performance: params.performanceMetrics,
          timeframe: params.timeframe,
          startDate: params.startDate,
          endDate: params.endDate,
          escrowId: escrowResult.escrowId!,
          leagueId: params.leagueId,
          isPublic: params.isPublic ?? true,
        },
      });

      // Create wager players
      if (balancedWager) {
        await this.createWagerPlayers(wager.id, balancedWager);
        await valueBalancingCalculator.lockWagerValues(wager.id, balancedWager);
      } else {
        // Create placeholder for creator's players only
        await this.createWagerPlayersForSide(
          wager.id,
          params.creatorPlayers,
          "CREATOR"
        );
      }

      return {
        success: true,
        wagerId: wager.id,
        balancedWager,
        escrowInfo: {
          escrowId: escrowResult.escrowId!,
          creatorPaymentIntent: escrowResult.creatorPaymentIntent,
          opponentPaymentIntent: escrowResult.opponentPaymentIntent,
        },
        suggestions,
      };

    } catch (error) {
      console.error("Error creating wager:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Accept an open wager
   */
  async acceptWager(params: AcceptWagerParams): Promise<AcceptWagerResult> {
    try {
      const wager = await prisma.wager.findUnique({
        where: { id: params.wagerId },
        include: {
          creator: true,
          wagerPlayers: {
            include: { player: true },
          },
        },
      });

      if (!wager) {
        return { success: false, error: "Wager not found" };
      }

      if (wager.status !== "OPEN") {
        return { success: false, error: "Wager is no longer available" };
      }

      if (wager.creatorId === params.opponentId) {
        return { success: false, error: "Cannot accept your own wager" };
      }

      // Get creator's players from existing wager players
      const creatorPlayers = wager.wagerPlayers
        .filter(wp => wp.side === "CREATOR")
        .map(wp => ({
          playerId: wp.playerId,
          playerName: wp.player.name,
          position: wp.player.position,
          team: wp.player.team,
        }));

      // Balance the wager with opponent's players
      const balanceResult = await valueBalancingCalculator.balanceWager(
        wager.creatorId,
        creatorPlayers,
        wager.creatorStake,
        params.opponentId,
        params.opponentPlayers,
        params.opponentCashContribution || 0
      );

      if (!balanceResult.success) {
        return {
          success: false,
          error: balanceResult.error,
        };
      }

      const balancedWager = balanceResult.balancedWager!;

      // Validate opponent can afford their stake
      const affordability = await valueBalancingCalculator.validateWagerAffordability(
        params.opponentId,
        balancedWager.opponentSide.cashContribution
      );

      if (!affordability.canAfford) {
        return {
          success: false,
          error: `Insufficient funds. You need $${affordability.shortfall?.toFixed(2)} more.`,
        };
      }

      // Create opponent's payment intent
      const opponentPayment = await stripeEscrowManager.createEscrowPaymentIntent({
        userId: params.opponentId,
        amount: balancedWager.opponentSide.cashContribution,
        description: `Wager acceptance - ${wager.title}`,
        metadata: {
          wagerId: wager.id,
          escrowId: wager.escrowId,
          side: "opponent",
        },
      });

      if (!opponentPayment.success) {
        return {
          success: false,
          error: `Failed to create payment: ${opponentPayment.error}`,
        };
      }

      // Update wager with opponent info
      await prisma.wager.update({
        where: { id: params.wagerId },
        data: {
          opponentId: params.opponentId,
          status: "MATCHED",
          opponentStake: balancedWager.opponentSide.cashContribution,
          totalValue: balancedWager.totalValue,
        },
      });

      // Update escrow with new amounts
      await prisma.escrowAccount.update({
        where: { id: wager.escrowId },
        data: {
          opponentAmount: balancedWager.opponentSide.cashContribution,
          totalAmount: balancedWager.totalValue,
        },
      });

      // Add opponent's players to wager
      await this.createWagerPlayersForSide(
        wager.id,
        balancedWager.opponentSide.players,
        "OPPONENT"
      );

      // Lock values
      await valueBalancingCalculator.lockWagerValues(wager.id, balancedWager);

      return {
        success: true,
        balancedWager,
        escrowInfo: {
          opponentPaymentIntent: opponentPayment.paymentIntentId!,
        },
      };

    } catch (error) {
      console.error("Error accepting wager:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Settle a completed wager
   */
  async settleWager(params: SettleWagerParams): Promise<SettleWagerResult> {
    try {
      const wager = await prisma.wager.findUnique({
        where: { id: params.wagerId },
        include: {
          creator: true,
          opponent: true,
          escrow: true,
        },
      });

      if (!wager) {
        return { success: false, error: "Wager not found" };
      }

      if (wager.status !== "ACTIVE" && wager.status !== "PENDING_SETTLEMENT") {
        return { success: false, error: "Wager cannot be settled" };
      }

      if (!wager.opponent) {
        return { success: false, error: "Wager has no opponent" };
      }

      // Validate winner is one of the participants
      if (params.winnerId !== wager.creatorId && params.winnerId !== wager.opponent.id) {
        return { success: false, error: "Invalid winner ID" };
      }

      // Update wager status
      await prisma.wager.update({
        where: { id: params.wagerId },
        data: {
          status: "SETTLED",
          winnerId: params.winnerId,
          settledAt: new Date(),
          metadata: {
            performanceResults: params.performanceResults,
            settledBy: params.settledBy || "system",
          },
        },
      });

      // Release escrow to winner
      const escrowResult = await stripeEscrowManager.releaseEscrow(
        wager.escrowId,
        params.winnerId,
        `Wager settled: ${wager.title}`
      );

      if (!escrowResult.success) {
        return {
          success: false,
          error: `Failed to release escrow: ${escrowResult.error}`,
        };
      }

      // Update user statistics
      await this.updateUserWagerStats(params.wagerId, params.winnerId);

      // Create settlement notification
      await this.createWagerUpdate(
        params.wagerId,
        "STATUS_CHANGE",
        `Wager settled. Winner: ${params.winnerId === wager.creatorId ? wager.creator.name : wager.opponent.name}`,
        {
          winnerId: params.winnerId,
          performanceResults: params.performanceResults,
        }
      );

      return {
        success: true,
        winnings: wager.escrow?.totalAmount || 0,
      };

    } catch (error) {
      console.error("Error settling wager:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Cancel an open wager
   */
  async cancelWager(wagerId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const wager = await prisma.wager.findUnique({
        where: { id: wagerId },
        include: { creator: true },
      });

      if (!wager) {
        return { success: false, error: "Wager not found" };
      }

      if (wager.creatorId !== userId) {
        return { success: false, error: "Only the creator can cancel this wager" };
      }

      if (wager.status !== "OPEN") {
        return { success: false, error: "Wager cannot be cancelled" };
      }

      // Update wager status
      await prisma.wager.update({
        where: { id: wagerId },
        data: { status: "CANCELLED" },
      });

      // Refund escrow
      await stripeEscrowManager.refundEscrow(
        wager.escrowId,
        "Wager cancelled by creator"
      );

      return { success: true };

    } catch (error) {
      console.error("Error cancelling wager:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get active wagers for a user
   */
  async getUserWagers(userId: string, status?: WagerStatus): Promise<{
    success: boolean;
    wagers?: any[];
    error?: string;
  }> {
    try {
      const where = {
        OR: [
          { creatorId: userId },
          { opponentId: userId },
        ],
        ...(status && { status }),
      };

      const wagers = await prisma.wager.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, image: true } },
          opponent: { select: { id: true, name: true, image: true } },
          league: { select: { id: true, name: true } },
          wagerPlayers: {
            include: {
              player: { select: { name: true, position: true, team: true } },
            },
          },
          escrow: { select: { totalAmount: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, wagers };

    } catch (error) {
      console.error("Error getting user wagers:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get public wagers available for acceptance
   */
  async getPublicWagers(leagueId?: string, limit: number = 20): Promise<{
    success: boolean;
    wagers?: any[];
    error?: string;
  }> {
    try {
      const wagers = await prisma.wager.findMany({
        where: {
          status: "OPEN",
          isPublic: true,
          ...(leagueId && { leagueId }),
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          league: { select: { id: true, name: true } },
          wagerPlayers: {
            include: {
              player: { select: { name: true, position: true, team: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return { success: true, wagers };

    } catch (error) {
      console.error("Error getting public wagers:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update live values for active wagers
   */
  async updateLiveWagerValues(): Promise<void> {
    try {
      const activeWagers = await prisma.wager.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      for (const wager of activeWagers) {
        await valueBalancingCalculator.updateLivePlayerValues(wager.id);
      }

    } catch (error) {
      console.error("Error updating live wager values:", error);
    }
  }

  // Private helper methods

  private async createWagerPlayers(wagerId: string, balancedWager: BalancedWager): Promise<void> {
    const wagerPlayers = [
      ...balancedWager.creatorSide.players.map(player => ({
        wagerId,
        playerId: player.playerId,
        side: "CREATOR" as const,
        stockPrice: player.stockPrice,
        currentValue: player.stockPrice,
        isTraded: false,
      })),
      ...balancedWager.opponentSide.players.map(player => ({
        wagerId,
        playerId: player.playerId,
        side: "OPPONENT" as const,
        stockPrice: player.stockPrice,
        currentValue: player.stockPrice,
        isTraded: false,
      })),
    ];

    await prisma.wagerPlayer.createMany({
      data: wagerPlayers,
    });
  }

  private async createWagerPlayersForSide(
    wagerId: string,
    players: PlayerWagerAsset[],
    side: "CREATOR" | "OPPONENT"
  ): Promise<void> {
    const wagerPlayers = players.map(player => ({
      wagerId,
      playerId: player.playerId,
      side,
      stockPrice: player.stockPrice,
      currentValue: player.stockPrice,
      isTraded: false,
    }));

    await prisma.wagerPlayer.createMany({
      data: wagerPlayers,
    });
  }

  private async updateUserWagerStats(wagerId: string, winnerId: string): Promise<void> {
    const wager = await prisma.wager.findUnique({
      where: { id: wagerId },
      include: { escrow: true },
    });

    if (!wager || !wager.opponentId) return;

    const winAmount = wager.escrow?.totalAmount || 0;
    const loserId = winnerId === wager.creatorId ? wager.opponentId : wager.creatorId;

    // Update winner stats
    await prisma.userWallet.upsert({
      where: { userId: winnerId },
      update: { totalWon: { increment: winAmount } },
      create: {
        userId: winnerId,
        totalWon: winAmount,
      },
    });

    // Update loser stats
    await prisma.userWallet.upsert({
      where: { userId: loserId },
      update: { totalLost: { increment: winAmount } },
      create: {
        userId: loserId,
        totalLost: winAmount,
      },
    });
  }

  private async createWagerUpdate(
    wagerId: string,
    type: "SCORE_UPDATE" | "STATUS_CHANGE" | "PAYMENT_UPDATE" | "PLAYER_UPDATE" | "SYSTEM_MESSAGE",
    message: string,
    data?: any
  ): Promise<void> {
    await prisma.wagerUpdate.create({
      data: {
        wagerId,
        type,
        message,
        data,
      },
    });
  }
}

export const wageringEngine = new WageringEngine();