/**
 * Fantasy Social Feed
 * Real-time social features for leagues, trash talk, and sharing
 */

export interface SocialPost {
  id: string;
  type: 'status' | 'achievement' | 'trade' | 'lineup' | 'prediction' | 'highlight' | 'trash_talk';
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorLevel?: number;
  leagueId?: string;
  content: string;
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnail?: string;
  };
  attachments?: {
    player?: { id: string; name: string; team: string };
    game?: { id: string; teams: string[]; score?: string };
    trade?: { give: string[]; receive: string[] };
    lineup?: { players: string[] };
    achievement?: { id: string; name: string; icon: string };
  };
  reactions: Map<string, Set<string>>; // emoji -> userIds
  comments: Comment[];
  timestamp: Date;
  edited?: Date;
  visibility: 'public' | 'league' | 'friends';
  tags: string[];
  metrics: {
    views: number;
    shares: number;
    engagement: number;
  };
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  reactions: Map<string, Set<string>>;
  parentId?: string; // For nested comments
}

export interface LeagueFeed {
  leagueId: string;
  posts: SocialPost[];
  pinnedPosts: string[];
  weeklyRecap?: WeeklyRecap;
  liveActivity: LiveActivity[];
}

export interface WeeklyRecap {
  week: number;
  highlights: {
    highestScorer: { userId: string; score: number };
    biggestUpset: { winnerId: string; loserId: string; odds: number };
    bestTrade: { userId: string; description: string };
    luckyWin: { userId: string; margin: number };
  };
  powerRankings: Array<{ userId: string; rank: number; change: number }>;
  aiInsights: string[];
}

export interface LiveActivity {
  id: string;
  type: 'score_update' | 'player_touchdown' | 'injury' | 'milestone';
  userId: string;
  description: string;
  impact: number; // Fantasy points impact
  timestamp: Date;
}

export interface TrashTalkTemplate {
  id: string;
  category: 'win' | 'loss' | 'trade' | 'draft' | 'general';
  template: string;
  placeholders: string[];
  savageryLevel: 1 | 2 | 3 | 4 | 5;
}

export interface Notification {
  id: string;
  type: 'mention' | 'reaction' | 'comment' | 'achievement' | 'trade_offer';
  fromUserId: string;
  toUserId: string;
  content: string;
  actionUrl?: string;
  read: boolean;
  timestamp: Date;
}

export class FantasySocialFeed {
  private static instance: FantasySocialFeed;
  private posts: Map<string, SocialPost> = new Map();
  private userFeeds: Map<string, string[]> = new Map(); // userId -> postIds
  private leagueFeeds: Map<string, LeagueFeed> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  
  // Reaction emojis
  private readonly reactions = ['👍', '🔥', '😂', '😭', '🤯', '🏆', '🤡', '💀'];
  
  // Trash talk templates
  private readonly trashTalkTemplates: TrashTalkTemplate[] = [
    {
      id: 'win_1',
      category: 'win',
      template: 'Just beat {opponent} by {points} points. Too easy! 😎',
      placeholders: ['opponent', 'points'],
      savageryLevel: 2
    },
    {
      id: 'win_2',
      category: 'win',
      template: '{opponent} really thought they had a chance 😂 Better luck next time!',
      placeholders: ['opponent'],
      savageryLevel: 3
    },
    {
      id: 'win_3',
      category: 'win',
      template: 'My grandma could have set a better lineup than {opponent} 👵',
      placeholders: ['opponent'],
      savageryLevel: 4
    },
    {
      id: 'trade_1',
      category: 'trade',
      template: 'Thanks {opponent} for that trade! {player} just went off for {points}! 🤝💰',
      placeholders: ['opponent', 'player', 'points'],
      savageryLevel: 3
    },
    {
      id: 'draft_1',
      category: 'draft',
      template: 'Still can\'t believe {opponent} passed on {player} in the draft 🤦‍♂️',
      placeholders: ['opponent', 'player'],
      savageryLevel: 2
    },
    {
      id: 'loss_1',
      category: 'loss',
      template: 'Lost by {points} because {player} decided to forget how to play football 😤',
      placeholders: ['points', 'player'],
      savageryLevel: 1
    },
    {
      id: 'general_1',
      category: 'general',
      template: 'Current mood watching {opponent}\'s team: 📉📉📉',
      placeholders: ['opponent'],
      savageryLevel: 2
    },
    {
      id: 'general_2',
      category: 'general',
      template: 'Alexa, show me what a dumpster fire looks like. *Shows {opponent}\'s roster* 🔥🗑️',
      placeholders: ['opponent'],
      savageryLevel: 5
    }
  ];
  
