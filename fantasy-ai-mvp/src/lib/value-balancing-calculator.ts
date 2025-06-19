// Mock types for disabled fantasy stock market
interface PlayerStock {
  playerId: string;
  currentPrice: number;
  priceChangeToday: number;
}

import { prisma } from "./prisma";

export interface PlayerWagerAsset {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  stockPrice: number;
  quantity?: number; // For multiple shares/players
}

export interface WagerSide {
  userId: string;
  players: PlayerWagerAsset[];
  cashContribution: number;
  totalValue: number;
}

export interface BalancedWager {
  creatorSide: WagerSide;
  opponentSide: WagerSide;
  totalValue: number;
  isBalanced: boolean;
  cashAdjustment: {
    requiredBy: "creator" | "opponent" | "balanced";
    amount: number;
  };
  priceLockedAt: Date;
  volatilityBuffer: number;
}

export interface ValueBalanceResult {
  success: boolean;
  balancedWager?: BalancedWager;
  error?: string;
  suggestions?: string[];
}

export class ValueBalancingCalculator {
  private stockMarket: any; // Mock fantasy stock market
  private volatilityBufferPercent = 0.02; // 2% buffer for price volatility

  constructor() {
    this.stockMarket = null; // Mock disabled
  }

  /**
   * Calculate the current market value of a collection of players
   */
  async calculatePlayersValue(players: Omit<PlayerWagerAsset, 'stockPrice'>[]): Promise<{
    totalValue: number;
    playersWithPrices: PlayerWagerAsset[];
    priceSnapshot: Date;
  }> {
    const playersWithPrices = await Promise.all(
      players.map(async (player) => {
        // Get current stock price for player
        const stockSymbol = this.generatePlayerStockSymbol(player.playerId, player.position, player.team);
        const playerStock = await this.stockMarket.getPlayerStock(stockSymbol);
        
        const stockPrice = playerStock?.currentPrice || this.estimatePlayerValue(player.position);
        const quantity = player.quantity || 1;

        return {
          ...player,
          stockPrice,
          quantity,
        } as PlayerWagerAsset;
      })
    );

    const totalValue = playersWithPrices.reduce(
      (sum, player) => sum + (player.stockPrice * (player.quantity || 1)), 
      0
    );

    return {
      totalValue,
      playersWithPrices,
      priceSnapshot: new Date(),
    };
  }

