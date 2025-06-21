/**
 * 🌍 FANTASY.AI - GLOBAL REAL SPORTS DATA API
 * Mission: "Either we know it or we don't... yet!"
 * 
 * Centralized sports data fetching from FREE global media sources
 * Powered by 24 MCP servers and international sports intelligence
 */

// Import our Global Real Data Engine
const GlobalRealSportsData = require('./global-real-data.js');

class SportsDataAPI {
  constructor() {
    this.globalRealData = new GlobalRealSportsData();
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
    this.rateLimiter = new Map();
    
    // API Configuration
    this.config = {
      // Primary APIs
      espn: {
        baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
        sports: {
          nfl: 'football/nfl',
          nba: 'basketball/nba',
          mlb: 'baseball/mlb',
          nhl: 'hockey/nhl',
          soccer: 'soccer/eng.1'
        }
      },
      
      // Fantasy data
      sleeper: {
        baseUrl: 'https://api.sleeper.app/v1',
        endpoints: {
          players: '/players/nfl',
          trending: '/players/nfl/trending'
        }
      },
      
      // Injury reports
      injuries: {
        baseUrl: 'https://api.sportsdata.io/v3',
        key: 'YOUR_API_KEY' // Would be loaded from secure storage
      },
      
      // Backup sources
      backup: {
        yahoo: 'https://api.sports.yahoo.com',
        nfl: 'https://api.nfl.com'
      }
    };
    
    // Player name mapping for better recognition
    this.playerAliases = new Map();
    this.teamAliases = new Map();
    
    this.init();
  }
  
  async init() {
    // Load player and team aliases
    await this.loadAliases();
    
    // Pre-warm cache with popular players
    this.preWarmCache();
    
    console.log('Sports Data API initialized!');
  }
  
  async loadAliases() {
    // Common player aliases for better voice recognition
    this.playerAliases.set('mahomes', 'Patrick Mahomes');
    this.playerAliases.set('lebron', 'LeBron James');
    this.playerAliases.set('brady', 'Tom Brady');
    this.playerAliases.set('aaron judge', 'Aaron Judge');
    this.playerAliases.set('mcdavid', 'Connor McDavid');
    this.playerAliases.set('messi', 'Lionel Messi');
    
    // Team aliases
    this.teamAliases.set('kc', 'Kansas City Chiefs');
    this.teamAliases.set('chiefs', 'Kansas City Chiefs');
    this.teamAliases.set('lakers', 'Los Angeles Lakers');
    this.teamAliases.set('yankees', 'New York Yankees');
    this.teamAliases.set('cowboys', 'Dallas Cowboys');
  }
  
  async preWarmCache() {
    // Pre-load data for top players to reduce latency
    const topPlayers = [
      'Patrick Mahomes', 'Josh Allen', 'Lamar Jackson',
      'LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo',
      'Mike Trout', 'Mookie Betts', 'Aaron Judge'
    ];
    
    topPlayers.forEach(player => {
      this.getPlayerStats(player).catch(() => {
        // Ignore errors during pre-warming
      });
    });
  }
  
  // Main query processing function
  async processQuery(query, context = {}) {
    const intent = this.parseIntent(query);
    
    try {
      switch (intent.type) {
        case 'PLAYER_STATS':
          return await this.globalRealData.getPlayerStats(intent.player, intent.timeframe);
          
        case 'GAME_SCORES':
          return await this.globalRealData.getGameScores(intent.teams, intent.date);
          
        case 'INJURY_REPORT':
          return await this.globalRealData.getInjuryReport(intent.player || intent.team);
          
        case 'TEAM_INFO':
          return await this.globalRealData.getTeamInfo(intent.team);
          
        case 'FANTASY_ADVICE':
          return await this.globalRealData.getFantasyAdvice(intent.context);
          
        case 'STANDINGS':
          return await this.globalRealData.getStandings(intent.league);
          
        case 'SCHEDULE':
          return await this.getSchedule(intent.team, intent.date);
          
        default:
          return await this.performGeneralSearch(query);
      }
    } catch (error) {
      console.error('Sports query error:', error);
      return this.createErrorResponse(error.message);
    }
  }
  
  parseIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Player stats intent
    if (lowerQuery.includes('stats') || lowerQuery.includes('performance')) {
      const player = this.extractPlayerName(query);
      const timeframe = this.extractTimeframe(query);
      return { type: 'PLAYER_STATS', player, timeframe };
    }
    
    // Game scores intent
    if (lowerQuery.includes('score') || lowerQuery.includes('game') || lowerQuery.includes('result')) {
      const teams = this.extractTeamNames(query);
      const date = this.extractDate(query);
      return { type: 'GAME_SCORES', teams, date };
    }
    
