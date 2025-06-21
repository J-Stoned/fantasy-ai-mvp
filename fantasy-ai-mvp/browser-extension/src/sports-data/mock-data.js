/**
 * HEY FANTASY - Mock Sports Data
 * Realistic mock data for development and testing
 */

class MockSportsData {
  constructor() {
    this.players = this.generateMockPlayers();
    this.teams = this.generateMockTeams();
    this.games = this.generateMockGames();
    this.injuries = this.generateMockInjuries();
  }
  
  generateMockPlayers() {
    return new Map([
      // NFL Players
      ['patrick mahomes', {
        displayName: 'Patrick Mahomes',
        position: 'QB',
        team: 'Kansas City Chiefs',
        headshot: '/images/mahomes.jpg',
        stats: {
          passing_yards: 4183,
          passing_tds: 31,
          completions: 329,
          attempts: 516,
          rating: 92.6
        },
        recentStats: {
          last_game_yards: 287,
          last_game_tds: 2,
          last_game_ints: 1
        },
        fantasyProjection: 24.8,
        fantasyPoints: 22.4,
        injuryStatus: 'Healthy',
        source: 'Mock'
      }],
      
      ['josh allen', {
        displayName: 'Josh Allen',
        position: 'QB',
        team: 'Buffalo Bills',
        headshot: '/images/allen.jpg',
        stats: {
          passing_yards: 3731,
          passing_tds: 29,
          rushing_yards: 523,
          rushing_tds: 15,
          rating: 96.3
        },
        recentStats: {
          last_game_yards: 304,
          last_game_tds: 3,
          rushing_yards: 41
        },
        fantasyProjection: 26.2,
        fantasyPoints: 28.6,
        injuryStatus: 'Healthy',
        source: 'Mock'
      }],
      
      ['tyreek hill', {
        displayName: 'Tyreek Hill',
        position: 'WR',
        team: 'Miami Dolphins',
        headshot: '/images/hill.jpg',
        stats: {
          receiving_yards: 1481,
          receiving_tds: 13,
          receptions: 119,
          targets: 171,
          yards_per_catch: 12.4
        },
        recentStats: {
          last_game_yards: 157,
          last_game_tds: 2,
          receptions: 8
        },
        fantasyProjection: 18.7,
        fantasyPoints: 24.3,
        injuryStatus: 'Healthy',
        source: 'Mock'
      }],
      
      // NBA Players
      ['lebron james', {
        displayName: 'LeBron James',
        position: 'SF',
        team: 'Los Angeles Lakers',
        headshot: '/images/lebron.jpg',
        stats: {
          points: 25.3,
          rebounds: 7.3,
          assists: 8.2,
          field_goal_pct: 0.543,
          three_point_pct: 0.412
        },
        recentStats: {
          last_game_points: 32,
          last_game_rebounds: 11,
          last_game_assists: 6
        },
        fantasyProjection: 48.7,
        fantasyPoints: 52.1,
        injuryStatus: 'Day-to-Day (ankle)',
        source: 'Mock'
      }],
      
      ['stephen curry', {
        displayName: 'Stephen Curry',
        position: 'PG',
        team: 'Golden State Warriors',
        headshot: '/images/curry.jpg',
        stats: {
          points: 26.4,
          rebounds: 4.5,
          assists: 5.1,
          field_goal_pct: 0.427,
          three_point_pct: 0.403,
          threes_made: 3.2
        },
        recentStats: {
          last_game_points: 31,
          last_game_threes: 7,
          last_game_assists: 5
        },
        fantasyProjection: 42.8,
        fantasyPoints: 39.6,
        injuryStatus: 'Healthy',
        source: 'Mock'
      }],
      
      // MLB Players
      ['aaron judge', {
        displayName: 'Aaron Judge',
        position: 'OF',
        team: 'New York Yankees',
        headshot: '/images/judge.jpg',
        stats: {
          home_runs: 37,
          rbi: 144,
          batting_avg: 0.267,
          ops: 0.906,
          runs: 108
        },
        recentStats: {
          last_game_hits: 2,
          last_game_hrs: 1,
          last_game_rbi: 3
        },
        fantasyProjection: 42.1,
        fantasyPoints: 38.9,
        injuryStatus: 'Healthy',
        source: 'Mock'
      }],
      
      ['mike trout', {
        displayName: 'Mike Trout',
        position: 'OF',
        team: 'Los Angeles Angels',
        headshot: '/images/trout.jpg',
        stats: {
          home_runs: 18,
          rbi: 44,
          batting_avg: 0.263,
          ops: 0.858,
          runs: 39
        },
        recentStats: {
          last_game_hits: 1,
          last_game_walks: 2,
          last_game_runs: 1
        },
        fantasyProjection: 35.2,
        fantasyPoints: 31.8,
        injuryStatus: 'Out (wrist surgery)',
        source: 'Mock'
      }]
    ]);
  }
  
