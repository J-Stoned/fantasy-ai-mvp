"use client";

import { EventEmitter } from 'events';

export interface SocialSentimentData {
  playerId: string;
  timestamp: number;
  platform: 'twitter' | 'instagram' | 'tiktok' | 'reddit' | 'youtube';
  
  // Sentiment Metrics
  overallSentiment: number; // -100 to 100
  emotionalIntensity: number; // 0-100
  confidenceScore: number; // 0-100
  
  // Engagement Metrics
  mentions: number;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  impressions: number;
  
  // Content Analysis
  topics: string[];
  keywords: string[];
  hashtags: string[];
  emoticons: string[];
  
  // Influence Metrics
  influencerMentions: number;
  verifiedAccountMentions: number;
  mediaOutletCoverage: number;
  fanClubActivity: number;
  
  // Performance Correlation
  performanceImpact: number; // -100 to 100
  marketMovement: number; // fantasy value change
  publicPerception: 'positive' | 'negative' | 'neutral';
  
  // Trending Analysis
  velocityScore: number; // rate of mention increase
  viralPotential: number; // 0-100
  peakReached: boolean;
  trendingHashtags: string[];
}

export interface PlayerMomentumIndicator {
  playerId: string;
  playerName: string;
  
  // Social Momentum
  socialScore: number; // 0-100
  trendDirection: 'rising' | 'falling' | 'stable';
  velocityChange: number; // % change in velocity
  
  // Fan Engagement
  fanSentiment: number; // -100 to 100
  fanEngagement: number; // 0-100
  fanGrowth: number; // new followers/mentions
  
  // Market Intelligence
  fantasyDemand: number; // 0-100
  tradeValue: number; // perceived value
  ownershipTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Predictive Indicators
  performancePrediction: number; // expected fantasy points
  breakoutPotential: number; // 0-100
  bustRisk: number; // 0-100
  
  // Content Triggers
  triggerEvents: Array<{
    event: string;
    impact: number;
    timestamp: Date;
    sentiment: number;
  }>;
  
  generatedAt: Date;
}

export interface InfluencerImpact {
  influencerId: string;
  influencerName: string;
  platform: string;
  followers: number;
  verificationStatus: boolean;
  
  // Content Analysis
  postContent: string;
  postType: 'analysis' | 'prediction' | 'news' | 'opinion';
  playersmentioned: string[];
  sentiment: number;
  
  // Engagement Metrics
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  
  // Historical Accuracy
  predictionAccuracy: number; // 0-100
  fantasyImpact: number; // historical impact on player values
  followingInFantasy: number; // fantasy players who follow
  
  // Market Movement
  postImpact: number; // price movement after post
  responseTime: number; // minutes to market reaction
  decayTime: number; // minutes for impact to fade
  
  timestamp: Date;
}

export interface TrendingTopic {
  topicId: string;
  topic: string;
  category: 'injury' | 'trade' | 'performance' | 'controversy' | 'personal';
  
  // Trend Metrics
  mentionVolume: number;
  growthRate: number; // % change in mentions
  peakMentions: number;
  trendDuration: number; // minutes trending
  
  // Related Entities
  playersInvolved: string[];
  teamsInvolved: string[];
  keyHashtags: string[];
  
  // Sentiment Distribution
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  controversyLevel: number; // 0-100
  
  // Geographic Spread
  topRegions: Array<{
    region: string;
    mentions: number;
    sentiment: number;
  }>;
  
  // Prediction Impact
  fantasyRelevance: number; // 0-100
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  
  firstDetected: Date;
  lastUpdated: Date;
}

export interface CrossPlatformAnalysis {
  playerId: string;
  timeFrame: 'hour' | 'day' | 'week' | 'month';
  
  // Platform Breakdown
  platformMetrics: Record<string, {
    mentions: number;
    sentiment: number;
    engagement: number;
    reach: number;
    dominantSentiment: string;
  }>;
  
  // Audience Demographics
  demographics: {
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
    fantasyParticipation: number; // % who play fantasy
  };
  
  // Content Types
  contentAnalysis: {
    highlights: number;
    news: number;
    memes: number;
    analysis: number;
    predictions: number;
    personal: number;
  };
  
