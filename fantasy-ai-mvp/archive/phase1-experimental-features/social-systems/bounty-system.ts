import { prisma } from "./prisma";
import { stripeEscrowManager } from "./stripe-integration";
import { WagerTimeframe, BountyStatus } from "@prisma/client";

export interface CreateBountyParams {
  creatorId: string;
  title: string;
  description: string;
  bountyAmount: number;
  targetMetric: BountyTargetMetric;
  timeframe: WagerTimeframe;
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  isPublic?: boolean;
  leagueId?: string;
}

export interface BountyTargetMetric {
  type: "points" | "touchdowns" | "yards" | "receptions" | "custom";
  target: number;
  playerId?: string; // For player-specific bounties
  position?: string; // For position-based bounties
  comparison: "greater_than" | "less_than" | "equal_to" | "range";
  description: string;
  bonusMultipliers?: {
    threshold: number;
    multiplier: number;
  }[];
}

export interface CreateBountyResult {
  success: boolean;
  bountyId?: string;
  escrowInfo?: {
    escrowId: string;
    creatorPaymentIntent: string;
  };
  error?: string;
}

export interface JoinBountyParams {
  bountyId: string;
  participantId: string;
  stakeAmount: number;
}

export interface JoinBountyResult {
  success: boolean;
  escrowInfo?: {
    participantPaymentIntent: string;
  };
  error?: string;
}

export interface BountyLeaderboard {
  participantId: string;
  participantName: string;
  currentScore: number;
  progress: number; // Percentage towards target
  rank: number;
  isWinning: boolean;
}

export interface SettleBountyParams {
  bountyId: string;
  results: {
    participantId: string;
    finalScore: number;
    achieved: boolean;
  }[];
}

export interface SettleBountyResult {
  success: boolean;
  winners?: string[];
  winnings?: number;
  error?: string;
}

export class BountySystem {

