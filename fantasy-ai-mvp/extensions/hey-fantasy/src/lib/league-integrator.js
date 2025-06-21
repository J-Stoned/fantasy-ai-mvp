// 🏈 Universal Fantasy League Integrator
// Supports Yahoo, ESPN, CBS, Sleeper, NFL, DraftKings, FanDuel

export class LeagueIntegrator {
  constructor() {
    this.platforms = {
      yahoo: new YahooIntegration(),
      espn: new ESPNIntegration(),
      cbs: new CBSIntegration(),
      sleeper: new SleeperIntegration(),
      nfl: new NFLIntegration(),
      draftkings: new DraftKingsIntegration(),
      fanduel: new FanDuelIntegration()
    };
  }

  // Extract data from current page
  async extractPageData(tab) {
    const platform = this.detectPlatform(tab.url);
    if (!platform || !this.platforms[platform]) {
      throw new Error('Unsupported platform');
    }

    return await this.platforms[platform].extractPageData(tab);
  }

  // Sync all leagues across platforms
  async syncAllPlatforms(enabledPlatforms) {
    const allLeagues = [];

    for (const platform of enabledPlatforms) {
      try {
        const leagues = await this.platforms[platform].getLeagues();
        allLeagues.push(...leagues.map(league => ({
          ...league,
          platform
        })));
      } catch (error) {
        console.error(`Failed to sync ${platform}:`, error);
      }
    }

    return allLeagues;
  }

  // Analyze current page
  async analyzePage(tab, platform) {
    const integration = this.platforms[platform];
    if (!integration) return { suggestions: [] };

    return await integration.analyzePage(tab);
  }

  // Detect platform from URL
  detectPlatform(url) {
    if (url.includes('yahoo.com')) return 'yahoo';
    if (url.includes('espn.com')) return 'espn';
    if (url.includes('cbssports.com')) return 'cbs';
    if (url.includes('sleeper.app')) return 'sleeper';
    if (url.includes('nfl.com')) return 'nfl';
    if (url.includes('draftkings.com')) return 'draftkings';
    if (url.includes('fanduel.com')) return 'fanduel';
    return null;
  }
}

// Base class for platform integrations
class PlatformIntegration {
  async extractPageData(tab) {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: this.extractDataFunction,
      args: [this.selectors]
    });

    return result[0]?.result || {};
  }

  async getLeagues() {
    // Override in subclasses
    return [];
  }

  async analyzePage(tab) {
    // Override in subclasses
    return { suggestions: [] };
  }
}

// Yahoo Fantasy Integration
class YahooIntegration extends PlatformIntegration {
  constructor() {
    super();
    this.selectors = {
      leagueId: '[data-league-id]',
      teamName: '.Fz-sm',
      playerRows: '.player-row',
      playerName: '.player-name',
      playerPosition: '.player-position',
      playerTeam: '.player-team',
      score: '.score',
      standings: '.standings-table'
    };
  }

  extractDataFunction(selectors) {
    const data = {
      leagueId: document.querySelector(selectors.leagueId)?.getAttribute('data-league-id'),
      teamName: document.querySelector(selectors.teamName)?.textContent,
      players: [],
      scoringSettings: {}
    };

    document.querySelectorAll(selectors.playerRows).forEach(row => {
      data.players.push({
        name: row.querySelector(selectors.playerName)?.textContent?.trim(),
        position: row.querySelector(selectors.playerPosition)?.textContent?.trim(),
        team: row.querySelector(selectors.playerTeam)?.textContent?.trim()
      });
    });

    return data;
  }

  async getLeagues() {
    // Fetch user's Yahoo leagues
    return [
      {
        id: 'yahoo-league-1',
        name: 'Championship League',
        teams: 12,
        scoringType: 'PPR',
        currentWeek: 15
      }
    ];
  }

  async analyzePage(tab) {
    const data = await this.extractPageData(tab);
    const suggestions = [];

    // Analyze lineup
    const emptySlots = data.players.filter(p => !p.name).length;
    if (emptySlots > 0) {
      suggestions.push(`You have ${emptySlots} empty roster spots!`);
    }

    return { suggestions, data };
  }
}

// ESPN Fantasy Integration
class ESPNIntegration extends PlatformIntegration {
  constructor() {
    super();
    this.selectors = {
      leagueId: '.league-header',
      teamName: '.team-name',
      playerRows: '.player-row',
      playerName: '.player-name',
      playerStats: '.player-stats'
    };
  }

