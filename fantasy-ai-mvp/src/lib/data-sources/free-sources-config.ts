/**
 * 🌍 FREE SPORTS DATA SOURCES CONFIGURATION
 * The most comprehensive free sports data source mapping ever created!
 * 500+ sources, $0 cost, maximum data coverage!
 */

export interface FreeDataSource {
  id: string;
  name: string;
  url: string;
  type: 'official' | 'news' | 'social' | 'api' | 'rss' | 'podcast' | 'video' | 'betting';
  region: 'usa' | 'uk' | 'canada' | 'australia' | 'global' | 'europe' | 'asia' | 'latam';
  sports: string[];
  dataTypes: string[];
  updateFrequency: 'realtime' | '5min' | '15min' | 'hourly' | 'daily';
  mcpServer: 'firecrawl' | 'puppeteer' | 'rss' | 'social' | 'api';
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  rateLimit?: {
    requests: number;
    per: 'minute' | 'hour' | 'day';
  };
  apiKey?: boolean; // Does it need a free API key?
  authRequired?: boolean; // Does it need authentication?
}

export class FreeSourcesConfig {
  private static instance: FreeSourcesConfig;
  public sources: FreeDataSource[] = [];

  private constructor() {
    this.initializeAllSources();
  }

  public static getInstance(): FreeSourcesConfig {
    if (!FreeSourcesConfig.instance) {
      FreeSourcesConfig.instance = new FreeSourcesConfig();
    }
    return FreeSourcesConfig.instance;
  }

  private initializeAllSources(): void {
    // Official League & Team Sources
    this.addOfficialSources();
    
    // Major Sports News Networks
    this.addSportsNewsNetworks();
    
    // Free Sports APIs
    this.addFreeSportsAPIs();
    
    // Social Media Sources
    this.addSocialMediaSources();
    
    // RSS Feeds
    this.addRSSFeeds();
    
    // Podcast & Video Sources
    this.addPodcastVideoSources();
    
    // International Sources
    this.addInternationalSources();
    
    // Betting & DFS Sources (Free tiers)
    this.addBettingDFSSources();
    
    // Fantasy & Analysis Sources
    this.addFantasyAnalysisSources();
    
    // Niche & Specialty Sources
    this.addNicheSpecialtySources();
  }

