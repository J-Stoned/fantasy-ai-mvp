/**
 * Automated Social Sharing
 * Schedule and post content across platforms
 */

import { SocialPlatform, SocialShareOptions } from '../types';
import { getTwitterIntegration } from '../twitter';
import { getRedditIntegration } from '../reddit';
import { getDiscordIntegration } from '../discord';
import { getInstagramIntegration } from '../instagram';
import { getTikTokIntegration } from '../tiktok';
import cron from 'node-cron';

export class SocialSharingService {
  private scheduledPosts: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Share content across multiple platforms
   */
  async shareContent(options: SocialShareOptions): Promise<{
    platform: SocialPlatform;
    success: boolean;
    postId?: string;
    error?: string;
  }[]> {
    const results = [];

    for (const platform of options.platforms) {
      try {
        const postId = await this.shareOnPlatform(platform, options);
        results.push({ platform, success: true, postId });
      } catch (error: any) {
        results.push({ 
          platform, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * Schedule content for future posting
   */
  async scheduleContent(
    options: SocialShareOptions,
    scheduledAt: Date
  ): Promise<string> {
    const jobId = `schedule-${Date.now()}`;
    
    // Calculate cron expression from date
    const cronExpression = this.dateToCron(scheduledAt);
    
    const task = cron.schedule(cronExpression, async () => {
      await this.shareContent(options);
      this.scheduledPosts.delete(jobId);
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.scheduledPosts.set(jobId, task);
    return jobId;
  }

  /**
   * Cancel scheduled post
   */
  cancelScheduledPost(jobId: string): boolean {
    const task = this.scheduledPosts.get(jobId);
    if (task) {
      task.stop();
      this.scheduledPosts.delete(jobId);
      return true;
    }
    return false;
  }

  /**
   * Share on specific platform
   */
  private async shareOnPlatform(
    platform: SocialPlatform,
    options: SocialShareOptions
  ): Promise<string> {
    const content = this.formatContentForPlatform(platform, options);

    switch (platform) {
      case 'twitter':
        const twitter = getTwitterIntegration();
        return await twitter.postUpdate(content);

      case 'reddit':
        const reddit = getRedditIntegration();
        return await reddit.submitPost(
          'fantasyfootball',
          options.content,
          content
        );

      case 'discord':
        // Discord posting would be to specific channels
        const discord = getDiscordIntegration();
        // Implementation depends on your Discord setup
        return 'discord-post-id';

      case 'instagram':
        if (options.mediaUrl) {
          const instagram = await getInstagramIntegration();
          return await instagram.postPhoto(
            options.mediaUrl,
            content,
            options.hashtags || []
          );
        }
        throw new Error('Instagram requires media');

      case 'tiktok':
        if (options.mediaUrl) {
          const tiktok = getTikTokIntegration();
          // Mock implementation for now
          return 'tiktok-post-id';
        }
        throw new Error('TikTok requires media');

      default:
        throw new Error(`Platform ${platform} not supported`);
    }
  }

  /**
   * Format content for each platform
   */
  private formatContentForPlatform(
    platform: SocialPlatform,
    options: SocialShareOptions
  ): string {
    const { content, hashtags = [], mentions = [] } = options;
    
    switch (platform) {
      case 'twitter':
        // Twitter has 280 character limit
        const twitterHashtags = hashtags.map(tag => `#${tag}`).join(' ');
        const twitterMentions = mentions.map(m => `@${m}`).join(' ');
        const twitterContent = `${content} ${twitterMentions} ${twitterHashtags}`.trim();
        return twitterContent.length > 280 ? 
          twitterContent.substring(0, 277) + '...' : 
          twitterContent;

      case 'reddit':
        // Reddit doesn't use hashtags
        return content;

      case 'instagram':
      case 'tiktok':
        // Instagram and TikTok love hashtags
        const tags = hashtags.map(tag => `#${tag}`).join(' ');
        return `${content}\n\n${tags}`;

      default:
        return content;
    }
  }

  /**
   * Convert date to cron expression
   */
  private dateToCron(date: Date): string {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = '*';

    return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }
}

/**
 * Automated content generation
 */
export class ContentGenerator {
  /**
   * Generate lineup announcement
   */
  generateLineupPost(lineup: {
    teamName: string;
    week: number;
    players: { position: string; name: string; opponent: string }[];
  }): SocialShareOptions {
    const content = `🏈 ${lineup.teamName} Week ${lineup.week} Lineup:\n\n` +
      lineup.players.map(p => `${p.position}: ${p.name} vs ${p.opponent}`).join('\n');

    return {
      platforms: ['twitter', 'discord'],
      content,
      hashtags: ['FantasyFootball', `Week${lineup.week}`, 'LineupSet'],
      mentions: []
    };
  }

  /**
   * Generate trade announcement
   */
  generateTradePost(trade: {
    teamA: string;
    teamB: string;
    playersFromA: string[];
    playersFromB: string[];
  }): SocialShareOptions {
    const content = `🔄 TRADE ALERT!\n\n` +
      `${trade.teamA} receives: ${trade.playersFromB.join(', ')}\n` +
      `${trade.teamB} receives: ${trade.playersFromA.join(', ')}\n\n` +
      `Who won this trade? 🤔`;

    return {
      platforms: ['twitter', 'reddit', 'discord'],
      content,
      hashtags: ['FantasyTrade', 'TradeAlert', 'FantasyFootball'],
      mentions: []
    };
  }

  /**
   * Generate waiver pickup post
   */
  generateWaiverPost(pickups: {
    added: { player: string; faab?: number }[];
    dropped: string[];
  }): SocialShareOptions {
    let content = `📋 Waiver Wire Results:\n\n`;
    
    content += `✅ Added:\n`;
    pickups.added.forEach(add => {
      content += add.faab ? 
        `${add.player} ($${add.faab} FAAB)\n` : 
        `${add.player}\n`;
    });

    if (pickups.dropped.length > 0) {
      content += `\n❌ Dropped:\n`;
      content += pickups.dropped.join('\n');
    }

    return {
      platforms: ['twitter', 'discord'],
      content,
      hashtags: ['WaiverWire', 'FantasyFootball', 'FAAB'],
      mentions: []
    };
  }

  /**
   * Generate injury update post
   */
  generateInjuryPost(injury: {
    player: string;
    team: string;
    status: string;
    details: string;
  }): SocialShareOptions {
    const emoji = injury.status === 'OUT' ? '🚨' : 
                  injury.status === 'QUESTIONABLE' ? '⚠️' : '✅';

    const content = `${emoji} INJURY UPDATE: ${injury.player} (${injury.team})\n\n` +
      `Status: ${injury.status}\n` +
      `${injury.details}`;

    return {
      platforms: ['twitter', 'discord'],
      content,
      hashtags: ['InjuryUpdate', 'FantasyFootball', injury.team],
      mentions: []
    };
  }

  /**
   * Generate victory post
   */
  generateVictoryPost(result: {
    winner: string;
    loser: string;
    winnerScore: number;
    loserScore: number;
    topPerformer: { name: string; points: number };
  }): SocialShareOptions {
    const content = `🏆 VICTORY!\n\n` +
      `${result.winner} defeats ${result.loser}\n` +
      `${result.winnerScore} - ${result.loserScore}\n\n` +
      `MVP: ${result.topPerformer.name} (${result.topPerformer.points} pts) 🌟`;

    return {
      platforms: ['twitter', 'discord'],
      content,
      hashtags: ['FantasyFootball', 'Victory', 'FantasyWin'],
      mentions: []
    };
  }
}

// Singleton instances
let sharingService: SocialSharingService | null = null;
let contentGenerator: ContentGenerator | null = null;

export function getSocialSharingService(): SocialSharingService {
  if (!sharingService) {
    sharingService = new SocialSharingService();
  }
  return sharingService;
}

export function getContentGenerator(): ContentGenerator {
  if (!contentGenerator) {
    contentGenerator = new ContentGenerator();
  }
  return contentGenerator;
}