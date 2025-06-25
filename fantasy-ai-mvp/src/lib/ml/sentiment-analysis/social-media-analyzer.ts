/**
 * Social Media Sentiment Analysis
 * Analyzes Twitter, Reddit, and news sentiment for fantasy insights
 */

import * as tf from '@tensorflow/tfjs';

export interface SentimentResult {
  score: number; // -1 to 1 (negative to positive)
  magnitude: number; // 0 to 1 (strength of sentiment)
  confidence: number; // 0 to 1
  topics: string[];
  entities: Array<{
    name: string;
    type: 'player' | 'team' | 'coach' | 'injury' | 'trade';
    sentiment: number;
  }>;
}

export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'news' | 'youtube';
  text: string;
  author: string;
  timestamp: Date;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  metadata?: {
    isVerified?: boolean;
    followerCount?: number;
    subreddit?: string;
  };
}

export interface PlayerSentimentTrend {
  playerId: string;
  playerName: string;
  overallSentiment: number;
  sentimentChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  topTopics: string[];
  keyInsights: string[];
  riskFactors: string[];
  consensusRating: 'buy' | 'hold' | 'sell';
}

export class SocialMediaSentimentAnalyzer {
  private static instance: SocialMediaSentimentAnalyzer;
  private sentimentModel: tf.LayersModel | null = null;
  private entityModel: tf.LayersModel | null = null;
  private topicModel: tf.LayersModel | null = null;
  private tokenizer: Map<string, number> = new Map();
  private isInitialized = false;
  
  // Sentiment lexicons
  private positiveLexicon = new Set([
    'beast', 'stud', 'elite', 'dominating', 'crushing', 'fire', 'goat',
    'locked', 'start', 'must-start', 'league-winner', 'breakout', 'boom'
  ]);
  
  private negativeLexicon = new Set([
    'bust', 'injury', 'benched', 'struggling', 'drop', 'avoid', 'fade',
    'concern', 'worried', 'regression', 'overrated', 'sit', 'terrible'
  ]);
  
  private constructor() {}
  
  static getInstance(): SocialMediaSentimentAnalyzer {
    if (!SocialMediaSentimentAnalyzer.instance) {
      SocialMediaSentimentAnalyzer.instance = new SocialMediaSentimentAnalyzer();
    }
    return SocialMediaSentimentAnalyzer.instance;
  }
  
  /**
   * Initialize sentiment analysis models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create models
      this.sentimentModel = await this.createSentimentModel();
      this.entityModel = await this.createEntityModel();
      this.topicModel = await this.createTopicModel();
      
      // Initialize tokenizer
      this.initializeTokenizer();
      
      this.isInitialized = true;
      console.log('Social media sentiment analyzer initialized');
    } catch (error) {
      console.error('Failed to initialize sentiment analyzer:', error);
      throw error;
    }
  }
  
  /**
   * Analyze sentiment of a single post
   */
  async analyzeSentiment(post: SocialMediaPost): Promise<SentimentResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Preprocess text
    const processedText = this.preprocessText(post.text);
    const tokens = this.tokenize(processedText);
    
    // Get base sentiment from lexicon
    const lexiconSentiment = this.getLexiconSentiment(processedText);
    
    // Create input tensor
    const inputTensor = this.createInputTensor(tokens);
    
    // Run sentiment model
    const sentimentPrediction = this.sentimentModel!.predict(inputTensor) as tf.Tensor;
    const sentimentData = await sentimentPrediction.data();
    
    // Extract entities
    const entities = await this.extractEntities(processedText);
    
    // Extract topics
    const topics = await this.extractTopics(processedText);
    
    // Calculate final sentiment
    const modelSentiment = sentimentData[0] * 2 - 1; // Convert 0-1 to -1 to 1
    const finalSentiment = (modelSentiment + lexiconSentiment) / 2;
    
    // Calculate confidence based on engagement
    const confidence = this.calculateConfidence(post, Math.abs(finalSentiment));
    
    // Clean up
    inputTensor.dispose();
    sentimentPrediction.dispose();
    
