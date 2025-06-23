/**
 * Real-time Social Media Updates
 * WebSocket and SSE for live social feeds
 */

import { EventEmitter } from 'events';
import { SocialPost, SocialPlatform } from '../types';
import { getTwitterIntegration } from '../twitter';
import { getRedditIntegration } from '../reddit';
import { getDiscordIntegration } from '../discord';
import WebSocket from 'ws';

export class RealTimeSocialFeed extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private activeStreams: Map<string, any> = new Map();
  private updateInterval?: NodeJS.Timer;

  constructor() {
    super();
    this.startPolling();
  }

  /**
   * Subscribe to real-time updates for specific players
   */
  async subscribeToPlayers(
    connectionId: string,
    players: string[],
    platforms: SocialPlatform[] = ['twitter', 'reddit', 'discord']
  ) {
    // Start platform-specific streams
    if (platforms.includes('twitter')) {
      await this.startTwitterStream(players);
    }

    if (platforms.includes('reddit')) {
      await this.startRedditStream(players);
    }

    // Store subscription
    await this.storeSubscription(connectionId, players, platforms);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(connectionId: string) {
    this.connections.delete(connectionId);
    
    // Check if we need to stop any streams
    if (this.connections.size === 0) {
      this.stopAllStreams();
    }
  }

  /**
   * Start Twitter stream
   */
  private async startTwitterStream(players: string[]) {
    const streamKey = 'twitter-players';
    
    // Don't start duplicate streams
    if (this.activeStreams.has(streamKey)) return;

    try {
      const twitter = getTwitterIntegration();
      await twitter.streamFantasyUpdates(players, (post) => {
        this.emit('post', post);
        this.broadcastToSubscribers(post);
      });

      this.activeStreams.set(streamKey, true);
    } catch (error) {
      console.error('Twitter stream error:', error);
    }
  }

  /**
   * Start Reddit stream (polling-based)
   */
  private async startRedditStream(players: string[]) {
    const streamKey = 'reddit-players';
    
    if (this.activeStreams.has(streamKey)) return;

    const reddit = getRedditIntegration();
    
    // Poll Reddit every 30 seconds
    const pollInterval = setInterval(async () => {
      try {
        for (const player of players) {
          const posts = await reddit.searchPlayerDiscussions(player, 10);
          posts.forEach(post => {
            this.emit('post', post);
            this.broadcastToSubscribers(post);
          });
        }
      } catch (error) {
        console.error('Reddit polling error:', error);
      }
    }, 30000);

    this.activeStreams.set(streamKey, pollInterval);
  }

  /**
   * Start general polling for updates
   */
  private startPolling() {
    // Poll for trending topics every 5 minutes
    this.updateInterval = setInterval(async () => {
      await this.updateTrendingTopics();
    }, 5 * 60 * 1000);
  }

  /**
   * Update trending topics
   */
  private async updateTrendingTopics() {
    try {
      const twitter = getTwitterIntegration();
      const trends = await twitter.getTrendingTopics();
      
      this.emit('trends', {
        platform: 'twitter',
        trends,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Trending topics error:', error);
    }
  }

  /**
   * Stop all active streams
   */
  private stopAllStreams() {
    this.activeStreams.forEach((stream, key) => {
      if (typeof stream === 'object' && stream.close) {
        stream.close();
      } else if (typeof stream === 'number') {
        clearInterval(stream);
      }
    });

    this.activeStreams.clear();
  }

  /**
   * Store subscription details
   */
  private async storeSubscription(
    connectionId: string,
    players: string[],
    platforms: SocialPlatform[]
  ) {
    // Store in memory or database
    // This is a simplified implementation
  }

  /**
   * Broadcast post to subscribed connections
   */
  private broadcastToSubscribers(post: SocialPost) {
    const message = JSON.stringify({
      type: 'social_post',
      data: post
    });

    this.connections.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Add WebSocket connection
   */
  addConnection(connectionId: string, ws: WebSocket) {
    this.connections.set(connectionId, ws);

    ws.on('close', () => {
      this.unsubscribe(connectionId);
    });
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      activeStreams: this.activeStreams.size,
      platforms: Array.from(this.activeStreams.keys())
    };
  }
}

/**
 * Server-Sent Events for social updates
 */
export class SocialSSE {
  private clients: Map<string, any> = new Map();

  /**
   * Add SSE client
   */
  addClient(clientId: string, response: any) {
    // Set SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection message
    response.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    // Store client
    this.clients.set(clientId, response);

    // Handle client disconnect
    response.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  /**
   * Send update to specific client
   */
  sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client) {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  /**
   * Broadcast to all clients
   */
  broadcast(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    this.clients.forEach((client) => {
      client.write(message);
    });
  }

  /**
   * Send social post update
   */
  sendSocialPost(post: SocialPost) {
    this.broadcast({
      type: 'social_post',
      data: post,
      timestamp: new Date()
    });
  }

  /**
   * Send trending update
   */
  sendTrendingUpdate(trends: any) {
    this.broadcast({
      type: 'trending_update',
      data: trends,
      timestamp: new Date()
    });
  }

  /**
   * Send player alert
   */
  sendPlayerAlert(alert: {
    playerId: string;
    playerName: string;
    type: 'injury' | 'trade' | 'news';
    severity: 'low' | 'medium' | 'high';
    message: string;
    source: SocialPost;
  }) {
    this.broadcast({
      type: 'player_alert',
      data: alert,
      timestamp: new Date()
    });
  }
}

/**
 * Social media monitoring service
 */
export class SocialMonitor {
  private feed: RealTimeSocialFeed;
  private sse: SocialSSE;
  private monitoredPlayers: Set<string> = new Set();
  private alertThresholds = {
    mentionCount: 10, // Alert if player mentioned 10+ times in 5 minutes
    sentimentDrop: -0.3, // Alert if sentiment drops below -0.3
    engagementSpike: 500 // Alert if engagement spikes above 500%
  };

  constructor(feed: RealTimeSocialFeed, sse: SocialSSE) {
    this.feed = feed;
    this.sse = sse;
    this.setupEventHandlers();
  }

  /**
   * Monitor specific players
   */
  monitorPlayers(players: string[]) {
    players.forEach(player => this.monitoredPlayers.add(player));
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.feed.on('post', (post: SocialPost) => {
      this.analyzePost(post);
    });

    this.feed.on('trends', (trends: any) => {
      this.analyzeTrends(trends);
    });
  }

  /**
   * Analyze post for alerts
   */
  private async analyzePost(post: SocialPost) {
    // Check for monitored player mentions
    if (post.playerMentions) {
      for (const mention of post.playerMentions) {
        if (this.monitoredPlayers.has(mention.playerName)) {
          await this.checkPlayerAlerts(mention.playerName, post);
        }
      }
    }

    // Check for high engagement posts
    if (this.isHighEngagement(post)) {
      this.sse.sendPlayerAlert({
        playerId: '',
        playerName: 'Multiple Players',
        type: 'news',
        severity: 'medium',
        message: 'High engagement post detected',
        source: post
      });
    }

    // Check for negative sentiment
    if (post.sentiment && post.sentiment.score < this.alertThresholds.sentimentDrop) {
      this.handleNegativeSentiment(post);
    }
  }

  /**
   * Check if post has high engagement
   */
  private isHighEngagement(post: SocialPost): boolean {
    const totalEngagement = 
      post.engagement.likes + 
      post.engagement.comments + 
      post.engagement.shares;
    
    // High engagement threshold varies by platform
    const thresholds: Record<string, number> = {
      twitter: 1000,
      reddit: 500,
      instagram: 5000,
      tiktok: 10000
    };

    const threshold = thresholds[post.platform] || 1000;
    return totalEngagement > threshold;
  }

  /**
   * Check for player-specific alerts
   */
  private async checkPlayerAlerts(playerName: string, post: SocialPost) {
    // Check for injury keywords
    const injuryKeywords = ['injury', 'injured', 'out', 'questionable', 'doubtful'];
    const hasInjuryKeyword = injuryKeywords.some(keyword => 
      post.content.toLowerCase().includes(keyword)
    );

    if (hasInjuryKeyword) {
      this.sse.sendPlayerAlert({
        playerId: '',
        playerName,
        type: 'injury',
        severity: 'high',
        message: `Potential injury news for ${playerName}`,
        source: post
      });
    }

    // Check for trade keywords
    const tradeKeywords = ['trade', 'traded', 'deal', 'moving', 'acquired'];
    const hasTradeKeyword = tradeKeywords.some(keyword => 
      post.content.toLowerCase().includes(keyword)
    );

    if (hasTradeKeyword) {
      this.sse.sendPlayerAlert({
        playerId: '',
        playerName,
        type: 'trade',
        severity: 'high',
        message: `Potential trade news for ${playerName}`,
        source: post
      });
    }
  }

  /**
   * Handle negative sentiment posts
   */
  private handleNegativeSentiment(post: SocialPost) {
    if (post.playerMentions && post.playerMentions.length > 0) {
      post.playerMentions.forEach(mention => {
        this.sse.sendPlayerAlert({
          playerId: '',
          playerName: mention.playerName,
          type: 'news',
          severity: 'medium',
          message: 'Negative sentiment detected',
          source: post
        });
      });
    }
  }

  /**
   * Analyze trending topics
   */
  private analyzeTrends(trends: any) {
    // Check if any monitored players are trending
    const trendingPlayers = trends.trends.filter((trend: string) =>
      Array.from(this.monitoredPlayers).some(player =>
        trend.toLowerCase().includes(player.toLowerCase())
      )
    );

    if (trendingPlayers.length > 0) {
      this.sse.sendTrendingUpdate({
        platform: trends.platform,
        trendingPlayers,
        allTrends: trends.trends
      });
    }
  }
}

// Singleton instances
let realTimeFeed: RealTimeSocialFeed | null = null;
let socialSSE: SocialSSE | null = null;
let socialMonitor: SocialMonitor | null = null;

export function getRealTimeSocialFeed(): RealTimeSocialFeed {
  if (!realTimeFeed) {
    realTimeFeed = new RealTimeSocialFeed();
  }
  return realTimeFeed;
}

export function getSocialSSE(): SocialSSE {
  if (!socialSSE) {
    socialSSE = new SocialSSE();
  }
  return socialSSE;
}

export function getSocialMonitor(): SocialMonitor {
  if (!socialMonitor) {
    socialMonitor = new SocialMonitor(
      getRealTimeSocialFeed(),
      getSocialSSE()
    );
  }
  return socialMonitor;
}