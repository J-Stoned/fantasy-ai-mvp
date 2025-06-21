/**
 * 🚨 NOTIFICATION ENGINE
 * 
 * The ULTIMATE notification system that delivers alerts with MILITARY PRECISION!
 * Multi-channel, AI-powered, context-aware notifications that users will LOVE!
 */

import { EventEmitter } from "events";
import { prisma } from "./prisma";
import { webSocketManager } from "./websocket-manager";
import { aiService } from "./ai-service";

export interface NotificationChannel {
  id: string;
  name: string;
  type: "websocket" | "email" | "sms" | "push" | "webhook";
  isActive: boolean;
  priority: number;
  rateLimits: {
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  deliveryOptions: {
    immediate: boolean;
    batching: boolean;
    batchInterval: number; // minutes
    retryAttempts: number;
    retryDelay: number; // seconds
  };
}

export interface NotificationTemplate {
  id: string;
  type: "injury" | "touchdown" | "milestone" | "market_move" | "lineup_alert" | "wager_update";
  priority: "low" | "medium" | "high" | "critical";
  templates: {
    title: string;
    shortMessage: string;
    longMessage: string;
    emoji: string;
    actionButtons?: Array<{
      text: string;
      action: string;
      style: "primary" | "secondary" | "danger";
    }>;
  };
  personalization: {
    usePlayerNames: boolean;
    includeStats: boolean;
    includeProjections: boolean;
    includeRecommendations: boolean;
  };
}

export interface UserPreferences {
  userId: string;
  channels: {
    websocket: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  frequency: {
    immediate: string[]; // notification types for immediate delivery
    batched: string[]; // notification types for batched delivery
    disabled: string[]; // disabled notification types
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  filters: {
    minImpactLevel: "low" | "medium" | "high" | "critical";
    ownPlayersOnly: boolean;
    favoriteTeams: string[];
    excludeOpponents: boolean;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  data: any;
  channels: string[];
  status: "pending" | "sent" | "delivered" | "failed" | "cancelled";
  attempts: number;
  createdAt: Date;
  scheduledFor?: Date;
  deliveredAt?: Date;
  metadata: {
    source: string;
    playerId?: string;
    gameId?: string;
    wagerId?: string;
    urgency: number; // 1-10 scale
  };
}

export interface DeliveryResult {
  notificationId: string;
  channel: string;
  success: boolean;
  deliveredAt: Date;
  responseTime: number;
  error?: string;
  metadata: any;
}

export class NotificationEngine extends EventEmitter {
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private pendingNotifications: Map<string, Notification> = new Map();
  private batchedNotifications: Map<string, Notification[]> = new Map();
  
  // Performance tracking
  private deliveryStats = {
    sent: 0,
    delivered: 0,
    failed: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  };

  private isRunning = false;
  private batchProcessor: NodeJS.Timeout | null = null;
  private retryProcessor: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeChannels();
    this.initializeTemplates();
  }

  /**
   * 🚀 START THE NOTIFICATION ENGINE
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Notification engine already running");
      return;
    }

    console.log("🚨 STARTING NOTIFICATION ENGINE...");
    this.isRunning = true;

    // Load user preferences from database
    await this.loadUserPreferences();

    // Start batch processor
    this.batchProcessor = setInterval(() => {
      this.processBatchedNotifications();
    }, 60000); // Every minute

    // Start retry processor
    this.retryProcessor = setInterval(() => {
      this.retryFailedNotifications();
    }, 30000); // Every 30 seconds

    console.log("✅ Notification engine started successfully");
    this.emit("engineStarted");
  }

  /**
   * 🛑 STOP THE NOTIFICATION ENGINE
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log("🛑 Stopping notification engine...");
    this.isRunning = false;

    // Clear intervals
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
      this.batchProcessor = null;
    }

    if (this.retryProcessor) {
      clearInterval(this.retryProcessor);
      this.retryProcessor = null;
    }

    // Process any remaining notifications
    await this.processBatchedNotifications();

    console.log("✅ Notification engine stopped");
    this.emit("engineStopped");
  }

  /**
   * 📨 SEND NOTIFICATION
   * The main entry point for sending notifications
   */
  async sendNotification(notification: Omit<Notification, "id" | "status" | "attempts" | "createdAt">): Promise<string> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullNotification: Notification = {
      ...notification,
      id: notificationId,
      status: "pending",
      attempts: 0,
      createdAt: new Date()
    };

    // Apply user preferences and filters
    const filteredNotification = await this.applyUserFilters(fullNotification);
    if (!filteredNotification) {
      console.log(`🚫 Notification filtered out for user ${notification.userId}`);
      return notificationId;
    }

    // Determine delivery strategy
    const preferences = this.userPreferences.get(notification.userId);
    const shouldBatch = preferences?.frequency.batched.includes(notification.type) || false;

    if (shouldBatch && notification.priority !== "critical") {
      // Add to batch queue
      await this.addToBatch(filteredNotification);
    } else {
      // Send immediately
      await this.sendImmediately(filteredNotification);
    }

    return notificationId;
  }

  /**
   * 🎯 SMART NOTIFICATION
   * AI-powered personalized notification
   */
  async sendSmartNotification(
    userId: string,
    type: string,
    data: any,
    options: {
      useAI?: boolean;
      priority?: "low" | "medium" | "high" | "critical";
      channels?: string[];
    } = {}
  ): Promise<string> {
    const { useAI = true, priority = "medium", channels = ["websocket"] } = options;

    let notification: Omit<Notification, "id" | "status" | "attempts" | "createdAt">;

    if (useAI) {
      // Use AI to generate personalized content
      notification = await this.generateAINotification(userId, type, data, priority);
    } else {
      // Use template-based notification
      notification = await this.generateTemplateNotification(userId, type, data, priority);
    }

    notification.channels = channels;
    
    return this.sendNotification(notification);
  }

  /**
   * 🔥 CRITICAL ALERT
   * For emergency situations that need immediate attention
   */
  async sendCriticalAlert(
    userId: string,
    title: string,
    message: string,
    data: any,
    metadata: any = {}
  ): Promise<string> {
    const notification: Notification = {
      id: `critical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: "critical_alert",
      priority: "critical",
      title: `🚨 ${title}`,
      message,
      data,
      channels: ["websocket", "push", "sms"], // All channels for critical
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
      metadata: {
        ...metadata,
        source: "critical_alert_system",
        urgency: 10
      }
    };

    // Critical alerts always bypass batching and filters
    return this.sendImmediately(notification);
  }

  /**
   * 📊 BULK NOTIFICATION
   * Send to multiple users efficiently
   */
  async sendBulkNotification(
    userIds: string[],
    notification: Omit<Notification, "id" | "status" | "attempts" | "createdAt" | "userId">
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    // Process in batches of 100 users
    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(userId => 
        this.sendNotification({ ...notification, userId })
      );

      const batchIds = await Promise.all(batchPromises);
      notificationIds.push(...batchIds);
    }

    console.log(`📢 Sent bulk notification to ${userIds.length} users`);
    return notificationIds;
  }

  /**
   * ⚙️ UPDATE USER PREFERENCES
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const existing = this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...existing, ...preferences };
    
    this.userPreferences.set(userId, updated);

    // Save to database
    await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        notifications: updated as any
      },
      update: {
        notifications: updated as any
      }
    });

    console.log(`⚙️ Updated notification preferences for user ${userId}`);
  }

  /**
   * 📈 GET DELIVERY STATS
   */
  getDeliveryStats(): typeof this.deliveryStats {
    return {
      ...this.deliveryStats,
      averageResponseTime: this.deliveryStats.totalResponseTime / Math.max(this.deliveryStats.sent, 1)
    };
  }

  /**
   * 📋 GET NOTIFICATION HISTORY
   */
  async getNotificationHistory(userId: string, limit: number = 50): Promise<Notification[]> {
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return alerts.map(alert => ({
      id: alert.id,
      userId: alert.userId,
      type: alert.type,
      priority: "medium" as const,
      title: alert.title,
      message: alert.message,
      data: alert.data,
      channels: ["websocket"],
      status: "delivered" as const,
      attempts: 1,
      createdAt: alert.createdAt,
      deliveredAt: alert.createdAt,
      metadata: {
        source: "database",
        urgency: 5
      }
    }));
  }

  // ===============================
  // PRIVATE METHODS
  // ===============================

  /**
   * Initialize notification channels
   */
  private initializeChannels(): void {
    // WebSocket channel
    this.channels.set("websocket", {
      id: "websocket",
      name: "Real-time WebSocket",
      type: "websocket",
      isActive: true,
      priority: 1,
      rateLimits: {
        maxPerMinute: 100,
        maxPerHour: 1000,
        maxPerDay: 10000
      },
      deliveryOptions: {
        immediate: true,
        batching: false,
        batchInterval: 0,
        retryAttempts: 3,
        retryDelay: 5
      }
    });

    // Push notification channel
    this.channels.set("push", {
      id: "push",
      name: "Push Notifications",
      type: "push",
      isActive: true,
      priority: 2,
      rateLimits: {
        maxPerMinute: 10,
        maxPerHour: 100,
        maxPerDay: 500
      },
      deliveryOptions: {
        immediate: true,
        batching: true,
        batchInterval: 5,
        retryAttempts: 5,
        retryDelay: 30
      }
    });

    // SMS channel
    this.channels.set("sms", {
      id: "sms",
      name: "SMS Messages",
      type: "sms",
      isActive: true,
      priority: 3,
      rateLimits: {
        maxPerMinute: 5,
        maxPerHour: 20,
        maxPerDay: 50
      },
      deliveryOptions: {
        immediate: true,
        batching: false,
        batchInterval: 0,
        retryAttempts: 3,
        retryDelay: 60
      }
    });

    // Email channel
    this.channels.set("email", {
      id: "email",
      name: "Email",
      type: "email",
      isActive: true,
      priority: 4,
      rateLimits: {
        maxPerMinute: 10,
        maxPerHour: 50,
        maxPerDay: 200
      },
      deliveryOptions: {
        immediate: false,
        batching: true,
        batchInterval: 15,
        retryAttempts: 3,
        retryDelay: 300
      }
    });

    console.log(`📡 Initialized ${this.channels.size} notification channels`);
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    // Injury alert template
    this.templates.set("injury", {
      id: "injury",
      type: "injury",
      priority: "critical",
      templates: {
        title: "🚨 INJURY ALERT",
        shortMessage: "{playerName} - {injuryStatus}",
        longMessage: "{playerName} ({position}, {team}) has been listed as {injuryStatus}. This may impact your lineup and wagers.",
        emoji: "🏥",
        actionButtons: [
          { text: "View Lineup", action: "view_lineup", style: "primary" },
          { text: "Find Replacement", action: "find_replacement", style: "secondary" }
        ]
      },
      personalization: {
        usePlayerNames: true,
        includeStats: false,
        includeProjections: true,
        includeRecommendations: true
      }
    });

    // Touchdown template
    this.templates.set("touchdown", {
      id: "touchdown",
      type: "touchdown",
      priority: "high",
      templates: {
        title: "🏈 TOUCHDOWN!",
        shortMessage: "{playerName} scored!",
        longMessage: "{playerName} just scored a {yardage}-yard {touchdownType}! That's +{fantasyPoints} fantasy points for your lineup.",
        emoji: "🔥",
        actionButtons: [
          { text: "View Game", action: "view_game", style: "primary" }
        ]
      },
      personalization: {
        usePlayerNames: true,
        includeStats: true,
        includeProjections: false,
        includeRecommendations: false
      }
    });

    // Market movement template
    this.templates.set("market_move", {
      id: "market_move",
      type: "market_move",
      priority: "medium",
      templates: {
        title: "💰 PRICE ALERT",
        shortMessage: "{playerName} price moved {changePercent}%",
        longMessage: "{playerName}'s market value just moved {changePercent}% to ${newPrice}. Consider adjusting your positions.",
        emoji: "📈",
        actionButtons: [
          { text: "View Market", action: "view_market", style: "primary" },
          { text: "Trade Now", action: "trade_now", style: "secondary" }
        ]
      },
      personalization: {
        usePlayerNames: true,
        includeStats: false,
        includeProjections: true,
        includeRecommendations: true
      }
    });

    console.log(`📝 Initialized ${this.templates.size} notification templates`);
  }

  /**
   * Load user preferences from database
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          preferences: {
            select: {
              notifications: true
            }
          }
        }
      });

      for (const user of users) {
        if (user.preferences?.notifications) {
          this.userPreferences.set(user.id, user.preferences.notifications as unknown as UserPreferences);
        } else {
          this.userPreferences.set(user.id, this.getDefaultPreferences(user.id));
        }
      }

      console.log(`📋 Loaded preferences for ${users.length} users`);
    } catch (error) {
      console.error("❌ Failed to load user preferences:", error);
    }
  }

  /**
   * Get default preferences for a user
   */
  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      userId,
      channels: {
        websocket: true,
        email: true,
        sms: false,
        push: true
      },
      frequency: {
        immediate: ["injury", "touchdown", "critical_alert"],
        batched: ["market_move", "lineup_alert"],
        disabled: []
      },
      quietHours: {
        enabled: true,
        start: "22:00",
        end: "08:00",
        timezone: "America/New_York"
      },
      filters: {
        minImpactLevel: "medium",
        ownPlayersOnly: false,
        favoriteTeams: [],
        excludeOpponents: false
      }
    };
  }

  /**
   * Apply user filters to notification
   */
  private async applyUserFilters(notification: Notification): Promise<Notification | null> {
    const preferences = this.userPreferences.get(notification.userId);
    if (!preferences) return notification;

    // Check if notification type is disabled
    if (preferences.frequency.disabled.includes(notification.type)) {
      return null;
    }

    // Check minimum impact level
    const impactLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const minLevel = impactLevels[preferences.filters.minImpactLevel];
    const notificationLevel = impactLevels[notification.priority];
    
    if (notificationLevel < minLevel) {
      return null;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled && notification.priority !== "critical") {
      const now = new Date();
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: preferences.quietHours.timezone }));
      const currentHour = userTime.getHours();
      const startHour = parseInt(preferences.quietHours.start.split(":")[0]);
      const endHour = parseInt(preferences.quietHours.end.split(":")[0]);
      
      const isQuietTime = startHour > endHour ? 
        (currentHour >= startHour || currentHour < endHour) : 
        (currentHour >= startHour && currentHour < endHour);
      
      if (isQuietTime) {
        // Schedule for later
        notification.scheduledFor = new Date();
        notification.scheduledFor.setHours(endHour, 0, 0, 0);
        if (notification.scheduledFor <= now) {
          notification.scheduledFor.setDate(notification.scheduledFor.getDate() + 1);
        }
      }
    }

    // Filter channels based on user preferences
    notification.channels = notification.channels.filter(channel => {
      return (preferences.channels as any)[channel] === true;
    });

    return notification.channels.length > 0 ? notification : null;
  }

  /**
   * Add notification to batch queue
   */
  private async addToBatch(notification: Notification): Promise<void> {
    const batchKey = `${notification.userId}_${notification.type}`;
    
    if (!this.batchedNotifications.has(batchKey)) {
      this.batchedNotifications.set(batchKey, []);
    }
    
    this.batchedNotifications.get(batchKey)!.push(notification);
    console.log(`📦 Added notification to batch: ${batchKey}`);
  }

  /**
   * Send notification immediately
   */
  private async sendImmediately(notification: Notification): Promise<string> {
    this.pendingNotifications.set(notification.id, notification);
    
    const deliveryPromises = notification.channels.map(channelId => 
      this.deliverToChannel(notification, channelId)
    );

    const results = await Promise.allSettled(deliveryPromises);
    
    // Update notification status based on results
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    
    if (successful > 0) {
      notification.status = "delivered";
      notification.deliveredAt = new Date();
    } else {
      notification.status = "failed";
    }

    this.deliveryStats.sent++;
    if (successful > 0) this.deliveryStats.delivered++;
    if (failed > 0) this.deliveryStats.failed++;

    console.log(`📨 Sent notification ${notification.id} - ${successful}/${notification.channels.length} channels successful`);
    
    this.pendingNotifications.delete(notification.id);
    return notification.id;
  }

  /**
   * Deliver notification to specific channel
   */
  private async deliverToChannel(notification: Notification, channelId: string): Promise<DeliveryResult> {
    const startTime = Date.now();
    const channel = this.channels.get(channelId);
    
    if (!channel || !channel.isActive) {
      throw new Error(`Channel ${channelId} not available`);
    }

    try {
      let deliveryResult: any;

      switch (channel.type) {
        case "websocket":
          deliveryResult = await this.deliverWebSocket(notification);
          break;
        case "push":
          deliveryResult = await this.deliverPush(notification);
          break;
        case "sms":
          deliveryResult = await this.deliverSMS(notification);
          break;
        case "email":
          deliveryResult = await this.deliverEmail(notification);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }

      const responseTime = Date.now() - startTime;
      this.deliveryStats.totalResponseTime += responseTime;

      return {
        notificationId: notification.id,
        channel: channelId,
        success: true,
        deliveredAt: new Date(),
        responseTime,
        metadata: deliveryResult
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        notificationId: notification.id,
        channel: channelId,
        success: false,
        deliveredAt: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {}
      };
    }
  }

  /**
   * WebSocket delivery
   */
  private async deliverWebSocket(notification: Notification): Promise<any> {
    await webSocketManager.sendUserNotification(notification.userId, {
      type: "wager_matched", // Map to existing type
      title: notification.title,
      message: notification.message,
      data: notification.data
    });
    
    return { channel: "websocket", delivered: true };
  }

  /**
   * Push notification delivery
   */
  private async deliverPush(notification: Notification): Promise<any> {
    // Simulate push notification delivery
    console.log(`📱 Push: ${notification.title} to user ${notification.userId}`);
    return { channel: "push", delivered: true };
  }

  /**
   * SMS delivery
   */
  private async deliverSMS(notification: Notification): Promise<any> {
    // Simulate SMS delivery
    console.log(`📱 SMS: ${notification.message} to user ${notification.userId}`);
    return { channel: "sms", delivered: true };
  }

  /**
   * Email delivery
   */
  private async deliverEmail(notification: Notification): Promise<any> {
    // Simulate email delivery
    console.log(`📧 Email: ${notification.title} to user ${notification.userId}`);
    return { channel: "email", delivered: true };
  }

  /**
   * Process batched notifications
   */
  private async processBatchedNotifications(): Promise<void> {
    if (this.batchedNotifications.size === 0) return;

    console.log(`📦 Processing ${this.batchedNotifications.size} batched notification groups`);

    for (const [batchKey, notifications] of this.batchedNotifications) {
      if (notifications.length === 0) continue;

      // Create summary notification
      const summaryNotification = this.createBatchSummary(notifications);
      
      // Send the summary
      await this.sendImmediately(summaryNotification);
      
      // Clear processed notifications
      this.batchedNotifications.delete(batchKey);
    }
  }

  /**
   * Create batch summary notification
   */
  private createBatchSummary(notifications: Notification[]): Notification {
    const firstNotification = notifications[0];
    const count = notifications.length;
    
    return {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: firstNotification.userId,
      type: `batch_${firstNotification.type}`,
      priority: firstNotification.priority,
      title: `📋 ${count} ${firstNotification.type} updates`,
      message: `You have ${count} new ${firstNotification.type} notifications`,
      data: {
        count,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          data: n.data
        }))
      },
      channels: firstNotification.channels,
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
      metadata: {
        source: "batch_processor",
        urgency: 5
      }
    };
  }

  /**
   * Retry failed notifications
   */
  private async retryFailedNotifications(): Promise<void> {
    // Implementation for retrying failed notifications
    // This would check for notifications that failed and retry them
  }

  /**
   * Generate AI-powered notification
   */
  private async generateAINotification(
    userId: string,
    type: string,
    data: any,
    priority: "low" | "medium" | "high" | "critical"
  ): Promise<Omit<Notification, "id" | "status" | "attempts" | "createdAt">> {
    try {
      // Use AI to generate personalized content
      const aiResponse = await aiService.generateVoiceResponse(
        `Create a personalized notification for ${type} with this data: ${JSON.stringify(data)}`,
        { userTeam: [], availablePlayers: [], recentNews: [] }
      );

      return {
        userId,
        type,
        priority,
        title: aiResponse.response.split('.')[0] || `AI ${type} Alert`,
        message: aiResponse.response,
        data,
        channels: ["websocket"],
        metadata: {
          source: "ai_generator",
          urgency: priority === "critical" ? 10 : 5
        }
      };
    } catch (error) {
      console.error("❌ AI notification generation failed, falling back to template");
      return this.generateTemplateNotification(userId, type, data, priority);
    }
  }

  /**
   * Generate template-based notification
   */
  private async generateTemplateNotification(
    userId: string,
    type: string,
    data: any,
    priority: "low" | "medium" | "high" | "critical"
  ): Promise<Omit<Notification, "id" | "status" | "attempts" | "createdAt">> {
    const template = this.templates.get(type);
    
    if (!template) {
      // Generic fallback
      return {
        userId,
        type,
        priority,
        title: `${type} Alert`,
        message: `You have a new ${type} notification`,
        data,
        channels: ["websocket"],
        metadata: {
          source: "fallback_template",
          urgency: 5
        }
      };
    }

    // Process template variables
    let title = template.templates.title;
    let message = template.templates.longMessage;

    // Replace variables with actual data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return {
      userId,
      type,
      priority,
      title,
      message,
      data,
      channels: ["websocket"],
      metadata: {
        source: "template_generator",
        urgency: priority === "critical" ? 10 : 5
      }
    };
  }
}

// Singleton instance
export const notificationEngine = new NotificationEngine();