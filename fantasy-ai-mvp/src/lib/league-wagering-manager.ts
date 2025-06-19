import { prisma } from "./prisma";
import { z } from "zod";
import type { League, WageringSettings, MemberWageringOptIn, Wager, Team, User, UserWallet } from "@prisma/client";

const FEATURE_FLAGS = {
  WAGERING_ENABLED: process.env.ENABLE_WAGERING === 'true' || false,
  LIVE_BETTING_ENABLED: process.env.ENABLE_LIVE_BETTING === 'true' || false,
  CRYPTO_ENABLED: process.env.ENABLE_CRYPTO === 'true' || false,
  PROP_BETTING_ENABLED: process.env.ENABLE_PROP_BETTING === 'true' || false,
};

export const WageringSettingsInputSchema = z.object({
  enablePlayerTrading: z.boolean().default(true),
  enableLiveBetting: z.boolean().default(false),
  enableBounties: z.boolean().default(true),
  enablePropBets: z.boolean().default(false),
  enableCrypto: z.boolean().default(false),
  minWagerAmount: z.number().min(1).default(5),
  maxWagerAmount: z.number().max(10000).default(1000),
  maxDailyWagerTotal: z.number().max(50000).default(5000),
  requireCommissionerApproval: z.boolean().default(false),
  allowGuestBetting: z.boolean().default(false),
  allowCrossLeagueBetting: z.boolean().default(false),
  profitSharingPercent: z.number().min(0).max(10).default(0),
  escrowHoldDays: z.number().min(0).max(7).default(0),
});

export type WageringSettingsInput = z.infer<typeof WageringSettingsInputSchema>;

export interface LeagueWageringStatus {
  enabled: boolean;
  settings?: WageringSettings;
  memberOptIns: {
    userId: string;
    userName: string;
    optedIn: boolean;
    dailyLimit?: number;
    weeklyLimit?: number;
  }[];
  stats: {
    totalWagers: number;
    activeWagers: number;
    totalVolume: number;
    averageWagerSize: number;
    participationRate: number;
  };
}

export class LeagueWageringManager {
  /**
   * Check if wagering features are available
   */
  private checkWageringAvailable(): { available: boolean; reason?: string } {
    if (!FEATURE_FLAGS.WAGERING_ENABLED) {
      return { 
        available: false, 
        reason: "Wagering features coming soon! Currently in beta testing." 
      };
    }
    return { available: true };
  }

  /**
   * Enable wagering for a league (Commissioner only)
   */
  async enableWagering(
    leagueId: string,
    requestingUserId: string,
    initialSettings?: Partial<WageringSettingsInput>
  ): Promise<{
    success: boolean;
    settings?: any;
    error?: string;
  }> {
    try {
      // Check if wagering is available globally
      const availability = this.checkWageringAvailable();
      if (!availability.available) {
        return { success: false, error: availability.reason };
      }

      // Verify user is league commissioner
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: {
          id: true,
          userId: true,
          wageringEnabled: true,
        },
      });

      if (!league) {
        return { success: false, error: "League not found" };
      }

      if (league.userId !== requestingUserId) {
        return { success: false, error: "Only the league commissioner can enable wagering" };
      }

      if (league.wageringEnabled) {
        return { success: false, error: "Wagering is already enabled for this league" };
      }

      // Validate settings
      const validatedSettings = WageringSettingsInputSchema.parse(initialSettings || {});

      // Create wagering settings
      const settings = await prisma.wageringSettings.create({
        data: {
          leagueId,
          ...validatedSettings,
        },
      });

      // Enable wagering on the league
      await prisma.league.update({
        where: { id: leagueId },
        data: { wageringEnabled: true },
      });

      // Send notifications to all league members
      await this.notifyLeagueMembers(
        leagueId,
        "Wagering Enabled",
        "Your league commissioner has enabled wagering features. Visit settings to opt-in!"
      );