    return {
      score: finalSentiment,
      magnitude: Math.abs(finalSentiment),
      confidence,
      topics,
      entities
    };
  }
  
  /**
   * Analyze player sentiment trends from multiple posts
   */
  async analyzePlayerSentiment(
    playerId: string,
    playerName: string,
    posts: SocialMediaPost[]
  ): Promise<PlayerSentimentTrend> {
    const sentimentResults: SentimentResult[] = [];
    const last24hPosts: SocialMediaPost[] = [];
    const prev24hPosts: SocialMediaPost[] = [];
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    // Separate posts by time period
    for (const post of posts) {
      if (post.timestamp > oneDayAgo) {
        last24hPosts.push(post);
      } else if (post.timestamp > twoDaysAgo) {
        prev24hPosts.push(post);
      }
    }
    
    // Analyze all recent posts
    for (const post of last24hPosts) {
      const sentiment = await this.analyzeSentiment(post);
      sentimentResults.push(sentiment);
    }
    
    // Calculate metrics
    const overallSentiment = this.calculateWeightedSentiment(
      last24hPosts,
      sentimentResults
    );
    
    const prevSentiment = prev24hPosts.length > 0
      ? await this.calculatePeriodSentiment(prev24hPosts)
      : overallSentiment;
    
    const sentimentChange = overallSentiment - prevSentiment;
    const volumeChange = ((last24hPosts.length - prev24hPosts.length) / 
      Math.max(prev24hPosts.length, 1)) * 100;
    
    // Extract insights
    const insights = this.extractKeyInsights(sentimentResults, posts);
    const riskFactors = this.identifyRiskFactors(sentimentResults);
    const topTopics = this.aggregateTopics(sentimentResults);
    
    // Determine consensus rating
    const consensusRating = this.determineConsensusRating(
      overallSentiment,
      sentimentChange,
      volumeChange
    );
    
    return {
      playerId,
      playerName,
      overallSentiment,
      sentimentChange24h: sentimentChange,
      volume24h: last24hPosts.length,
      volumeChange24h: volumeChange,
      topTopics,
      keyInsights: insights,
      riskFactors,
      consensusRating
    };
  }
  
  /**
   * Stream real-time sentiment updates
   */
  async *streamSentimentUpdates(
    posts: AsyncIterable<SocialMediaPost>
  ): AsyncGenerator<{ post: SocialMediaPost; sentiment: SentimentResult }> {
    for await (const post of posts) {
      const sentiment = await this.analyzeSentiment(post);
      yield { post, sentiment };
    }
  }
  
  /**
   * Preprocess text for analysis
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[@#]\w+/g, '') // Remove mentions and hashtags
      .replace(/https?:\/\/\S+/g, '') // Remove URLs
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  /**
   * Tokenize text
   */
  private tokenize(text: string): number[] {
    const words = text.split(' ');
    const tokens: number[] = [];
    
    for (const word of words) {
      if (this.tokenizer.has(word)) {
        tokens.push(this.tokenizer.get(word)!);
      } else {
        tokens.push(0); // Unknown token
      }
    }
    
    // Pad or truncate to fixed length
    const maxLength = 100;
    if (tokens.length > maxLength) {
      return tokens.slice(0, maxLength);
    } else {
      return [...tokens, ...new Array(maxLength - tokens.length).fill(0)];
    }
  }
  
  /**
   * Get sentiment from lexicon
   */
  private getLexiconSentiment(text: string): number {
    const words = text.split(' ');
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of words) {
      if (this.positiveLexicon.has(word)) positiveCount++;
      if (this.negativeLexicon.has(word)) negativeCount++;
    }
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0;
    
    return (positiveCount - negativeCount) / total;
  }
  
  /**
   * Extract entities from text
   */
  private async extractEntities(text: string): Promise<SentimentResult['entities']> {
    // Simplified entity extraction
    const entities: SentimentResult['entities'] = [];
    
    // Player patterns
    const playerPatterns = [
      /(\w+\s+\w+)\s+is\s+(injured|questionable|doubtful)/gi,
      /(\w+\s+\w+)\s+looks?\s+(great|terrible|good|bad)/gi,
      /start\s+(\w+\s+\w+)/gi,
      /bench\s+(\w+\s+\w+)/gi
    ];
    
    for (const pattern of playerPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        const context = match[2] || '';
        
        let sentiment = 0;
        if (context.match(/great|good/i)) sentiment = 0.7;
        else if (context.match(/terrible|bad|injured/i)) sentiment = -0.7;
        
        entities.push({
          name,
          type: 'player',
          sentiment
        });
      }
    }
    
    return entities;
  }
  
  /**
   * Extract topics from text
   */
  private async extractTopics(text: string): Promise<string[]> {
    const topics: string[] = [];
    
    // Topic patterns
    const topicPatterns: Record<string, RegExp> = {
      injury: /injur|hurt|questionable|doubtful|limited/i,
      matchup: /matchup|against|versus|face|play/i,
      weather: /weather|rain|wind|snow|dome/i,
      trade: /trade|deal|acquire|move/i,
      hot_streak: /hot|streak|fire|rolling/i,
      cold_streak: /cold|slump|struggling|bust/i
    };
    
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(text)) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
  
  /**
   * Calculate confidence based on engagement
   */
  private calculateConfidence(post: SocialMediaPost, magnitude: number): number {
    let confidence = magnitude;
    
    // Boost confidence for verified accounts
    if (post.metadata?.isVerified) {
      confidence *= 1.2;
    }
    
    // Boost for high engagement
    const totalEngagement = post.engagement.likes + 
      post.engagement.shares + 
      post.engagement.comments;
    
    if (totalEngagement > 1000) {
      confidence *= 1.1;
    }
    
    // Boost for high follower count
    if (post.metadata?.followerCount && post.metadata.followerCount > 10000) {
      confidence *= 1.1;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Calculate weighted sentiment for time period
   */
  private calculateWeightedSentiment(
    posts: SocialMediaPost[],
    sentiments: SentimentResult[]
  ): number {
    if (posts.length === 0) return 0;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const sentiment = sentiments[i];
      
      // Weight by engagement and confidence
      const engagement = Math.log10(
        post.engagement.likes + post.engagement.shares + 1
      );
      const weight = engagement * sentiment.confidence;
      
      weightedSum += sentiment.score * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Calculate sentiment for a time period
   */
  private async calculatePeriodSentiment(posts: SocialMediaPost[]): Promise<number> {
    const sentiments: SentimentResult[] = [];
    
    for (const post of posts) {
      const sentiment = await this.analyzeSentiment(post);
      sentiments.push(sentiment);
    }
    
    return this.calculateWeightedSentiment(posts, sentiments);
  }
  
  /**
   * Extract key insights from sentiment results
   */
  private extractKeyInsights(
    sentiments: SentimentResult[],
    posts: SocialMediaPost[]
  ): string[] {
    const insights: string[] = [];
    
    // Check for injury mentions
    const injuryMentions = sentiments.filter(s => 
      s.topics.includes('injury')
    ).length;
    
    if (injuryMentions > posts.length * 0.2) {
      insights.push('High volume of injury concerns');
    }
    
    // Check for matchup discussions
    const matchupMentions = sentiments.filter(s => 
      s.topics.includes('matchup')
    ).length;
    
    if (matchupMentions > posts.length * 0.3) {
      const avgMatchupSentiment = sentiments
        .filter(s => s.topics.includes('matchup'))
        .reduce((sum, s) => sum + s.score, 0) / matchupMentions;
      
      if (avgMatchupSentiment > 0.3) {
        insights.push('Favorable matchup consensus');
      } else if (avgMatchupSentiment < -0.3) {
        insights.push('Difficult matchup concerns');
      }
    }
    
    // Check for trending topics
    const topicCounts = new Map<string, number>();
    for (const sentiment of sentiments) {
      for (const topic of sentiment.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }
    
    const trendingTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([topic]) => topic);
    
    if (trendingTopics.length > 0) {
      insights.push(`Trending topics: ${trendingTopics.join(', ')}`);
    }
    
    return insights;
  }
  
  /**
   * Identify risk factors
   */
  private identifyRiskFactors(sentiments: SentimentResult[]): string[] {
    const risks: string[] = [];
    
    // Check for negative sentiment surge
    const negativeCount = sentiments.filter(s => s.score < -0.3).length;
    if (negativeCount > sentiments.length * 0.4) {
      risks.push('Significant negative sentiment');
    }
    
    // Check for injury concerns
    const injuryCount = sentiments.filter(s => 
      s.entities.some(e => e.type === 'injury')
    ).length;
    
    if (injuryCount > 0) {
      risks.push('Injury concerns mentioned');
    }
    
    // Check for high volatility
    const sentimentScores = sentiments.map(s => s.score);
    const variance = this.calculateVariance(sentimentScores);
    
    if (variance > 0.3) {
      risks.push('High sentiment volatility');
    }
    
    return risks;
  }
  
  /**
   * Aggregate topics from multiple sentiments
   */
  private aggregateTopics(sentiments: SentimentResult[]): string[] {
    const topicCounts = new Map<string, number>();
    
    for (const sentiment of sentiments) {
      for (const topic of sentiment.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }
    
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }
  
  /**
   * Determine consensus rating
   */
  private determineConsensusRating(
    sentiment: number,
    sentimentChange: number,
    volumeChange: number
  ): 'buy' | 'hold' | 'sell' {
    // Buy signals
    if (sentiment > 0.3 && sentimentChange > 0.1 && volumeChange > 20) {
      return 'buy';
    }
    
    // Sell signals
    if (sentiment < -0.3 || (sentimentChange < -0.2 && volumeChange > 50)) {
      return 'sell';
    }
    
    return 'hold';
  }
  
  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
  
  /**
   * Create input tensor from tokens
   */
  private createInputTensor(tokens: number[]): tf.Tensor {
    return tf.tensor2d([tokens], [1, tokens.length]);
  }
  
  /**
   * Initialize tokenizer with common words
   */
  private initializeTokenizer(): void {
    const commonWords = [
      'player', 'team', 'game', 'start', 'bench', 'injury', 'touchdown',
      'yards', 'points', 'fantasy', 'lineup', 'matchup', 'week', 'season',
      'trade', 'waiver', 'pickup', 'drop', 'add', 'roster', 'projection'
    ];
    
    commonWords.forEach((word, index) => {
      this.tokenizer.set(word, index + 1);
    });
  }
  
  /**
   * Create sentiment analysis model
   */
  private async createSentimentModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: 1000,
          outputDim: 50,
          inputLength: 100
        }),
        tf.layers.lstm({
          units: 32,
          returnSequences: false
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }
  
  /**
   * Create entity extraction model
   */
  private async createEntityModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [100],
          units: 50,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 20,
          activation: 'softmax'
        })
      ]
    });
  }
  
  /**
   * Create topic classification model
   */
  private async createTopicModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [100],
          units: 50,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 10,
          activation: 'sigmoid'
        })
      ]
    });
  }
}

// Export singleton instance
export const socialMediaAnalyzer = SocialMediaSentimentAnalyzer.getInstance();