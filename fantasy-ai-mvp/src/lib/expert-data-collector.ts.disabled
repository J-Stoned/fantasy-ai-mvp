import { EventEmitter } from "events";
import { aiPersonalityTrainer, ExpertDecisionData } from "./ai-personality-trainer";

export interface ExpertSource {
  id: string;
  name: string;
  type: "content_creator" | "analyst" | "pro_player" | "podcaster" | "twitter_expert";
  platforms: Array<{
    platform: "youtube" | "twitter" | "podcast" | "website" | "newsletter";
    url: string;
    handle?: string;
    rss_feed?: string;
    api_endpoint?: string;
  }>;
  expertise: {
    sport: "nfl" | "nba" | "mlb" | "nhl";
    specialties: string[];
    accuracy_rating: number;
    follower_count: number;
    years_experience: number;
  };
  scraping_config: {
    frequency: number; // minutes
    content_types: string[];
    keywords: string[];
    ignore_patterns: string[];
  };
  last_scraped: Date;
  is_active: boolean;
}

export interface ScrapedContent {
  source_id: string;
  platform: string;
  content_type: "article" | "tweet" | "video" | "podcast" | "newsletter";
  url: string;
  title: string;
  content: string;
  published_at: Date;
  scraped_at: Date;
  metadata: {
    author: string;
    word_count: number;
    sentiment: number;
    confidence: number;
    contains_picks: boolean;
    contains_analysis: boolean;
  };
  extracted_decisions: ExpertDecisionData[];
}

export interface ContentParser {
  parseContent(content: ScrapedContent): Promise<ExpertDecisionData[]>;
  extractPlayerMentions(text: string): string[];
  extractLineupDecisions(text: string): any[];
  extractConfidence(text: string): number;
  extractReasoning(text: string): string;
}

export class ExpertDataCollector extends EventEmitter {
  private sources: Map<string, ExpertSource> = new Map();
  private scrapingQueues: Map<string, ScrapedContent[]> = new Map();
  private contentParsers: Map<string, ContentParser> = new Map();
  private isRunning = false;
  private scrapeInterval: NodeJS.Timeout | null = null;

  // Rate limiting
  private rateLimits: Map<string, { count: number; resetTime: Date }> = new Map();
  private readonly DEFAULT_RATE_LIMIT = 100; // requests per hour

  constructor() {
    super();
    this.initializeExperts();
    this.initializeParsers();
  }