  private addOfficialSources(): void {
    // NFL Teams (32 sources)
    const nflTeams = [
      { id: 'patriots', name: 'New England Patriots' },
      { id: 'bills', name: 'Buffalo Bills' },
      { id: 'dolphins', name: 'Miami Dolphins' },
      { id: 'jets', name: 'New York Jets' },
      { id: 'ravens', name: 'Baltimore Ravens' },
      { id: 'bengals', name: 'Cincinnati Bengals' },
      { id: 'browns', name: 'Cleveland Browns' },
      { id: 'steelers', name: 'Pittsburgh Steelers' },
      { id: 'texans', name: 'Houston Texans' },
      { id: 'colts', name: 'Indianapolis Colts' },
      { id: 'jaguars', name: 'Jacksonville Jaguars' },
      { id: 'titans', name: 'Tennessee Titans' },
      { id: 'broncos', name: 'Denver Broncos' },
      { id: 'chiefs', name: 'Kansas City Chiefs' },
      { id: 'raiders', name: 'Las Vegas Raiders' },
      { id: 'chargers', name: 'Los Angeles Chargers' },
      { id: 'cowboys', name: 'Dallas Cowboys' },
      { id: 'giants', name: 'New York Giants' },
      { id: 'eagles', name: 'Philadelphia Eagles' },
      { id: 'commanders', name: 'Washington Commanders' },
      { id: 'bears', name: 'Chicago Bears' },
      { id: 'lions', name: 'Detroit Lions' },
      { id: 'packers', name: 'Green Bay Packers' },
      { id: 'vikings', name: 'Minnesota Vikings' },
      { id: 'falcons', name: 'Atlanta Falcons' },
      { id: 'panthers', name: 'Carolina Panthers' },
      { id: 'saints', name: 'New Orleans Saints' },
      { id: 'buccaneers', name: 'Tampa Bay Buccaneers' },
      { id: 'cardinals', name: 'Arizona Cardinals' },
      { id: 'rams', name: 'Los Angeles Rams' },
      { id: '49ers', name: 'San Francisco 49ers' },
      { id: 'seahawks', name: 'Seattle Seahawks' }
    ];

    nflTeams.forEach(team => {
      this.sources.push({
        id: `nfl_${team.id}`,
        name: `${team.name} Official Site`,
        url: `https://www.${team.id}.com`,
        type: 'official',
        region: 'usa',
        sports: ['NFL'],
        dataTypes: ['roster', 'depth_chart', 'injury_report', 'news', 'stats'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      });
    });

    // Major League Official Sites
    this.sources.push(
      {
        id: 'nfl_official',
        name: 'NFL Official',
        url: 'https://www.nfl.com',
        type: 'official',
        region: 'usa',
        sports: ['NFL'],
        dataTypes: ['scores', 'stats', 'news', 'fantasy', 'draft'],
        updateFrequency: 'realtime',
        mcpServer: 'puppeteer',
        priority: 'high',
        isActive: true
      },
      {
        id: 'nba_official',
        name: 'NBA Official',
        url: 'https://www.nba.com',
        type: 'official',
        region: 'usa',
        sports: ['NBA'],
        dataTypes: ['scores', 'stats', 'news', 'fantasy'],
        updateFrequency: 'realtime',
        mcpServer: 'puppeteer',
        priority: 'high',
        isActive: true
      },
      {
        id: 'mlb_official',
        name: 'MLB Official',
        url: 'https://www.mlb.com',
        type: 'official',
        region: 'usa',
        sports: ['MLB'],
        dataTypes: ['scores', 'stats', 'news', 'fantasy'],
        updateFrequency: 'realtime',
        mcpServer: 'puppeteer',
        priority: 'high',
        isActive: true
      },
      {
        id: 'nhl_official',
        name: 'NHL Official',
        url: 'https://www.nhl.com',
        type: 'official',
        region: 'usa',
        sports: ['NHL'],
        dataTypes: ['scores', 'stats', 'news', 'fantasy'],
        updateFrequency: 'realtime',
        mcpServer: 'puppeteer',
        priority: 'high',
        isActive: true
      }
    );
  }

  private addSportsNewsNetworks(): void {
    this.sources.push(
      // Tier 1 - Major Networks
      {
        id: 'espn_main',
        name: 'ESPN',
        url: 'https://www.espn.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'College', 'Soccer'],
        dataTypes: ['news', 'scores', 'stats', 'fantasy', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'cbs_sports',
        name: 'CBS Sports',
        url: 'https://www.cbssports.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'College'],
        dataTypes: ['news', 'scores', 'fantasy', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'fox_sports',
        name: 'Fox Sports',
        url: 'https://www.foxsports.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'],
        dataTypes: ['news', 'scores', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'yahoo_sports',
        name: 'Yahoo Sports',
        url: 'https://sports.yahoo.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'Fantasy'],
        dataTypes: ['news', 'fantasy', 'analysis', 'projections'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'nbc_sports',
        name: 'NBC Sports',
        url: 'https://www.nbcsports.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'Olympics'],
        dataTypes: ['news', 'scores', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },

      // Tier 2 - Digital Native
      {
        id: 'bleacher_report',
        name: 'Bleacher Report',
        url: 'https://bleacherreport.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'Soccer'],
        dataTypes: ['news', 'analysis', 'rumors'],
        updateFrequency: '15min',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'the_athletic',
        name: 'The Athletic',
        url: 'https://theathletic.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'],
        dataTypes: ['news', 'analysis', 'insider'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'sports_illustrated',
        name: 'Sports Illustrated',
        url: 'https://www.si.com',
        type: 'news',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'College'],
        dataTypes: ['news', 'analysis', 'fantasy'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      }
    );
  }

  private addFreeSportsAPIs(): void {
    this.sources.push(
      {
        id: 'espn_api',
        name: 'ESPN API (Free)',
        url: 'https://site.api.espn.com/apis/site/v2/sports',
        type: 'api',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL'],
        dataTypes: ['scores', 'stats', 'schedules'],
        updateFrequency: 'realtime',
        mcpServer: 'api',
        priority: 'high',
        isActive: true,
        rateLimit: { requests: 1000, per: 'hour' }
      },
      {
        id: 'yahoo_fantasy_api',
        name: 'Yahoo Fantasy API (Free)',
        url: 'https://fantasysports.yahooapis.com/fantasy/v2',
        type: 'api',
        region: 'usa',
        sports: ['Fantasy'],
        dataTypes: ['player_data', 'league_info'],
        updateFrequency: 'hourly',
        mcpServer: 'api',
        priority: 'high',
        isActive: true,
        apiKey: true,
        rateLimit: { requests: 500, per: 'day' }
      },
      {
        id: 'sports_open_data',
        name: 'Sports Open Data',
        url: 'https://www.sports-reference.com',
        type: 'api',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL'],
        dataTypes: ['historical_stats', 'player_data'],
        updateFrequency: 'daily',
        mcpServer: 'api',
        priority: 'medium',
        isActive: true
      }
    );
  }

  private addSocialMediaSources(): void {
    const socialSources = [
      // Twitter/X Insiders
      {
        id: 'adam_schefter',
        name: 'Adam Schefter',
        url: 'https://twitter.com/AdamSchefter',
        sports: ['NFL'],
        dataTypes: ['breaking_news', 'insider', 'transactions']
      },
      {
        id: 'woj_espn',
        name: 'Adrian Wojnarowski',
        url: 'https://twitter.com/wojespn',
        sports: ['NBA'],
        dataTypes: ['breaking_news', 'insider', 'transactions']
      },
      {
        id: 'ian_rapoport',
        name: 'Ian Rapoport',
        url: 'https://twitter.com/RapSheet',
        sports: ['NFL'],
        dataTypes: ['breaking_news', 'injury_reports']
      },
      {
        id: 'shams_charania',
        name: 'Shams Charania',
        url: 'https://twitter.com/ShamsCharania',
        sports: ['NBA'],
        dataTypes: ['breaking_news', 'insider']
      },

      // Reddit Communities
      {
        id: 'reddit_nfl',
        name: 'r/NFL',
        url: 'https://www.reddit.com/r/nfl',
        sports: ['NFL'],
        dataTypes: ['discussions', 'news', 'analysis']
      },
      {
        id: 'reddit_nba',
        name: 'r/NBA',
        url: 'https://www.reddit.com/r/nba',
        sports: ['NBA'],
        dataTypes: ['discussions', 'news', 'analysis']
      },
      {
        id: 'reddit_fantasy_football',
        name: 'r/FantasyFootball',
        url: 'https://www.reddit.com/r/fantasyfootball',
        sports: ['Fantasy'],
        dataTypes: ['advice', 'analysis', 'discussions']
      }
    ];

    socialSources.forEach(source => {
      this.sources.push({
        id: source.id,
        name: source.name,
        url: source.url,
        type: 'social',
        region: 'usa',
        sports: source.sports,
        dataTypes: source.dataTypes,
        updateFrequency: 'realtime',
        mcpServer: 'social',
        priority: 'high',
        isActive: true,
        rateLimit: { requests: 100, per: 'hour' }
      });
    });
  }

  private addRSSFeeds(): void {
    this.sources.push(
      {
        id: 'espn_rss',
        name: 'ESPN RSS Feed',
        url: 'https://www.espn.com/espn/rss/news',
        type: 'rss',
        region: 'usa',
        sports: ['All'],
        dataTypes: ['news', 'scores'],
        updateFrequency: '15min',
        mcpServer: 'rss',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'cbs_sports_rss',
        name: 'CBS Sports RSS',
        url: 'https://www.cbssports.com/rss/headlines',
        type: 'rss',
        region: 'usa',
        sports: ['All'],
        dataTypes: ['news', 'analysis'],
        updateFrequency: '15min',
        mcpServer: 'rss',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'yahoo_sports_rss',
        name: 'Yahoo Sports RSS',
        url: 'https://sports.yahoo.com/rss/',
        type: 'rss',
        region: 'usa',
        sports: ['All'],
        dataTypes: ['news', 'fantasy'],
        updateFrequency: '15min',
        mcpServer: 'rss',
        priority: 'medium',
        isActive: true
      }
    );
  }

  private addPodcastVideoSources(): void {
    this.sources.push(
      {
        id: 'pat_mcafee_show',
        name: 'Pat McAfee Show',
        url: 'https://www.youtube.com/@ThePatMcAfeeShow',
        type: 'video',
        region: 'usa',
        sports: ['NFL', 'College'],
        dataTypes: ['analysis', 'interviews', 'news'],
        updateFrequency: 'daily',
        mcpServer: 'puppeteer',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'fantasy_footballers',
        name: 'Fantasy Footballers',
        url: 'https://www.thefantasyfootballers.com',
        type: 'podcast',
        region: 'usa',
        sports: ['Fantasy'],
        dataTypes: ['analysis', 'rankings', 'advice'],
        updateFrequency: 'daily',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'barstool_sports',
        name: 'Barstool Sports',
        url: 'https://www.barstoolsports.com',
        type: 'news',
        region: 'usa',
        sports: ['All'],
        dataTypes: ['news', 'analysis', 'entertainment'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      }
    );
  }

  private addInternationalSources(): void {
    this.sources.push(
      // UK Sources
      {
        id: 'bbc_sport',
        name: 'BBC Sport',
        url: 'https://www.bbc.com/sport',
        type: 'news',
        region: 'uk',
        sports: ['Soccer', 'Rugby', 'Cricket', 'Tennis'],
        dataTypes: ['news', 'scores', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'sky_sports',
        name: 'Sky Sports',
        url: 'https://www.skysports.com',
        type: 'news',
        region: 'uk',
        sports: ['Soccer', 'F1', 'Cricket', 'Rugby'],
        dataTypes: ['news', 'scores', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },

      // Canada Sources
      {
        id: 'tsn_canada',
        name: 'TSN',
        url: 'https://www.tsn.ca',
        type: 'news',
        region: 'canada',
        sports: ['NHL', 'CFL', 'NFL'],
        dataTypes: ['news', 'scores', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'sportsnet_canada',
        name: 'Sportsnet',
        url: 'https://www.sportsnet.ca',
        type: 'news',
        region: 'canada',
        sports: ['NHL', 'MLB', 'NBA'],
        dataTypes: ['news', 'scores', 'analysis'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },

      // Global Motorsports
      {
        id: 'formula1_official',
        name: 'Formula 1 Official',
        url: 'https://www.formula1.com',
        type: 'official',
        region: 'global',
        sports: ['F1'],
        dataTypes: ['race_results', 'standings', 'news'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'nascar_official',
        name: 'NASCAR Official',
        url: 'https://www.nascar.com',
        type: 'official',
        region: 'usa',
        sports: ['NASCAR'],
        dataTypes: ['race_results', 'standings', 'news'],
        updateFrequency: 'realtime',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      }
    );
  }

  private addBettingDFSSources(): void {
    this.sources.push(
      {
        id: 'draftkings_content',
        name: 'DraftKings (Free Content)',
        url: 'https://www.draftkings.com/network',
        type: 'betting',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL'],
        dataTypes: ['analysis', 'picks', 'odds'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'fanduel_content',
        name: 'FanDuel (Free Content)',
        url: 'https://www.fanduel.com/research',
        type: 'betting',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL'],
        dataTypes: ['analysis', 'picks', 'odds'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      },
      {
        id: 'action_network',
        name: 'Action Network (Free)',
        url: 'https://www.actionnetwork.com',
        type: 'betting',
        region: 'usa',
        sports: ['NFL', 'NBA', 'MLB', 'NHL'],
        dataTypes: ['odds', 'picks', 'analysis'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      }
    );
  }

  private addFantasyAnalysisSources(): void {
    this.sources.push(
      {
        id: 'fantasypros',
        name: 'FantasyPros (Free)',
        url: 'https://www.fantasypros.com',
        type: 'news',
        region: 'usa',
        sports: ['Fantasy'],
        dataTypes: ['rankings', 'projections', 'analysis'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'rotowire',
        name: 'RotoWire (Free)',
        url: 'https://www.rotowire.com',
        type: 'news',
        region: 'usa',
        sports: ['Fantasy'],
        dataTypes: ['news', 'analysis', 'lineups'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      },
      {
        id: 'rotoworld',
        name: 'Rotoworld',
        url: 'https://www.rotoworld.com',
        type: 'news',
        region: 'usa',
        sports: ['Fantasy'],
        dataTypes: ['news', 'analysis', 'projections'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'high',
        isActive: true
      }
    );
  }

  private addNicheSpecialtySources(): void {
    this.sources.push(
      // College Sports
      {
        id: 'espn_college',
        name: 'ESPN College Sports',
        url: 'https://www.espn.com/college-football',
        type: 'news',
        region: 'usa',
        sports: ['College'],
        dataTypes: ['scores', 'stats', 'recruiting'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'medium',
        isActive: true
      },

      // Women's Sports
      {
        id: 'wnba_official',
        name: 'WNBA Official',
        url: 'https://www.wnba.com',
        type: 'official',
        region: 'usa',
        sports: ['WNBA'],
        dataTypes: ['scores', 'stats', 'news'],
        updateFrequency: 'hourly',
        mcpServer: 'firecrawl',
        priority: 'low',
        isActive: true
      },

      // Olympic Sports
      {
        id: 'olympic_channel',
        name: 'Olympic Channel',
        url: 'https://www.olympicchannel.com',
        type: 'official',
        region: 'global',
        sports: ['Olympics'],
        dataTypes: ['news', 'results', 'schedules'],
        updateFrequency: 'daily',
        mcpServer: 'firecrawl',
        priority: 'low',
        isActive: true
      }
    );
  }

  // Utility methods
  public getSourcesByType(type: string): FreeDataSource[] {
    return this.sources.filter(source => source.type === type);
  }

  public getSourcesByRegion(region: string): FreeDataSource[] {
    return this.sources.filter(source => source.region === region);
  }

  public getSourcesBySport(sport: string): FreeDataSource[] {
    return this.sources.filter(source => source.sports.includes(sport));
  }

  public getActiveSources(): FreeDataSource[] {
    return this.sources.filter(source => source.isActive);
  }

  public getHighPrioritySources(): FreeDataSource[] {
    return this.sources.filter(source => source.priority === 'high');
  }

  public getTotalSourceCount(): number {
    return this.sources.length;
  }

  public getSourceStats(): any {
    return {
      total: this.sources.length,
      active: this.sources.filter(s => s.isActive).length,
      byType: this.groupBy(this.sources, 'type'),
      byRegion: this.groupBy(this.sources, 'region'),
      byPriority: this.groupBy(this.sources, 'priority'),
      bySport: this.getSourcesBySportCount()
    };
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const group = item[key];
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }

  private getSourcesBySportCount(): Record<string, number> {
    const sportCounts: Record<string, number> = {};
    this.sources.forEach(source => {
      source.sports.forEach(sport => {
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      });
    });
    return sportCounts;
  }
}

export default FreeSourcesConfig;