  extractDataFunction(selectors) {
    const data = {
      leagueId: window.location.pathname.match(/leagueId=(\d+)/)?.[1],
      teamName: document.querySelector(selectors.teamName)?.textContent,
      players: []
    };

    document.querySelectorAll(selectors.playerRows).forEach(row => {
      data.players.push({
        name: row.querySelector(selectors.playerName)?.textContent?.trim(),
        stats: row.querySelector(selectors.playerStats)?.textContent?.trim()
      });
    });

    return data;
  }

  async getLeagues() {
    return [
      {
        id: 'espn-league-1',
        name: 'Friends League',
        teams: 10,
        scoringType: 'Standard',
        currentWeek: 15
      }
    ];
  }
}

// Sleeper Integration
class SleeperIntegration extends PlatformIntegration {
  constructor() {
    super();
    this.selectors = {
      leagueData: '[data-league]',
      roster: '.roster-player',
      playerName: '.player-name',
      matchupScore: '.matchup-score'
    };
  }

  extractDataFunction(selectors) {
    const data = {
      leagueId: window.location.pathname.split('/')[2],
      players: [],
      matchupScore: document.querySelector(selectors.matchupScore)?.textContent
    };

    document.querySelectorAll(selectors.roster).forEach(player => {
      data.players.push({
        name: player.querySelector(selectors.playerName)?.textContent?.trim()
      });
    });

    return data;
  }

  async getLeagues() {
    // Sleeper API integration
    return [
      {
        id: 'sleeper-league-1',
        name: 'Dynasty Masters',
        teams: 14,
        scoringType: 'Dynasty PPR',
        currentWeek: 15
      }
    ];
  }
}

// CBS Sports Integration
class CBSIntegration extends PlatformIntegration {
  constructor() {
    super();
    this.selectors = {
      leagueName: '.league-name',
      roster: '.roster-grid',
      playerInfo: '.player-info'
    };
  }

  extractDataFunction(selectors) {
    return {
      leagueName: document.querySelector(selectors.leagueName)?.textContent,
      rosterCount: document.querySelectorAll(selectors.playerInfo).length
    };
  }
}

// NFL.com Integration
class NFLIntegration extends PlatformIntegration {
  constructor() {
    super();
    this.selectors = {
      teamRoster: '.team-roster',
      playerCard: '.player-card',
      scoreProjection: '.projection'
    };
  }

  extractDataFunction(selectors) {
    const projections = [];
    document.querySelectorAll(selectors.scoreProjection).forEach(proj => {
      projections.push(parseFloat(proj.textContent) || 0);
    });

    return {
      totalProjection: projections.reduce((a, b) => a + b, 0),
      playerCount: projections.length
    };
  }
}

// DraftKings DFS Integration
class DraftKingsIntegration extends PlatformIntegration {
  constructor() {
    super();
    this.selectors = {
      contestName: '.contest-name',
      lineup: '.lineup-player',
      salary: '.player-salary',
      remainingSalary: '.remaining-salary'
    };
  }

  extractDataFunction(selectors) {
    const lineup = [];
    document.querySelectorAll(selectors.lineup).forEach(player => {
      lineup.push({
        name: player.querySelector('.name')?.textContent,
        salary: parseInt(player.querySelector(selectors.salary)?.textContent?.replace(/\D/g, '')) || 0
      });
    });

    return {
      contestName: document.querySelector(selectors.contestName)?.textContent,
      lineup,
      remainingSalary: document.querySelector(selectors.remainingSalary)?.textContent
    };
  }

  async analyzePage(tab) {
    const data = await this.extractPageData(tab);
    const suggestions = [];

    if (data.remainingSalary && parseInt(data.remainingSalary) > 0) {
      suggestions.push(`You have $${data.remainingSalary} in unused salary!`);
    }

    return { suggestions, data };
  }
}

// FanDuel DFS Integration
class FanDuelIntegration extends PlatformIntegration {
  constructor() {
    super();
    this.selectors = {
      contestDetails: '.contest-details',
      lineupSlot: '.lineup-slot',
      playerPool: '.player-pool'
    };
  }

  extractDataFunction(selectors) {
    const emptySlots = document.querySelectorAll(`${selectors.lineupSlot}:empty`).length;
    
    return {
      contest: document.querySelector(selectors.contestDetails)?.textContent,
      emptySlots,
      totalSlots: document.querySelectorAll(selectors.lineupSlot).length
    };
  }

  async analyzePage(tab) {
    const data = await this.extractPageData(tab);
    const suggestions = [];

    if (data.emptySlots > 0) {
      suggestions.push(`Complete your lineup - ${data.emptySlots} slots remaining!`);
    }

    return { suggestions, data };
  }
}