  /**
   * Initialize known fantasy experts
   */
  private initializeExperts(): void {
    const experts: ExpertSource[] = [
      {
        id: "matthew_berry",
        name: "Matthew Berry",
        type: "analyst",
        platforms: [
          {
            platform: "twitter",
            url: "https://twitter.com/MatthewBerryTMR",
            handle: "@MatthewBerryTMR"
          },
          {
            platform: "website",
            url: "https://www.espn.com/fantasy/football/",
            rss_feed: "https://www.espn.com/espn/rss/fantasy/news"
          }
        ],
        expertise: {
          sport: "nfl",
          specialties: ["lineup_advice", "waiver_wire", "start_sit"],
          accuracy_rating: 0.72,
          follower_count: 1200000,
          years_experience: 15
        },
        scraping_config: {
          frequency: 60, // Every hour
          content_types: ["article", "tweet"],
          keywords: ["start", "sit", "lineup", "waiver", "pick up", "drop"],
          ignore_patterns: ["RT @", "promotion", "ad"]
        },
        last_scraped: new Date(),
        is_active: true
      },
      {
        id: "sean_koerner",
        name: "Sean Koerner",
        type: "analyst",
        platforms: [
          {
            platform: "twitter",
            url: "https://twitter.com/The_Oddsmaker",
            handle: "@The_Oddsmaker"
          },
          {
            platform: "website",
            url: "https://www.actionnetwork.com/fantasy",
            api_endpoint: "https://api.actionnetwork.com/web/v1/fantasy/articles"
          }
        ],
        expertise: {
          sport: "nfl",
          specialties: ["projections", "dfs", "analytics"],
          accuracy_rating: 0.84,
          follower_count: 450000,
          years_experience: 8
        },
        scraping_config: {
          frequency: 30, // Every 30 minutes
          content_types: ["article", "tweet"],
          keywords: ["projection", "model", "data", "analytics", "edge"],
          ignore_patterns: ["retweet", "sponsored"]
        },
        last_scraped: new Date(),
        is_active: true
      },
      {
        id: "fantasy_footballers",
        name: "The Fantasy Footballers",
        type: "podcaster",
        platforms: [
          {
            platform: "podcast",
            url: "https://www.thefantasyfootballers.com/",
            rss_feed: "https://feeds.megaphone.fm/WWO8086673842"
          },
          {
            platform: "twitter",
            url: "https://twitter.com/TheFFBallers",
            handle: "@TheFFBallers"
          }
        ],
        expertise: {
          sport: "nfl",
          specialties: ["rankings", "start_sit", "waiver_wire", "trades"],
          accuracy_rating: 0.76,
          follower_count: 800000,
          years_experience: 10
        },
        scraping_config: {
          frequency: 240, // Every 4 hours
          content_types: ["podcast", "tweet"],
          keywords: ["start", "sit", "love", "hate", "bounce back", "breakout"],
          ignore_patterns: ["merch", "live show"]
        },
        last_scraped: new Date(),
        is_active: true
      },
      {
        id: "adam_levitan",
        name: "Adam Levitan",
        type: "content_creator",
        platforms: [
          {
            platform: "twitter",
            url: "https://twitter.com/adamlevitan",
            handle: "@adamlevitan"
          },
          {
            platform: "website",
            url: "https://establishtherun.com/",
            rss_feed: "https://establishtherun.com/feed/"
          }
        ],
        expertise: {
          sport: "nfl",
          specialties: ["dfs", "cash_games", "tournaments", "game_theory"],
          accuracy_rating: 0.79,
          follower_count: 120000,
          years_experience: 12
        },
        scraping_config: {
          frequency: 45,
          content_types: ["article", "tweet"],
          keywords: ["leverage", "ownership", "pivot", "contrarian", "chalk"],
          ignore_patterns: ["course", "subscription"]
        },
        last_scraped: new Date(),
        is_active: true
      }
    ];

    experts.forEach(expert => {
      this.sources.set(expert.id, expert);
      this.scrapingQueues.set(expert.id, []);
    });

    console.log(`📚 Initialized ${experts.length} expert sources`);
  }

  /**
   * Initialize content parsers
   */
  private initializeParsers(): void {
    this.contentParsers.set("twitter", new TwitterParser());
    this.contentParsers.set("article", new ArticleParser());
    this.contentParsers.set("podcast", new PodcastParser());
    this.contentParsers.set("video", new VideoParser());

    console.log("🔧 Content parsers initialized");
  }

  /**
   * Start the expert data collection system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Expert data collector already running");
      return;
    }

    console.log("🚀 Starting expert data collection...");
    this.isRunning = true;

    // Start scraping loop
    this.scrapeInterval = setInterval(() => {
      this.scrapeAllSources();
    }, 60000); // Check every minute

    // Initial scrape
    await this.scrapeAllSources();

    console.log("✅ Expert data collection started");
  }

  /**
   * Stop the data collection system
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log("🛑 Stopping expert data collection...");
    this.isRunning = false;

    if (this.scrapeInterval) {
      clearInterval(this.scrapeInterval);
      this.scrapeInterval = null;
    }

    console.log("✅ Expert data collection stopped");
  }

  /**
   * Scrape content from all sources
   */
  private async scrapeAllSources(): Promise<void> {
    const activeSources = Array.from(this.sources.values()).filter(s => s.is_active);

    for (const source of activeSources) {
      if (this.shouldScrapeSource(source)) {
        await this.scrapeSource(source);
      }
    }
  }

  /**
   * Check if a source should be scraped now
   */
  private shouldScrapeSource(source: ExpertSource): boolean {
    const now = new Date();
    const lastScraped = source.last_scraped;
    const intervalMs = source.scraping_config.frequency * 60 * 1000;

    return (now.getTime() - lastScraped.getTime()) >= intervalMs;
  }