  /**
   * Balance a wager between two sides, calculating required cash adjustments
   */
  async balanceWager(
    creatorUserId: string,
    creatorPlayers: Omit<PlayerWagerAsset, 'stockPrice'>[],
    creatorCash: number,
    opponentUserId: string,
    opponentPlayers: Omit<PlayerWagerAsset, 'stockPrice'>[],
    opponentCash: number
  ): Promise<ValueBalanceResult> {
    try {
      // Calculate current values for both sides
      const [creatorData, opponentData] = await Promise.all([
        this.calculatePlayersValue(creatorPlayers),
        this.calculatePlayersValue(opponentPlayers)
      ]);

      const creatorPlayerValue = creatorData.totalValue;
      const opponentPlayerValue = opponentData.totalValue;

      const creatorTotalValue = creatorPlayerValue + creatorCash;
      const opponentTotalValue = opponentPlayerValue + opponentCash;

      // Calculate value difference
      const valueDifference = Math.abs(creatorTotalValue - opponentTotalValue);
      const targetValue = Math.max(creatorTotalValue, opponentTotalValue);

      // Apply volatility buffer
      const volatilityBuffer = targetValue * this.volatilityBufferPercent;
      const isBalanced = valueDifference <= volatilityBuffer;

      let cashAdjustment: { requiredBy: "creator" | "opponent" | "balanced"; amount: number };

      if (isBalanced) {
        cashAdjustment = { requiredBy: "balanced", amount: 0 };
      } else {
        const needsAdjustment = creatorTotalValue < opponentTotalValue ? "creator" : "opponent";
        cashAdjustment = {
          requiredBy: needsAdjustment,
          amount: valueDifference
        };
      }

      // Adjust cash contributions based on balance calculation
      let adjustedCreatorCash = creatorCash;
      let adjustedOpponentCash = opponentCash;

      if (cashAdjustment.requiredBy === "creator") {
        adjustedCreatorCash += cashAdjustment.amount;
      } else if (cashAdjustment.requiredBy === "opponent") {
        adjustedOpponentCash += cashAdjustment.amount;
      }

      const balancedWager: BalancedWager = {
        creatorSide: {
          userId: creatorUserId,
          players: creatorData.playersWithPrices,
          cashContribution: adjustedCreatorCash,
          totalValue: creatorPlayerValue + adjustedCreatorCash,
        },
        opponentSide: {
          userId: opponentUserId,
          players: opponentData.playersWithPrices,
          cashContribution: adjustedOpponentCash,
          totalValue: opponentPlayerValue + adjustedOpponentCash,
        },
        totalValue: targetValue,
        isBalanced: true, // After adjustment
        cashAdjustment,
        priceLockedAt: new Date(),
        volatilityBuffer,
      };

      // Generate suggestions for better balance if needed
      const suggestions = await this.generateBalancingSuggestions(
        creatorData.playersWithPrices,
        opponentData.playersWithPrices,
        cashAdjustment
      );

      return {
        success: true,
        balancedWager,
        suggestions,
      };

    } catch (error) {
      console.error("Error balancing wager:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Lock in player values for a wager to prevent manipulation
   */
  async lockWagerValues(
    wagerId: string,
    balancedWager: BalancedWager
  ): Promise<{ success: boolean; snapshotIds: string[]; error?: string }> {
    try {
      const snapshotIds: string[] = [];

      // Create value snapshots for all players in the wager
      const allPlayers = [
        ...balancedWager.creatorSide.players,
        ...balancedWager.opponentSide.players,
      ];

      for (const player of allPlayers) {
        const snapshot = await prisma.valueSnapshot.create({
          data: {
            playerId: player.playerId,
            stockPrice: player.stockPrice,
            wagerId,
            metadata: {
              playerName: player.playerName,
              position: player.position,
              team: player.team,
              lockedForWager: true,
              wagerCreatedAt: balancedWager.priceLockedAt,
            },
          },
        });
        snapshotIds.push(snapshot.id);
      }

      return { success: true, snapshotIds };
    } catch (error) {
      console.error("Error locking wager values:", error);
      return {
        success: false,
        snapshotIds: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Calculate live value changes during a wager
   */
  async calculateLiveValueChanges(wagerId: string): Promise<{
    success: boolean;
    valueChanges?: {
      creatorSideChange: number;
      opponentSideChange: number;
      netSwing: number;
      percentageChange: number;
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
        },
      });

      if (!wager) {
        return { success: false, error: "Wager not found" };
      }

      let creatorOriginalValue = 0;
      let creatorCurrentValue = 0;
      let opponentOriginalValue = 0;
      let opponentCurrentValue = 0;

      // Calculate value changes for each side
      for (const wagerPlayer of wager.wagerPlayers) {
        const originalPrice = wagerPlayer.stockPrice;
        const currentPrice = wagerPlayer.currentValue;

        if (wagerPlayer.side === "CREATOR") {
          creatorOriginalValue += originalPrice;
          creatorCurrentValue += currentPrice;
        } else {
          opponentOriginalValue += originalPrice;
          opponentCurrentValue += currentPrice;
        }
      }

      const creatorSideChange = creatorCurrentValue - creatorOriginalValue;
      const opponentSideChange = opponentCurrentValue - opponentOriginalValue;
      const netSwing = creatorSideChange - opponentSideChange;
      
      const totalOriginalValue = creatorOriginalValue + opponentOriginalValue;
      const percentageChange = totalOriginalValue > 0 ? (Math.abs(netSwing) / totalOriginalValue) * 100 : 0;

      return {
        success: true,
        valueChanges: {
          creatorSideChange,
          opponentSideChange,
          netSwing,
          percentageChange,
        },
      };
    } catch (error) {
      console.error("Error calculating live value changes:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update live player values during active wagers
   */
  async updateLivePlayerValues(wagerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const wager = await prisma.wager.findUnique({
        where: { id: wagerId },
        include: {
          wagerPlayers: {
            include: { player: true },
          },
        },
      });

      if (!wager || wager.status !== "ACTIVE") {
        return { success: false, error: "Wager not found or not active" };
      }

      // Update current values for all players in the wager
      for (const wagerPlayer of wager.wagerPlayers) {
        const stockSymbol = this.generatePlayerStockSymbol(
          wagerPlayer.player.id,
          wagerPlayer.player.position,
          wagerPlayer.player.team
        );
        
        const currentStock = await this.stockMarket.getPlayerStock(stockSymbol);
        const currentValue = currentStock?.currentPrice || wagerPlayer.stockPrice;

        await prisma.wagerPlayer.update({
          where: { id: wagerPlayer.id },
          data: { currentValue },
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating live player values:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Generate smart suggestions for better wager balance
   */
  private async generateBalancingSuggestions(
    creatorPlayers: PlayerWagerAsset[],
    opponentPlayers: PlayerWagerAsset[],
    cashAdjustment: { requiredBy: string; amount: number }
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (cashAdjustment.amount > 0) {
      const needsMore = cashAdjustment.requiredBy;
      const formattedAmount = `$${cashAdjustment.amount.toFixed(2)}`;

      suggestions.push(
        `${needsMore === "creator" ? "Creator" : "Opponent"} needs to add ${formattedAmount} to balance the wager`
      );

      // Suggest alternative player swaps
      if (cashAdjustment.amount > 100) {
        suggestions.push(
          "Consider swapping players with similar values to reduce cash requirement"
        );
      }

      // Suggest adding lower-value players instead of cash
      const lowValueThreshold = 200;
      if (cashAdjustment.amount < lowValueThreshold) {
        suggestions.push(
          "Alternative: Add a bench player or kicker to balance instead of cash"
        );
      }
    }

    return suggestions;
  }

  /**
   * Generate stock symbol for player (integration with fantasy stock market)
   */
  private generatePlayerStockSymbol(playerId: string, position: string, team: string): string {
    // Create a consistent symbol format like "PLAYER_YEAR" or use existing format
    const year = new Date().getFullYear();
    const playerCode = playerId.slice(-3).toUpperCase(); // Last 3 chars of ID
    return `${playerCode}${year}`;
  }

  /**
   * Estimate player value when stock price is not available
   */
  private estimatePlayerValue(position: string): number {
    const baseValues: Record<string, number> = {
      QB: 1000,
      RB: 800,
      WR: 600,
      TE: 400,
      K: 100,
      DST: 150,
    };

    return baseValues[position] || 500;
  }

  /**
   * Calculate maximum wager amount based on user's wallet balance
   */
  async calculateMaxWagerAmount(userId: string): Promise<{
    maxAmount: number;
    availableBalance: number;
    lockedAmount: number;
  }> {
    const wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return { maxAmount: 0, availableBalance: 0, lockedAmount: 0 };
    }

    const availableBalance = wallet.balance - wallet.lockedAmount;
    const maxAmount = Math.max(0, availableBalance * 0.5); // Max 50% of available balance per wager

    return {
      maxAmount,
      availableBalance,
      lockedAmount: wallet.lockedAmount,
    };
  }

  /**
   * Validate if a user can afford a wager
   */
  async validateWagerAffordability(
    userId: string,
    requiredAmount: number
  ): Promise<{ canAfford: boolean; shortfall?: number }> {
    const { maxAmount, availableBalance } = await this.calculateMaxWagerAmount(userId);

    const canAfford = requiredAmount <= availableBalance && requiredAmount <= maxAmount;
    const shortfall = canAfford ? undefined : Math.max(requiredAmount - availableBalance, requiredAmount - maxAmount);

    return { canAfford, shortfall };
  }
}

export const valueBalancingCalculator = new ValueBalancingCalculator();