  private constructor() {}
  
  static getInstance(): FantasySocialFeed {
    if (!FantasySocialFeed.instance) {
      FantasySocialFeed.instance = new FantasySocialFeed();
    }
    return FantasySocialFeed.instance;
  }
  
  /**
   * Create a new social post
   */
  async createPost(
    authorId: string,
    authorName: string,
    content: string,
    options: Partial<SocialPost> = {}
  ): Promise<SocialPost> {
    const post: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type || 'status',
      authorId,
      authorName,
      authorAvatar: options.authorAvatar,
      authorLevel: options.authorLevel,
      leagueId: options.leagueId,
      content,
      media: options.media,
      attachments: options.attachments,
      reactions: new Map(),
      comments: [],
      timestamp: new Date(),
      visibility: options.visibility || 'league',
      tags: this.extractTags(content),
      metrics: {
        views: 0,
        shares: 0,
        engagement: 0
      }
    };
    
    // Store post
    this.posts.set(post.id, post);
    
    // Add to user feed
    if (!this.userFeeds.has(authorId)) {
      this.userFeeds.set(authorId, []);
    }
    this.userFeeds.get(authorId)!.unshift(post.id);
    
    // Add to league feed if applicable
    if (post.leagueId) {
      this.addToLeagueFeed(post.leagueId, post);
    }
    
    // Create notifications for mentions
    await this.createMentionNotifications(post);
    
    // Auto-generate trash talk for certain events
    if (post.type === 'achievement' && Math.random() < 0.3) {
      await this.generateAutoTrashTalk(post);
    }
    
