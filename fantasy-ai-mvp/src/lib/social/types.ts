/**
 * Social Media Integration Types
 */

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  sentiment?: SentimentAnalysis;
  playerMentions?: PlayerMention[];
  isVerified?: boolean;
  url: string;
}

export type SocialPlatform = 
  | 'twitter'
  | 'reddit'
  | 'discord'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'threads';

export interface PlayerMention {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  confidence: number; // 0-1 confidence score
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number; // 0-1
  keywords: string[];
  topics: string[];
}

export interface SocialAuthConfig {
  platform: SocialPlatform;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
}

export interface SocialWebhook {
  id: string;
  platform: SocialPlatform;
  event: string;
  url: string;
  secret?: string;
  active: boolean;
  createdAt: Date;
}

export interface SocialShareOptions {
  platforms: SocialPlatform[];
  content: string;
  mediaUrl?: string;
  hashtags?: string[];
  mentions?: string[];
  scheduledAt?: Date;
}

export interface CommunityPost {
  id: string;
  userId: string;
  leagueId?: string;
  content: string;
  mediaUrls?: string[];
  tags?: string[];
  likes: number;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  likes: number;
  replies?: Comment[];
  createdAt: Date;
}

export interface SocialFeed {
  posts: SocialPost[];
  nextCursor?: string;
  hasMore: boolean;
  lastUpdated: Date;
}

export interface PlayerSocialProfile {
  playerId: string;
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  verified: boolean;
  followers: {
    twitter?: number;
    instagram?: number;
    tiktok?: number;
  };
  lastActivity: {
    twitter?: Date;
    instagram?: Date;
    tiktok?: Date;
  };
}

export interface SocialMediaMetrics {
  platform: SocialPlatform;
  followers: number;
  engagement: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  topPosts: SocialPost[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}