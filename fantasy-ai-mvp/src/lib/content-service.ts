"use client";

import { EventEmitter } from 'events';

export interface ContentArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: ContentAuthor;
  category: ContentCategory;
  tags: string[];
  imageUrl?: string;
  videoUrl?: string;
  readTime: number; // in minutes
  publishedAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  isExpert: boolean;
  isPremium: boolean;
  relatedPlayers: string[]; // player IDs
  relatedTeams: string[]; // team names
  trendingScore: number; // 0-100
}

export interface ContentAuthor {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  expertise: string[];
  verificationLevel: 'EXPERT' | 'ANALYST' | 'COMMUNITY';
  followers: number;
  accuracy: number; // prediction accuracy percentage
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  author: ContentAuthor;
  category: ContentCategory;
  tags: string[];
  publishedAt: Date;
  views: number;
  likes: number;
  isPremium: boolean;
  chapters: VideoChapter[];
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number;
  description?: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  hosts: ContentAuthor[];
  guests: ContentAuthor[];
  episode: number;
  season: number;
  publishedAt: Date;
  downloads: number;
  rating: number;
  topics: string[];
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  author?: string;
  imageUrl?: string;
  publishedAt: Date;
  category: NewsCategory;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedPlayers: string[];
  relatedTeams: string[];
  tags: string[];
  externalUrl?: string;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  category: ContentCategory;
  score: number;
  change: number; // percentage change from previous period
  mentions: number;
  relatedContent: string[]; // content IDs
  timeframe: '1h' | '6h' | '24h' | '7d';
}

export enum ContentCategory {
  ANALYSIS = 'ANALYSIS',
  NEWS = 'NEWS',
  STRATEGY = 'STRATEGY',
  PICKS = 'PICKS',
  TRADE_ADVICE = 'TRADE_ADVICE',
  DRAFT_GUIDE = 'DRAFT_GUIDE',
  INJURY_REPORT = 'INJURY_REPORT',
  MATCHUP_PREVIEW = 'MATCHUP_PREVIEW',
  WAIVER_WIRE = 'WAIVER_WIRE',
  WEEKLY_RECAP = 'WEEKLY_RECAP'
}

export enum NewsCategory {
  BREAKING = 'BREAKING',
  TRADE = 'TRADE',
  INJURY = 'INJURY',
  SIGNING = 'SIGNING',
  SUSPENSION = 'SUSPENSION',
  COACHING = 'COACHING',
  GENERAL = 'GENERAL'
}

export class ContentService extends EventEmitter {
  private articles: Map<string, ContentArticle> = new Map();
  private videos: Map<string, VideoContent> = new Map();
  private podcasts: Map<string, Podcast> = new Map();
  private news: Map<string, NewsItem> = new Map();
  private authors: Map<string, ContentAuthor> = new Map();
  private trendingTopics: TrendingTopic[] = [];

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock authors
    const experts: ContentAuthor[] = [
      {
        id: 'expert_1',
        name: 'Matthew Berry',
        bio: 'Senior Fantasy Analyst with 15+ years of experience. Former ESPN Fantasy guru.',
        avatar: '/experts/matthew-berry.jpg',
        expertise: ['Fantasy Football', 'Player Analysis', 'Start/Sit'],
        verificationLevel: 'EXPERT',
        followers: 1200000,
        accuracy: 73.2,
        socialLinks: {
          twitter: '@MatthewBerryTMR',
          website: 'https://matthewberry.com'
        }
      },
      {
        id: 'expert_2',
        name: 'Adam Schefter',
        bio: 'NFL Insider breaking the biggest stories in football.',
        avatar: '/experts/adam-schefter.jpg',
        expertise: ['Breaking News', 'Trade Analysis', 'Injury Reports'],
        verificationLevel: 'EXPERT',
        followers: 9800000,
        accuracy: 89.5,
        socialLinks: {
          twitter: '@AdamSchefter'
        }
      },
      {
        id: 'analyst_1',
        name: 'Sarah Thompson',
        bio: 'Data-driven fantasy analyst specializing in advanced metrics and predictive modeling.',
        avatar: '/experts/sarah-thompson.jpg',
        expertise: ['Advanced Analytics', 'Predictive Modeling', 'DFS Strategy'],
        verificationLevel: 'ANALYST',
        followers: 245000,
        accuracy: 68.8,
        socialLinks: {
          twitter: '@SarahFantasyPro',
          linkedin: 'sarah-thompson-fantasy'
        }
      }
    ];