  /**
   * Scrape content from a specific source
   */
  private async scrapeSource(source: ExpertSource): Promise<void> {
    console.log(`🕷️ Scraping content from ${source.name}...`);

    try {
      for (const platform of source.platforms) {
        if (this.isRateLimited(platform.platform)) {
          console.log(`⏱️ Rate limited for ${platform.platform}, skipping...`);
          continue;
        }

        const scrapedContent = await this.scrapeFromPlatform(source, platform);
        
        if (scrapedContent.length > 0) {
          await this.processScrapedContent(source.id, scrapedContent);
        }

        // Update rate limit
        this.updateRateLimit(platform.platform);
      }

      // Update last scraped time
      source.last_scraped = new Date();

    } catch (error) {
      console.error(`❌ Error scraping ${source.name}:`, error);
    }
  }

  /**
   * Scrape content from a specific platform
   */
  private async scrapeFromPlatform(source: ExpertSource, platform: any): Promise<ScrapedContent[]> {
    const scrapedContent: ScrapedContent[] = [];

    switch (platform.platform) {
      case "twitter":
        const tweets = await this.scrapeTwitter(source, platform);
        scrapedContent.push(...tweets);
        break;

      case "website":
        const articles = await this.scrapeWebsite(source, platform);
        scrapedContent.push(...articles);
        break;

      case "podcast":
        const episodes = await this.scrapePodcast(source, platform);
        scrapedContent.push(...episodes);
        break;

      case "youtube":
        const videos = await this.scrapeYouTube(source, platform);
        scrapedContent.push(...videos);
        break;
    }

    return scrapedContent;
  }

  /**
   * Scrape Twitter content
   */
  private async scrapeTwitter(source: ExpertSource, platform: any): Promise<ScrapedContent[]> {
    // In production, would use Twitter API v2
    // For now, simulate scraping
    const mockTweets: ScrapedContent[] = [
      {
        source_id: source.id,
        platform: "twitter",
        content_type: "tweet",
        url: `https://twitter.com/user/status/123456789`,
        title: "Week 8 Start/Sit Recommendations",
        content: "Start: Christian McCaffrey vs LAR - great matchup, expecting 20+ touches. Sit: Ezekiel Elliott vs PHI - tough run defense, limited upside. #FantasyFootball",
        published_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        scraped_at: new Date(),
        metadata: {
          author: source.name,
          word_count: 35,
          sentiment: 0.6,
          confidence: 0.8,
          contains_picks: true,
          contains_analysis: true
        },
        extracted_decisions: []
      }
    ];

    console.log(`📱 Found ${mockTweets.length} new tweets from ${source.name}`);
    return mockTweets;
  }

  /**
   * Scrape website/blog articles
   */
  private async scrapeWebsite(source: ExpertSource, platform: any): Promise<ScrapedContent[]> {
    // Would use web scraping or RSS feeds
    const mockArticles: ScrapedContent[] = [
      {
        source_id: source.id,
        platform: "website",
        content_type: "article",
        url: "https://example.com/week-8-lineup-advice",
        title: "Week 8 Lineup Advice: Start/Sit Recommendations",
        content: "This week I'm going heavy on 49ers players against the Rams. Christian McCaffrey is a must-start with his high floor and ceiling. Also loving Deebo Samuel as a WR2 play...",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        scraped_at: new Date(),
        metadata: {
          author: source.name,
          word_count: 1250,
          sentiment: 0.7,
          confidence: 0.9,
          contains_picks: true,
          contains_analysis: true
        },
        extracted_decisions: []
      }
    ];

    console.log(`📰 Found ${mockArticles.length} new articles from ${source.name}`);
    return mockArticles;
  }

  /**
   * Scrape podcast episodes
   */
  private async scrapePodcast(source: ExpertSource, platform: any): Promise<ScrapedContent[]> {
    // Would use podcast RSS feeds + speech-to-text
    const mockEpisodes: ScrapedContent[] = [];

    console.log(`🎧 Found ${mockEpisodes.length} new podcast episodes from ${source.name}`);
    return mockEpisodes;
  }

  /**
   * Scrape YouTube videos
   */
  private async scrapeYouTube(source: ExpertSource, platform: any): Promise<ScrapedContent[]> {
    // Would use YouTube API + transcript extraction
    const mockVideos: ScrapedContent[] = [];

    console.log(`📺 Found ${mockVideos.length} new videos from ${source.name}`);
    return mockVideos;
  }

