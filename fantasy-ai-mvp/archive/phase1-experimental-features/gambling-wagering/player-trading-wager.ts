import { prisma } from "./prisma";
import { valueBalancingCalculator, PlayerWagerAsset } from "./value-balancing-calculator";
import { stripeEscrowManager } from "./stripe-integration";
import { wageringEngine } from "./wagering-engine";

export interface PlayerTradeWagerParams {
  creatorId: string;
  opponentId: string;
  leagueId: string;
  title: string;
  description: string;
  creatorPlayers: {
    playerId: string;
    willTrade: boolean; // Whether this player will be traded if creator wins
  }[];
  opponentPlayers: {
    playerId: string;
    willTrade: boolean; // Whether this player will be traded if opponent wins
  }[];
  creatorCashContribution: number;
  opponentCashContribution: number;
  performanceMetrics: {
    duration: "single_game" | "week" | "season";
    metric: "total_points" | "head_to_head" | "custom";
    details: any;
  };
  startDate: Date;
  endDate: Date;
}

export interface PlayerTradeWagerResult {
  success: boolean;
  wagerId?: string;
  tradeDetails?: PlayerTradeDetails;
  balancedWager?: any;
  escrowInfo?: {
    escrowId: string;
    creatorPaymentIntent: string;
    opponentPaymentIntent: string;
  };
  error?: string;
}

export interface PlayerTradeDetails {
  totalValue: number;
  creatorSide: {
    playersToTrade: PlayerWagerAsset[];
    playersToKeep: PlayerWagerAsset[];
    cashContribution: number;
    totalValue: number;
  };
  opponentSide: {
    playersToTrade: PlayerWagerAsset[];
    playersToKeep: PlayerWagerAsset[];
    cashContribution: number;
    totalValue: number;
  };
  valueBalance: {
    isBalanced: boolean;
    adjustment: number;
    adjustmentSide: "creator" | "opponent" | "none";
  };
}

export interface ExecutePlayerTradeParams {
  wagerId: string;
  winnerId: string;
  performanceResults: any;
}

export interface ExecutePlayerTradeResult {
  success: boolean;
  tradesExecuted?: {
    playerId: string;
    fromTeamId: string;
    toTeamId: string;
    playerName: string;
  }[];
  cashTransferred?: number;
  error?: string;
}

export class PlayerTradingWagerSystem {

