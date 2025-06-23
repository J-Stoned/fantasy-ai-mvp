/**
 * Social Media Hub
 * Central coordinator for all social media integrations
 */

import { 
  SocialPost, 
  SocialPlatform, 
  PlayerSocialProfile,
  SocialMediaMetrics 
} from './types';
import { getTwitterIntegration } from './twitter';
import { getRedditIntegration } from './reddit';
import { getDiscordIntegration } from './discord';
import { getInstagramIntegration } from './instagram';
import { getTikTokIntegration } from './tiktok';
import { aggregateSentiment, analyzePlayerSentimentTrend } from './sentiment';
import { getSocialSharingService, getContentGenerator } from './sharing';
import { getCommunityService } from './community';
import { getSocialAuthService } from './auth';
import { getRealTimeSocialFeed, getSocialMonitor } from './real-time';

export class SocialMediaHub {
  private platforms = {
    twitter: getTwitterIntegration(),
    reddit: getRedditIntegration(),
    discord: getDiscordIntegration(),
    instagram: null as any, // Lazy loaded
    tiktok: getTikTokIntegration()
  };

  private services = {
    sharing: getSocialSharingService(),
    content: getContentGenerator(),
    community: getCommunityService(),
    auth: getSocialAuthService(),
    realtime: getRealTimeSocialFeed(),
    monitor: getSocialMonitor()
  };