    experts.forEach(expert => this.authors.set(expert.id, expert));

    // Mock articles
    const mockArticles: ContentArticle[] = [
      {
        id: 'article_1',
        title: 'Week 8 Start/Sit: Must-Start Players Flying Under the Radar',
        excerpt: 'Uncover hidden gems and avoid potential busts in your lineup decisions for Week 8.',
        content: `This week presents some fascinating opportunities for fantasy managers looking to gain an edge...

## Top Start Candidates

### Geno Smith, QB (Seattle Seahawks)
Despite inconsistent play earlier this season, Smith faces a Cardinals defense that has allowed the 3rd most fantasy points to quarterbacks. His 2-game average of 18.5 fantasy points makes him a solid streaming option.

### Dameon Pierce, RB (Houston Texans) 
With increased usage over the past three weeks, Pierce has emerged as a viable RB2 option. The Titans' run defense ranks 28th in yards allowed per carry, setting up Pierce for potential success.

### Romeo Doubs, WR (Green Bay Packers)
Doubs has quietly become Aaron Rodgers' most reliable target, with a 23% target share over the last four games. Against Jacksonville's vulnerable secondary, expect another solid performance.

## Sit Recommendations

### Tua Tagovailoa, QB (Miami Dolphins)
The Bills' defense has allowed just 12.3 fantasy points per game to quarterbacks at home this season. Tua's road struggles continue to be concerning.

### Najee Harris, RB (Pittsburgh Steelers)
Philadelphia's run defense has tightened considerably, allowing just 3.2 yards per carry over the last three games. Harris has struggled in similar matchups this season.

## Key Injury Updates

Monitor the status of several key players heading into Sunday...`,
        author: experts[0],
        category: ContentCategory.PICKS,
        tags: ['start-sit', 'week-8', 'lineup-advice', 'streaming'],
        imageUrl: '/content/week-8-startsit.jpg',
        readTime: 7,
        publishedAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 1800000),
        views: 15420,
        likes: 892,
        isExpert: true,
        isPremium: false,
        relatedPlayers: ['geno-smith', 'dameon-pierce', 'romeo-doubs'],
        relatedTeams: ['SEA', 'HOU', 'GB'],
        trendingScore: 85
      },
      {
        id: 'article_2',
        title: 'Trade Deadline Winners and Losers: Fantasy Impact Analysis',
        excerpt: 'Breaking down how recent trades will shake up fantasy values for the rest of the season.',
        content: `The NFL trade deadline brought several blockbuster moves that will significantly impact fantasy football...

## Biggest Winners

### Calvin Ridley (Tennessee Titans)
Ridley's move to Tennessee immediately makes him a WR2 with upside. The Titans' passing offense gets a major boost, and Ridley should see 8-10 targets per game.

### Josh Jacobs (Green Bay Packers) 
This trade transforms Jacobs from a struggling RB3 to a potential league-winner. Green Bay's offensive line creates much better rushing lanes than Las Vegas.

## Biggest Losers

### Diontae Johnson (Carolina Panthers)
Moving from Pittsburgh's pass-heavy offense to Carolina's run-first approach significantly caps Johnson's ceiling. Expect fewer targets and less red zone involvement.

## Long-term Implications

These moves set up interesting dynamics for the 2024 season and beyond...`,
        author: experts[0],
        category: ContentCategory.TRADE_ADVICE,
        tags: ['trade-deadline', 'fantasy-impact', 'ros-rankings'],
        imageUrl: '/content/trade-deadline.jpg',
        readTime: 12,
        publishedAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 5400000),
        views: 28350,
        likes: 1205,
        isExpert: true,
        isPremium: true,
        relatedPlayers: ['calvin-ridley', 'josh-jacobs', 'diontae-johnson'],
        relatedTeams: ['TEN', 'GB', 'CAR'],
        trendingScore: 92
      },
      {
        id: 'article_3',
        title: 'Advanced Metrics Deep Dive: Predicting RB Success',
        excerpt: 'Using snap counts, target shares, and red zone touches to identify breakout running backs.',
        content: `Traditional fantasy analysis often misses key indicators of future success. Let's dive into the data...

## Key Metrics to Track

### Snap Share Percentage
Running backs playing 65%+ of snaps typically provide consistent fantasy production. Here's who's trending up:

- James Cook (BUF): 71% snap share (up from 52% early season)
- De'Von Achane (MIA): 68% snap share when healthy
- Rachaad White (TB): 73% snap share in recent games

### Red Zone Opportunity Share
Goal line carries remain the strongest predictor of touchdown upside:

**Leaders in RZ Touches (Last 4 Weeks):**
1. Josh Jacobs - 15 touches
2. Christian McCaffrey - 12 touches  
3. Derrick Henry - 11 touches

### Target Share Trends
Pass-catching backs provide safer floors in PPR formats:

**Highest Target Share Among RBs:**
- Christian McCaffrey: 16.2%
- Alvin Kamara: 13.8%
- Austin Ekeler: 12.4%

## Predictive Model Results

Our machine learning model identifies these breakout candidates...`,
        author: experts[2],
        category: ContentCategory.ANALYSIS,
        tags: ['advanced-metrics', 'running-backs', 'predictive-analysis', 'data-driven'],
        imageUrl: '/content/rb-analytics.jpg',
        readTime: 15,
        publishedAt: new Date(Date.now() - 14400000),
        updatedAt: new Date(Date.now() - 12600000),
        views: 8920,
        likes: 445,
        isExpert: true,
        isPremium: true,
        relatedPlayers: ['james-cook', 'devon-achane', 'christian-mccaffrey'],
        relatedTeams: ['BUF', 'MIA', 'SF'],
        trendingScore: 78
      }
    ];

    mockArticles.forEach(article => this.articles.set(article.id, article));

    // Mock news items
    const mockNews: NewsItem[] = [
      {
        id: 'news_1',
        headline: 'BREAKING: Star WR Questionable for Sunday with Hamstring Injury',
        summary: 'Team sources indicate the injury occurred during Wednesday practice. Full evaluation pending.',
        source: 'NFL Network',
        author: 'Adam Schefter',
        imageUrl: '/news/injury-report.jpg',
        publishedAt: new Date(Date.now() - 900000),
        category: NewsCategory.INJURY,
        impact: 'HIGH',
        relatedPlayers: ['tyreek-hill'],
        relatedTeams: ['MIA'],
        tags: ['injury', 'questionable', 'fantasy-impact']
      },
      {
        id: 'news_2',
        headline: 'Rookie RB Expected to See Increased Role This Week',
        summary: 'Coaching staff pleased with recent performances. Could become primary back if trend continues.',
        source: 'ESPN',
        imageUrl: '/news/rookie-rb.jpg',
        publishedAt: new Date(Date.now() - 1800000),
        category: NewsCategory.GENERAL,
        impact: 'MEDIUM',
        relatedPlayers: ['bijan-robinson'],
        relatedTeams: ['ATL'],
        tags: ['rookie', 'opportunity', 'depth-chart']
      }
    ];

    mockNews.forEach(item => this.news.set(item.id, item));

    // Mock trending topics
    this.trendingTopics = [
      {
        id: 'trend_1',
        topic: 'Week 8 Waiver Wire',
        category: ContentCategory.WAIVER_WIRE,
        score: 95,
        change: 15.2,
        mentions: 12450,
        relatedContent: ['article_1'],
        timeframe: '24h'
      },
      {
        id: 'trend_2',
        topic: 'Trade Deadline Impact',
        category: ContentCategory.TRADE_ADVICE,
        score: 88,
        change: -5.3,
        mentions: 8930,
        relatedContent: ['article_2'],
        timeframe: '24h'
      }
    ];
  }

  async getArticles(options?: {
    category?: ContentCategory;
    isExpert?: boolean;
    isPremium?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ContentArticle[]> {
    let articles = Array.from(this.articles.values());

    if (options?.category) {
      articles = articles.filter(a => a.category === options.category);
    }

    if (options?.isExpert !== undefined) {
      articles = articles.filter(a => a.isExpert === options.isExpert);
    }

    if (options?.isPremium !== undefined) {
      articles = articles.filter(a => a.isPremium === options.isPremium);
    }

    // Sort by trending score then by published date
    articles.sort((a, b) => {
      if (a.trendingScore !== b.trendingScore) {
        return b.trendingScore - a.trendingScore;
      }
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });

    const start = options?.offset || 0;
    const end = start + (options?.limit || articles.length);
    
    return articles.slice(start, end);
  }

  async getArticle(id: string): Promise<ContentArticle | null> {
    const article = this.articles.get(id);
    if (article) {
      // Increment view count
      article.views++;
      this.articles.set(id, article);
    }
    return article || null;
  }

  async getNews(options?: {
    category?: NewsCategory;
    impact?: 'HIGH' | 'MEDIUM' | 'LOW';
    limit?: number;
  }): Promise<NewsItem[]> {
    let news = Array.from(this.news.values());

    if (options?.category) {
      news = news.filter(n => n.category === options.category);
    }

    if (options?.impact) {
      news = news.filter(n => n.impact === options.impact);
    }

    news.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    return news.slice(0, options?.limit || news.length);
  }

  async getTrendingTopics(timeframe: '1h' | '6h' | '24h' | '7d' = '24h'): Promise<TrendingTopic[]> {
    return this.trendingTopics
      .filter(t => t.timeframe === timeframe)
      .sort((a, b) => b.score - a.score);
  }

  async getExpertPicks(week: number): Promise<{
    expert: ContentAuthor;
    picks: {
      playerId: string;
      playerName: string;
      position: string;
      recommendation: 'START' | 'SIT' | 'FLEX';
      confidence: number;
      reasoning: string;
    }[];
  }[]> {
    // Mock expert picks
    return [
      {
        expert: this.authors.get('expert_1')!,
        picks: [
          {
            playerId: 'geno-smith',
            playerName: 'Geno Smith',
            position: 'QB',
            recommendation: 'START',
            confidence: 75,
            reasoning: 'Favorable matchup against weak Cardinals secondary'
          },
          {
            playerId: 'dameon-pierce',
            playerName: 'Dameon Pierce',
            position: 'RB',
            recommendation: 'FLEX',
            confidence: 68,
            reasoning: 'Increased workload and good matchup vs Titans'
          }
        ]
      }
    ];
  }

  async searchContent(query: string, type?: 'articles' | 'news' | 'all'): Promise<{
    articles: ContentArticle[];
    news: NewsItem[];
  }> {
    const searchTerm = query.toLowerCase();

    const articles = type !== 'news' ? Array.from(this.articles.values()).filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.excerpt.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    ) : [];

    const news = type !== 'articles' ? Array.from(this.news.values()).filter(item =>
      item.headline.toLowerCase().includes(searchTerm) ||
      item.summary.toLowerCase().includes(searchTerm) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    ) : [];

    return { articles, news };
  }

  async likeContent(contentId: string, userId: string): Promise<void> {
    const article = this.articles.get(contentId);
    if (article) {
      article.likes++;
      this.articles.set(contentId, article);
      this.emit('contentLiked', { contentId, userId, type: 'article' });
    }
  }

  async getAuthor(authorId: string): Promise<ContentAuthor | null> {
    return this.authors.get(authorId) || null;
  }

  async getTopExperts(limit: number = 10): Promise<ContentAuthor[]> {
    return Array.from(this.authors.values())
      .filter(author => author.verificationLevel === 'EXPERT')
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit);
  }
}

export const contentService = new ContentService();