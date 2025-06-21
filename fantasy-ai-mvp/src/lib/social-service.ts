import { EventEmitter } from 'events';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId?: string;
  leagueId?: string;
  draftId?: string;
  messageType: MessageType;
  content: string;
  attachments?: any[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  parentId?: string;
  reactions: MessageReaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  leagueId?: string;
  leagueName?: string;
  activityType: ActivityType;
  title: string;
  description: string;
  metadata?: any;
  isPublic: boolean;
  reactions: ActivityReaction[];
  createdAt: Date;
}

export interface MessageReaction {
  id: string;
  userId: string;
  userName: string;
  reactionType: ReactionType;
  createdAt: Date;
}

export interface ActivityReaction {
  id: string;
  userId: string;
  userName: string;
  reactionType: ReactionType;
  createdAt: Date;
}

export interface Friendship {
  id: string;
  initiatorId: string;
  recipientId: string;
  initiatorName: string;
  recipientName: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  TRADE_PROPOSAL = 'TRADE_PROPOSAL',
  WAGER_CHALLENGE = 'WAGER_CHALLENGE',
  DRAFT_PICK = 'DRAFT_PICK',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE'
}

export enum ActivityType {
  TRADE_COMPLETED = 'TRADE_COMPLETED',
  WAIVER_CLAIM = 'WAIVER_CLAIM',
  LINEUP_SET = 'LINEUP_SET',
  PLAYER_DROPPED = 'PLAYER_DROPPED',
  PLAYER_ADDED = 'PLAYER_ADDED',
  DRAFT_PICK_MADE = 'DRAFT_PICK_MADE',
  CONTEST_WON = 'CONTEST_WON',
  WAGER_WON = 'WAGER_WON',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  MILESTONE_REACHED = 'MILESTONE_REACHED'
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  LAUGH = 'LAUGH',
  ANGRY = 'ANGRY',
  SURPRISED = 'SURPRISED',
  FIRE = 'FIRE',
  TROPHY = 'TROPHY'
}

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
  DECLINED = 'DECLINED'
}

export enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  TRADE_PROPOSAL = 'TRADE_PROPOSAL',
  WAGER_CHALLENGE = 'WAGER_CHALLENGE',
  DRAFT_STARTING = 'DRAFT_STARTING',
  LINEUP_REMINDER = 'LINEUP_REMINDER',
  PLAYER_NEWS = 'PLAYER_NEWS',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}

export class SocialService extends EventEmitter {
  private messages: Map<string, Message[]> = new Map(); // keyed by leagueId or userId
  private activities: Map<string, ActivityItem[]> = new Map(); // keyed by leagueId
  private friendships: Map<string, Friendship[]> = new Map(); // keyed by userId
  private notifications: Map<string, Notification[]> = new Map(); // keyed by userId

  constructor() {
    super();
    this.initializeMockData();
  }

  // Message Management
  async sendMessage(messageData: {
    senderId: string;
    content: string;
    messageType?: MessageType;
    recipientId?: string;
    leagueId?: string;
    draftId?: string;
    parentId?: string;
    attachments?: any[];
  }): Promise<Message> {
    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: messageData.senderId,
      senderName: `User_${messageData.senderId.slice(-4)}`,
      recipientId: messageData.recipientId,
      leagueId: messageData.leagueId,
      draftId: messageData.draftId,
      messageType: messageData.messageType || MessageType.TEXT,
      content: messageData.content,
      attachments: messageData.attachments,
      isEdited: false,
      isDeleted: false,
      parentId: messageData.parentId,
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store message
    const key = messageData.leagueId || messageData.draftId || messageData.recipientId || 'general';
    const existingMessages = this.messages.get(key) || [];
    existingMessages.push(message);
    this.messages.set(key, existingMessages);

    // Create notification for recipient
    if (messageData.recipientId) {
      await this.createNotification({
        userId: messageData.recipientId,
        notificationType: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        message: `You received a message from ${message.senderName}`,
        data: { messageId: message.id, senderId: messageData.senderId }
      });
    }

    this.emit('messageCreated', message);
    return message;
  }

