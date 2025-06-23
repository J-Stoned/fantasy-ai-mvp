/**
 * Twitter/X API Integration
 * Real-time player news, updates, and sentiment analysis
 */

import { TwitterApi, ApiResponseError } from 'twitter-api-v2';
import { SocialPost, PlayerMention, SentimentAnalysis } from '../types';
import { analyzeSentiment } from '../sentiment';
import { extractPlayerMentions } from '../utils';

export class TwitterIntegration {
  private client: TwitterApi;
  private streamClient?: TwitterApi;
  private bearerToken: string;

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
    this.client = new TwitterApi(bearerToken);
  }

  /**
   * Search for tweets mentioning specific players
   */
  async searchPlayerNews(playerName: string, limit = 50): Promise<SocialPost[]> {
    try {
      const tweets = await this.client.v2.search(
        `"${playerName}" (injury OR trade OR news OR update) -is:retweet lang:en`,
        {
          max_results: limit,
          expansions: ['author_id', 'attachments.media_keys'],
          'tweet.fields': ['created_at', 'public_metrics', 'entities', 'attachments'],
          'user.fields': ['name', 'username', 'profile_image_url', 'verified'],
          'media.fields': ['url', 'preview_image_url']
        }
      );

      return this.transformTweets(tweets);
    } catch (error) {
      console.error('Twitter search error:', error);
      throw error;
    }
  }

  /**
   * Stream real-time tweets for specific topics
   */
  async streamFantasyUpdates(
    players: string[],
    onTweet: (tweet: SocialPost) => void
  ): Promise<void> {
    try {
      // Create filtered stream rules
      const rules = players.map(player => ({
        value: `"${player}" (injury OR touchdown OR goal OR news)`,
        tag: `player-${player.replace(/\s+/g, '-')}`
      }));

      // Add rules to stream
      await this.client.v2.updateStreamRules({
        add: rules
      });

      // Start streaming
      const stream = await this.client.v2.searchStream({
        expansions: ['author_id', 'attachments.media_keys'],
        'tweet.fields': ['created_at', 'public_metrics', 'entities'],
        'user.fields': ['name', 'username', 'profile_image_url', 'verified']
      });

      stream.on('data', async (tweet) => {
        const socialPost = await this.transformTweet(tweet);
        onTweet(socialPost);
      });

      stream.on('error', (error) => {
        console.error('Stream error:', error);
      });

      stream.autoReconnect = true;
    } catch (error) {
      console.error('Twitter stream error:', error);
      throw error;
    }
  }

  /**
   * Get trending fantasy sports topics
   */
  async getTrendingTopics(): Promise<string[]> {
    try {
      // Get trends for US (WOEID: 23424977)
      const trends = await this.client.v1.trendsByPlace(23424977);
      
      const fantasyKeywords = ['fantasy', 'football', 'nfl', 'nba', 'injury', 'trade'];
      const relevantTrends = trends[0].trends
        .filter(trend => 
          fantasyKeywords.some(keyword => 
            trend.name.toLowerCase().includes(keyword)
          )
        )
        .map(trend => trend.name);

      return relevantTrends;
    } catch (error) {
      console.error('Twitter trends error:', error);
      return [];
    }
  }

  /**
   * Get tweets from verified sports reporters
   */
  async getReporterUpdates(reporters: string[]): Promise<SocialPost[]> {
    try {
      const usernames = reporters.map(r => `from:${r}`).join(' OR ');
      const tweets = await this.client.v2.search(
        `(${usernames}) (injury OR trade OR breaking OR update)`,
        {
          max_results: 100,
          expansions: ['author_id'],
          'tweet.fields': ['created_at', 'public_metrics'],
          'user.fields': ['name', 'username', 'profile_image_url', 'verified']
        }
      );

      return this.transformTweets(tweets);
    } catch (error) {
      console.error('Reporter updates error:', error);
      throw error;
    }
  }

  /**
   * Post a tweet
   */
  async postUpdate(content: string, mediaIds?: string[]): Promise<string> {
    try {
      const tweet = await this.client.v2.tweet({
        text: content,
        media: mediaIds ? { media_ids: mediaIds } : undefined
      });

      return tweet.data.id;
    } catch (error) {
      console.error('Twitter post error:', error);
      throw error;
    }
  }

  /**
   * Transform Twitter API response to SocialPost
   */
  private async transformTweets(tweets: any): Promise<SocialPost[]> {
    const posts: SocialPost[] = [];

    for (const tweet of tweets.data || []) {
      const post = await this.transformTweet(tweet, tweets.includes);
      posts.push(post);
    }

    return posts;
  }

  private async transformTweet(tweet: any, includes?: any): Promise<SocialPost> {
    const author = includes?.users?.find((u: any) => u.id === tweet.author_id);
    const media = tweet.attachments?.media_keys?.map((key: string) =>
      includes?.media?.find((m: any) => m.media_key === key)
    ).filter(Boolean);

    const content = tweet.text;
    const sentiment = await analyzeSentiment(content);
    const playerMentions = extractPlayerMentions(content);

    return {
      id: tweet.id,
      platform: 'twitter',
      authorId: tweet.author_id,
      authorName: author?.name || 'Unknown',
      authorAvatar: author?.profile_image_url,
      content,
      mediaUrls: media?.map((m: any) => m.url || m.preview_image_url).filter(Boolean),
      hashtags: tweet.entities?.hashtags?.map((h: any) => h.tag) || [],
      mentions: tweet.entities?.mentions?.map((m: any) => m.username) || [],
      timestamp: new Date(tweet.created_at),
      engagement: {
        likes: tweet.public_metrics?.like_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
        views: tweet.public_metrics?.impression_count
      },
      sentiment,
      playerMentions,
      isVerified: author?.verified || false,
      url: `https://twitter.com/i/status/${tweet.id}`
    };
  }
}

// Singleton instance
let twitterInstance: TwitterIntegration | null = null;

export function getTwitterIntegration(): TwitterIntegration {
  if (!twitterInstance) {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error('Twitter bearer token not configured');
    }
    twitterInstance = new TwitterIntegration(bearerToken);
  }
  return twitterInstance;
}