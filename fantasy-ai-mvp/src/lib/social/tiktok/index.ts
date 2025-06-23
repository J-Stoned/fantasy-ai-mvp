/**
 * TikTok Integration
 * Viral fantasy sports content and trends
 */

import axios from 'axios';
import { SocialPost } from '../types';
import { analyzeSentiment } from '../sentiment';
import { extractPlayerMentions } from '../utils';

export class TikTokIntegration {
  private apiKey: string;
  private apiSecret: string;
  private accessToken?: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Get access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await axios.post(
        'https://open-api.tiktok.com/oauth/access_token/',
        {
          client_key: this.apiKey,
          client_secret: this.apiSecret,
          grant_type: 'client_credentials'
        }
      );

      this.accessToken = response.data.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('TikTok auth error:', error);
      throw error;
    }
  }

  /**
   * Search for fantasy sports videos
   */
  async searchFantasyContent(query: string, limit = 20): Promise<SocialPost[]> {
    try {
      const token = await this.getAccessToken();
      
      // Note: TikTok's public API has limitations
      // This is a simplified implementation
      const response = await axios.get(
        'https://open-api.tiktok.com/discovery/search/',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            keyword: query,
            type: 1, // Videos
            count: limit
          }
        }
      );

      const posts: SocialPost[] = [];
      for (const video of response.data.data.videos || []) {
        const post = await this.transformTikTokVideo(video);
        posts.push(post);
      }

      return posts;
    } catch (error) {
      console.error('TikTok search error:', error);
      return [];
    }
  }

  /**
   * Get trending fantasy hashtags
   */
  async getTrendingHashtags(): Promise<string[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        'https://open-api.tiktok.com/discovery/hashtag/',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const fantasyHashtags = response.data.data.hashtags
        .filter((tag: any) => 
          tag.name.toLowerCase().includes('fantasy') ||
          tag.name.toLowerCase().includes('nfl') ||
          tag.name.toLowerCase().includes('sports')
        )
        .map((tag: any) => tag.name);

      return fantasyHashtags;
    } catch (error) {
      console.error('TikTok hashtags error:', error);
      return [];
    }
  }

  /**
   * Get videos from specific creators
   */
  async getCreatorVideos(userId: string, limit = 10): Promise<SocialPost[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `https://open-api.tiktok.com/user/video/list/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            user_id: userId,
            count: limit
          }
        }
      );

      const posts: SocialPost[] = [];
      for (const video of response.data.data.videos || []) {
        const post = await this.transformTikTokVideo(video);
        posts.push(post);
      }

      return posts;
    } catch (error) {
      console.error('TikTok creator error:', error);
      return [];
    }
  }

  /**
   * Post a video to TikTok
   */
  async postVideo(
    videoPath: string,
    caption: string,
    hashtags: string[]
  ): Promise<string> {
    try {
      const token = await this.getAccessToken();
      
      // Note: Video upload requires special permissions
      // This is a simplified implementation
      const formData = new FormData();
      formData.append('video', await this.createReadStream(videoPath));
      formData.append('description', `${caption} ${hashtags.map(tag => `#${tag}`).join(' ')}`);

      const response = await axios.post(
        'https://open-api.tiktok.com/share/video/upload/',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data.data.video_id;
    } catch (error) {
      console.error('TikTok post error:', error);
      throw error;
    }
  }

  /**
   * Transform TikTok video to SocialPost
   */
  private async transformTikTokVideo(video: any): Promise<SocialPost> {
    const description = video.description || '';
    const sentiment = await analyzeSentiment(description);
    const playerMentions = extractPlayerMentions(description);

    return {
      id: video.id,
      platform: 'tiktok',
      authorId: video.author.id,
      authorName: video.author.nickname,
      authorAvatar: video.author.avatar_thumb?.url_list?.[0],
      content: description,
      mediaUrls: [video.video.cover?.url_list?.[0], video.video.play_addr?.url_list?.[0]].filter(Boolean),
      hashtags: (video.text_extra || [])
        .filter((extra: any) => extra.hashtag_name)
        .map((extra: any) => extra.hashtag_name),
      mentions: (video.text_extra || [])
        .filter((extra: any) => extra.user_id)
        .map((extra: any) => extra.sec_uid),
      timestamp: new Date(video.create_time * 1000),
      engagement: {
        likes: video.statistics?.digg_count || 0,
        comments: video.statistics?.comment_count || 0,
        shares: video.statistics?.share_count || 0,
        views: video.statistics?.play_count || 0
      },
      sentiment,
      playerMentions,
      isVerified: video.author.is_verified || false,
      url: `https://www.tiktok.com/@${video.author.unique_id}/video/${video.id}`
    };
  }

  /**
   * Helper to create read stream
   */
  private async createReadStream(path: string): Promise<any> {
    const fs = await import('fs');
    return fs.createReadStream(path);
  }
}

// Mock implementation for demo purposes
export class TikTokMockIntegration {
  async searchFantasyContent(query: string, limit = 20): Promise<SocialPost[]> {
    // Return mock data for demo
    return [
      {
        id: 'tiktok-1',
        platform: 'tiktok',
        authorId: 'fantasyguru',
        authorName: 'Fantasy Guru',
        authorAvatar: 'https://example.com/avatar.jpg',
        content: `🏈 MUST START players Week 12! ${query} #fantasyfootball #nfl #lineup`,
        mediaUrls: ['https://example.com/video-thumb.jpg'],
        hashtags: ['fantasyfootball', 'nfl', 'lineup'],
        mentions: [],
        timestamp: new Date(),
        engagement: {
          likes: 15000,
          comments: 500,
          shares: 1200,
          views: 250000
        },
        sentiment: {
          score: 0.8,
          label: 'positive',
          confidence: 0.9,
          keywords: ['must', 'start'],
          topics: ['lineup', 'advice']
        },
        playerMentions: [],
        isVerified: true,
        url: 'https://tiktok.com/@fantasyguru/video/123'
      }
    ];
  }

  async getTrendingHashtags(): Promise<string[]> {
    return [
      'fantasyfootball',
      'nfllineup',
      'fantasyadvice',
      'waiverwire',
      'dynastyleague',
      'fantasytrade'
    ];
  }

  async getCreatorVideos(userId: string, limit = 10): Promise<SocialPost[]> {
    return this.searchFantasyContent('fantasy football', limit);
  }
}

// Use mock for now since TikTok API requires approval
let tiktokInstance: TikTokMockIntegration | null = null;

export function getTikTokIntegration(): TikTokMockIntegration {
  if (!tiktokInstance) {
    tiktokInstance = new TikTokMockIntegration();
  }
  return tiktokInstance;
}