  /**
   * Process scraped content to extract expert decisions
   */
  private async processScrapedContent(sourceId: string, content: ScrapedContent[]): Promise<void> {
    for (const item of content) {
      try {
        // Parse content to extract decisions
        const parser = this.contentParsers.get(item.platform);
        if (parser) {
          const decisions = await parser.parseContent(item);
          item.extracted_decisions = decisions;

          // Add decisions to training data
          for (const decision of decisions) {
            await aiPersonalityTrainer.addExpertDecision(decision);
          }

          console.log(`✅ Extracted ${decisions.length} decisions from ${item.title}`);
        }

        // Add to processing queue
        const queue = this.scrapingQueues.get(sourceId)!;
        queue.push(item);

        // Keep only last 100 items per source
        if (queue.length > 100) {
          queue.splice(0, queue.length - 100);
        }

      } catch (error) {
        console.error(`❌ Error processing content from ${sourceId}:`, error);
      }
    }

    this.emit("contentProcessed", { sourceId, contentCount: content.length });
  }

  /**
   * Rate limiting implementation
   */
  private isRateLimited(platform: string): boolean {
    const rateLimit = this.rateLimits.get(platform);
    if (!rateLimit) return false;

    const now = new Date();
    if (now > rateLimit.resetTime) {
      // Reset the limit
      this.rateLimits.set(platform, { count: 0, resetTime: new Date(now.getTime() + 60 * 60 * 1000) });
      return false;
    }

    return rateLimit.count >= this.DEFAULT_RATE_LIMIT;
  }

  private updateRateLimit(platform: string): void {
    const rateLimit = this.rateLimits.get(platform);
    if (rateLimit) {
      rateLimit.count++;
    } else {
      this.rateLimits.set(platform, {
        count: 1,
        resetTime: new Date(Date.now() + 60 * 60 * 1000)
      });
    }
  }

  /**
   * Add a new expert source
   */
  addExpertSource(source: ExpertSource): void {
    this.sources.set(source.id, source);
    this.scrapingQueues.set(source.id, []);
    console.log(`➕ Added new expert source: ${source.name}`);
  }

  /**
   * Get collection stats
   */
  getCollectionStats(): {
    totalSources: number;
    activeSources: number;
    totalContentItems: number;
    totalDecisions: number;
    recentActivity: any[];
  } {
    const activeSources = Array.from(this.sources.values()).filter(s => s.is_active).length;
    const totalContentItems = Array.from(this.scrapingQueues.values())
      .reduce((sum, queue) => sum + queue.length, 0);
    
    const totalDecisions = Array.from(this.scrapingQueues.values())
      .reduce((sum, queue) => {
        return sum + queue.reduce((queueSum, item) => queueSum + item.extracted_decisions.length, 0);
      }, 0);

    const recentActivity = Array.from(this.scrapingQueues.entries())
      .map(([sourceId, queue]) => ({
        sourceId,
        sourceName: this.sources.get(sourceId)?.name,
        recentContent: queue.slice(-5).map(item => ({
          title: item.title,
          decisions: item.extracted_decisions.length,
          scraped_at: item.scraped_at
        }))
      }));

    return {
      totalSources: this.sources.size,
      activeSources,
      totalContentItems,
      totalDecisions,
      recentActivity
    };
  }

  /**
   * Get content for a specific source
   */
  getSourceContent(sourceId: string, limit: number = 20): ScrapedContent[] {
    const queue = this.scrapingQueues.get(sourceId);
    return queue ? queue.slice(-limit) : [];
  }
}

// Content Parsers