  // Influencer Network
  keyInfluencers: InfluencerImpact[];
  networkReach: number;
  amplificationFactor: number; // how much influencers amplify mentions
  
  // Competitive Comparison
  peerComparison: Array<{
    playerId: string;
    playerName: string;
    relativePopularity: number;
    sentimentGap: number;
  }>;
}

export class SocialIntelligenceService extends EventEmitter {
  private sentimentData: Map<string, SocialSentimentData[]> = new Map();
  private momentumIndicators: Map<string, PlayerMomentumIndicator> = new Map();
  private influencerData: Map<string, InfluencerImpact[]> = new Map();
  private trendingTopics: Map<string, TrendingTopic> = new Map();
  private crossPlatformCache: Map<string, CrossPlatformAnalysis> = new Map();
  
  private apiEndpoints = {
    twitter: { apiKey: '', endpoint: 'https://api.twitter.com/2/' },
    reddit: { apiKey: '', endpoint: 'https://oauth.reddit.com/api/v1/' },
    instagram: { apiKey: '', endpoint: 'https://graph.instagram.com/v18.0/' },
    tiktok: { apiKey: '', endpoint: 'https://open-api.tiktok.com/v1/' },
    youtube: { apiKey: '', endpoint: 'https://www.googleapis.com/youtube/v3/' }
  };
  
  private sentimentModel = {
    positiveKeywords: [
      'amazing', 'incredible', 'beast', 'elite', 'clutch', 'dominant', 'explosive',
      'monster', 'phenomenal', 'unstoppable', 'legendary', 'goat', 'mvp'
    ],
    negativeKeywords: [
      'terrible', 'awful', 'trash', 'bust', 'overrated', 'disappointing', 'injured',
      'declining', 'washed', 'liability', 'benchwarmer', 'dropped'
    ],
    contextModifiers: [
      'fantasy', 'start', 'sit', 'trade', 'drop', 'pickup', 'sleeper', 'avoid'
    ]
  };

  constructor() {
    super();
    this.initializeSocialMonitoring();
    this.startRealTimeProcessing();
  }

  private initializeSocialMonitoring() {
    console.log('Initializing social media monitoring APIs');
    this.generateMockData();
  }

  private startRealTimeProcessing() {
    // Process social data every 30 seconds
    setInterval(() => {
      this.processSocialMentions();
      this.updateMomentumIndicators();
      this.detectTrendingTopics();
    }, 30000);
    
    // Update influencer impact every 5 minutes
    setInterval(() => {
      this.analyzeInfluencerImpact();
    }, 300000);
  }

  async getPlayerMomentum(playerId: string): Promise<PlayerMomentumIndicator | null> {
    return this.momentumIndicators.get(playerId) || null;
  }

  async getTopMomentumPlayers(count: number = 10): Promise<PlayerMomentumIndicator[]> {
    return Array.from(this.momentumIndicators.values())
      .sort((a, b) => b.socialScore - a.socialScore)
      .slice(0, count);
  }