  generateMockTeams() {
    return new Map([
      ['kansas city chiefs', {
        teamName: 'Kansas City Chiefs',
        sport: 'NFL',
        wins: 11,
        losses: 1,
        logo: '/images/chiefs-logo.png',
        lastGame: {
          result: 'W 27-19',
          opponent: 'Las Vegas Raiders',
          date: '2024-11-29'
        },
        nextGame: {
          opponent: 'Los Angeles Chargers',
          date: '2024-12-08',
          time: '8:20 PM ET'
        },
        source: 'Mock'
      }],
      
      ['buffalo bills', {
        teamName: 'Buffalo Bills',
        sport: 'NFL',
        wins: 10,
        losses: 2,
        logo: '/images/bills-logo.png',
        lastGame: {
          result: 'W 30-21',
          opponent: 'San Francisco 49ers',
          date: '2024-12-01'
        },
        nextGame: {
          opponent: 'Los Angeles Rams',
          date: '2024-12-08',
          time: '4:25 PM ET'
        },
        source: 'Mock'
      }],
      
      ['los angeles lakers', {
        teamName: 'Los Angeles Lakers',
        sport: 'NBA',
        wins: 13,
        losses: 11,
        logo: '/images/lakers-logo.png',
        lastGame: {
          result: 'L 119-122',
          opponent: 'Oklahoma City Thunder',
          date: '2024-11-29'
        },
        nextGame: {
          opponent: 'Utah Jazz',
          date: '2024-12-01',
          time: '9:00 PM ET'
        },
        source: 'Mock'
      }],
      
      ['golden state warriors', {
        teamName: 'Golden State Warriors',
        sport: 'NBA',
        wins: 12,
        losses: 11,
        logo: '/images/warriors-logo.png',
        lastGame: {
          result: 'W 123-118',
          opponent: 'Phoenix Suns',
          date: '2024-11-30'
        },
        nextGame: {
          opponent: 'Denver Nuggets',
          date: '2024-12-03',
          time: '10:00 PM ET'
        },
        source: 'Mock'
      }]
    ]);
  }
  
  generateMockGames() {
    return [
      {
        id: 'game_1',
        sport: 'NFL',
        awayTeam: 'Buffalo Bills',
        homeTeam: 'Kansas City Chiefs',
        awayScore: 24,
        homeScore: 30,
        status: 'Final',
        date: '2024-11-17',
        awayLogo: '/images/bills-logo.png',
        homeLogo: '/images/chiefs-logo.png',
        awayRecord: '9-2',
        homeRecord: '9-1'
      },
      {
        id: 'game_2',
        sport: 'NBA',
        awayTeam: 'Los Angeles Lakers',
        homeTeam: 'Boston Celtics',
        awayScore: 115,
        homeScore: 119,
        status: 'Final',
        date: '2024-11-18',
        awayLogo: '/images/lakers-logo.png',
        homeLogo: '/images/celtics-logo.png'
      },
      {
        id: 'game_3',
        sport: 'NFL',
        awayTeam: 'Dallas Cowboys',
        homeTeam: 'Philadelphia Eagles',
        awayScore: null,
        homeScore: null,
        status: 'Sunday 4:25 PM ET',
        date: '2024-12-08',
        awayLogo: '/images/cowboys-logo.png',
        homeLogo: '/images/eagles-logo.png'
      }
    ];
  }
  
  generateMockInjuries() {
    return [
      {
        playerName: 'Mike Trout',
        team: 'Los Angeles Angels',
        position: 'OF',
        status: 'Out',
        description: 'Wrist surgery recovery',
        injuryType: 'Wrist',
        returnDate: '2025-04-01',
        severity: 'Major',
        fantasyImpact: 'Season-ending'
      },
      {
        playerName: 'LeBron James',
        team: 'Los Angeles Lakers',
        position: 'SF',
        status: 'Day-to-Day',
        description: 'Left ankle soreness',
        injuryType: 'Ankle',
        returnDate: 'Expected next game',
        severity: 'Minor',
        fantasyImpact: 'Monitor closely'
      },
      {
        playerName: 'Ja Morant',
        team: 'Memphis Grizzlies',
        position: 'PG',
        status: 'Questionable',
        description: 'Right hip injury',
        injuryType: 'Hip',
        returnDate: 'Game-time decision',
        severity: 'Minor',
        fantasyImpact: 'Have backup ready'
      }
    ];
  }
  
  // Mock API Methods
  async getPlayerStats(playerName, timeframe = 'current') {
    // Simulate API delay
    await this.delay(100 + Math.random() * 200);
    
    const normalizedName = playerName.toLowerCase();
    const player = this.players.get(normalizedName);
    
    if (!player) {
      throw new Error(`Player "${playerName}" not found`);
    }
    
    return {
      status: 'success',
      type: 'player_stats',
      data: player,
      source: 'Mock API',
      processingTime: 150 + Math.random() * 100
    };
  }
  