class TwitterParser implements ContentParser {
  async parseContent(content: ScrapedContent): Promise<ExpertDecisionData[]> {
    const decisions: ExpertDecisionData[] = [];

    // Extract player mentions and decisions from tweet
    const playerMentions = this.extractPlayerMentions(content.content);
    if (playerMentions.length === 0) return decisions;

    const lineupDecisions = this.extractLineupDecisions(content.content);
    const confidence = this.extractConfidence(content.content);
    const reasoning = this.extractReasoning(content.content);

    // Create decision data
    if (lineupDecisions.length > 0) {
      decisions.push({
        expertId: content.source_id,
        timestamp: content.published_at,
        context: "lineup_decision",
        situation: {
          week: this.extractWeek(content.content),
          players: lineupDecisions,
          constraints: {},
          market_conditions: {
            chalk_players: [],
            contrarian_opportunities: [],
            injury_news: [],
            weather_concerns: []
          }
        },
        decision: {
          chosen_players: playerMentions,
          reasoning,
          confidence,
          risk_level: confidence > 0.8 ? "low" : confidence > 0.5 ? "medium" : "high",
          contrarian_factor: this.extractContrarianFactor(content.content)
        },
        outcome: { success: "average" }, // Will be updated later
        source: "article",
        metadata: {
          confidence_in_data: 0.7,
          context_completeness: 0.6
        }
      });
    }

    return decisions;
  }

  extractPlayerMentions(text: string): string[] {
    // Simple regex to find player names (would be more sophisticated in production)
    const playerPattern = /(?:Christian McCaffrey|Justin Jefferson|Josh Allen|Travis Kelce|Ezekiel Elliott|Deebo Samuel)/gi;
    return text.match(playerPattern) || [];
  }

  extractLineupDecisions(text: string): any[] {
    const decisions = [];
    const startPattern = /start:?\s*([^.]+)/gi;
    const sitPattern = /sit:?\s*([^.]+)/gi;

    let match;
    while ((match = startPattern.exec(text)) !== null) {
      decisions.push({
        id: match[1].trim().toLowerCase().replace(/\s+/g, '_'),
        name: match[1].trim(),
        action: "start"
      });
    }

    while ((match = sitPattern.exec(text)) !== null) {
      decisions.push({
        id: match[1].trim().toLowerCase().replace(/\s+/g, '_'),
        name: match[1].trim(),
        action: "sit"
      });
    }

    return decisions;
  }

  extractConfidence(text: string): number {
    // Look for confidence indicators
    if (/must[- ]start|lock|smash/i.test(text)) return 0.9;
    if (/love|strong/i.test(text)) return 0.8;
    if (/like|solid/i.test(text)) return 0.7;
    if (/consider|lean/i.test(text)) return 0.6;
    return 0.5;
  }

  extractReasoning(text: string): string {
    // Extract reasoning from tweet
    const reasoningPattern = /-\s*(.+)/;
    const match = text.match(reasoningPattern);
    return match ? match[1].trim() : "No specific reasoning provided";
  }

  private extractWeek(text: string): number {
    const weekPattern = /week\s*(\d+)/i;
    const match = text.match(weekPattern);
    return match ? parseInt(match[1]) : 1;
  }

  private extractContrarianFactor(text: string): number {
    if (/contrarian|fade|pivot|leverage/i.test(text)) return 0.8;
    if (/chalk|popular|obvious/i.test(text)) return 0.2;
    return 0.5;
  }
}

class ArticleParser implements ContentParser {
  async parseContent(content: ScrapedContent): Promise<ExpertDecisionData[]> {
    // More sophisticated article parsing
    return [];
  }

  extractPlayerMentions(text: string): string[] {
    return [];
  }

  extractLineupDecisions(text: string): any[] {
    return [];
  }

  extractConfidence(text: string): number {
    return 0.5;
  }

  extractReasoning(text: string): string {
    return "";
  }
}

class PodcastParser implements ContentParser {
  async parseContent(content: ScrapedContent): Promise<ExpertDecisionData[]> {
    // Would use speech-to-text + NLP
    return [];
  }

  extractPlayerMentions(text: string): string[] {
    return [];
  }

  extractLineupDecisions(text: string): any[] {
    return [];
  }

  extractConfidence(text: string): number {
    return 0.5;
  }

  extractReasoning(text: string): string {
    return "";
  }
}

class VideoParser implements ContentParser {
  async parseContent(content: ScrapedContent): Promise<ExpertDecisionData[]> {
    // Would use video transcript + visual recognition
    return [];
  }

  extractPlayerMentions(text: string): string[] {
    return [];
  }

  extractLineupDecisions(text: string): any[] {
    return [];
  }

  extractConfidence(text: string): number {
    return 0.5;
  }

  extractReasoning(text: string): string {
    return "";
  }
}

export const expertDataCollector = new ExpertDataCollector();