  /**
   * Search for player content across all platforms
   */
  async searchPlayerContent(
    playerName: string,
    platforms: SocialPlatform[] = ['twitter', 'reddit', 'tiktok'],
    limit = 50
  ): Promise<{
    posts: SocialPost[];
    sentiment: ReturnType<typeof aggregateSentiment>;
    trending: boolean;
  }> {
    const allPosts: SocialPost[] = [];

    // Search each platform
    for (const platform of platforms) {
      try {
        let posts: SocialPost[] = [];

        switch (platform) {
          case 'twitter':
            posts = await this.platforms.twitter.searchPlayerNews(playerName, limit);
            break;

          case 'reddit':
            posts = await this.platforms.reddit.searchPlayerDiscussions(playerName, limit);
            break;

          case 'tiktok':
            posts = await this.platforms.tiktok.searchFantasyContent(playerName, limit);
            break;

          case 'instagram':
            if (!this.platforms.instagram) {
              this.platforms.instagram = await getInstagramIntegration();
            }
            posts = await this.platforms.instagram.searchPlayerHighlights(playerName, limit);
            break;
        }

        allPosts.push(...posts);
      } catch (error) {
        console.error(`Error searching ${platform}:`, error);
      }
    }

    // Analyze sentiment
    const sentiment = aggregateSentiment(allPosts);

    // Check if trending (high volume of recent posts)
    const recentPosts = allPosts.filter(
      p => p.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    const trending = recentPosts.length > 10;

    return {
      posts: allPosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      sentiment,
      trending
    };
  }

  /**
   * Get comprehensive social media metrics for a player
   */
  async getPlayerSocialMetrics(
    playerName: string
  ): Promise<{
    profile: PlayerSocialProfile;
    metrics: SocialMediaMetrics[];
    sentimentTrend: ReturnType<typeof analyzePlayerSentimentTrend>;
  }> {
    // Search for content
    const { posts, sentiment } = await this.searchPlayerContent(playerName);

    // Analyze sentiment trend
    const sentimentTrend = analyzePlayerSentimentTrend(playerName, posts);

    // Build metrics by platform
    const metricsByPlatform: Record<string, SocialMediaMetrics> = {};

    posts.forEach(post => {
      if (!metricsByPlatform[post.platform]) {
        metricsByPlatform[post.platform] = {
          platform: post.platform as SocialPlatform,
          followers: 0,
          engagement: {
            daily: 0,
            weekly: 0,
            monthly: 0
          },
          topPosts: [],
          sentiment: {
            positive: 0,
            negative: 0,
            neutral: 0
          }
        };
      }

      const metrics = metricsByPlatform[post.platform];
      
      // Update engagement
      const engagement = post.engagement.likes + post.engagement.comments + post.engagement.shares;
      const daysSincePost = (Date.now() - post.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSincePost <= 1) metrics.engagement.daily += engagement;
      if (daysSincePost <= 7) metrics.engagement.weekly += engagement;
      if (daysSincePost <= 30) metrics.engagement.monthly += engagement;

      // Update sentiment
      if (post.sentiment) {
        if (post.sentiment.label === 'positive') metrics.sentiment.positive++;
        else if (post.sentiment.label === 'negative') metrics.sentiment.negative++;
        else metrics.sentiment.neutral++;
      }

      // Track top posts
      if (metrics.topPosts.length < 5) {
        metrics.topPosts.push(post);
      } else {
        metrics.topPosts.sort((a, b) => 
          (b.engagement.likes + b.engagement.comments + b.engagement.shares) -
          (a.engagement.likes + a.engagement.comments + a.engagement.shares)
        );
        metrics.topPosts = metrics.topPosts.slice(0, 5);
      }
    });

    // Create player profile (would be enhanced with actual social media handles)
    const profile: PlayerSocialProfile = {
      playerId: '', // Would be matched from database
      playerName,
      verified: false,
      followers: {},
      lastActivity: {}
    };

    return {
      profile,
      metrics: Object.values(metricsByPlatform),
      sentimentTrend
    };
  }

  /**
   * Post lineup announcement across platforms
   */
  async announceLineup(lineup: {
    teamName: string;
    week: number;
    players: { position: string; name: string; opponent: string }[];
    platforms?: SocialPlatform[];
  }) {
    const content = this.services.content.generateLineupPost(lineup);
    
    if (lineup.platforms) {
      content.platforms = lineup.platforms;
    }

    return await this.services.sharing.shareContent(content);
  }

  /**
   * Post trade announcement
   */
  async announceTrade(trade: {
    teamA: string;
    teamB: string;
    playersFromA: string[];
    playersFromB: string[];
    platforms?: SocialPlatform[];
  }) {
    const content = this.services.content.generateTradePost(trade);
    
    if (trade.platforms) {
      content.platforms = trade.platforms;
    }

    return await this.services.sharing.shareContent(content);
  }

  /**
   * Start monitoring players for real-time updates
   */
  async startMonitoring(players: string[], connectionId: string) {
    // Monitor players across platforms
    this.services.monitor.monitorPlayers(players);
    
    // Subscribe to real-time updates
    await this.services.realtime.subscribeToPlayers(connectionId, players);
  }

  /**
   * Get trending fantasy topics
   */
  async getTrendingTopics(): Promise<{
    platform: SocialPlatform;
    topics: string[];
  }[]> {
    const trending = [];

    try {
      // Twitter trends
      const twitterTrends = await this.platforms.twitter.getTrendingTopics();
      trending.push({
        platform: 'twitter' as SocialPlatform,
        topics: twitterTrends
      });

      // TikTok trends
      const tiktokTrends = await this.platforms.tiktok.getTrendingHashtags();
      trending.push({
        platform: 'tiktok' as SocialPlatform,
        topics: tiktokTrends
      });

      // Reddit hot topics
      const redditPosts = await this.platforms.reddit.getHotPosts('nfl', 10);
      const redditTopics = [...new Set(redditPosts.flatMap(p => p.hashtags))];
      trending.push({
        platform: 'reddit' as SocialPlatform,
        topics: redditTopics
      });
    } catch (error) {
      console.error('Error fetching trends:', error);
    }

    return trending;
  }

  /**
   * Get community feed for a user
   */
  async getUserFeed(userId: string, limit = 50) {
    return await this.services.community.getUserFeed(userId, limit);
  }

  /**
   * Create community post
   */
  async createPost(
    userId: string,
    content: string,
    options?: {
      leagueId?: string;
      mediaUrls?: string[];
      tags?: string[];
    }
  ) {
    return await this.services.community.createPost(
      userId,
      content,
      options?.leagueId,
      options?.mediaUrls,
      options?.tags
    );
  }

  /**
   * Get social login URL
   */
  getSocialLoginUrl(platform: SocialPlatform, state: string): string {
    return this.services.auth.getAuthorizationUrl(platform, state);
  }

  /**
   * Handle social login callback
   */
  async handleSocialCallback(
    platform: SocialPlatform,
    code: string,
    userId: string
  ) {
    // Exchange code for token
    const tokens = await this.services.auth.exchangeCodeForToken(platform, code);
    
    // Get user profile
    const profile = await this.services.auth.getUserProfile(
      platform,
      tokens.accessToken
    );

    // Link account
    await this.services.auth.linkSocialAccount(
      userId,
      platform,
      profile.id,
      tokens.accessToken,
      tokens.refreshToken
    );

    return profile;
  }

  /**
   * Send Discord notification to league
   */
  async notifyDiscordLeague(
    leagueId: string,
    notification: {
      title: string;
      message: string;
      type: 'trade' | 'waiver' | 'score' | 'general';
      data?: any;
    }
  ) {
    await this.platforms.discord.sendLeagueNotification(leagueId, notification);
  }

  /**
   * Get stats about social media integration
   */
  getStats() {
    return {
      realtime: this.services.realtime.getStats(),
      platforms: Object.keys(this.platforms),
      services: Object.keys(this.services)
    };
  }
}

// Singleton instance
let socialHub: SocialMediaHub | null = null;

export function getSocialMediaHub(): SocialMediaHub {
  if (!socialHub) {
    socialHub = new SocialMediaHub();
  }
  return socialHub;
}