  async getMessages(filters: {
    leagueId?: string;
    draftId?: string;
    userId?: string; // For direct messages
    limit?: number;
    offset?: number;
  }): Promise<Message[]> {
    const key = filters.leagueId || filters.draftId || filters.userId || 'general';
    const messages = this.messages.get(key) || [];
    
    return messages
      .filter(msg => !msg.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));
  }

  async addReactionToMessage(messageId: string, userId: string, reactionType: ReactionType): Promise<void> {
    // Find the message across all conversations
    for (const [key, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex >= 0) {
        const message = messages[messageIndex];
        
        // Remove existing reaction of same type from this user
        message.reactions = message.reactions.filter(r => 
          !(r.userId === userId && r.reactionType === reactionType)
        );
        
        // Add new reaction
        message.reactions.push({
          id: `react_${Date.now()}`,
          userId,
          userName: `User_${userId.slice(-4)}`,
          reactionType,
          createdAt: new Date()
        });

        this.emit('messageReactionAdded', { messageId, userId, reactionType });
        break;
      }
    }
  }

  async editMessage(messageId: string, userId: string, newContent: string): Promise<void> {
    for (const [key, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex(m => m.id === messageId && m.senderId === userId);
      if (messageIndex >= 0) {
        messages[messageIndex].content = newContent;
        messages[messageIndex].isEdited = true;
        messages[messageIndex].editedAt = new Date();
        messages[messageIndex].updatedAt = new Date();
        
        this.emit('messageEdited', messages[messageIndex]);
        break;
      }
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    for (const [key, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex(m => m.id === messageId && m.senderId === userId);
      if (messageIndex >= 0) {
        messages[messageIndex].isDeleted = true;
        
        this.emit('messageDeleted', { messageId, userId });
        break;
      }
    }
  }

  // Activity Feed Management
  async createActivity(activityData: {
    userId: string;
    leagueId?: string;
    activityType: ActivityType;
    title: string;
    description: string;
    metadata?: any;
    isPublic?: boolean;
  }): Promise<ActivityItem> {
    const activity: ActivityItem = {
      id: `activity_${Date.now()}`,
      userId: activityData.userId,
      userName: `User_${activityData.userId.slice(-4)}`,
      leagueId: activityData.leagueId,
      leagueName: activityData.leagueId ? `League_${activityData.leagueId.slice(-4)}` : undefined,
      activityType: activityData.activityType,
      title: activityData.title,
      description: activityData.description,
      metadata: activityData.metadata,
      isPublic: activityData.isPublic !== false,
      reactions: [],
      createdAt: new Date()
    };

    // Store activity
    const key = activityData.leagueId || 'global';
    const existingActivities = this.activities.get(key) || [];
    existingActivities.push(activity);
    this.activities.set(key, existingActivities);

    this.emit('activityCreated', activity);
    return activity;
  }

  async getActivityFeed(filters: {
    leagueId?: string;
    userId?: string;
    activityTypes?: ActivityType[];
    limit?: number;
    offset?: number;
  }): Promise<ActivityItem[]> {
    let allActivities: ActivityItem[] = [];

    if (filters.leagueId) {
      allActivities = this.activities.get(filters.leagueId) || [];
    } else {
      // Get activities from all leagues/global
      for (const activities of this.activities.values()) {
        allActivities.push(...activities);
      }
    }

    return allActivities
      .filter(activity => {
        if (filters.userId && activity.userId !== filters.userId) return false;
        if (filters.activityTypes && !filters.activityTypes.includes(activity.activityType)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20));
  }

  async addReactionToActivity(activityId: string, userId: string, reactionType: ReactionType): Promise<void> {
    for (const [key, activities] of this.activities.entries()) {
      const activityIndex = activities.findIndex(a => a.id === activityId);
      if (activityIndex >= 0) {
        const activity = activities[activityIndex];
        
        // Remove existing reaction of same type from this user
        activity.reactions = activity.reactions.filter(r => 
          !(r.userId === userId && r.reactionType === reactionType)
        );
        
        // Add new reaction
        activity.reactions.push({
          id: `react_${Date.now()}`,
          userId,
          userName: `User_${userId.slice(-4)}`,
          reactionType,
          createdAt: new Date()
        });

        this.emit('activityReactionAdded', { activityId, userId, reactionType });
        break;
      }
    }
  }

  // Friendship Management
  async sendFriendRequest(initiatorId: string, recipientId: string): Promise<Friendship> {
    // Check if friendship already exists
    const existingFriendship = await this.getFriendship(initiatorId, recipientId);
    if (existingFriendship) {
      throw new Error('Friendship already exists');
    }

    const friendship: Friendship = {
      id: `friendship_${Date.now()}`,
      initiatorId,
      recipientId,
      initiatorName: `User_${initiatorId.slice(-4)}`,
      recipientName: `User_${recipientId.slice(-4)}`,
      status: FriendshipStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store friendship for both users
    const initiatorFriendships = this.friendships.get(initiatorId) || [];
    initiatorFriendships.push(friendship);
    this.friendships.set(initiatorId, initiatorFriendships);

    const recipientFriendships = this.friendships.get(recipientId) || [];
    recipientFriendships.push(friendship);
    this.friendships.set(recipientId, recipientFriendships);

    // Create notification for recipient
    await this.createNotification({
      userId: recipientId,
      notificationType: NotificationType.FRIEND_REQUEST,
      title: 'New Friend Request',
      message: `${friendship.initiatorName} sent you a friend request`,
      data: { friendshipId: friendship.id, initiatorId }
    });

    this.emit('friendRequestSent', friendship);
    return friendship;
  }

  async respondToFriendRequest(friendshipId: string, userId: string, accept: boolean): Promise<Friendship> {
    const friendship = await this.getFriendshipById(friendshipId);
    if (!friendship) {
      throw new Error('Friendship not found');
    }

    if (friendship.recipientId !== userId) {
      throw new Error('Not authorized to respond to this friend request');
    }

    friendship.status = accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED;
    friendship.updatedAt = new Date();

    // Update in both users' friendship lists
    this.updateFriendshipInMaps(friendship);

    this.emit('friendRequestResponded', { friendship, accepted: accept });
    return friendship;
  }

  async getFriends(userId: string): Promise<Friendship[]> {
    const userFriendships = this.friendships.get(userId) || [];
    return userFriendships.filter(f => f.status === FriendshipStatus.ACCEPTED);
  }

  async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
    const userFriendships = this.friendships.get(userId) || [];
    return userFriendships.filter(f => 
      f.status === FriendshipStatus.PENDING && f.recipientId === userId
    );
  }

  // Notification Management
  async createNotification(notificationData: {
    userId: string;
    notificationType: NotificationType;
    title: string;
    message: string;
    data?: any;
  }): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      userId: notificationData.userId,
      notificationType: notificationData.notificationType,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      isRead: false,
      createdAt: new Date()
    };

    const userNotifications = this.notifications.get(notificationData.userId) || [];
    userNotifications.push(notification);
    this.notifications.set(notificationData.userId, userNotifications);

    this.emit('notificationCreated', notification);
    return notification;
  }

  async getNotifications(userId: string, filters?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    const userNotifications = this.notifications.get(userId) || [];
    
    return userNotifications
      .filter(notif => {
        if (filters?.isRead !== undefined && notif.isRead !== filters.isRead) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      this.emit('notificationRead', notification);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const now = new Date();
    
    userNotifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = now;
      }
    });

    this.emit('allNotificationsRead', { userId });
  }

  // Helper Methods
  private async getFriendship(userId1: string, userId2: string): Promise<Friendship | null> {
    const userFriendships = this.friendships.get(userId1) || [];
    return userFriendships.find(f => 
      (f.initiatorId === userId1 && f.recipientId === userId2) ||
      (f.initiatorId === userId2 && f.recipientId === userId1)
    ) || null;
  }

  private async getFriendshipById(friendshipId: string): Promise<Friendship | null> {
    for (const friendships of this.friendships.values()) {
      const friendship = friendships.find(f => f.id === friendshipId);
      if (friendship) return friendship;
    }
    return null;
  }

  private updateFriendshipInMaps(friendship: Friendship): void {
    // Update in initiator's map
    const initiatorFriendships = this.friendships.get(friendship.initiatorId) || [];
    const initiatorIndex = initiatorFriendships.findIndex(f => f.id === friendship.id);
    if (initiatorIndex >= 0) {
      initiatorFriendships[initiatorIndex] = friendship;
    }

    // Update in recipient's map
    const recipientFriendships = this.friendships.get(friendship.recipientId) || [];
    const recipientIndex = recipientFriendships.findIndex(f => f.id === friendship.id);
    if (recipientIndex >= 0) {
      recipientFriendships[recipientIndex] = friendship;
    }
  }

  private initializeMockData(): void {
    // Mock messages for a league
    const mockMessages: Message[] = [
      {
        id: 'msg_1',
        senderId: 'user_1',
        senderName: 'FantasyKing',
        leagueId: 'league_1',
        messageType: MessageType.TEXT,
        content: 'Great pickup on CMC! That trade is going to pay off big time 🔥',
        isEdited: false,
        isDeleted: false,
        reactions: [
          {
            id: 'react_1',
            userId: 'user_2',
            userName: 'ChampMaker',
            reactionType: ReactionType.FIRE,
            createdAt: new Date(Date.now() - 300000)
          }
        ],
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date(Date.now() - 1800000)
      },
      {
        id: 'msg_2',
        senderId: 'user_2',
        senderName: 'ChampMaker',
        leagueId: 'league_1',
        messageType: MessageType.TEXT,
        content: 'Anyone want to make a trade? I need RB depth badly',
        isEdited: false,
        isDeleted: false,
        reactions: [],
        createdAt: new Date(Date.now() - 900000),
        updatedAt: new Date(Date.now() - 900000)
      },
      {
        id: 'msg_3',
        senderId: 'user_3',
        senderName: 'GridironGuru',
        leagueId: 'league_1',
        messageType: MessageType.SYSTEM_MESSAGE,
        content: 'Trade completed: ChampMaker traded Stefon Diggs to FantasyKing for Joe Mixon + 2024 2nd round pick',
        isEdited: false,
        isDeleted: false,
        reactions: [
          {
            id: 'react_2',
            userId: 'user_1',
            userName: 'FantasyKing',
            reactionType: ReactionType.TROPHY,
            createdAt: new Date(Date.now() - 60000)
          }
        ],
        createdAt: new Date(Date.now() - 300000),
        updatedAt: new Date(Date.now() - 300000)
      }
    ];

    this.messages.set('league_1', mockMessages);

    // Mock activities
    const mockActivities: ActivityItem[] = [
      {
        id: 'activity_1',
        userId: 'user_1',
        userName: 'FantasyKing',
        leagueId: 'league_1',
        leagueName: 'Championship League',
        activityType: ActivityType.TRADE_COMPLETED,
        title: 'Trade Completed',
        description: 'Traded Stefon Diggs for Joe Mixon + 2024 2nd round pick',
        metadata: {
          tradeId: 'trade_123',
          playersGiven: ['Stefon Diggs'],
          playersReceived: ['Joe Mixon'],
          picksReceived: ['2024 2nd']
        },
        isPublic: true,
        reactions: [
          {
            id: 'react_3',
            userId: 'user_2',
            userName: 'ChampMaker',
            reactionType: ReactionType.LIKE,
            createdAt: new Date(Date.now() - 120000)
          }
        ],
        createdAt: new Date(Date.now() - 300000)
      },
      {
        id: 'activity_2',
        userId: 'user_2',
        userName: 'ChampMaker',
        leagueId: 'league_1',
        leagueName: 'Championship League',
        activityType: ActivityType.WAIVER_CLAIM,
        title: 'Waiver Claim',
        description: 'Successfully claimed Kyren Williams from waivers',
        metadata: {
          playerAdded: 'Kyren Williams',
          playerDropped: 'Tony Pollard',
          waiverPriority: 3
        },
        isPublic: true,
        reactions: [],
        createdAt: new Date(Date.now() - 1800000)
      }
    ];

    this.activities.set('league_1', mockActivities);

    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: 'notif_1',
        userId: 'user_1',
        notificationType: NotificationType.TRADE_PROPOSAL,
        title: 'New Trade Proposal',
        message: 'ChampMaker wants to trade Saquon Barkley for your Derrick Henry',
        data: { tradeId: 'trade_456', fromUserId: 'user_2' },
        isRead: false,
        createdAt: new Date(Date.now() - 600000)
      },
      {
        id: 'notif_2',
        userId: 'user_1',
        notificationType: NotificationType.LINEUP_REMINDER,
        title: 'Lineup Reminder',
        message: 'Set your lineup for Week 8 - games start in 2 hours!',
        data: { week: 8, gamesStarting: new Date(Date.now() + 7200000) },
        isRead: true,
        readAt: new Date(Date.now() - 300000),
        createdAt: new Date(Date.now() - 1200000)
      }
    ];

    this.notifications.set('user_1', mockNotifications);
  }
}

export const socialService = new SocialService();