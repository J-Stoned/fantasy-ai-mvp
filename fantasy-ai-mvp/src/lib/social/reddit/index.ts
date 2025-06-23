/**
 * Reddit Integration
 * Access r/fantasyfootball and other fantasy sports subreddits
 */

import Snoowrap from 'snoowrap';
import { SocialPost, PlayerMention, SentimentAnalysis } from '../types';
import { analyzeSentiment } from '../sentiment';
import { extractPlayerMentions } from '../utils';

export class RedditIntegration {
  private client: Snoowrap;
  private subreddits = {
    nfl: ['fantasyfootball', 'nfl', 'DynastyFF', 'Fantasy_Football'],
    nba: ['fantasybball', 'nba', 'dynastybb'],
    mlb: ['fantasybaseball', 'baseball'],
    nhl: ['fantasyhockey', 'hockey']
  };

  constructor(config: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    userAgent: string;
  }) {
    this.client = new Snoowrap({
      userAgent: config.userAgent,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken
    });
  }

  /**
   * Get hot posts from fantasy subreddits
   */
  async getHotPosts(sport: 'nfl' | 'nba' | 'mlb' | 'nhl', limit = 25): Promise<SocialPost[]> {
    const posts: SocialPost[] = [];

    for (const subredditName of this.subreddits[sport]) {
      try {
        const subreddit = this.client.getSubreddit(subredditName);
        const hotPosts = await subreddit.getHot({ limit });

        for (const post of hotPosts) {
          const socialPost = await this.transformRedditPost(post);
          posts.push(socialPost);
        }
      } catch (error) {
        console.error(`Error fetching from r/${subredditName}:`, error);
      }
    }

    return posts.sort((a, b) => b.engagement.likes - a.engagement.likes);
  }

  /**
   * Search for posts about specific players
   */
  async searchPlayerDiscussions(playerName: string, limit = 50): Promise<SocialPost[]> {
    const posts: SocialPost[] = [];

    try {
      const searchResults = await this.client.search({
        query: playerName,
        subreddit: 'fantasyfootball',
        sort: 'relevance',
        time: 'week',
        limit
      });

      for (const post of searchResults) {
        const socialPost = await this.transformRedditPost(post);
        posts.push(socialPost);
      }
    } catch (error) {
      console.error('Reddit search error:', error);
    }

    return posts;
  }

  /**
   * Get trade discussions and advice threads
   */
  async getTradeThreads(): Promise<SocialPost[]> {
    const posts: SocialPost[] = [];

    try {
      const searchResults = await this.client.search({
        query: 'flair:"Trade" OR title:"Trade" OR title:"WDIS"',
        subreddit: 'fantasyfootball',
        sort: 'new',
        limit: 50
      });

      for (const post of searchResults) {
        const socialPost = await this.transformRedditPost(post);
        posts.push(socialPost);
      }
    } catch (error) {
      console.error('Trade thread error:', error);
    }

    return posts;
  }

  /**
   * Get daily/weekly discussion threads
   */
  async getDiscussionThreads(): Promise<SocialPost[]> {
    const posts: SocialPost[] = [];

    try {
      const subreddit = this.client.getSubreddit('fantasyfootball');
      const stickiedPosts = await subreddit.getSticky() as any[];

      for (const post of stickiedPosts) {
        if (post.title.includes('Daily') || post.title.includes('Weekly')) {
          const socialPost = await this.transformRedditPost(post);
          posts.push(socialPost);

          // Get top comments
          await post.expandReplies({ limit: 10, depth: 1 });
          const topComments = post.comments.slice(0, 10);

          for (const comment of topComments) {
            const commentPost = await this.transformRedditComment(comment, post);
            posts.push(commentPost);
          }
        }
      }
    } catch (error) {
      console.error('Discussion thread error:', error);
    }

    return posts;
  }

  /**
   * Monitor new posts in real-time
   */
  async streamNewPosts(
    subreddit: string,
    onPost: (post: SocialPost) => void
  ): Promise<void> {
    try {
      const sub = this.client.getSubreddit(subreddit);
      
      // Poll for new posts every 30 seconds
      setInterval(async () => {
        const newPosts = await sub.getNew({ limit: 10 });
        
        for (const post of newPosts) {
          const socialPost = await this.transformRedditPost(post);
          onPost(socialPost);
        }
      }, 30000);
    } catch (error) {
      console.error('Reddit stream error:', error);
    }
  }

  /**
   * Post to Reddit
   */
  async submitPost(
    subreddit: string,
    title: string,
    text?: string,
    url?: string
  ): Promise<string> {
    try {
      const sub = this.client.getSubreddit(subreddit);
      const submission = url
        ? await sub.submitLink({ title, url })
        : await sub.submitSelfpost({ title, text: text || '' });

      return submission.id;
    } catch (error) {
      console.error('Reddit post error:', error);
      throw error;
    }
  }

  /**
   * Transform Reddit post to SocialPost
   */
  private async transformRedditPost(post: any): Promise<SocialPost> {
    const content = post.selftext || post.title;
    const sentiment = await analyzeSentiment(content);
    const playerMentions = extractPlayerMentions(content);

    return {
      id: post.id,
      platform: 'reddit',
      authorId: post.author.id || post.author,
      authorName: post.author.name || post.author,
      content,
      mediaUrls: post.url && !post.is_self ? [post.url] : [],
      hashtags: post.link_flair_text ? [post.link_flair_text] : [],
      mentions: [],
      timestamp: new Date(post.created_utc * 1000),
      engagement: {
        likes: post.score,
        comments: post.num_comments,
        shares: post.num_crossposts || 0
      },
      sentiment,
      playerMentions,
      url: `https://reddit.com${post.permalink}`
    };
  }

  /**
   * Transform Reddit comment to SocialPost
   */
  private async transformRedditComment(comment: any, parentPost: any): Promise<SocialPost> {
    const content = comment.body;
    const sentiment = await analyzeSentiment(content);
    const playerMentions = extractPlayerMentions(content);

    return {
      id: comment.id,
      platform: 'reddit',
      authorId: comment.author.id || comment.author,
      authorName: comment.author.name || comment.author,
      content,
      mediaUrls: [],
      hashtags: [],
      mentions: [],
      timestamp: new Date(comment.created_utc * 1000),
      engagement: {
        likes: comment.score,
        comments: comment.replies ? comment.replies.length : 0,
        shares: 0
      },
      sentiment,
      playerMentions,
      url: `https://reddit.com${parentPost.permalink}${comment.id}`
    };
  }
}

// Singleton instance
let redditInstance: RedditIntegration | null = null;

export function getRedditIntegration(): RedditIntegration {
  if (!redditInstance) {
    const config = {
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
      userAgent: 'FantasyAI/1.0.0'
    };

    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      throw new Error('Reddit API credentials not configured');
    }

    redditInstance = new RedditIntegration(config);
  }
  return redditInstance;
}