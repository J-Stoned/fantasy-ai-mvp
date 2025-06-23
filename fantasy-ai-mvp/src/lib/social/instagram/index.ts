/**
 * Instagram Integration
 * Player highlights and visual content
 */

import { IgApiClient } from 'instagram-private-api';
import { SocialPost } from '../types';
import { analyzeSentiment } from '../sentiment';
import { extractPlayerMentions } from '../utils';

export class InstagramIntegration {
  private client: IgApiClient;
  private loggedIn = false;

  constructor() {
    this.client = new IgApiClient();
  }

  /**
   * Login to Instagram
   */
  async login(username: string, password: string) {
    try {
      this.client.state.generateDevice(username);
      await this.client.account.login(username, password);
      this.loggedIn = true;
    } catch (error) {
      console.error('Instagram login error:', error);
      throw error;
    }
  }

  /**
   * Search for player highlights
   */
  async searchPlayerHighlights(playerName: string, limit = 20): Promise<SocialPost[]> {
    if (!this.loggedIn) throw new Error('Not logged in to Instagram');

    try {
      // Search for hashtags related to the player
      const searchResults = await this.client.search.blended({
        query: playerName,
        context: 'blended'
      });

      const posts: SocialPost[] = [];

      // Get posts from hashtag results
      for (const hashtag of searchResults.hashtags || []) {
        const tagFeed = await this.client.tags.feed(hashtag.name);
        const items = await tagFeed.items();

        for (const item of items.slice(0, limit)) {
          const post = await this.transformInstagramPost(item);
          posts.push(post);
        }
      }

      // Get posts from user results (player official accounts)
      for (const user of searchResults.users || []) {
        if (user.is_verified) {
          const userFeed = await this.client.feed.user(user.pk);
          const items = await userFeed.items();

          for (const item of items.slice(0, 5)) {
            const post = await this.transformInstagramPost(item);
            posts.push(post);
          }
        }
      }

      return posts;
    } catch (error) {
      console.error('Instagram search error:', error);
      throw error;
    }
  }

  /**
   * Get posts from official team accounts
   */
  async getTeamPosts(teamUsernames: string[]): Promise<SocialPost[]> {
    if (!this.loggedIn) throw new Error('Not logged in to Instagram');

    const posts: SocialPost[] = [];

    for (const username of teamUsernames) {
      try {
        const user = await this.client.user.searchExact(username);
        if (user) {
          const userFeed = await this.client.feed.user(user.pk);
          const items = await userFeed.items();

          for (const item of items.slice(0, 10)) {
            const post = await this.transformInstagramPost(item);
            posts.push(post);
          }
        }
      } catch (error) {
        console.error(`Error fetching @${username}:`, error);
      }
    }

    return posts;
  }

  /**
   * Get stories from players and teams
   */
  async getStories(userIds: string[]): Promise<SocialPost[]> {
    if (!this.loggedIn) throw new Error('Not logged in to Instagram');

    const posts: SocialPost[] = [];

    try {
      const reelsFeed = await this.client.feed.reelsMedia({
        userIds: userIds
      });
      const items = await reelsFeed.items();

      for (const item of items) {
        const post = await this.transformInstagramStory(item);
        posts.push(post);
      }
    } catch (error) {
      console.error('Instagram stories error:', error);
    }

    return posts;
  }

  /**
   * Post to Instagram
   */
  async postPhoto(
    photoPath: string,
    caption: string,
    hashtags: string[]
  ): Promise<string> {
    if (!this.loggedIn) throw new Error('Not logged in to Instagram');

    try {
      const publishResult = await this.client.publish.photo({
        file: await this.readFileAsBuffer(photoPath),
        caption: `${caption}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`
      });

      return publishResult.media.id;
    } catch (error) {
      console.error('Instagram post error:', error);
      throw error;
    }
  }

  /**
   * Transform Instagram post to SocialPost
   */
  private async transformInstagramPost(post: any): Promise<SocialPost> {
    const caption = post.caption?.text || '';
    const sentiment = await analyzeSentiment(caption);
    const playerMentions = extractPlayerMentions(caption);

    const mediaUrls: string[] = [];
    if (post.image_versions2?.candidates) {
      mediaUrls.push(post.image_versions2.candidates[0].url);
    }
    if (post.carousel_media) {
      for (const media of post.carousel_media) {
        if (media.image_versions2?.candidates) {
          mediaUrls.push(media.image_versions2.candidates[0].url);
        }
      }
    }

    return {
      id: post.id,
      platform: 'instagram',
      authorId: post.user.pk.toString(),
      authorName: post.user.username,
      authorAvatar: post.user.profile_pic_url,
      content: caption,
      mediaUrls,
      hashtags: (caption.match(/#\w+/g) || []).map(tag => tag.slice(1)),
      mentions: (caption.match(/@\w+/g) || []).map(mention => mention.slice(1)),
      timestamp: new Date(post.taken_at * 1000),
      engagement: {
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        shares: 0,
        views: post.view_count || 0
      },
      sentiment,
      playerMentions,
      isVerified: post.user.is_verified || false,
      url: `https://instagram.com/p/${post.code}`
    };
  }

  /**
   * Transform Instagram story to SocialPost
   */
  private async transformInstagramStory(story: any): Promise<SocialPost> {
    const caption = story.caption?.text || '';
    const sentiment = await analyzeSentiment(caption);
    const playerMentions = extractPlayerMentions(caption);

    return {
      id: story.id,
      platform: 'instagram',
      authorId: story.user.pk.toString(),
      authorName: story.user.username,
      authorAvatar: story.user.profile_pic_url,
      content: caption,
      mediaUrls: story.image_versions2?.candidates ? 
        [story.image_versions2.candidates[0].url] : [],
      hashtags: [],
      mentions: [],
      timestamp: new Date(story.taken_at * 1000),
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: story.viewer_count || 0
      },
      sentiment,
      playerMentions,
      isVerified: story.user.is_verified || false,
      url: '' // Stories don't have permanent URLs
    };
  }

  /**
   * Helper to read file as buffer
   */
  private async readFileAsBuffer(path: string): Promise<Buffer> {
    const fs = await import('fs/promises');
    return fs.readFile(path);
  }
}

// Singleton instance
let instagramInstance: InstagramIntegration | null = null;

export async function getInstagramIntegration(): Promise<InstagramIntegration> {
  if (!instagramInstance) {
    instagramInstance = new InstagramIntegration();
    
    const username = process.env.INSTAGRAM_USERNAME;
    const password = process.env.INSTAGRAM_PASSWORD;
    
    if (username && password) {
      await instagramInstance.login(username, password);
    }
  }
  return instagramInstance;
}