  async getGameScores(teams = [], date = 'today') {
    await this.delay(150 + Math.random() * 100);
    
    let filteredGames = this.games;
    
    if (teams.length > 0) {
      filteredGames = this.games.filter(game => 
        teams.some(team => 
          game.awayTeam.toLowerCase().includes(team.toLowerCase()) ||
          game.homeTeam.toLowerCase().includes(team.toLowerCase())
        )
      );
    }
    
    if (date === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filteredGames = filteredGames.filter(game => game.date === today);
    }
    
    return {
      status: 'success',
      type: 'game_scores',
      data: filteredGames.length > 0 ? filteredGames : this.games.slice(0, 3),
      source: 'Mock API',
      processingTime: 120 + Math.random() * 80
    };
  }
  
  async getInjuryReport(playerOrTeam) {
    await this.delay(100 + Math.random() * 150);
    
    let injuries = this.injuries;
    
    if (playerOrTeam) {
      const search = playerOrTeam.toLowerCase();
      injuries = this.injuries.filter(injury =>
        injury.playerName.toLowerCase().includes(search) ||
        injury.team.toLowerCase().includes(search)
      );
    }
    
    return {
      status: 'success',
      type: 'injury_report',
      data: injuries.length > 0 ? injuries : this.injuries.slice(0, 3),
      source: 'Mock API',
      processingTime: 130 + Math.random() * 70
    };
  }
  
  async getTeamInfo(teamName) {
    await this.delay(80 + Math.random() * 120);
    
    const normalizedName = teamName.toLowerCase();
    const team = this.teams.get(normalizedName);
    
    if (!team) {
      // Return a generic team for demo
      return {
        status: 'success',
        type: 'team_info',
        data: {
          teamName: teamName,
          sport: 'Unknown',
          wins: 8,
          losses: 4,
          logo: '/images/default-logo.png',
          lastGame: { result: 'W 28-21', opponent: 'Generic Team' },
          nextGame: { opponent: 'Another Team', date: '2024-12-08' }
        },
        source: 'Mock API',
        processingTime: 90
      };
    }
    
    return {
      status: 'success',
      type: 'team_info',
      data: team,
      source: 'Mock API',
      processingTime: 95 + Math.random() * 60
    };
  }
  
  async getFantasyAdvice(context) {
    await this.delay(200 + Math.random() * 300);
    
    const adviceOptions = [
      {
        title: 'Start/Sit Recommendation',
        advice: 'Based on matchup analysis, start Josh Allen this week. He faces a defense allowing 18.2 fantasy points to QBs.',
        players: [
          { name: 'Josh Allen', action: 'start', reason: 'Favorable matchup vs weak pass defense' },
          { name: 'Tua Tagovailoa', action: 'sit', reason: 'Tough matchup vs top-ranked defense' }
        ],
        confidence: 87
      },
      {
        title: 'Waiver Wire Pickup',
        advice: 'Consider picking up Jaylen Warren. With Najee Harris banged up, Warren could see increased touches.',
        players: [
          { name: 'Jaylen Warren', action: 'pickup', reason: 'Backup RB with upside due to injury' }
        ],
        confidence: 73
      },
      {
        title: 'Trade Analysis',
        advice: 'This trade favors Team A slightly. Getting a consistent WR1 for a boom-or-bust RB is solid value.',
        confidence: 82
      }
    ];
    
    const randomAdvice = adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
    
    return {
      status: 'success',
      type: 'fantasy_advice',
      data: randomAdvice,
      source: 'Fantasy.AI Mock',
      processingTime: 250 + Math.random() * 200
    };
  }
  
  async getStandings(league) {
    await this.delay(120 + Math.random() * 100);
    
    const standings = {
      NFL: [
        { team: 'Kansas City Chiefs', wins: 11, losses: 1 },
        { team: 'Buffalo Bills', wins: 10, losses: 2 },
        { team: 'Philadelphia Eagles', wins: 10, losses: 2 },
        { team: 'Detroit Lions', wins: 9, losses: 3 }
      ],
      NBA: [
        { team: 'Boston Celtics', wins: 18, losses: 4 },
        { team: 'Cleveland Cavaliers', wins: 17, losses: 3 },
        { team: 'Oklahoma City Thunder', wins: 15, losses: 8 },
        { team: 'Denver Nuggets', wins: 13, losses: 10 }
      ]
    };
    
    return {
      status: 'success',
      type: 'standings',
      data: standings[league] || standings.NFL,
      source: 'Mock API',
      processingTime: 140
    };
  }
  
  async performGeneralSearch(query) {
    await this.delay(150 + Math.random() * 200);
    
    return {
      status: 'success',
      type: 'general_search',
      data: {
        title: 'Sports Search Results',
        content: `Here's what I found for "${query}". This is mock data for development.`,
        source: 'Mock Search'
      },
      source: 'Mock API',
      processingTime: 180
    };
  }
  
  // Utility method to simulate network delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in sports API
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MockSportsData;
}