      return { success: true, settings };

    } catch (error) {
      console.error("Error enabling wagering:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update wagering settings (Commissioner only)
   */
  async updateWageringSettings(
    leagueId: string,
    requestingUserId: string,
    updates: Partial<WageringSettingsInput>
  ): Promise<{
    success: boolean;
    settings?: any;
    error?: string;
  }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: { 
          wageringSettings: true,
        },
      });

      if (!league) {
        return { success: false, error: "League not found" };
      }

      if (league.userId !== requestingUserId) {
        // Check if user is a wagering admin
        const wageringAdmins = Array.isArray(league.wageringSettings?.wageringAdmins) 
          ? league.wageringSettings.wageringAdmins as string[]
          : [];
        const isAdmin = wageringAdmins.includes(requestingUserId);
        if (!isAdmin) {
          return { success: false, error: "Only commissioners or wagering admins can update settings" };
        }
      }

      if (!league.wageringEnabled || !league.wageringSettings) {
        return { success: false, error: "Wagering is not enabled for this league" };
      }

      // Validate updates
      const validatedUpdates = WageringSettingsInputSchema.partial().parse(updates);

      // Update settings
      const updatedSettings = await prisma.wageringSettings.update({
        where: { id: league.wageringSettings.id },
        data: validatedUpdates,
      });

      return { success: true, settings: updatedSettings };

    } catch (error) {
      console.error("Error updating wagering settings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Opt-in or opt-out of wagering (Individual members)
   */
  async updateMemberOptIn(
    leagueId: string,
    userId: string,
    optIn: boolean,
    personalLimits?: {
      dailyLimit?: number;
      weeklyLimit?: number;
      allowLiveBetting?: boolean;
      allowPlayerTrades?: boolean;
    }
  ): Promise<{
    success: boolean;
    optInStatus?: any;
    error?: string;
  }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: { 
          wageringSettings: true,
          teams: { where: { userId } },
        },
      });

      if (!league) {
        return { success: false, error: "League not found" };
      }

      if (!league.wageringEnabled || !league.wageringSettings) {
        return { success: false, error: "Wagering is not enabled for this league" };
      }

      if (league.teams.length === 0) {
        return { success: false, error: "You must be a member of this league to opt-in to wagering" };
      }

      // Check if user is blocked
      const blockedMembers = Array.isArray(league.wageringSettings.blockedMembers) 
        ? league.wageringSettings.blockedMembers as string[]
        : [];
      if (blockedMembers.includes(userId)) {
        return { success: false, error: "You have been blocked from wagering in this league" };
      }

      // Create or update opt-in status
      const optInStatus = await prisma.memberWageringOptIn.upsert({
        where: {
          userId_wageringSettingsId: {
            userId,
            wageringSettingsId: league.wageringSettings.id,
          },
        },
        create: {
          userId,
          wageringSettingsId: league.wageringSettings.id,
          optedIn: optIn,
          ...personalLimits,
        },
        update: {
          optedIn: optIn,
          ...personalLimits,
        },
      });

      return { success: true, optInStatus };

    } catch (error) {
      console.error("Error updating member opt-in:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get wagering status for a league
   */
  async getLeagueWageringStatus(leagueId: string): Promise<{
    success: boolean;
    status?: LeagueWageringStatus;
    error?: string;
  }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          wageringSettings: {
            include: {
              memberOptIns: {
                include: {
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
          teams: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
          wagers: true,
        },
      });

      if (!league) {
        return { success: false, error: "League not found" };
      }

      // Calculate stats
      const totalWagers = league.wagers.length;
      const activeWagers = league.wagers.filter((w: Wager) => 
        ["OPEN", "MATCHED", "ACTIVE"].includes(w.status)
      ).length;
      const totalVolume = league.wagers.reduce((sum: number, w: Wager) => sum + Number(w.totalValue), 0);
      const averageWagerSize = totalWagers > 0 ? totalVolume / totalWagers : 0;

      // Build member opt-in list
      const memberOptIns = league.teams.map((team: any) => {
        const optIn = league.wageringSettings?.memberOptIns.find(
          (o: MemberWageringOptIn) => o.userId === team.userId
        );

        return {
          userId: team.userId,
          userName: team.user.name || "Unknown",
          optedIn: optIn?.optedIn || false,
          dailyLimit: optIn?.dailyLimit || undefined,
          weeklyLimit: optIn?.weeklyLimit || undefined,
        };
      });

      const optedInCount = memberOptIns.filter(m => m.optedIn).length;
      const participationRate = league.teams.length > 0 
        ? (optedInCount / league.teams.length) * 100 
        : 0;

      const status: LeagueWageringStatus = {
        enabled: league.wageringEnabled,
        settings: league.wageringSettings || undefined,
        memberOptIns,
        stats: {
          totalWagers,
          activeWagers,
          totalVolume,
          averageWagerSize,
          participationRate,
        },
      };

      return { success: true, status };

    } catch (error) {
      console.error("Error getting league wagering status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Check if a user can wager in a league
   */
  async canUserWager(
    userId: string,
    leagueId: string
  ): Promise<{
    canWager: boolean;
    reason?: string;
    limits?: {
      dailyLimit: number;
      weeklyLimit: number;
      remainingDaily: number;
      remainingWeekly: number;
    };
  }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          wageringSettings: {
            include: {
              memberOptIns: {
                where: { userId },
              },
            },
          },
          teams: {
            where: { userId },
          },
        },
      });

      if (!league) {
        return { canWager: false, reason: "League not found" };
      }

      if (!league.wageringEnabled) {
        return { canWager: false, reason: "Wagering is not enabled for this league" };
      }

      if (league.teams.length === 0 && !league.wageringSettings?.allowGuestBetting) {
        return { canWager: false, reason: "You must be a member of this league to wager" };
      }

      const wageringSettings = league.wageringSettings!;
      const memberOptIn = wageringSettings.memberOptIns[0];

      if (!memberOptIn?.optedIn) {
        return { canWager: false, reason: "You have not opted in to wagering for this league" };
      }

      const blockedMembersCheck = Array.isArray(wageringSettings.blockedMembers) 
        ? wageringSettings.blockedMembers as string[]
        : [];
      if (blockedMembersCheck.includes(userId)) {
        return { canWager: false, reason: "You have been blocked from wagering in this league" };
      }

      // Calculate limits
      const userWallet = await prisma.userWallet.findUnique({
        where: { userId },
      });

      if (!userWallet || Number(userWallet.balance) <= 0) {
        return { canWager: false, reason: "Insufficient funds in wallet" };
      }

      // Get today's and this week's wager totals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const userWagers = await prisma.wager.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { opponentId: userId },
          ],
          leagueId,
          createdAt: { gte: weekStart },
        },
      });

      const todayWagers = userWagers.filter((w: Wager) => w.createdAt >= today);
      const dailyTotal = todayWagers.reduce((sum: number, w: Wager) => {
        const userStake = w.creatorId === userId ? w.creatorStake : w.opponentStake;
        return sum + Number(userStake || 0);
      }, 0);

      const weeklyTotal = userWagers.reduce((sum: number, w: Wager) => {
        const userStake = w.creatorId === userId ? w.creatorStake : w.opponentStake;
        return sum + Number(userStake || 0);
      }, 0);

      const effectiveDailyLimit = memberOptIn.dailyLimit || wageringSettings.maxDailyWagerTotal;
      const effectiveWeeklyLimit = memberOptIn.weeklyLimit || (effectiveDailyLimit * 7);

      if (dailyTotal >= effectiveDailyLimit) {
        return { 
          canWager: false, 
          reason: "Daily wagering limit reached",
          limits: {
            dailyLimit: effectiveDailyLimit,
            weeklyLimit: effectiveWeeklyLimit,
            remainingDaily: 0,
            remainingWeekly: Math.max(0, effectiveWeeklyLimit - weeklyTotal),
          },
        };
      }

      if (weeklyTotal >= effectiveWeeklyLimit) {
        return { 
          canWager: false, 
          reason: "Weekly wagering limit reached",
          limits: {
            dailyLimit: effectiveDailyLimit,
            weeklyLimit: effectiveWeeklyLimit,
            remainingDaily: 0,
            remainingWeekly: 0,
          },
        };
      }

      return { 
        canWager: true,
        limits: {
          dailyLimit: effectiveDailyLimit,
          weeklyLimit: effectiveWeeklyLimit,
          remainingDaily: effectiveDailyLimit - dailyTotal,
          remainingWeekly: effectiveWeeklyLimit - weeklyTotal,
        },
      };

    } catch (error) {
      console.error("Error checking wagering eligibility:", error);
      return { 
        canWager: false, 
        reason: "Error checking wagering eligibility" 
      };
    }
  }

  /**
   * Add wagering admin (Commissioner only)
   */
  async addWageringAdmin(
    leagueId: string,
    requestingUserId: string,
    newAdminId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: { wageringSettings: true },
      });

      if (!league) {
        return { success: false, error: "League not found" };
      }

      if (league.userId !== requestingUserId) {
        return { success: false, error: "Only the league commissioner can add wagering admins" };
      }

      if (!league.wageringSettings) {
        return { success: false, error: "Wagering is not enabled for this league" };
      }

      await prisma.wageringSettings.update({
        where: { id: league.wageringSettings.id },
        data: {
          wageringAdmins: {
            push: [newAdminId],
          },
        },
      });

      return { success: true };

    } catch (error) {
      console.error("Error adding wagering admin:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Block/unblock member from wagering (Commissioner/Admin only)
   */
  async toggleMemberBlock(
    leagueId: string,
    requestingUserId: string,
    targetUserId: string,
    block: boolean
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: { wageringSettings: true },
      });

      if (!league || !league.wageringSettings) {
        return { success: false, error: "League or wagering settings not found" };
      }

      const isCommissioner = league.userId === requestingUserId;
      const adminsList = Array.isArray(league.wageringSettings.wageringAdmins) 
        ? league.wageringSettings.wageringAdmins as string[]
        : [];
      const isAdmin = adminsList.includes(requestingUserId);

      if (!isCommissioner && !isAdmin) {
        return { success: false, error: "Insufficient permissions" };
      }

      const currentBlocked = Array.isArray(league.wageringSettings.blockedMembers) 
        ? league.wageringSettings.blockedMembers as string[]
        : [];
      let updatedBlocked: string[];

      if (block) {
        if (currentBlocked.includes(targetUserId)) {
          return { success: false, error: "User is already blocked" };
        }
        updatedBlocked = [...currentBlocked, targetUserId];
      } else {
        updatedBlocked = currentBlocked.filter(id => id !== targetUserId);
      }

      await prisma.wageringSettings.update({
        where: { id: league.wageringSettings.id },
        data: { blockedMembers: updatedBlocked },
      });

      return { success: true };

    } catch (error) {
      console.error("Error toggling member block:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Disable wagering for a league (Commissioner only)
   */
  async disableWagering(
    leagueId: string,
    requestingUserId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: {
          id: true,
          userId: true,
          wageringEnabled: true,
          wagers: {
            where: {
              status: { in: ["OPEN", "MATCHED", "ACTIVE"] },
            },
          },
        },
      });

      if (!league) {
        return { success: false, error: "League not found" };
      }

      if (league.userId !== requestingUserId) {
        return { success: false, error: "Only the league commissioner can disable wagering" };
      }

      if (!league.wageringEnabled) {
        return { success: false, error: "Wagering is already disabled" };
      }

      if (league.wagers.length > 0) {
        return { 
          success: false, 
          error: `Cannot disable wagering with ${league.wagers.length} active wagers. Please settle or cancel all wagers first.` 
        };
      }

      // Disable wagering
      await prisma.league.update({
        where: { id: leagueId },
        data: { wageringEnabled: false },
      });

      // Notify all members
      await this.notifyLeagueMembers(
        leagueId,
        "Wagering Disabled",
        "The league commissioner has disabled wagering features."
      );

      return { success: true };

    } catch (error) {
      console.error("Error disabling wagering:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Helper method to notify league members
  private async notifyLeagueMembers(
    leagueId: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      const teams = await prisma.team.findMany({
        where: { leagueId },
        select: { userId: true },
      });

      const notifications = teams.map(team => ({
        userId: team.userId,
        type: "WAGER_UPDATE" as const,
        title,
        message,
        data: { leagueId },
      }));

      await prisma.alert.createMany({
        data: notifications,
      });
    } catch (error) {
      console.error("Error notifying league members:", error);
    }
  }
}

export const leagueWageringManager = new LeagueWageringManager();