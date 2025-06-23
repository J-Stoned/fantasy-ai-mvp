/**
 * Social Sentiment Analysis
 * Analyze sentiment for players across social media
 */

import { SentimentAnalysis, SocialPost } from '../types';

// Simple sentiment analysis using keyword matching
// In production, use a proper NLP service like AWS Comprehend or Google NLP
const POSITIVE_KEYWORDS = [
  'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'good',
  'love', 'perfect', 'wonderful', 'best', 'win', 'victory',
  'beast', 'goat', 'elite', 'dominant', 'clutch', 'fire',
  'healthy', 'returning', 'cleared', 'active', 'starting'
];

const NEGATIVE_KEYWORDS = [
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
  'injury', 'injured', 'out', 'questionable', 'doubtful',
  'benched', 'suspended', 'struggling', 'bust', 'avoid',
  'concern', 'worried', 'risky', 'limited', 'setback'
];

const NEUTRAL_KEYWORDS = [
  'okay', 'fine', 'average', 'decent', 'normal', 'standard',
  'maybe', 'possibly', 'could', 'might', 'expected'
];

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  const lowerText = text.toLowerCase();
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  const keywords: string[] = [];
  
  // Count keyword occurrences
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveScore++;
      keywords.push(keyword);
    }
  });
  
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeScore++;
      keywords.push(keyword);
    }
  });
  
  NEUTRAL_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      neutralScore++;
      keywords.push(keyword);
    }
  });
  
  // Calculate total and normalize
  const total = positiveScore + negativeScore + neutralScore || 1;
  const score = (positiveScore - negativeScore) / total;
  
  // Determine label
  let label: 'positive' | 'negative' | 'neutral' | 'mixed';
  if (score > 0.3) {
    label = 'positive';
  } else if (score < -0.3) {
    label = 'negative';
  } else if (positiveScore > 0 && negativeScore > 0) {
    label = 'mixed';
  } else {
    label = 'neutral';
  }
  
  // Extract topics
  const topics = extractTopics(text);
  
  return {
    score: Math.max(-1, Math.min(1, score)),
    label,
    confidence: Math.min(0.9, total / 10), // Simple confidence based on keyword count
    keywords: keywords.slice(0, 5),
    topics
  };
}

/**
 * Extract topics from text
 */
function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Fantasy-related topics
  if (lowerText.includes('lineup') || lowerText.includes('start')) {
    topics.push('lineup');
  }
  if (lowerText.includes('trade')) {
    topics.push('trade');
  }
  if (lowerText.includes('waiver') || lowerText.includes('pickup')) {
    topics.push('waiver');
  }
  if (lowerText.includes('injury') || lowerText.includes('injured')) {
    topics.push('injury');
  }
  if (lowerText.includes('matchup')) {
    topics.push('matchup');
  }
  if (lowerText.includes('projection') || lowerText.includes('predict')) {
    topics.push('projection');
  }
  
  return topics;
}

/**
 * Aggregate sentiment across multiple posts
 */
export function aggregateSentiment(posts: SocialPost[]): {
  overall: SentimentAnalysis;
  byPlatform: Record<string, SentimentAnalysis>;
  timeline: { date: Date; sentiment: number }[];
} {
  // Overall sentiment
  let totalScore = 0;
  let totalConfidence = 0;
  const allKeywords: string[] = [];
  const allTopics: string[] = [];
  
  posts.forEach(post => {
    if (post.sentiment) {
      totalScore += post.sentiment.score * post.sentiment.confidence;
      totalConfidence += post.sentiment.confidence;
      allKeywords.push(...post.sentiment.keywords);
      allTopics.push(...post.sentiment.topics);
    }
  });
  
  const avgScore = totalConfidence > 0 ? totalScore / totalConfidence : 0;
  const avgConfidence = totalConfidence / posts.length;
  
  // By platform
  const byPlatform: Record<string, SentimentAnalysis> = {};
  const platformGroups = groupBy(posts, 'platform');
  
  Object.entries(platformGroups).forEach(([platform, platformPosts]) => {
    let platformScore = 0;
    let platformConfidence = 0;
    
    platformPosts.forEach(post => {
      if (post.sentiment) {
        platformScore += post.sentiment.score * post.sentiment.confidence;
        platformConfidence += post.sentiment.confidence;
      }
    });
    
    byPlatform[platform] = {
      score: platformConfidence > 0 ? platformScore / platformConfidence : 0,
      label: getLabel(platformScore / platformConfidence),
      confidence: platformConfidence / platformPosts.length,
      keywords: [],
      topics: []
    };
  });
  
  // Timeline
  const timeline = posts
    .filter(post => post.sentiment)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(post => ({
      date: post.timestamp,
      sentiment: post.sentiment!.score
    }));
  
  return {
    overall: {
      score: avgScore,
      label: getLabel(avgScore),
      confidence: avgConfidence,
      keywords: getTopItems(allKeywords, 5),
      topics: getTopItems(allTopics, 5)
    },
    byPlatform,
    timeline
  };
}

/**
 * Get sentiment label from score
 */
function getLabel(score: number): 'positive' | 'negative' | 'neutral' | 'mixed' {
  if (score > 0.3) return 'positive';
  if (score < -0.3) return 'negative';
  return 'neutral';
}

/**
 * Group array by property
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Get top occurring items
 */
function getTopItems(items: string[], limit: number): string[] {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([item]) => item);
}

/**
 * Analyze player sentiment trend
 */
export function analyzePlayerSentimentTrend(
  playerName: string,
  posts: SocialPost[]
): {
  current: number;
  change24h: number;
  change7d: number;
  trend: 'improving' | 'declining' | 'stable';
} {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Filter posts mentioning the player
  const playerPosts = posts.filter(post => 
    post.playerMentions?.some(mention => 
      mention.playerName.toLowerCase() === playerName.toLowerCase()
    )
  );
  
  // Calculate sentiment for different time periods
  const last24h = playerPosts.filter(p => p.timestamp > oneDayAgo);
  const last7d = playerPosts.filter(p => p.timestamp > sevenDaysAgo);
  const previous24h = playerPosts.filter(p => 
    p.timestamp > new Date(oneDayAgo.getTime() - 24 * 60 * 60 * 1000) &&
    p.timestamp <= oneDayAgo
  );
  
  const currentSentiment = calculateAverageSentiment(last24h);
  const previousSentiment = calculateAverageSentiment(previous24h);
  const weekSentiment = calculateAverageSentiment(last7d);
  
  const change24h = currentSentiment - previousSentiment;
  const change7d = currentSentiment - weekSentiment;
  
  let trend: 'improving' | 'declining' | 'stable';
  if (change24h > 0.1 && change7d > 0.1) {
    trend = 'improving';
  } else if (change24h < -0.1 && change7d < -0.1) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }
  
  return {
    current: currentSentiment,
    change24h,
    change7d,
    trend
  };
}

/**
 * Calculate average sentiment score
 */
function calculateAverageSentiment(posts: SocialPost[]): number {
  if (posts.length === 0) return 0;
  
  const totalScore = posts.reduce((sum, post) => {
    return sum + (post.sentiment?.score || 0);
  }, 0);
  
  return totalScore / posts.length;
}