  async getSentimentAnalysis(playerId: string, timeRange?: {
    start: Date;
    end: Date;
  }): Promise<SocialSentimentData[]> {
    let data = this.sentimentData.get(playerId) || [];
    
    if (timeRange) {
      data = data.filter(d => 
        d.timestamp >= timeRange.start.getTime() && 
        d.timestamp <= timeRange.end.getTime()
      );
    }
    
    return data.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getTrendingTopics(category?: string): Promise<TrendingTopic[]> {
    let topics = Array.from(this.trendingTopics.values());
    
    if (category) {
      topics = topics.filter(t => t.category === category);
    }
    
    return topics
      .sort((a, b) => b.mentionVolume - a.mentionVolume)
      .slice(0, 20);
  }

  async getInfluencerImpact(playerId: string): Promise<InfluencerImpact[]> {
    return this.influencerData.get(playerId) || [];
  }

  async generateCrossPlatformAnalysis(
    playerId: string, 
    timeFrame: 'hour' | 'day' | 'week' | 'month'
  ): Promise<CrossPlatformAnalysis> {
    const cacheKey = `${playerId}_${timeFrame}`;
    
    if (this.crossPlatformCache.has(cacheKey)) {
      return this.crossPlatformCache.get(cacheKey)!;
    }

    const sentimentData = await this.getSentimentAnalysis(playerId, this.getTimeRange(timeFrame));
    const influencerData = await this.getInfluencerImpact(playerId);
    
    const analysis = this.buildCrossPlatformAnalysis(playerId, timeFrame, sentimentData, influencerData);
    
    this.crossPlatformCache.set(cacheKey, analysis);
    
    // Cache for 15 minutes
    setTimeout(() => {
      this.crossPlatformCache.delete(cacheKey);
    }, 15 * 60 * 1000);
    
    return analysis;
  }

  async detectBreakingNews(playerId?: string): Promise<Array<{
    topic: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    impact: string[];
    sentiment: number;
    confidence: number;
    timestamp: Date;
  }>> {
    const recentTopics = Array.from(this.trendingTopics.values())
      .filter(t => Date.now() - t.lastUpdated.getTime() < 30 * 60 * 1000); // Last 30 minutes
    
    if (playerId) {
      return recentTopics
        .filter(t => t.playersInvolved.includes(playerId))
        .map(t => ({
          topic: t.topic,
          urgency: t.urgencyLevel,
          impact: [`Fantasy relevance: ${t.fantasyRelevance}%`],
          sentiment: (t.positiveMentions - t.negativeMentions) / t.mentionVolume * 100,
          confidence: Math.min(95, t.mentionVolume / 10),
          timestamp: t.lastUpdated
        }));
    }
    
    return recentTopics
      .filter(t => t.urgencyLevel !== 'low')
      .map(t => ({
        topic: t.topic,
        urgency: t.urgencyLevel,
        impact: t.playersInvolved.map(p => `Player: ${p}`),
        sentiment: (t.positiveMentions - t.negativeMentions) / t.mentionVolume * 100,
        confidence: Math.min(95, t.mentionVolume / 10),
        timestamp: t.lastUpdated
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  async predictPerformanceFromSentiment(playerId: string): Promise<{
    projectedImpact: number; // -50 to +50 fantasy points
    confidence: number;
    factors: string[];
    historicalAccuracy: number;
  }> {
    const momentum = await this.getPlayerMomentum(playerId);
    const recentSentiment = await this.getSentimentAnalysis(playerId, {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    });
    
    if (!momentum || recentSentiment.length === 0) {
      return {
        projectedImpact: 0,
        confidence: 0,
        factors: ['Insufficient data'],
        historicalAccuracy: 0
      };
    }
    
    // Calculate sentiment-performance correlation
    const avgSentiment = recentSentiment.reduce((sum, d) => sum + d.overallSentiment, 0) / recentSentiment.length;
    const sentimentVelocity = this.calculateSentimentVelocity(recentSentiment);
    const influencerBoost = momentum.triggerEvents
      .filter(e => e.impact > 50)
      .reduce((sum, e) => sum + e.impact, 0) / 100;
    
    // Fantasy impact formula (simplified)
    let projectedImpact = 0;
    
    // Positive sentiment boost
    if (avgSentiment > 20) {
      projectedImpact += Math.min(15, avgSentiment / 10);
    }
    
    // Negative sentiment penalty
    if (avgSentiment < -20) {
      projectedImpact += Math.max(-10, avgSentiment / 15);
    }
    
    // Velocity bonus/penalty
    projectedImpact += sentimentVelocity / 10;
    
    // Influencer impact
    projectedImpact += influencerBoost;
    
    const factors = [];
    if (avgSentiment > 20) factors.push('Strong positive sentiment');
    if (avgSentiment < -20) factors.push('Negative sentiment concerns');
    if (sentimentVelocity > 50) factors.push('Rapidly improving perception');
    if (influencerBoost > 5) factors.push('High-profile endorsements');
    
    return {
      projectedImpact: Math.max(-50, Math.min(50, projectedImpact)),
      confidence: Math.min(85, 40 + recentSentiment.length),
      factors,
      historicalAccuracy: 73 // Mock historical accuracy
    };
  }

  async getCompetitorSentimentComparison(playerIds: string[]): Promise<Array<{
    playerId: string;
    playerName: string;
    sentimentScore: number;
    rank: number;
    weeklyChange: number;
    keyStrengths: string[];
    keyWeaknesses: string[];
  }>> {
    const comparisons = [];
    
    for (const playerId of playerIds) {
      const momentum = await this.getPlayerMomentum(playerId);
      const sentimentData = await this.getSentimentAnalysis(playerId, {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      });
      
      if (momentum) {
        comparisons.push({
          playerId,
          playerName: momentum.playerName,
          sentimentScore: momentum.fanSentiment,
          rank: 0, // Will be calculated after sorting
          weeklyChange: momentum.velocityChange,
          keyStrengths: this.extractPositiveKeywords(sentimentData),
          keyWeaknesses: this.extractNegativeKeywords(sentimentData)
        });
      }
    }
    
    // Sort by sentiment score and assign ranks
    comparisons.sort((a, b) => b.sentimentScore - a.sentimentScore);
    comparisons.forEach((comp, index) => {
      comp.rank = index + 1;
    });
    
    return comparisons;
  }

  private processSocialMentions() {
    // Mock real-time social media processing
    const mockPlayers = ['player_josh_allen', 'player_lamar_jackson', 'player_josh_jacobs'];
    
    mockPlayers.forEach(playerId => {
      const sentimentData: SocialSentimentData = {
        playerId,
        timestamp: Date.now(),
        platform: 'twitter',
        overallSentiment: Math.floor(Math.random() * 200) - 100,
        emotionalIntensity: Math.floor(Math.random() * 100),
        confidenceScore: Math.floor(Math.random() * 40) + 60,
        mentions: Math.floor(Math.random() * 1000) + 100,
        likes: Math.floor(Math.random() * 5000) + 500,
        shares: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 500) + 50,
        reach: Math.floor(Math.random() * 50000) + 10000,
        impressions: Math.floor(Math.random() * 100000) + 25000,
        topics: ['performance', 'fantasy', 'NFL'],
        keywords: ['touchdown', 'fantasy', 'start'],
        hashtags: ['#NFL', '#Fantasy', '#StartEmSitEm'],
        emoticons: ['🔥', '💪', '⚡'],
        influencerMentions: Math.floor(Math.random() * 10),
        verifiedAccountMentions: Math.floor(Math.random() * 5),
        mediaOutletCoverage: Math.floor(Math.random() * 3),
        fanClubActivity: Math.floor(Math.random() * 50),
        performanceImpact: Math.floor(Math.random() * 40) - 20,
        marketMovement: Math.floor(Math.random() * 10) - 5,
        publicPerception: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral',
        velocityScore: Math.floor(Math.random() * 100),
        viralPotential: Math.floor(Math.random() * 100),
        peakReached: Math.random() > 0.7,
        trendingHashtags: ['#FantasyFootball', '#NFL']
      };
      
      const existing = this.sentimentData.get(playerId) || [];
      existing.push(sentimentData);
      
      // Keep only last 1000 entries
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      this.sentimentData.set(playerId, existing);
    });
    
    this.emit('sentimentUpdated', { timestamp: Date.now() });
  }

  private updateMomentumIndicators() {
    const mockPlayers = [
      { id: 'player_josh_allen', name: 'Josh Allen' },
      { id: 'player_lamar_jackson', name: 'Lamar Jackson' },
      { id: 'player_josh_jacobs', name: 'Josh Jacobs' }
    ];
    
    mockPlayers.forEach(player => {
      const momentum: PlayerMomentumIndicator = {
        playerId: player.id,
        playerName: player.name,
        socialScore: Math.floor(Math.random() * 100),
        trendDirection: Math.random() > 0.6 ? 'rising' : Math.random() > 0.3 ? 'falling' : 'stable',
        velocityChange: Math.floor(Math.random() * 40) - 20,
        fanSentiment: Math.floor(Math.random() * 200) - 100,
        fanEngagement: Math.floor(Math.random() * 100),
        fanGrowth: Math.floor(Math.random() * 1000),
        fantasyDemand: Math.floor(Math.random() * 100),
        tradeValue: Math.floor(Math.random() * 100),
        ownershipTrend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable',
        performancePrediction: Math.floor(Math.random() * 30) + 10,
        breakoutPotential: Math.floor(Math.random() * 100),
        bustRisk: Math.floor(Math.random() * 100),
        triggerEvents: [
          {
            event: 'Great performance highlight',
            impact: Math.floor(Math.random() * 50) + 25,
            timestamp: new Date(),
            sentiment: Math.floor(Math.random() * 100) + 50
          }
        ],
        generatedAt: new Date()
      };
      
      this.momentumIndicators.set(player.id, momentum);
    });
  }

  private detectTrendingTopics() {
    const mockTopics: TrendingTopic[] = [
      {
        topicId: 'topic_injury_update',
        topic: 'Josh Allen injury update',
        category: 'injury',
        mentionVolume: Math.floor(Math.random() * 10000) + 1000,
        growthRate: Math.floor(Math.random() * 200) + 50,
        peakMentions: Math.floor(Math.random() * 15000) + 5000,
        trendDuration: Math.floor(Math.random() * 120) + 30,
        playersInvolved: ['player_josh_allen'],
        teamsInvolved: ['BUF'],
        keyHashtags: ['#JoshAllen', '#Bills', '#InjuryUpdate'],
        positiveMentions: Math.floor(Math.random() * 3000) + 1000,
        negativeMentions: Math.floor(Math.random() * 2000) + 500,
        neutralMentions: Math.floor(Math.random() * 5000) + 2000,
        controversyLevel: Math.floor(Math.random() * 30),
        topRegions: [
          { region: 'Buffalo', mentions: 2500, sentiment: 75 },
          { region: 'New York', mentions: 1800, sentiment: 65 }
        ],
        fantasyRelevance: Math.floor(Math.random() * 40) + 60,
        urgencyLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        actionRequired: Math.random() > 0.6,
        firstDetected: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
        lastUpdated: new Date()
      }
    ];
    
    mockTopics.forEach(topic => {
      this.trendingTopics.set(topic.topicId, topic);
    });
  }

  private analyzeInfluencerImpact() {
    const mockInfluencers: InfluencerImpact[] = [
      {
        influencerId: 'matthew_berry',
        influencerName: 'Matthew Berry',
        platform: 'twitter',
        followers: 1200000,
        verificationStatus: true,
        postContent: 'Josh Allen is my #1 QB this week. The matchup is perfect.',
        postType: 'prediction',
        playersmentioned: ['player_josh_allen'],
        sentiment: 85,
        likes: Math.floor(Math.random() * 5000) + 1000,
        shares: Math.floor(Math.random() * 1000) + 200,
        comments: Math.floor(Math.random() * 500) + 100,
        reach: Math.floor(Math.random() * 100000) + 50000,
        predictionAccuracy: 74,
        fantasyImpact: 8.5,
        followingInFantasy: 850000,
        postImpact: Math.floor(Math.random() * 15) + 5,
        responseTime: Math.floor(Math.random() * 30) + 5,
        decayTime: Math.floor(Math.random() * 120) + 60,
        timestamp: new Date()
      }
    ];
    
    mockInfluencers.forEach(influencer => {
      influencer.playersmentioned.forEach(playerId => {
        const existing = this.influencerData.get(playerId) || [];
        existing.push(influencer);
        
        // Keep only last 100 entries per player
        if (existing.length > 100) {
          existing.splice(0, existing.length - 100);
        }
        
        this.influencerData.set(playerId, existing);
      });
    });
  }

  private generateMockData() {
    // Generate initial mock data for demonstration
    this.updateMomentumIndicators();
    this.detectTrendingTopics();
    this.analyzeInfluencerImpact();
  }

  private getTimeRange(timeFrame: string): { start: Date; end: Date } {
    const now = new Date();
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    return {
      start: new Date(now.getTime() - ranges[timeFrame as keyof typeof ranges]),
      end: now
    };
  }

  private buildCrossPlatformAnalysis(
    playerId: string,
    timeFrame: string,
    sentimentData: SocialSentimentData[],
    influencerData: InfluencerImpact[]
  ): CrossPlatformAnalysis {
    // Group data by platform
    const platformData = sentimentData.reduce((acc, data) => {
      if (!acc[data.platform]) {
        acc[data.platform] = [];
      }
      acc[data.platform].push(data);
      return acc;
    }, {} as Record<string, SocialSentimentData[]>);
    
    // Calculate platform metrics
    const platformMetrics: Record<string, any> = {};
    Object.entries(platformData).forEach(([platform, data]) => {
      platformMetrics[platform] = {
        mentions: data.reduce((sum, d) => sum + d.mentions, 0),
        sentiment: data.reduce((sum, d) => sum + d.overallSentiment, 0) / data.length,
        engagement: data.reduce((sum, d) => sum + d.likes + d.shares + d.comments, 0),
        reach: data.reduce((sum, d) => sum + d.reach, 0),
        dominantSentiment: data.length > 0 ? (data.reduce((sum, d) => sum + d.overallSentiment, 0) / data.length > 0 ? 'positive' : 'negative') : 'neutral'
      };
    });
    
    return {
      playerId,
      timeFrame: timeFrame as any,
      platformMetrics,
      demographics: {
        ageDistribution: { '18-24': 25, '25-34': 35, '35-44': 25, '45+': 15 },
        genderDistribution: { 'male': 70, 'female': 25, 'other': 5 },
        locationDistribution: { 'US': 75, 'Canada': 10, 'UK': 8, 'Other': 7 },
        fantasyParticipation: 82
      },
      contentAnalysis: {
        highlights: Math.floor(Math.random() * 100) + 50,
        news: Math.floor(Math.random() * 50) + 25,
        memes: Math.floor(Math.random() * 75) + 25,
        analysis: Math.floor(Math.random() * 60) + 30,
        predictions: Math.floor(Math.random() * 40) + 20,
        personal: Math.floor(Math.random() * 30) + 10
      },
      keyInfluencers: influencerData.slice(0, 5),
      networkReach: influencerData.reduce((sum, inf) => sum + inf.reach, 0),
      amplificationFactor: 2.3,
      peerComparison: [
        { playerId: 'player_lamar_jackson', playerName: 'Lamar Jackson', relativePopularity: 85, sentimentGap: 12 },
        { playerId: 'player_patrick_mahomes', playerName: 'Patrick Mahomes', relativePopularity: 120, sentimentGap: -8 }
      ]
    };
  }

  private calculateSentimentVelocity(data: SocialSentimentData[]): number {
    if (data.length < 2) return 0;
    
    const sorted = data.sort((a, b) => a.timestamp - b.timestamp);
    const recent = sorted.slice(-Math.ceil(sorted.length / 2));
    const older = sorted.slice(0, Math.floor(sorted.length / 2));
    
    const recentAvg = recent.reduce((sum, d) => sum + d.overallSentiment, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.overallSentiment, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  private extractPositiveKeywords(data: SocialSentimentData[]): string[] {
    const keywords = data.flatMap(d => d.keywords);
    const positive = keywords.filter(k => 
      this.sentimentModel.positiveKeywords.some(pos => k.toLowerCase().includes(pos))
    );
    
    return [...new Set(positive)].slice(0, 5);
  }

  private extractNegativeKeywords(data: SocialSentimentData[]): string[] {
    const keywords = data.flatMap(d => d.keywords);
    const negative = keywords.filter(k => 
      this.sentimentModel.negativeKeywords.some(neg => k.toLowerCase().includes(neg))
    );
    
    return [...new Set(negative)].slice(0, 5);
  }

  // Public API methods
  async startSocialMonitoring(playerIds: string[]): Promise<void> {
    console.log(`Starting social monitoring for ${playerIds.length} players`);
    this.emit('monitoringStarted', { playerIds });
  }

  async getSocialAlerts(urgencyLevel: 'low' | 'medium' | 'high' | 'critical'): Promise<Array<{
    playerId: string;
    alert: string;
    urgency: string;
    timestamp: Date;
  }>> {
    const alerts = [];
    const topics = await this.getTrendingTopics();
    
    for (const topic of topics) {
      if (topic.urgencyLevel === urgencyLevel || urgencyLevel === 'low') {
        for (const playerId of topic.playersInvolved) {
          alerts.push({
            playerId,
            alert: topic.topic,
            urgency: topic.urgencyLevel,
            timestamp: topic.lastUpdated
          });
        }
      }
    }
    
    return alerts.slice(0, 20);
  }
}

export const socialIntelligenceService = new SocialIntelligenceService();