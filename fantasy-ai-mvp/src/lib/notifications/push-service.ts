import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys not configured - push notifications will not work');
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  /**
   * Subscribe user to push notifications
   */
  async subscribeUser(
    userId: string,
    subscription: PushSubscription,
    deviceInfo?: {
      userAgent: string;
      platform: string;
    }
  ): Promise<void> {
    try {
      // Store subscription in database
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint
          }
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          userAgent: deviceInfo?.userAgent,
          platform: deviceInfo?.platform,
          isActive: true
        },
        update: {
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          userAgent: deviceInfo?.userAgent,
          platform: deviceInfo?.platform,
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Push subscription saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(userId: string, endpoint: string): Promise<void> {
    try {
      await prisma.pushSubscription.updateMany({
        where: {
          userId,
          endpoint
        },
        data: {
          isActive: false
        }
      });

      console.log(`✅ Push subscription disabled for user ${userId}`);
    } catch (error) {
      console.error('Error disabling push subscription:', error);
      throw error;
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendToUser(
    userId: string,
    notification: PushNotification,
    options?: {
      urgency?: 'very-low' | 'low' | 'normal' | 'high';
      ttl?: number;
    }
  ): Promise<boolean> {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          isActive: true
        }
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`);
        return false;
      }

      const payload = JSON.stringify(notification);
      const pushOptions = {
        urgency: options?.urgency || 'normal',
        TTL: options?.ttl || 86400, // 24 hours
      };

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dhKey,
              auth: sub.authKey
            }
          };

          return webpush.sendNotification(
            pushSubscription,
            payload,
            pushOptions
          );
        })
      );

      // Check for failed subscriptions and disable them
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
          const subscription = subscriptions[i];
          console.error(`Push notification failed for ${subscription.endpoint}:`, result.reason);
          
          // Disable invalid subscriptions
          if (this.isSubscriptionInvalid(result.reason)) {
            await this.unsubscribeUser(userId, subscription.endpoint);
          }
        }
      }

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ Sent push notification to ${successCount}/${subscriptions.length} devices for user ${userId}`);
      
      return successCount > 0;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    notification: PushNotification,
    options?: {
      urgency?: 'very-low' | 'low' | 'normal' | 'high';
      ttl?: number;
    }
  ): Promise<number> {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification, options))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`✅ Sent push notifications to ${successCount}/${userIds.length} users`);
    
    return successCount;
  }

  /**
   * Send push notification to all subscribers
   */
  async sendToAll(
    notification: PushNotification,
    filters?: {
      subscriptionTier?: string[];
      userLevel?: { min?: number; max?: number };
      lastActive?: Date;
    }
  ): Promise<number> {
    try {
      // Build user filter query
      const userWhere: any = {};
      
      if (filters?.subscriptionTier) {
        userWhere.subscriptionTier = { in: filters.subscriptionTier };
      }
      
      if (filters?.userLevel) {
        userWhere.level = {};
        if (filters.userLevel.min) userWhere.level.gte = filters.userLevel.min;
        if (filters.userLevel.max) userWhere.level.lte = filters.userLevel.max;
      }
      
      if (filters?.lastActive) {
        userWhere.lastActiveAt = { gte: filters.lastActive };
      }

      const users = await prisma.user.findMany({
        where: userWhere,
        select: { id: true }
      });

      const userIds = users.map(u => u.id);
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Error sending broadcast push notification:', error);
      return 0;
    }
  }

  /**
   * Send score update notifications
   */
  async sendScoreUpdate(
    userId: string,
    playerName: string,
    points: number,
    gameContext?: string
  ): Promise<boolean> {
    const notification: PushNotification = {
      title: `${playerName} Scored!`,
      body: `+${points.toFixed(1)} points${gameContext ? ` (${gameContext})` : ''}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `score-${userId}-${Date.now()}`,
      data: {
        type: 'score_update',
        playerId: playerName,
        points,
        url: '/dashboard'
      },
      actions: [
        {
          action: 'view',
          title: 'View Dashboard'
        }
      ]
    };

    return await this.sendToUser(userId, notification, { urgency: 'high' });
  }

  /**
   * Send trade alert notifications
   */
  async sendTradeAlert(
    userIds: string[],
    tradeDetails: {
      proposer: string;
      target: string;
      givingPlayers: string[];
      receivingPlayers: string[];
    }
  ): Promise<number> {
    const notification: PushNotification = {
      title: 'New Trade Proposal',
      body: `${tradeDetails.proposer} wants to trade with ${tradeDetails.target}`,
      icon: '/icons/icon-192x192.png',
      tag: 'trade-alert',
      data: {
        type: 'trade_proposal',
        url: '/trades'
      },
      actions: [
        {
          action: 'view',
          title: 'View Trade'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    return await this.sendToUsers(userIds, notification);
  }

  /**
   * Send injury alert notifications
   */
  async sendInjuryAlert(
    affectedUserIds: string[],
    playerName: string,
    injuryStatus: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<number> {
    const urgencyMap = {
      low: 'low' as const,
      medium: 'normal' as const,
      high: 'high' as const
    };

    const notification: PushNotification = {
      title: 'Injury Alert',
      body: `${playerName} is ${injuryStatus}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `injury-${playerName}`,
      data: {
        type: 'injury_alert',
        playerName,
        status: injuryStatus,
        severity,
        url: '/players'
      },
      actions: [
        {
          action: 'view',
          title: 'View Player'
        }
      ]
    };

    return await this.sendToUsers(
      affectedUserIds, 
      notification,
      { urgency: urgencyMap[severity] }
    );
  }

  /**
   * Send battle invitation notifications
   */
  async sendBattleInvitation(
    userId: string,
    inviterName: string,
    battleType: string,
    entryFee: number
  ): Promise<boolean> {
    const notification: PushNotification = {
      title: 'Battle Invitation',
      body: `${inviterName} invited you to a ${battleType} (${entryFee} gems)`,
      icon: '/icons/icon-192x192.png',
      tag: 'battle-invitation',
      requireInteraction: true,
      data: {
        type: 'battle_invitation',
        inviter: inviterName,
        battleType,
        entryFee,
        url: '/battles'
      },
      actions: [
        {
          action: 'accept',
          title: 'Accept'
        },
        {
          action: 'decline',
          title: 'Decline'
        }
      ]
    };

    return await this.sendToUser(userId, notification, { urgency: 'normal' });
  }

  /**
   * Send achievement unlock notifications
   */
  async sendAchievementUnlock(
    userId: string,
    achievementTitle: string,
    xpReward: number,
    gemsReward: number
  ): Promise<boolean> {
    const notification: PushNotification = {
      title: 'Achievement Unlocked!',
      body: `${achievementTitle} (+${xpReward} XP, +${gemsReward} gems)`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'achievement',
      data: {
        type: 'achievement',
        title: achievementTitle,
        xpReward,
        gemsReward,
        url: '/achievements'
      }
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Send weekly insights notifications
   */
  async sendWeeklyInsights(
    userId: string,
    insights: {
      topPerformer: string;
      recommendation: string;
      weeklyRank: number;
    }
  ): Promise<boolean> {
    const notification: PushNotification = {
      title: 'Weekly Fantasy Insights',
      body: `Your top performer: ${insights.topPerformer}. Weekly rank: #${insights.weeklyRank}`,
      icon: '/icons/icon-192x192.png',
      tag: 'weekly-insights',
      data: {
        type: 'weekly_insights',
        insights,
        url: '/insights'
      },
      actions: [
        {
          action: 'view',
          title: 'View Insights'
        }
      ]
    };

    return await this.sendToUser(userId, notification, { urgency: 'low' });
  }

  /**
   * Clean up expired subscriptions
   */
  async cleanupExpiredSubscriptions(): Promise<void> {
    try {
      const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const result = await prisma.pushSubscription.deleteMany({
        where: {
          AND: [
            { isActive: false },
            { updatedAt: { lt: expiredDate } }
          ]
        }
      });

      console.log(`✅ Cleaned up ${result.count} expired push subscriptions`);
    } catch (error) {
      console.error('Error cleaning up expired subscriptions:', error);
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionsByPlatform: Record<string, number>;
  }> {
    try {
      const [total, active, byPlatform] = await Promise.all([
        prisma.pushSubscription.count(),
        prisma.pushSubscription.count({ where: { isActive: true } }),
        prisma.pushSubscription.groupBy({
          by: ['platform'],
          where: { isActive: true },
          _count: true
        })
      ]);

      const subscriptionsByPlatform = byPlatform.reduce((acc, item) => {
        acc[item.platform || 'unknown'] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalSubscriptions: total,
        activeSubscriptions: active,
        subscriptionsByPlatform
      };
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        subscriptionsByPlatform: {}
      };
    }
  }

  /**
   * Helper method to check if subscription error indicates invalid subscription
   */
  private isSubscriptionInvalid(error: any): boolean {
    if (typeof error === 'object' && error.statusCode) {
      // 410 Gone - subscription is no longer valid
      // 404 Not Found - endpoint not found
      return error.statusCode === 410 || error.statusCode === 404;
    }
    return false;
  }
}

// Export singleton
export const pushNotificationService = new PushNotificationService();