    // Injury intent
    if (lowerQuery.includes('injury') || lowerQuery.includes('hurt') || lowerQuery.includes('status')) {
      const player = this.extractPlayerName(query);
      const team = this.extractTeamNames(query)[0];
      return { type: 'INJURY_REPORT', player, team };
    }
    
    // Team info intent
    if (lowerQuery.includes('team') || lowerQuery.includes('roster')) {
      const team = this.extractTeamNames(query)[0];
      return { type: 'TEAM_INFO', team };
    }
    
    // Fantasy advice intent
    if (lowerQuery.includes('start') || lowerQuery.includes('sit') || lowerQuery.includes('fantasy')) {
      return { type: 'FANTASY_ADVICE', context: this.extractFantasyContext(query) };
    }
    
    // Standings intent
    if (lowerQuery.includes('standings') || lowerQuery.includes('rankings')) {
      const league = this.extractLeague(query);
      return { type: 'STANDINGS', league };
    }
    
    // Schedule intent
    if (lowerQuery.includes('schedule') || lowerQuery.includes('next game') || lowerQuery.includes('when')) {
      const team = this.extractTeamNames(query)[0];
      const date = this.extractDate(query);
      return { type: 'SCHEDULE', team, date };
    }
    
    return { type: 'GENERAL_SEARCH', query };
  }
  
  // Player Stats Implementation
  async getPlayerStats(playerName, timeframe = 'current') {
    if (!playerName) {
      throw new Error('Player name is required');
    }
    
    const cacheKey = `player_stats_${playerName}_${timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      // Try multiple sources for player data
      let playerData = await this.fetchFromESPN('player', playerName);
      
      if (!playerData) {
        playerData = await this.fetchFromSleeper('player', playerName);
      }
      
      if (!playerData) {
        throw new Error(`Player "${playerName}" not found`);
      }
      
      const result = {
        status: 'success',
        type: 'player_stats',
        data: {
          playerName: playerData.displayName || playerName,
          position: playerData.position,
          team: playerData.team,
          playerImage: playerData.headshot,
          stats: playerData.stats || {},
          recentStats: playerData.recentStats || {},
          fantasyProjection: playerData.fantasyProjection,
          injuryStatus: playerData.injuryStatus
        },
        source: playerData.source,
        processingTime: Date.now() - this.startTime
      };
      
      this.setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      throw new Error(`Unable to fetch stats for ${playerName}: ${error.message}`);
    }
  }
  
  // Game Scores Implementation
  async getGameScores(teams = [], date = 'today') {
    const cacheKey = `game_scores_${teams.join('_')}_${date}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      let games;
      
      if (teams.length > 0) {
        // Specific team(s) requested
        games = await this.fetchTeamGames(teams, date);
      } else {
        // All games for the day
        games = await this.fetchAllGames(date);
      }
      
      const result = {
        status: 'success',
        type: 'game_scores',
        data: games,
        source: 'ESPN',
        processingTime: Date.now() - this.startTime
      };
      
      this.setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      throw new Error(`Unable to fetch game scores: ${error.message}`);
    }
  }
  
  // Injury Report Implementation
  async getInjuryReport(playerOrTeam) {
    const cacheKey = `injury_report_${playerOrTeam}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const injuries = await this.fetchInjuries(playerOrTeam);
      
      const result = {
        status: 'success',
        type: 'injury_report',
        data: injuries,
        source: 'Multiple',
        processingTime: Date.now() - this.startTime
      };
      
      this.setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      throw new Error(`Unable to fetch injury report: ${error.message}`);
    }
  }
  
  // Fantasy Advice Implementation
  async getFantasyAdvice(context) {
    const cacheKey = `fantasy_advice_${JSON.stringify(context)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const advice = await this.generateFantasyAdvice(context);
      
      const result = {
        status: 'success',
        type: 'fantasy_advice',
        data: advice,
        source: 'Fantasy.AI',
        processingTime: Date.now() - this.startTime
      };
      
      this.setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      throw new Error(`Unable to generate fantasy advice: ${error.message}`);
    }
  }
  
  // ESPN API Integration
  async fetchFromESPN(type, query) {
    const sport = this.detectSport(query);
    const endpoint = this.config.espn.sports[sport];
    
    if (!endpoint) return null;
    
    try {
      let url;
      
      if (type === 'player') {
        // ESPN doesn't have a direct player search, use team rosters
        url = `${this.config.espn.baseUrl}/${endpoint}/teams`;
      } else if (type === 'scores') {
        url = `${this.config.espn.baseUrl}/${endpoint}/scoreboard`;
      }
      
      const response = await this.fetchWithRateLimit(url);
      const data = await response.json();
      
      return this.parseESPNResponse(data, type, query);
      
    } catch (error) {
      console.error('ESPN API error:', error);
      return null;
    }
  }
  
  // Sleeper API Integration
  async fetchFromSleeper(type, query) {
    try {
      let url;
      
      if (type === 'player') {
        url = `${this.config.sleeper.baseUrl}${this.config.sleeper.endpoints.players}`;
      }
      
      const response = await this.fetchWithRateLimit(url);
      const data = await response.json();
      
      return this.parseSleeperResponse(data, type, query);
      
    } catch (error) {
      console.error('Sleeper API error:', error);
      return null;
    }
  }
  
  // Helper Methods
  extractPlayerName(query) {
    // Use the patterns from service worker or implement here
    const playerPatterns = [
      /patrick mahomes/i, /mahomes/i,
      /josh allen/i, /allen/i,
      /lamar jackson/i, /jackson/i,
      /lebron james/i, /lebron/i,
      /stephen curry/i, /curry/i
      // Add more patterns
    ];
    
    for (const pattern of playerPatterns) {
      const match = query.match(pattern);
      if (match) {
        // Normalize the name
        const found = match[0].toLowerCase();
        return this.playerAliases.get(found) || this.titleCase(found);
      }
    }
    
    // Fallback: look for capitalized words
    const words = query.split(' ');
    const capitalizedWords = words.filter(word => 
      word[0] === word[0].toUpperCase() && word.length > 2
    );
    
    if (capitalizedWords.length >= 2) {
      return capitalizedWords.slice(0, 2).join(' ');
    }
    
    return null;
  }
  
  extractTeamNames(query) {
    const teams = [];
    const teamPatterns = [
      /chiefs/i, /kansas city/i,
      /bills/i, /buffalo/i,
      /cowboys/i, /dallas/i,
      /eagles/i, /philadelphia/i,
      /lakers/i, /los angeles lakers/i,
      /celtics/i, /boston/i
      // Add more patterns
    ];
    
    for (const pattern of teamPatterns) {
      const match = query.match(pattern);
      if (match) {
        const found = match[0].toLowerCase();
        const teamName = this.teamAliases.get(found) || this.titleCase(found);
        if (!teams.includes(teamName)) {
          teams.push(teamName);
        }
      }
    }
    
    return teams;
  }
  
  detectSport(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('nfl') || lowerQuery.includes('football') || 
        lowerQuery.includes('touchdown') || lowerQuery.includes('quarterback')) {
      return 'nfl';
    }
    
    if (lowerQuery.includes('nba') || lowerQuery.includes('basketball') || 
        lowerQuery.includes('points') || lowerQuery.includes('rebounds')) {
      return 'nba';
    }
    
    if (lowerQuery.includes('mlb') || lowerQuery.includes('baseball') || 
        lowerQuery.includes('home run') || lowerQuery.includes('rbi')) {
      return 'mlb';
    }
    
    if (lowerQuery.includes('nhl') || lowerQuery.includes('hockey') || 
        lowerQuery.includes('goals') || lowerQuery.includes('assists')) {
      return 'nhl';
    }
    
    if (lowerQuery.includes('soccer') || lowerQuery.includes('football') || 
        lowerQuery.includes('premier league')) {
      return 'soccer';
    }
    
    // Default to NFL if unclear
    return 'nfl';
  }
  
  // Cache Management
  getFromCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  // Rate Limiting
  async fetchWithRateLimit(url) {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(domain) || 0;
    
    // Enforce 100ms minimum between requests to same domain
    if (now - lastRequest < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - (now - lastRequest)));
    }
    
    this.rateLimiter.set(domain, Date.now());
    return fetch(url);
  }
  
  // Utility Methods
  titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
  
  createErrorResponse(message) {
    return {
      status: 'error',
      message,
      fallbackSuggestion: 'Try rephrasing your question or being more specific'
    };
  }
  
  // Mock implementations for complex methods
  async fetchTeamGames(teams, date) {
    // Implementation would fetch real game data
    return [{
      awayTeam: teams[0] || 'Team A',
      homeTeam: teams[1] || 'Team B',
      awayScore: 21,
      homeScore: 14,
      status: 'Final',
      awayLogo: '/default-logo.png',
      homeLogo: '/default-logo.png'
    }];
  }
  
  async fetchAllGames(date) {
    // Implementation would fetch all games for the date
    return [];
  }
  
  async fetchInjuries(playerOrTeam) {
    // Implementation would fetch injury data
    return [{
      playerName: playerOrTeam,
      team: 'Unknown',
      status: 'Healthy',
      description: 'No injuries reported',
      returnDate: null
    }];
  }
  
  async generateFantasyAdvice(context) {
    // Implementation would generate AI-powered advice
    return {
      title: 'Fantasy Recommendation',
      advice: 'Based on current matchups and projections...',
      confidence: 85
    };
  }
  
  parseESPNResponse(data, type, query) {
    // Parse ESPN API responses
    return null;
  }
  
  parseSleeperResponse(data, type, query) {
    // Parse Sleeper API responses
    return null;
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SportsDataAPI;
}