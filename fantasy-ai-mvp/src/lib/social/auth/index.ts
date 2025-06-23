/**
 * Social Authentication
 * OAuth flows for social login
 */

import { SocialAuthConfig, SocialPlatform } from '../types';
import { prisma } from '@/lib/prisma';

export class SocialAuthService {
  private configs: Map<SocialPlatform, SocialAuthConfig> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  /**
   * Initialize OAuth configurations
   */
  private initializeConfigs() {
    // Twitter OAuth 2.0
    this.configs.set('twitter', {
      platform: 'twitter',
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/twitter`,
      scopes: ['tweet.read', 'users.read', 'follows.read', 'offline.access']
    });

    // Google OAuth 2.0
    this.configs.set('youtube', {
      platform: 'youtube',
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/google`,
      scopes: ['profile', 'email']
    });

    // Discord OAuth 2.0
    this.configs.set('discord', {
      platform: 'discord',
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/discord`,
      scopes: ['identify', 'email', 'guilds']
    });

    // Reddit OAuth 2.0
    this.configs.set('reddit', {
      platform: 'reddit',
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/reddit`,
      scopes: ['identity', 'read', 'submit']
    });
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(platform: SocialPlatform, state: string): string {
    const config = this.configs.get(platform);
    if (!config) throw new Error(`Platform ${platform} not configured`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state
    });

    switch (platform) {
      case 'twitter':
        params.append('code_challenge', 'challenge'); // Add PKCE
        params.append('code_challenge_method', 'plain');
        return `https://twitter.com/i/oauth2/authorize?${params}`;

      case 'youtube':
        params.append('access_type', 'offline');
        params.append('prompt', 'consent');
        return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

      case 'discord':
        return `https://discord.com/api/oauth2/authorize?${params}`;

      case 'reddit':
        params.append('duration', 'permanent');
        return `https://www.reddit.com/api/v1/authorize?${params}`;

      default:
        throw new Error(`Platform ${platform} not supported`);
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    platform: SocialPlatform,
    code: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    const config = this.configs.get(platform);
    if (!config) throw new Error(`Platform ${platform} not configured`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    });

    let tokenUrl: string;
    switch (platform) {
      case 'twitter':
        params.append('code_verifier', 'challenge'); // PKCE verifier
        tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        break;

      case 'youtube':
        tokenUrl = 'https://oauth2.googleapis.com/token';
        break;

      case 'discord':
        tokenUrl = 'https://discord.com/api/oauth2/token';
        break;

      case 'reddit':
        tokenUrl = 'https://www.reddit.com/api/v1/access_token';
        break;

      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(platform === 'reddit' && {
          'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
        })
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  /**
   * Get user profile from social platform
   */
  async getUserProfile(
    platform: SocialPlatform,
    accessToken: string
  ): Promise<{
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    name?: string;
  }> {
    switch (platform) {
      case 'twitter':
        return this.getTwitterProfile(accessToken);

      case 'youtube':
        return this.getGoogleProfile(accessToken);

      case 'discord':
        return this.getDiscordProfile(accessToken);

      case 'reddit':
        return this.getRedditProfile(accessToken);

      default:
        throw new Error(`Platform ${platform} not supported`);
    }
  }

  /**
   * Link social account to user
   */
  async linkSocialAccount(
    userId: string,
    platform: SocialPlatform,
    socialId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<void> {
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform
        }
      },
      update: {
        socialId,
        accessToken,
        refreshToken,
        updatedAt: new Date()
      },
      create: {
        userId,
        platform,
        socialId,
        accessToken,
        refreshToken
      }
    });
  }

  /**
   * Get Twitter profile
   */
  private async getTwitterProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
      avatar: data.data.profile_image_url
    };
  }

  /**
   * Get Google profile
   */
  private async getGoogleProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    return {
      id: data.id,
      username: data.email.split('@')[0],
      email: data.email,
      name: data.name,
      avatar: data.picture
    };
  }

  /**
   * Get Discord profile
   */
  private async getDiscordProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.global_name || data.username,
      avatar: data.avatar ? 
        `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : 
        undefined
    };
  }

  /**
   * Get Reddit profile
   */
  private async getRedditProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'FantasyAI/1.0.0'
      }
    });

    const data = await response.json();
    return {
      id: data.id,
      username: data.name,
      avatar: data.icon_img
    };
  }
}

// Singleton instance
let socialAuthService: SocialAuthService | null = null;

export function getSocialAuthService(): SocialAuthService {
  if (!socialAuthService) {
    socialAuthService = new SocialAuthService();
  }
  return socialAuthService;
}