  /**
   * Create a player trading wager with automatic value balancing
   */
  async createPlayerTradeWager(params: PlayerTradeWagerParams): Promise<PlayerTradeWagerResult> {
    try {
      // Validate league membership for both users
      const [creatorTeam, opponentTeam] = await Promise.all([
        this.getUserTeamInLeague(params.creatorId, params.leagueId),
        this.getUserTeamInLeague(params.opponentId, params.leagueId),
      ]);

      if (!creatorTeam || !opponentTeam) {
        return {
          success: false,
          error: "Both users must be members of the specified league"
        };
      }

      // Validate player ownership
      const ownershipValidation = await this.validatePlayerOwnership(
        params.creatorPlayers,
        params.opponentPlayers,
        creatorTeam.id,
        opponentTeam.id
      );

      if (!ownershipValidation.valid) {
        return {
          success: false,
          error: ownershipValidation.error
        };
      }

      // Calculate trade details and value balancing
      const tradeDetails = await this.calculateTradeDetails(
        params.creatorPlayers,
        params.opponentPlayers,
        params.creatorCashContribution,
        params.opponentCashContribution
      );

      if (!tradeDetails.success) {
        return {
          success: false,
          error: tradeDetails.error
        };
      }

      // Create the wager using the existing wagering engine
      const wagerResult = await wageringEngine.createWager({
        creatorId: params.creatorId,
        title: params.title,
        description: params.description,
        type: "PLAYER_TRADE",
        timeframe: this.mapDurationToTimeframe(params.performanceMetrics.duration),
        startDate: params.startDate,
        endDate: params.endDate,
        creatorPlayers: tradeDetails.tradeDetails!.creatorSide.playersToTrade.concat(
          tradeDetails.tradeDetails!.creatorSide.playersToKeep
        ),
        creatorCashContribution: tradeDetails.tradeDetails!.creatorSide.cashContribution,
        performanceMetrics: params.performanceMetrics,
        leagueId: params.leagueId,
        isPublic: false, // Player trades are always private
        opponentId: params.opponentId,
        opponentPlayers: tradeDetails.tradeDetails!.opponentSide.playersToTrade.concat(
          tradeDetails.tradeDetails!.opponentSide.playersToKeep
        ),
        opponentCashContribution: tradeDetails.tradeDetails!.opponentSide.cashContribution,
      });

      if (!wagerResult.success) {
        return {
          success: false,
          error: wagerResult.error
        };
      }

      // Mark players as tradeable in the wager
      await this.markTradablePlayers(
        wagerResult.wagerId!,
        params.creatorPlayers,
        params.opponentPlayers
      );

      return {
        success: true,
        wagerId: wagerResult.wagerId,
        tradeDetails: tradeDetails.tradeDetails,
        balancedWager: wagerResult.balancedWager,
        escrowInfo: wagerResult.escrowInfo,
      };

    } catch (error) {
      console.error("Error creating player trade wager:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Execute player trades when wager is settled
   */
  async executePlayerTrades(params: ExecutePlayerTradeParams): Promise<ExecutePlayerTradeResult> {
    try {
      const wager = await prisma.wager.findUnique({
        where: { id: params.wagerId },
        include: {
          creator: true,
          opponent: true,
          league: true,
          wagerPlayers: {
            where: { isTraded: true },
            include: {
              player: true,
            },
          },
        },
      });

      if (!wager) {
        return { success: false, error: "Wager not found" };
      }

      if (wager.type !== "PLAYER_TRADE") {
        return { success: false, error: "Not a player trading wager" };
      }

      if (!wager.opponent) {
        return { success: false, error: "Wager has no opponent" };
      }

      // Get teams for both users
      const [winnerTeam, loserTeam] = await Promise.all([
        this.getUserTeamInLeague(params.winnerId, wager.leagueId!),
        this.getUserTeamInLeague(
          params.winnerId === wager.creatorId ? wager.opponent.id : wager.creatorId,
          wager.leagueId!
        ),
      ]);

      if (!winnerTeam || !loserTeam) {
        return { success: false, error: "Could not find user teams" };
      }

      // Determine which players to trade based on winner
      const winnerSide = params.winnerId === wager.creatorId ? "CREATOR" : "OPPONENT";
      const playersToTrade = wager.wagerPlayers.filter(wp => 
        wp.isTraded && wp.side !== winnerSide
      );

      const tradesExecuted = [];

      // Execute trades in a transaction
      await prisma.$transaction(async (tx) => {
        for (const wagerPlayer of playersToTrade) {
          // Find current roster entry
          const currentRoster = await tx.roster.findFirst({
            where: {
              playerId: wagerPlayer.playerId,
              teamId: loserTeam.id,
            },
          });

          if (!currentRoster) {
            throw new Error(`Player ${wagerPlayer.player.name} not found in loser's roster`);
          }

          // Remove from loser's team
          await tx.roster.delete({
            where: { id: currentRoster.id },
          });

          // Add to winner's team
          await tx.roster.create({
            data: {
              teamId: winnerTeam.id,
              playerId: wagerPlayer.playerId,
              position: currentRoster.position,
              isStarter: false, // Winner can decide if they want to start the player
            },
          });

          tradesExecuted.push({
            playerId: wagerPlayer.playerId,
            fromTeamId: loserTeam.id,
            toTeamId: winnerTeam.id,
            playerName: wagerPlayer.player.name,
          });
        }

        // Now we need to balance roster sizes - winner gives players to loser
        const winnerTradablePlayers = wager.wagerPlayers.filter(wp => 
          wp.isTraded && wp.side === winnerSide
        );

        // Winner must give same number of players to maintain roster balance
        const playersToGive = winnerTradablePlayers.slice(0, playersToTrade.length);

        for (const wagerPlayer of playersToGive) {
          const currentRoster = await tx.roster.findFirst({
            where: {
              playerId: wagerPlayer.playerId,
              teamId: winnerTeam.id,
            },
          });

          if (currentRoster) {
            // Remove from winner's team
            await tx.roster.delete({
              where: { id: currentRoster.id },
            });

            // Add to loser's team
            await tx.roster.create({
              data: {
                teamId: loserTeam.id,
                playerId: wagerPlayer.playerId,
                position: currentRoster.position,
                isStarter: false,
              },
            });

            tradesExecuted.push({
              playerId: wagerPlayer.playerId,
              fromTeamId: winnerTeam.id,
              toTeamId: loserTeam.id,
              playerName: wagerPlayer.player.name,
            });
          }
        }

        // Update wager with trade execution details
        await tx.wager.update({
          where: { id: params.wagerId },
          data: {
            metadata: {
              tradeExecuted: true,
              tradesExecuted,
              executedAt: new Date(),
            },
          },
        });
      });

      // Get cash amount from escrow
      const escrow = await prisma.escrowAccount.findUnique({
        where: { id: wager.escrowId },
      });

      return {
        success: true,
        tradesExecuted,
        cashTransferred: escrow?.totalAmount || 0,
      };

    } catch (error) {
      console.error("Error executing player trades:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Preview what trades would happen if a specific user wins
   */
  async previewTrades(wagerId: string, winnerId: string): Promise<{
    success: boolean;
    preview?: {
      playersWinnerGains: Array<{ name: string; position: string; team: string; value: number }>;
      playersWinnerLoses: Array<{ name: string; position: string; team: string; value: number }>;
      netValueGain: number;
      cashWinnings: number;
    };
    error?: string;
  }> {
    try {
      const wager = await prisma.wager.findUnique({
        where: { id: wagerId },
        include: {
          wagerPlayers: {
            include: { player: true },
          },
          escrow: true,
        },
      });

      if (!wager) {
        return { success: false, error: "Wager not found" };
      }

      const winnerSide = winnerId === wager.creatorId ? "CREATOR" : "OPPONENT";
      
      const playersWinnerGains = wager.wagerPlayers
        .filter(wp => wp.isTraded && wp.side !== winnerSide)
        .map(wp => ({
          name: wp.player.name,
          position: wp.player.position,
          team: wp.player.team,
          value: wp.stockPrice,
        }));

      const playersWinnerLoses = wager.wagerPlayers
        .filter(wp => wp.isTraded && wp.side === winnerSide)
        .map(wp => ({
          name: wp.player.name,
          position: wp.player.position,
          team: wp.player.team,
          value: wp.stockPrice,
        }));

      const netValueGain = playersWinnerGains.reduce((sum, p) => sum + p.value, 0) - 
                          playersWinnerLoses.reduce((sum, p) => sum + p.value, 0);

      return {
        success: true,
        preview: {
          playersWinnerGains,
          playersWinnerLoses,
          netValueGain,
          cashWinnings: wager.escrow?.totalAmount || 0,
        },
      };

    } catch (error) {
      console.error("Error previewing trades:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get player trading wagers for a league
   */
  async getLeagueTradeWagers(leagueId: string): Promise<{
    success: boolean;
    wagers?: any[];
    error?: string;
  }> {
    try {
      const wagers = await prisma.wager.findMany({
        where: {
          leagueId,
          type: "PLAYER_TRADE",
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          opponent: { select: { id: true, name: true, image: true } },
          wagerPlayers: {
            include: {
              player: { select: { name: true, position: true, team: true } },
            },
          },
          escrow: { select: { totalAmount: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, wagers };

    } catch (error) {
      console.error("Error getting league trade wagers:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Private helper methods

  private async getUserTeamInLeague(userId: string, leagueId: string) {
    return await prisma.team.findFirst({
      where: {
        userId,
        leagueId,
      },
    });
  }

  private async validatePlayerOwnership(
    creatorPlayers: { playerId: string; willTrade: boolean }[],
    opponentPlayers: { playerId: string; willTrade: boolean }[],
    creatorTeamId: string,
    opponentTeamId: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Check creator's player ownership
    for (const playerRef of creatorPlayers) {
      const roster = await prisma.roster.findFirst({
        where: {
          playerId: playerRef.playerId,
          teamId: creatorTeamId,
        },
      });

      if (!roster) {
        return {
          valid: false,
          error: `Creator does not own player ${playerRef.playerId}`,
        };
      }
    }

    // Check opponent's player ownership
    for (const playerRef of opponentPlayers) {
      const roster = await prisma.roster.findFirst({
        where: {
          playerId: playerRef.playerId,
          teamId: opponentTeamId,
        },
      });

      if (!roster) {
        return {
          valid: false,
          error: `Opponent does not own player ${playerRef.playerId}`,
        };
      }
    }

    return { valid: true };
  }

  private async calculateTradeDetails(
    creatorPlayers: { playerId: string; willTrade: boolean }[],
    opponentPlayers: { playerId: string; willTrade: boolean }[],
    creatorCash: number,
    opponentCash: number
  ): Promise<{
    success: boolean;
    tradeDetails?: PlayerTradeDetails;
    error?: string;
  }> {
    try {
      // Get player data for value calculations
      const allPlayerIds = [
        ...creatorPlayers.map(p => p.playerId),
        ...opponentPlayers.map(p => p.playerId),
      ];

      const playersData = await prisma.player.findMany({
        where: { id: { in: allPlayerIds } },
      });

      // Convert to PlayerWagerAsset format
      const creatorPlayerAssets = creatorPlayers.map(cp => {
        const player = playersData.find(p => p.id === cp.playerId)!;
        return {
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          team: player.team,
          stockPrice: 0, // Will be calculated by value calculator
        };
      });

      const opponentPlayerAssets = opponentPlayers.map(op => {
        const player = playersData.find(p => p.id === op.playerId)!;
        return {
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          team: player.team,
          stockPrice: 0,
        };
      });

      // Calculate values using the value balancing calculator
      const balanceResult = await valueBalancingCalculator.balanceWager(
        "temp_creator",
        creatorPlayerAssets,
        creatorCash,
        "temp_opponent", 
        opponentPlayerAssets,
        opponentCash
      );

      if (!balanceResult.success) {
        return {
          success: false,
          error: balanceResult.error,
        };
      }

      const balancedWager = balanceResult.balancedWager!;

      // Separate tradeable and non-tradeable players
      const creatorTradePlayers = balancedWager.creatorSide.players.filter((_, index) => 
        creatorPlayers[index]?.willTrade
      );
      const creatorKeepPlayers = balancedWager.creatorSide.players.filter((_, index) => 
        !creatorPlayers[index]?.willTrade
      );

      const opponentTradePlayers = balancedWager.opponentSide.players.filter((_, index) => 
        opponentPlayers[index]?.willTrade
      );
      const opponentKeepPlayers = balancedWager.opponentSide.players.filter((_, index) => 
        !opponentPlayers[index]?.willTrade
      );

      const tradeDetails: PlayerTradeDetails = {
        totalValue: balancedWager.totalValue,
        creatorSide: {
          playersToTrade: creatorTradePlayers,
          playersToKeep: creatorKeepPlayers,
          cashContribution: balancedWager.creatorSide.cashContribution,
          totalValue: balancedWager.creatorSide.totalValue,
        },
        opponentSide: {
          playersToTrade: opponentTradePlayers,
          playersToKeep: opponentKeepPlayers,
          cashContribution: balancedWager.opponentSide.cashContribution,
          totalValue: balancedWager.opponentSide.totalValue,
        },
        valueBalance: {
          isBalanced: balancedWager.isBalanced,
          adjustment: balancedWager.cashAdjustment.amount,
          adjustmentSide: balancedWager.cashAdjustment.requiredBy === "balanced" 
            ? "none" 
            : balancedWager.cashAdjustment.requiredBy,
        },
      };

      return {
        success: true,
        tradeDetails,
      };

    } catch (error) {
      console.error("Error calculating trade details:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async markTradablePlayers(
    wagerId: string,
    creatorPlayers: { playerId: string; willTrade: boolean }[],
    opponentPlayers: { playerId: string; willTrade: boolean }[]
  ): Promise<void> {
    const tradablePlayerIds = [
      ...creatorPlayers.filter(p => p.willTrade).map(p => p.playerId),
      ...opponentPlayers.filter(p => p.willTrade).map(p => p.playerId),
    ];

    await prisma.wagerPlayer.updateMany({
      where: {
        wagerId,
        playerId: { in: tradablePlayerIds },
      },
      data: { isTraded: true },
    });
  }

  private mapDurationToTimeframe(duration: string) {
    switch (duration) {
      case "single_game": return "SINGLE_GAME";
      case "week": return "WEEKLY";
      case "season": return "SEASON";
      default: return "WEEKLY";
    }
  }
}

export const playerTradingWagerSystem = new PlayerTradingWagerSystem();