  /**
   * Create a new bounty challenge
   */
  async createBounty(params: CreateBountyParams): Promise<CreateBountyResult> {
    try {
      // Validate creator can afford the bounty
      const wallet = await prisma.userWallet.findUnique({
        where: { userId: params.creatorId },
      });

      const availableBalance = wallet ? wallet.balance - wallet.lockedAmount : 0;
      if (params.bountyAmount > availableBalance) {
        return {
          success: false,
          error: `Insufficient funds. You need $${(params.bountyAmount - availableBalance).toFixed(2)} more.`,
        };
      }

      // Create escrow for the bounty
      const escrowResult = await stripeEscrowManager.createEscrowPaymentIntent({
        userId: params.creatorId,
        amount: params.bountyAmount,
        description: `Bounty creation: ${params.title}`,
        metadata: {
          type: "bounty",
          bountyAmount: params.bountyAmount.toString(),
        },
      });

      if (!escrowResult.success) {
        return {
          success: false,
          error: `Failed to create escrow: ${escrowResult.error}`,
        };
      }

      // Create escrow account
      const escrow = await prisma.escrowAccount.create({
        data: {
          totalAmount: params.bountyAmount,
          creatorAmount: params.bountyAmount,
          opponentAmount: 0,
          stripePaymentIntentId: escrowResult.paymentIntentId,
        },
      });

      // Create bounty
      const bounty = await prisma.bounty.create({
        data: {
          creatorId: params.creatorId,
          title: params.title,
          description: params.description,
          bountyAmount: params.bountyAmount,
          targetMetric: params.targetMetric,
          timeframe: params.timeframe,
          startDate: params.startDate,
          endDate: params.endDate,
          maxParticipants: params.maxParticipants || 1,
          isPublic: params.isPublic ?? true,
          escrowId: escrow.id,
          leagueId: params.leagueId,
        },
      });

      // Lock funds in creator's wallet
      await prisma.userWallet.upsert({
        where: { userId: params.creatorId },
        update: { lockedAmount: { increment: params.bountyAmount } },
        create: {
          userId: params.creatorId,
          lockedAmount: params.bountyAmount,
        },
      });

      return {
        success: true,
        bountyId: bounty.id,
        escrowInfo: {
          escrowId: escrow.id,
          creatorPaymentIntent: escrowResult.paymentIntentId!,
        },
      };

    } catch (error) {
      console.error("Error creating bounty:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Join an existing bounty challenge
   */
  async joinBounty(params: JoinBountyParams): Promise<JoinBountyResult> {
    try {
      const bounty = await prisma.bounty.findUnique({
        where: { id: params.bountyId },
        include: {
          participants: true,
          creator: true,
        },
      });

      if (!bounty) {
        return { success: false, error: "Bounty not found" };
      }

      if (bounty.status !== "OPEN") {
        return { success: false, error: "Bounty is no longer accepting participants" };
      }

      if (bounty.creatorId === params.participantId) {
        return { success: false, error: "Cannot join your own bounty" };
      }

      if (bounty.participants.length >= bounty.maxParticipants) {
        return { success: false, error: "Bounty is full" };
      }

      // Check if user already participating
      const existingParticipant = bounty.participants.find(
        p => p.participantId === params.participantId
      );
      if (existingParticipant) {
        return { success: false, error: "Already participating in this bounty" };
      }

      // Validate participant can afford the stake
      const wallet = await prisma.userWallet.findUnique({
        where: { userId: params.participantId },
      });

      const availableBalance = wallet ? wallet.balance - wallet.lockedAmount : 0;
      if (params.stakeAmount > availableBalance) {
        return {
          success: false,
          error: `Insufficient funds. You need $${(params.stakeAmount - availableBalance).toFixed(2)} more.`,
        };
      }

      // Create payment intent for participant
      const paymentResult = await stripeEscrowManager.createEscrowPaymentIntent({
        userId: params.participantId,
        amount: params.stakeAmount,
        description: `Bounty participation: ${bounty.title}`,
        metadata: {
          bountyId: params.bountyId,
          escrowId: bounty.escrowId,
          type: "bounty_participation",
        },
      });

      if (!paymentResult.success) {
        return {
          success: false,
          error: `Failed to create payment: ${paymentResult.error}`,
        };
      }

      // Add participant to bounty
      await prisma.bountyParticipant.create({
        data: {
          bountyId: params.bountyId,
          participantId: params.participantId,
          stakeAmount: params.stakeAmount,
        },
      });

      // Update escrow total
      await prisma.escrowAccount.update({
        where: { id: bounty.escrowId },
        data: {
          totalAmount: { increment: params.stakeAmount },
          opponentAmount: { increment: params.stakeAmount },
        },
      });

      // Lock funds in participant's wallet
      await prisma.userWallet.upsert({
        where: { userId: params.participantId },
        update: { lockedAmount: { increment: params.stakeAmount } },
        create: {
          userId: params.participantId,
          lockedAmount: params.stakeAmount,
        },
      });

      // Check if bounty is now full and should start
      const updatedBounty = await prisma.bounty.findUnique({
        where: { id: params.bountyId },
        include: { participants: true },
      });

      if (updatedBounty && updatedBounty.participants.length >= updatedBounty.maxParticipants) {
        await prisma.bounty.update({
          where: { id: params.bountyId },
          data: { status: "ACTIVE" },
        });

        await this.createBountyUpdate(
          params.bountyId,
          "STATUS_CHANGE",
          "Bounty is now active - all spots filled!",
          { maxParticipants: updatedBounty.maxParticipants }
        );
      }

      return {
        success: true,
        escrowInfo: {
          participantPaymentIntent: paymentResult.paymentIntentId!,
        },
      };

    } catch (error) {
      console.error("Error joining bounty:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update participant scores during active bounty
   */
  async updateBountyScores(
    bountyId: string,
    scores: { participantId: string; score: number }[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const bounty = await prisma.bounty.findUnique({
        where: { id: bountyId },
        include: { participants: true },
      });

      if (!bounty) {
        return { success: false, error: "Bounty not found" };
      }

      if (bounty.status !== "ACTIVE") {
        return { success: false, error: "Bounty is not active" };
      }

      // Update scores for each participant
      for (const scoreUpdate of scores) {
        await prisma.bountyParticipant.updateMany({
          where: {
            bountyId,
            participantId: scoreUpdate.participantId,
          },
          data: {
            currentScore: scoreUpdate.score,
          },
        });
      }

      // Create update notification
      await this.createBountyUpdate(
        bountyId,
        "SCORE_UPDATE",
        "Scores updated",
        { scores }
      );

      return { success: true };

    } catch (error) {
      console.error("Error updating bounty scores:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get current leaderboard for a bounty
   */
  async getBountyLeaderboard(bountyId: string): Promise<{
    success: boolean;
    leaderboard?: BountyLeaderboard[];
    targetMetric?: BountyTargetMetric;
    error?: string;
  }> {
    try {
      const bounty = await prisma.bounty.findUnique({
        where: { id: bountyId },
        include: {
          participants: {
            include: {
              participant: { select: { name: true } },
            },
            orderBy: { currentScore: "desc" },
          },
        },
      });

      if (!bounty) {
        return { success: false, error: "Bounty not found" };
      }

      const targetMetric = bounty.targetMetric as BountyTargetMetric;
      const target = targetMetric.target;

      const leaderboard: BountyLeaderboard[] = bounty.participants.map((participant, index) => {
        const progress = target > 0 ? (participant.currentScore / target) * 100 : 0;
        const isWinning = this.checkIfScoreAchievesTarget(participant.currentScore, targetMetric);

        return {
          participantId: participant.participantId,
          participantName: participant.participant.name || "Unknown",
          currentScore: participant.currentScore,
          progress: Math.min(100, progress),
          rank: index + 1,
          isWinning,
        };
      });

      return {
        success: true,
        leaderboard,
        targetMetric,
      };

    } catch (error) {
      console.error("Error getting bounty leaderboard:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Settle a completed bounty
   */
  async settleBounty(params: SettleBountyParams): Promise<SettleBountyResult> {
    try {
      const bounty = await prisma.bounty.findUnique({
        where: { id: params.bountyId },
        include: {
          participants: true,
          escrow: true,
        },
      });

      if (!bounty) {
        return { success: false, error: "Bounty not found" };
      }

      if (bounty.status !== "ACTIVE") {
        return { success: false, error: "Bounty is not active" };
      }

      const targetMetric = bounty.targetMetric as BountyTargetMetric;

      // Determine winners based on target achievement
      const winners = params.results.filter(result => result.achieved);

      if (winners.length === 0) {
        // No winners - refund all participants
        await this.refundBounty(params.bountyId, "No participants achieved the target");
        return {
          success: true,
          winners: [],
          winnings: 0,
        };
      }

      // Calculate winnings per winner
      const totalPrizePool = bounty.escrow?.totalAmount || 0;
      const winningsPerWinner = totalPrizePool / winners.length;

      // Update bounty status
      await prisma.bounty.update({
        where: { id: params.bountyId },
        data: {
          status: "COMPLETED",
          settledAt: new Date(),
          winnerId: winners.length === 1 ? winners[0].participantId : undefined,
        },
      });

      // Distribute winnings
      for (const winner of winners) {
        await stripeEscrowManager.releaseEscrow(
          bounty.escrowId,
          winner.participantId,
          `Bounty won: ${bounty.title}`
        );

        // Update participant stats
        await prisma.userWallet.upsert({
          where: { userId: winner.participantId },
          update: {
            totalWon: { increment: winningsPerWinner },
            lockedAmount: { decrement: bounty.participants.find(p => p.participantId === winner.participantId)?.stakeAmount || 0 },
          },
          create: {
            userId: winner.participantId,
            totalWon: winningsPerWinner,
          },
        });
      }

      // Update loser stats
      for (const participant of bounty.participants) {
        if (!winners.find(w => w.participantId === participant.participantId)) {
          await prisma.userWallet.upsert({
            where: { userId: participant.participantId },
            update: {
              totalLost: { increment: participant.stakeAmount },
              lockedAmount: { decrement: participant.stakeAmount },
            },
            create: {
              userId: participant.participantId,
              totalLost: participant.stakeAmount,
            },
          });
        }
      }

      // Unlock creator's funds
      await prisma.userWallet.update({
        where: { userId: bounty.creatorId },
        data: { lockedAmount: { decrement: bounty.bountyAmount } },
      });

      // Create settlement notification
      await this.createBountyUpdate(
        params.bountyId,
        "STATUS_CHANGE",
        `Bounty completed! ${winners.length} winner(s)`,
        {
          winners: winners.map(w => w.participantId),
          winningsPerWinner,
          results: params.results,
        }
      );

      return {
        success: true,
        winners: winners.map(w => w.participantId),
        winnings: winningsPerWinner,
      };

    } catch (error) {
      console.error("Error settling bounty:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Cancel a bounty and refund participants
   */
  async cancelBounty(bountyId: string, creatorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const bounty = await prisma.bounty.findUnique({
        where: { id: bountyId },
        include: { participants: true },
      });

      if (!bounty) {
        return { success: false, error: "Bounty not found" };
      }

      if (bounty.creatorId !== creatorId) {
        return { success: false, error: "Only the creator can cancel this bounty" };
      }

      if (bounty.status === "COMPLETED") {
        return { success: false, error: "Cannot cancel completed bounty" };
      }

      await this.refundBounty(bountyId, "Bounty cancelled by creator");

      return { success: true };

    } catch (error) {
      console.error("Error cancelling bounty:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get public bounties available to join
   */
  async getPublicBounties(leagueId?: string, limit: number = 20): Promise<{
    success: boolean;
    bounties?: any[];
    error?: string;
  }> {
    try {
      const bounties = await prisma.bounty.findMany({
        where: {
          status: { in: ["OPEN", "ACTIVE"] },
          isPublic: true,
          ...(leagueId && { leagueId }),
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          league: { select: { id: true, name: true } },
          participants: {
            include: {
              participant: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return { success: true, bounties };

    } catch (error) {
      console.error("Error getting public bounties:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get user's bounty history
   */
  async getUserBounties(userId: string, status?: BountyStatus): Promise<{
    success: boolean;
    bounties?: any[];
    error?: string;
  }> {
    try {
      const bounties = await prisma.bounty.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { participants: { some: { participantId: userId } } },
          ],
          ...(status && { status }),
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          league: { select: { id: true, name: true } },
          participants: {
            include: {
              participant: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, bounties };

    } catch (error) {
      console.error("Error getting user bounties:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Private helper methods

  private async refundBounty(bountyId: string, reason: string): Promise<void> {
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { participants: true },
    });

    if (!bounty) return;

    // Update bounty status
    await prisma.bounty.update({
      where: { id: bountyId },
      data: { status: "CANCELLED" },
    });

    // Refund escrow
    await stripeEscrowManager.refundEscrow(bounty.escrowId, reason);

    // Unlock funds for all participants
    for (const participant of bounty.participants) {
      await prisma.userWallet.update({
        where: { userId: participant.participantId },
        data: { lockedAmount: { decrement: participant.stakeAmount } },
      });
    }

    // Unlock creator's funds
    await prisma.userWallet.update({
      where: { userId: bounty.creatorId },
      data: { lockedAmount: { decrement: bounty.bountyAmount } },
    });
  }

  private checkIfScoreAchievesTarget(score: number, targetMetric: BountyTargetMetric): boolean {
    const { target, comparison } = targetMetric;

    switch (comparison) {
      case "greater_than":
        return score > target;
      case "less_than":
        return score < target;
      case "equal_to":
        return score === target;
      default:
        return false;
    }
  }

  private async createBountyUpdate(
    bountyId: string,
    type: "SCORE_UPDATE" | "STATUS_CHANGE" | "PAYMENT_UPDATE" | "PLAYER_UPDATE" | "SYSTEM_MESSAGE",
    message: string,
    data?: any
  ): Promise<void> {
    await prisma.bountyUpdate.create({
      data: {
        bountyId,
        type,
        message,
        data,
      },
    });
  }
}

export const bountySystem = new BountySystem();