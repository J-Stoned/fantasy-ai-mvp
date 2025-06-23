/**
 * Social Media Utilities
 * Helper functions for social media integration
 */

import { PlayerMention } from '../types';

// Common player name patterns and variations
const PLAYER_NAME_PATTERNS = [
  // Full names
  /\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s(?:Jr\.|Sr\.|III|II|IV))?)\b/g,
  // Nicknames with last names
  /\b([A-Z][a-z]{1,3} [A-Z][a-z]+)\b/g,
  // First initial last name
  /\b([A-Z]\. [A-Z][a-z]+)\b/g
];

// Common team abbreviations
const TEAM_ABBREVIATIONS: Record<string, string> = {
  // NFL
  'ARI': 'Cardinals', 'ATL': 'Falcons', 'BAL': 'Ravens', 'BUF': 'Bills',
  'CAR': 'Panthers', 'CHI': 'Bears', 'CIN': 'Bengals', 'CLE': 'Browns',
  'DAL': 'Cowboys', 'DEN': 'Broncos', 'DET': 'Lions', 'GB': 'Packers',
  'HOU': 'Texans', 'IND': 'Colts', 'JAX': 'Jaguars', 'KC': 'Chiefs',
  'LV': 'Raiders', 'LAC': 'Chargers', 'LAR': 'Rams', 'MIA': 'Dolphins',
  'MIN': 'Vikings', 'NE': 'Patriots', 'NO': 'Saints', 'NYG': 'Giants',
  'NYJ': 'Jets', 'PHI': 'Eagles', 'PIT': 'Steelers', 'SF': '49ers',
  'SEA': 'Seahawks', 'TB': 'Buccaneers', 'TEN': 'Titans', 'WAS': 'Commanders',
  
  // NBA
  'ATL': 'Hawks', 'BOS': 'Celtics', 'BKN': 'Nets', 'CHA': 'Hornets',
  'CHI': 'Bulls', 'CLE': 'Cavaliers', 'DAL': 'Mavericks', 'DEN': 'Nuggets',
  'DET': 'Pistons', 'GSW': 'Warriors', 'HOU': 'Rockets', 'IND': 'Pacers',
  'LAC': 'Clippers', 'LAL': 'Lakers', 'MEM': 'Grizzlies', 'MIA': 'Heat',
  'MIL': 'Bucks', 'MIN': 'Timberwolves', 'NOP': 'Pelicans', 'NYK': 'Knicks',
  'OKC': 'Thunder', 'ORL': 'Magic', 'PHI': '76ers', 'PHX': 'Suns',
  'POR': 'Trail Blazers', 'SAC': 'Kings', 'SAS': 'Spurs', 'TOR': 'Raptors',
  'UTA': 'Jazz', 'WAS': 'Wizards'
};

/**
 * Extract player mentions from text
 */
export function extractPlayerMentions(text: string): PlayerMention[] {
  const mentions: PlayerMention[] = [];
  const processedNames = new Set<string>();

  PLAYER_NAME_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const playerName = match[1];
      
      // Skip if already processed
      if (processedNames.has(playerName.toLowerCase())) continue;
      processedNames.add(playerName.toLowerCase());

      // Try to extract team and position context
      const context = extractPlayerContext(text, playerName);
      
      mentions.push({
        playerId: '', // Would be matched against database
        playerName,
        team: context.team || '',
        position: context.position || '',
        confidence: calculateConfidence(playerName, context)
      });
    }
  });

  return mentions;
}

/**
 * Extract player context (team, position) from surrounding text
 */
function extractPlayerContext(
  text: string,
  playerName: string
): { team?: string; position?: string } {
  const context: { team?: string; position?: string } = {};
  
  // Look for team mentions near player name
  const nearbyText = extractNearbyText(text, playerName, 50);
  
  // Check for team abbreviations
  Object.entries(TEAM_ABBREVIATIONS).forEach(([abbr, team]) => {
    if (nearbyText.includes(abbr) || nearbyText.includes(team)) {
      context.team = team;
    }
  });

  // Check for position mentions
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST', 'PG', 'SG', 'SF', 'PF', 'C'];
  positions.forEach(pos => {
    if (nearbyText.includes(pos)) {
      context.position = pos;
    }
  });

  return context;
}