    return post;
  }
  
  /**
   * Add reaction to post
   */
  async addReaction(
    postId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) throw new Error('Post not found');
    
    if (!post.reactions.has(emoji)) {
      post.reactions.set(emoji, new Set());
    }
    
    const users = post.reactions.get(emoji)!;
    
    if (users.has(userId)) {
      // Remove reaction
      users.delete(userId);
      if (users.size === 0) {
        post.reactions.delete(emoji);
      }
    } else {
      // Add reaction
      users.add(userId);
      
      // Create notification
      if (userId !== post.authorId) {
        await this.createNotification({
          type: 'reaction',
          fromUserId: userId,
          toUserId: post.authorId,
          content: `reacted ${emoji} to your post`
        });
      }
    }
    
    // Update engagement
    post.metrics.engagement = this.calculateEngagement(post);
  }
  
  /**
   * Add comment to post
   */
  async addComment(
    postId: string,
    authorId: string,
    authorName: string,
    content: string,
    parentId?: string
  ): Promise<Comment> {
    const post = this.posts.get(postId);
    if (!post) throw new Error('Post not found');
    
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId,
      authorName,
      content,
      timestamp: new Date(),
      reactions: new Map(),
      parentId
    };
    
    post.comments.push(comment);
    
    // Create notification
    if (authorId !== post.authorId) {
      await this.createNotification({
        type: 'comment',
        fromUserId: authorId,
        toUserId: post.authorId,
        content: `commented on your post: "${content.substring(0, 50)}..."`,
        actionUrl: `/post/${postId}`
      });
    }
    
    // Update engagement
    post.metrics.engagement = this.calculateEngagement(post);
    
    return comment;
  }
  
  /**
   * Get league feed
   */
  async getLeagueFeed(
    leagueId: string,
    options: {
      limit?: number;
      offset?: number;
      includeRecap?: boolean;
    } = {}
  ): Promise<LeagueFeed> {
    const feed = this.leagueFeeds.get(leagueId) || {
      leagueId,
      posts: [],
      pinnedPosts: [],
      liveActivity: []
    };
    
    // Sort posts by timestamp
    feed.posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    if (options.limit) {
      const start = options.offset || 0;
      feed.posts = feed.posts.slice(start, start + options.limit);
    }
    
    // Generate weekly recap if requested
    if (options.includeRecap) {
      feed.weeklyRecap = await this.generateWeeklyRecap(leagueId);
    }
    
    return feed;
  }
  
  /**
   * Get personalized feed for user
   */
  async getPersonalizedFeed(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      includeFollowing?: boolean;
    } = {}
  ): Promise<SocialPost[]> {
    const posts: SocialPost[] = [];
    
    // Get user's own posts
    const userPostIds = this.userFeeds.get(userId) || [];
    
    // Get posts from user's leagues
    // In real implementation, would query user's leagues
    const leaguePostIds: string[] = [];
    
    // Combine and deduplicate
    const allPostIds = [...new Set([...userPostIds, ...leaguePostIds])];
    
    // Get posts
    for (const postId of allPostIds) {
      const post = this.posts.get(postId);
      if (post) {
        posts.push(post);
      }
    }
    
    // Sort by relevance (engagement + recency)
    posts.sort((a, b) => {
      const scoreA = a.metrics.engagement + (1 / (Date.now() - a.timestamp.getTime()));
      const scoreB = b.metrics.engagement + (1 / (Date.now() - b.timestamp.getTime()));
      return scoreB - scoreA;
    });
    
    // Apply pagination
    const start = options.offset || 0;
    const limit = options.limit || 20;
    
    return posts.slice(start, start + limit);
  }
  
  /**
   * Generate trash talk
   */
  async generateTrashTalk(
    userId: string,
    category: TrashTalkTemplate['category'],
    data: Record<string, string>
  ): Promise<string[]> {
    const templates = this.trashTalkTemplates.filter(t => t.category === category);
    const suggestions: string[] = [];
    
    for (const template of templates) {
      let text = template.template;
      
      // Replace placeholders
      for (const placeholder of template.placeholders) {
        if (data[placeholder]) {
          text = text.replace(`{${placeholder}}`, data[placeholder]);
        }
      }
      
      suggestions.push(text);
    }
    
    // Add AI-generated suggestions
    const aiSuggestions = await this.generateAITrashTalk(category, data);
    suggestions.push(...aiSuggestions);
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
  
  /**
   * Create achievement post
   */
  async createAchievementPost(
    userId: string,
    userName: string,
    achievement: {
      id: string;
      name: string;
      icon: string;
      description: string;
    }
  ): Promise<SocialPost> {
    const content = `Just unlocked "${achievement.name}" ${achievement.icon}! ${achievement.description}`;
    
    return this.createPost(userId, userName, content, {
      type: 'achievement',
      attachments: { achievement },
      visibility: 'public'
    });
  }
  
  /**
   * Create highlight reel post
   */
  async createHighlightPost(
    userId: string,
    userName: string,
    week: number,
    highlights: Array<{
      playerId: string;
      playerName: string;
      stat: string;
      value: number;
    }>
  ): Promise<SocialPost> {
    const content = `Week ${week} Highlights 🌟\n` +
      highlights.map(h => `${h.playerName}: ${h.value} ${h.stat}`).join('\n');
    
    return this.createPost(userId, userName, content, {
      type: 'highlight',
      visibility: 'league'
    });
  }
  
  /**
   * Get trending topics in leagues
   */
  async getTrendingTopics(leagueIds: string[]): Promise<Array<{
    topic: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>> {
    const topics = new Map<string, number>();
    
    // Aggregate tags from recent posts
    for (const leagueId of leagueIds) {
      const feed = await this.getLeagueFeed(leagueId, { limit: 100 });
      
      for (const post of feed.posts) {
        for (const tag of post.tags) {
          topics.set(tag, (topics.get(tag) || 0) + 1);
        }
      }
    }
    
    // Sort by frequency
    const trending = Array.from(topics.entries())
      .map(([topic, count]) => ({
        topic,
        count,
        sentiment: this.analyzeSentiment(topic)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return trending;
  }
  
  /**
   * Get user notifications
   */
  async getNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    const userNotifications = this.notifications.get(userId) || [];
    
    if (unreadOnly) {
      return userNotifications.filter(n => !n.read);
    }
    
    return userNotifications;
  }
  
  /**
   * Mark notifications as read
   */
  async markNotificationsRead(userId: string, notificationIds: string[]): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    
    for (const notification of userNotifications) {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
      }
    }
  }
  
  // Private helper methods
  
  private addToLeagueFeed(leagueId: string, post: SocialPost): void {
    if (!this.leagueFeeds.has(leagueId)) {
      this.leagueFeeds.set(leagueId, {
        leagueId,
        posts: [],
        pinnedPosts: [],
        liveActivity: []
      });
    }
    
    const feed = this.leagueFeeds.get(leagueId)!;
    feed.posts.unshift(post);
    
    // Keep only recent posts (last 500)
    if (feed.posts.length > 500) {
      feed.posts = feed.posts.slice(0, 500);
    }
  }
  
  private extractTags(content: string): string[] {
    const tagRegex = /#\w+/g;
    const matches = content.match(tagRegex) || [];
    return matches.map(tag => tag.substring(1).toLowerCase());
  }
  
  private calculateEngagement(post: SocialPost): number {
    let engagement = 0;
    
    // Reactions worth 1 point each
    for (const [emoji, users] of post.reactions) {
      engagement += users.size;
    }
    
    // Comments worth 3 points each
    engagement += post.comments.length * 3;
    
    // Views worth 0.1 points each
    engagement += post.metrics.views * 0.1;
    
    // Shares worth 5 points each
    engagement += post.metrics.shares * 5;
    
    return engagement;
  }
  
  private async createMentionNotifications(post: SocialPost): Promise<void> {
    const mentionRegex = /@(\w+)/g;
    const matches = post.content.matchAll(mentionRegex);
    
    for (const match of matches) {
      const username = match[1];
      // In real implementation, look up userId from username
      const mentionedUserId = `user_${username}`;
      
      if (mentionedUserId !== post.authorId) {
        await this.createNotification({
          type: 'mention',
          fromUserId: post.authorId,
          toUserId: mentionedUserId,
          content: `mentioned you in a post`,
          actionUrl: `/post/${post.id}`
        });
      }
    }
  }
  
  private async createNotification(notification: Omit<Notification, 'id' | 'read' | 'timestamp'>): Promise<void> {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      timestamp: new Date()
    };
    
    if (!this.notifications.has(notification.toUserId)) {
      this.notifications.set(notification.toUserId, []);
    }
    
    this.notifications.get(notification.toUserId)!.unshift(newNotification);
    
    // Keep only recent notifications (last 100)
    const userNotifications = this.notifications.get(notification.toUserId)!;
    if (userNotifications.length > 100) {
      this.notifications.set(notification.toUserId, userNotifications.slice(0, 100));
    }
    
    // In real implementation, send push notification
  }
  
  private async generateAutoTrashTalk(triggerPost: SocialPost): Promise<void> {
    // Generate contextual trash talk based on achievement
    if (triggerPost.attachments?.achievement) {
      const responses = [
        'Congrats on the participation trophy 🏆',
        'My grandma has that achievement too',
        'Wake me up when you get a real achievement',
        'Weird flex but ok'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Simulate another user responding
      await this.addComment(
        triggerPost.id,
        'bot_trash_talker',
        'TrashTalkBot',
        randomResponse
      );
    }
  }
  
  private async generateWeeklyRecap(leagueId: string): Promise<WeeklyRecap> {
    // In real implementation, calculate from actual data
    return {
      week: 10,
      highlights: {
        highestScorer: { userId: 'user1', score: 156.4 },
        biggestUpset: { winnerId: 'user3', loserId: 'user1', odds: 3.5 },
        bestTrade: { userId: 'user2', description: 'Traded away injured player right before news broke' },
        luckyWin: { userId: 'user4', margin: 0.5 }
      },
      powerRankings: [
        { userId: 'user1', rank: 1, change: 0 },
        { userId: 'user2', rank: 2, change: 2 },
        { userId: 'user3', rank: 3, change: -1 },
        { userId: 'user4', rank: 4, change: -1 }
      ],
      aiInsights: [
        'Team 1 has the easiest remaining schedule',
        'Team 3 is trending up with recent waiver pickups',
        'Weather could impact Week 11 outdoor games'
      ]
    };
  }
  
  private async generateAITrashTalk(
    category: TrashTalkTemplate['category'],
    data: Record<string, string>
  ): Promise<string[]> {
    // In real implementation, use AI to generate contextual trash talk
    const suggestions = [
      `I've seen better lineups in a grocery store`,
      `Your team is so bad, it's making my algorithm cry`,
      `Even the AI feels bad about your draft picks`
    ];
    
    return suggestions;
  }
  
  private analyzeSentiment(topic: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis - in reality would use NLP
    const positive = ['win', 'awesome', 'great', 'best', 'champion'];
    const negative = ['loss', 'terrible', 'worst', 'injury', 'bust'];
    
    const topicLower = topic.toLowerCase();
    
    if (positive.some(word => topicLower.includes(word))) return 'positive';
    if (negative.some(word => topicLower.includes(word))) return 'negative';
    
    return 'neutral';
  }
}

// Export singleton instance
export const fantasySocialFeed = FantasySocialFeed.getInstance();