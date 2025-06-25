import { prisma } from '@/lib/prisma';
import { cache, pubsub } from '@/lib/redis/redis-client';
import { getWebSocketServer } from '@/lib/websocket/websocket-server';
import { queues } from '@/lib/jobs/job-queue';

interface NotificationOptions {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
  push?: boolean;
  email?: boolean;
  persistent?: boolean;
}

export class NotificationManager {
  // Send notification to user
  async send(options: NotificationOptions) {
    const {
      userId,
      type,
      title,
      message,
      data = {},
      priority = 'medium',
      push = false,
      email = false,
      persistent = true
    } = options;

    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Check if user wants this type of notification
      if (!this.shouldSendNotification(type, preferences)) {
        return null;
      }

      // Store notification in database if persistent
      let notificationId: string | null = null;
      
      if (persistent) {
        const notification = await prisma.notification.create({
          data: {
            userId,
            notificationType: type,
            title,
            message,
            data,
            priority,
            read: false
          }
        });
        notificationId = notification.id;
      }

      // Send real-time notification via WebSocket
      const ws = getWebSocketServer();
      if (ws.isUserOnline(userId)) {
        ws.sendNotification(userId, {
          id: notificationId,
          type,
          title,
          message,
          data,
          priority,
          timestamp: new Date()
        });
      }

      // Queue push notification if enabled
      if (push && preferences.pushEnabled) {
        await queues.notification.add('send-push', {
          userId,
          notification: {
            title,
            body: message,
            data,
            priority
          }
        });
      }

      // Queue email notification if enabled
      if (email && preferences.emailEnabled) {
        await queues.notification.add('send-email', {
          userId,
          notification: {
            type,
            title,
            message,
            data
          }
        });
      }

      // Publish to Redis for other services
      await pubsub.publish(`notifications:${userId}`, {
        id: notificationId,
        type,
        title,
        message,
        data,
        timestamp: new Date()
      });

      // Update notification count in cache
      await cache.incr(`user:${userId}:unread_notifications`);

      return notificationId;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send bulk notifications
  async sendBulk(userIds: string[], notification: Omit<NotificationOptions, 'userId'>) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.send({ ...notification, userId }))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed };
  }

  // Send notification to league members
  async sendToLeague(leagueId: string, notification: Omit<NotificationOptions, 'userId'>) {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { userId: true }
    });

    if (!league) {
      throw new Error('League not found');
    }

    // For now, send to league owner
    // In production, would get all league members
    return await this.send({ ...notification, userId: league.userId });
  }

  // Send notification to user's friends
  async sendToFriends(userId: string, notification: Omit<NotificationOptions, 'userId'>) {
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

    return await this.sendBulk(friendIds, notification);
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId // Ensure user owns the notification
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    // Update unread count in cache
    await cache.incr(`user:${userId}:unread_notifications`);

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    // Reset unread count
    await cache.del(`user:${userId}:unread_notifications`);
  }

  // Get user's notifications
  async getUserNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    type?: string;
    unreadOnly?: boolean;
  } = {}) {
    const {
      limit = 20,
      offset = 0,
      type,
      unreadOnly = false
    } = options;

    const where: any = { userId };
    
    if (type) {
      where.notificationType = type;
    }
    
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where })
    ]);

    const unreadCount = unreadOnly ? total : await this.getUnreadCount(userId);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total
    };
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    // Try cache first
    const cached = await cache.get<number>(`user:${userId}:unread_notifications`);
    if (cached !== null) {
      return cached;
    }

    // Fallback to database
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    // Update cache
    await cache.set(`user:${userId}:unread_notifications`, count, 300);

    return count;
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId // Ensure user owns the notification
      }
    });
  }

  // Get user notification preferences
  private async getUserPreferences(userId: string) {
    // Check cache first
    const cached = await cache.get<any>(`user:${userId}:notification_prefs`);
    if (cached) {
      return cached;
    }

    // Get from database or use defaults
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true }
    });

    const preferences = user?.notificationPreferences || {
      pushEnabled: true,
      emailEnabled: true,
      types: {
        achievement: true,
        score_update: true,
        trade_offer: true,
        injury_alert: true,
        game_reminder: true,
        social: true,
        promotion: false
      }
    };

    // Cache for 1 hour
    await cache.set(`user:${userId}:notification_prefs`, preferences, 3600);

    return preferences;
  }

  // Check if notification should be sent based on preferences
  private shouldSendNotification(type: string, preferences: any): boolean {
    // Always send critical notifications
    const criticalTypes = ['system', 'security', 'account'];
    if (criticalTypes.includes(type)) {
      return true;
    }

    // Check user preferences
    return preferences.types?.[type] !== false;
  }

  // Pre-defined notification templates
  async sendTemplateNotification(userId: string, template: string, data: any) {
    const templates = {
      achievement_unlocked: {
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've unlocked "${data.achievementName}"! +${data.xp} XP`,
        priority: 'high' as const,
        push: true
      },
      player_injury: {
        type: 'injury_alert',
        title: 'Player Injury Alert',
        message: `${data.playerName} is ${data.status}. Consider updating your lineup.`,
        priority: 'high' as const,
        push: true
      },
      trade_received: {
        type: 'trade_offer',
        title: 'New Trade Offer',
        message: `You received a trade offer from ${data.fromUser}`,
        priority: 'medium' as const,
        push: true
      },
      game_starting: {
        type: 'game_reminder',
        title: 'Games Starting Soon',
        message: `Your lineup locks in ${data.minutes} minutes!`,
        priority: 'high' as const,
        push: true
      },
      friend_request: {
        type: 'social',
        title: 'New Friend Request',
        message: `${data.fromUser} wants to be your friend`,
        priority: 'low' as const,
        push: false
      },
      score_update: {
        type: 'score_update',
        title: 'Score Update',
        message: `${data.playerName} scored ${data.points} points!`,
        priority: 'low' as const,
        push: false
      },
      weekly_summary: {
        type: 'summary',
        title: 'Your Weekly Summary',
        message: `You scored ${data.points} points and finished in ${data.rank} place`,
        priority: 'low' as const,
        email: true
      }
    };

    const notificationTemplate = templates[template];
    if (!notificationTemplate) {
      throw new Error(`Unknown notification template: ${template}`);
    }

    return await this.send({
      userId,
      ...notificationTemplate,
      data
    });
  }

  // Schedule a notification for later
  async scheduleNotification(options: NotificationOptions & { sendAt: Date }) {
    const { sendAt, ...notificationOptions } = options;
    const delay = sendAt.getTime() - Date.now();

    if (delay <= 0) {
      // Send immediately if time has passed
      return await this.send(notificationOptions);
    }

    // Schedule for later
    await queues.notification.add(
      'scheduled-notification',
      { notification: notificationOptions },
      { delay }
    );

    return { scheduled: true, sendAt };
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();