/**
 * Extract text near a specific phrase
 */
function extractNearbyText(text: string, phrase: string, radius: number): string {
  const index = text.indexOf(phrase);
  if (index === -1) return '';
  
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + phrase.length + radius);
  
  return text.substring(start, end);
}

/**
 * Calculate confidence score for player mention
 */
function calculateConfidence(
  playerName: string,
  context: { team?: string; position?: string }
): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence for full names
  if (playerName.split(' ').length >= 2) confidence += 0.2;
  
  // Increase confidence if team is mentioned
  if (context.team) confidence += 0.15;
  
  // Increase confidence if position is mentioned
  if (context.position) confidence += 0.15;
  
  return Math.min(1, confidence);
}

/**
 * Format number for social media display
 */
export function formatSocialNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Clean and validate hashtags
 */
export function cleanHashtags(hashtags: string[]): string[] {
  return hashtags
    .map(tag => tag.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(tag => tag.length > 0 && tag.length <= 100)
    .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1));
}

/**
 * Truncate text for social media
 */
export function truncateForPlatform(
  text: string,
  platform: string,
  includeEllipsis = true
): string {
  const limits: Record<string, number> = {
    twitter: 280,
    instagram: 2200,
    tiktok: 2200,
    discord: 2000,
    reddit: 40000
  };

  const limit = limits[platform] || 280;
  
  if (text.length <= limit) return text;
  
  const truncated = text.substring(0, limit - (includeEllipsis ? 3 : 0));
  return includeEllipsis ? `${truncated}...` : truncated;
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return text.match(urlPattern) || [];
}

/**
 * Generate social media preview
 */
export function generateSocialPreview(
  title: string,
  description: string,
  imageUrl?: string
): {
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  twitterCard: string;
} {
  return {
    ogTitle: truncateForPlatform(title, 'twitter', false),
    ogDescription: truncateForPlatform(description, 'instagram', false),
    ogImage: imageUrl,
    twitterCard: imageUrl ? 'summary_large_image' : 'summary'
  };
}

/**
 * Parse social media handle
 */
export function parseSocialHandle(handle: string): {
  platform?: string;
  username: string;
} {
  // Remove @ symbol
  handle = handle.replace('@', '');
  
  // Check if it's a full URL
  if (handle.includes('twitter.com/')) {
    return {
      platform: 'twitter',
      username: handle.split('twitter.com/')[1].split('/')[0]
    };
  } else if (handle.includes('instagram.com/')) {
    return {
      platform: 'instagram',
      username: handle.split('instagram.com/')[1].split('/')[0]
    };
  } else if (handle.includes('tiktok.com/@')) {
    return {
      platform: 'tiktok',
      username: handle.split('tiktok.com/@')[1].split('/')[0]
    };
  }
  
  // Return as-is if no platform detected
  return { username: handle };
}

/**
 * Generate share URL for platform
 */
export function generateShareUrl(
  platform: string,
  url: string,
  text?: string,
  hashtags?: string[]
): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = text ? encodeURIComponent(text) : '';
  const hashtagString = hashtags ? hashtags.join(',') : '';

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}&hashtags=${hashtagString}`;
    
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    
    case 'reddit':
      return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
    
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    
    default:
      return url;
  }
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(engagement: {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
}): number {
  const totalEngagement = engagement.likes + engagement.comments + engagement.shares;
  const reach = engagement.views || totalEngagement * 10; // Estimate if no views
  
  return reach > 0 ? (totalEngagement / reach) * 100 : 0;
}

/**
 * Get optimal posting time
 */
export function getOptimalPostingTime(platform: string): {
  day: string;
  hour: number;
} {
  // Based on general social media best practices
  const optimalTimes: Record<string, { day: string; hour: number }> = {
    twitter: { day: 'Wednesday', hour: 9 },
    instagram: { day: 'Wednesday', hour: 11 },
    facebook: { day: 'Thursday', hour: 13 },
    linkedin: { day: 'Tuesday', hour: 10 },
    tiktok: { day: 'Thursday', hour: 19 },
    reddit: { day: 'Monday', hour: 8 }
  };

  return optimalTimes[platform] || { day: 'Wednesday', hour: 12 };
}