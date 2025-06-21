"use client";

import { EventEmitter } from 'events';

export interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  team: string;
  league: string;
  sport: string;
  avatar?: string;
  background?: string;
  
  // Basic Info
  basicInfo: {
    age: number;
    height: string;
    weight: string;
    experience: number;
    college?: string;
    draftYear?: number;
    draftRound?: number;
    draftPick?: number;
    salary?: number;
    contract?: {
      years: number;
      totalValue: number;
      avgAnnualValue: number;
      guaranteed: number;
    };
  };

  // Current Season Stats
  currentStats: Record<string, number>;
  
  // Career Stats
  careerStats: Record<string, number>;
  
  // Advanced Metrics
  advancedMetrics: AdvancedMetrics;
  
  // Fantasy Data
  fantasyData: FantasyData;
  
  // Performance Trends
  trends: PerformanceTrends;
  
  // Injury History
  injuryHistory: InjuryRecord[];
  
  // News & Updates
  recentNews: NewsUpdate[];
  
  // Social Media
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    followers?: number;
  };
}

export interface AdvancedMetrics {
  // Efficiency Metrics
  efficiency: {
    targetsPerGame?: number;
    touchesPerGame?: number;
    usageRate?: number;
    efficiency?: number;
    valueOverReplacement?: number;
    pointsPerTarget?: number;
    pointsPerTouch?: number;
  };
  
  // Situation-Based Performance
  situational: {
    redZoneTargets?: number;
    redZoneReceptions?: number;
    redZoneTouchdowns?: number;
    thirdDownConversions?: number;
    goalLineCarries?: number;
    fourthQuarterPoints?: number;
    primeTimePerformance?: number;
  };
  
  // Matchup Analysis
  matchups: {
    vsTop10Defenses?: number;
    vsBottom10Defenses?: number;
    homeVsAway?: {
      home: number;
      away: number;
    };
    weatherImpact?: {
      dome: number;
      outdoors: number;
      rain: number;
      snow: number;
    };
  };
  
  // Predictive Metrics
  predictive: {
    projectedGrowth?: number;
    ceilingScore?: number;
    floorScore?: number;
    consistency?: number;
    volatility?: number;
    bustrisk?: number;
  };
}

export interface FantasyData {
  // Current Fantasy Performance
  fantasyPoints: number;
  fantasyRank: number;
  positionRank: number;
  
  // Weekly Performance
  weeklyScores: number[];
  averageScore: number;
  highScore: number;
  lowScore: number;
  
  // Consistency Metrics
  standardDeviation: number;
  coefficient: number;
  bonusGames: number; // Games with 20+ fantasy points
  bustGames: number;  // Games with <5 fantasy points
  
  // DFS Data
  dfsData?: {
    salary: number;
    ownership: number;
    projectedOwnership: number;
    value: number; // Points per $1000
    gppScore: number; // Tournament viability
    cashScore: number; // Cash game viability
  };
  
  // Season Projections
  projections: {
    remainingGames: number;
    projectedPoints: number;
    projectedRank: number;
    upside: number;
    downside: number;
  };
}

export interface PerformanceTrends {
  // Recent Performance (Last 4 weeks)
  recentForm: {
    trend: 'HOT' | 'COLD' | 'STABLE';
    direction: 'UP' | 'DOWN' | 'FLAT';
    momentum: number; // -100 to 100
    streakType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    streakLength: number;
  };
  
  // Seasonal Patterns
  seasonalPatterns: {
    earlySeasonAvg: number;
    midSeasonAvg: number;
    lateSeasonAvg: number;
    playoffPerformance?: number;
  };
  
  // Weekly Patterns
  weeklyPatterns: {
    mondayNight?: number;
    thursdayNight?: number;
    sunday1pm?: number;
    sunday4pm?: number;
    sundayNight?: number;
  };
  
  // Strength of Schedule
  scheduleStrength: {
    remainingSOS: number; // 1-32 ranking
    nextFourWeeks: number;
    playoffSchedule: number;
    toughestMatchups: string[];
    easiestMatchups: string[];
  };
}

export interface InjuryRecord {
  id: string;
  injury: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  dateInjured: Date;
  dateReturned?: Date;
  gamesmissed: number;
  impactOnReturn?: {
    performanceChange: number;
    weeksToFullStrength: number;
  };
}

export interface NewsUpdate {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: Date;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  fantasyImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
}

export interface PlayerComparison {
  player1: PlayerProfile;
  player2: PlayerProfile;
  comparison: {
    overall: {
      advantage: 'player1' | 'player2' | 'even';
      confidence: number;
      reasoning: string;
    };
    categories: {
      [category: string]: {
        player1Score: number;
        player2Score: number;
        advantage: 'player1' | 'player2' | 'even';
        weight: number;
      };
    };
  };
}

export interface TeamStats {
  teamName: string;
  teamCode: string;
  
  // Offensive Stats
  offense: {
    pointsPerGame: number;
    yardsPerGame: number;
    passingYardsPerGame: number;
    rushingYardsPerGame: number;
    redZoneEfficiency: number;
    thirdDownConversion: number;
    timeOfPossession: string;
    pace: number; // Plays per game
  };
  
  // Defensive Stats
  defense: {
    pointsAllowedPerGame: number;
    yardsAllowedPerGame: number;
    passingYardsAllowed: number;
    rushingYardsAllowed: number;
    sacks: number;
    interceptions: number;
    forcedFumbles: number;
    redZoneDefense: number;
  };
  
  // Fantasy Relevant
  fantasy: {
    fantasyPointsAllowed: {
      QB: number;
      RB: number;
      WR: number;
      TE: number;
      K: number;
      DEF: number;
    };
    positionRankings: {
      QB: number;
      RB: number;
      WR: number;
      TE: number;
      K: number;
      DEF: number;
    };
  };
}

export class PlayerAnalyticsService extends EventEmitter {
  private playerProfiles: Map<string, PlayerProfile> = new Map();
  private teamStats: Map<string, TeamStats> = new Map();
  private comparisons: Map<string, PlayerComparison> = new Map();

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock player profiles
    const mockProfiles: PlayerProfile[] = [
      {
        id: 'player_josh_allen',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        league: 'NFL',
        sport: 'NFL',
        avatar: '/players/josh-allen.jpg',
        background: '/players/josh-allen-bg.jpg',
        
        basicInfo: {
          age: 27,
          height: '6\'5"',
          weight: '237 lbs',
          experience: 6,
          college: 'Wyoming',
          draftYear: 2018,
          draftRound: 1,
          draftPick: 7,
          contract: {
            years: 6,
            totalValue: 258000000,
            avgAnnualValue: 43000000,
            guaranteed: 150000000
          }
        },
        
        currentStats: {
          passingYards: 2538,
          passingTouchdowns: 18,
          interceptions: 8,
          rushingYards: 417,
          rushingTouchdowns: 11,
          completionPercentage: 63.2,
          quarterbackRating: 101.4
        },
        
        careerStats: {
          passingYards: 19825,
          passingTouchdowns: 154,
          interceptions: 67,
          rushingYards: 3134,
          rushingTouchdowns: 52,
          completionPercentage: 62.8,
          quarterbackRating: 94.3
        },
        
        advancedMetrics: {
          efficiency: {
            usageRate: 100, // QBs always 100%
            efficiency: 92.3,
            valueOverReplacement: 145.2,
            pointsPerTarget: 8.4
          },
          situational: {
            redZoneTouchdowns: 15,
            thirdDownConversions: 28,
            fourthQuarterPoints: 89.2,
            primeTimePerformance: 23.8
          },
          matchups: {
            vsTop10Defenses: 18.4,
            vsBottom10Defenses: 26.7,
            homeVsAway: {
              home: 24.1,
              away: 20.3
            }
          },
          predictive: {
            projectedGrowth: 8.5,
            ceilingScore: 35,
            floorScore: 15,
            consistency: 78,
            volatility: 22,
            bustrisk: 15
          }
        },
        
        fantasyData: {
          fantasyPoints: 241.2,
          fantasyRank: 3,
          positionRank: 3,
          weeklyScores: [28.4, 31.2, 15.8, 22.6, 34.1, 18.9, 29.3, 19.7],
          averageScore: 25.0,
          highScore: 34.1,
          lowScore: 15.8,
          standardDeviation: 6.2,
          coefficient: 0.25,
          bonusGames: 4,
          bustGames: 0,
          projections: {
            remainingGames: 9,
            projectedPoints: 225,
            projectedRank: 2,
            upside: 280,
            downside: 190
          }
        },
        
        trends: {
          recentForm: {
            trend: 'HOT',
            direction: 'UP',
            momentum: 72,
            streakType: 'POSITIVE',
            streakLength: 3
          },
          seasonalPatterns: {
            earlySeasonAvg: 23.1,
            midSeasonAvg: 26.8,
            lateSeasonAvg: 24.3
          },
          weeklyPatterns: {
            sundayNight: 28.4,
            sunday1pm: 24.2,
            sunday4pm: 26.1,
            mondayNight: 22.8,
            thursdayNight: 25.3
          },
          scheduleStrength: {
            remainingSOS: 12,
            nextFourWeeks: 18,
            playoffSchedule: 8,
            toughestMatchups: ['SF', 'DAL', 'MIA'],
            easiestMatchups: ['NYJ', 'NE', 'MIA']
          }
        },
        
        injuryHistory: [
          {
            id: 'injury_1',
            injury: 'Shoulder Strain',
            severity: 'MINOR',
            dateInjured: new Date('2023-11-15'),
            dateReturned: new Date('2023-11-22'),
            gamesmissed: 0,
            impactOnReturn: {
              performanceChange: -5,
              weeksToFullStrength: 2
            }
          }
        ],
        
        recentNews: [
          {
            id: 'news_1',
            headline: 'Josh Allen Leads Bills to Victory with 4 Total TDs',
            summary: 'Allen threw for 3 touchdowns and rushed for another in dominant performance.',
            source: 'ESPN',
            publishedAt: new Date(Date.now() - 86400000),
            impact: 'POSITIVE',
            fantasyImpact: 'HIGH',
            tags: ['performance', 'touchdowns', 'victory']
          }
        ],
        
        socialMedia: {
          twitter: '@JoshAllenQB',
          instagram: '@joshallenqb',
          followers: 850000
        }
      }
    ];

    mockProfiles.forEach(profile => {
      this.playerProfiles.set(profile.id, profile);
    });

    // Mock team stats
    const mockTeamStats: TeamStats[] = [
      {
        teamName: 'Buffalo Bills',
        teamCode: 'BUF',
        offense: {
          pointsPerGame: 28.4,
          yardsPerGame: 398.2,
          passingYardsPerGame: 251.8,
          rushingYardsPerGame: 146.4,
          redZoneEfficiency: 67.8,
          thirdDownConversion: 44.2,
          timeOfPossession: '31:45',
          pace: 67.3
        },
        defense: {
          pointsAllowedPerGame: 19.8,
          yardsAllowedPerGame: 334.1,
          passingYardsAllowed: 218.6,
          rushingYardsAllowed: 115.5,
          sacks: 26,
          interceptions: 12,
          forcedFumbles: 8,
          redZoneDefense: 54.2
        },
        fantasy: {
          fantasyPointsAllowed: {
            QB: 16.8,
            RB: 22.4,
            WR: 28.9,
            TE: 11.2,
            K: 7.8,
            DEF: 8.1
          },
          positionRankings: {
            QB: 18,
            RB: 12,
            WR: 8,
            TE: 24,
            K: 15,
            DEF: 19
          }
        }
      }
    ];

    mockTeamStats.forEach(stats => {
      this.teamStats.set(stats.teamCode, stats);
    });
  }

  async getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
    return this.playerProfiles.get(playerId) || null;
  }

  async searchPlayers(query: string, filters?: {
    position?: string;
    team?: string;
    minFantasyPoints?: number;
  }): Promise<PlayerProfile[]> {
    const searchTerm = query.toLowerCase();
    let players = Array.from(this.playerProfiles.values());

    // Text search
    players = players.filter(player =>
      player.name.toLowerCase().includes(searchTerm) ||
      player.team.toLowerCase().includes(searchTerm) ||
      player.position.toLowerCase().includes(searchTerm)
    );

    // Apply filters
    if (filters?.position) {
      players = players.filter(p => p.position === filters.position);
    }

    if (filters?.team) {
      players = players.filter(p => p.team === filters.team);
    }

    if (filters?.minFantasyPoints) {
      players = players.filter(p => p.fantasyData.fantasyPoints >= filters.minFantasyPoints!);
    }

    return players.sort((a, b) => b.fantasyData.fantasyRank - a.fantasyData.fantasyRank);
  }

  async getTopPlayers(position?: string, limit: number = 50): Promise<PlayerProfile[]> {
    let players = Array.from(this.playerProfiles.values());

    if (position) {
      players = players.filter(p => p.position === position);
    }

    return players
      .sort((a, b) => a.fantasyData.positionRank - b.fantasyData.positionRank)
      .slice(0, limit);
  }

  async comparePlayers(player1Id: string, player2Id: string): Promise<PlayerComparison | null> {
    const comparisonKey = [player1Id, player2Id].sort().join('_');
    
    if (this.comparisons.has(comparisonKey)) {
      return this.comparisons.get(comparisonKey)!;
    }

    const player1 = await this.getPlayerProfile(player1Id);
    const player2 = await this.getPlayerProfile(player2Id);

    if (!player1 || !player2) return null;

    // Generate comparison
    const comparison: PlayerComparison = {
      player1,
      player2,
      comparison: {
        overall: {
          advantage: player1.fantasyData.fantasyRank < player2.fantasyData.fantasyRank ? 'player1' : 'player2',
          confidence: 78,
          reasoning: 'Based on current fantasy performance and advanced metrics'
        },
        categories: {
          'Fantasy Points': {
            player1Score: player1.fantasyData.fantasyPoints,
            player2Score: player2.fantasyData.fantasyPoints,
            advantage: player1.fantasyData.fantasyPoints > player2.fantasyData.fantasyPoints ? 'player1' : 'player2',
            weight: 30
          },
          'Consistency': {
            player1Score: player1.fantasyData.coefficient,
            player2Score: player2.fantasyData.coefficient,
            advantage: player1.fantasyData.coefficient < player2.fantasyData.coefficient ? 'player1' : 'player2',
            weight: 25
          },
          'Ceiling': {
            player1Score: player1.advancedMetrics.predictive.ceilingScore || 0,
            player2Score: player2.advancedMetrics.predictive.ceilingScore || 0,
            advantage: (player1.advancedMetrics.predictive.ceilingScore || 0) > (player2.advancedMetrics.predictive.ceilingScore || 0) ? 'player1' : 'player2',
            weight: 20
          }
        }
      }
    };

    this.comparisons.set(comparisonKey, comparison);
    return comparison;
  }

  async getTeamStats(teamCode: string): Promise<TeamStats | null> {
    return this.teamStats.get(teamCode) || null;
  }

  async getPlayerTrends(playerId: string, timeframe: 'week' | 'month' | 'season'): Promise<any> {
    const player = await this.getPlayerProfile(playerId);
    if (!player) return null;

    // Mock trend analysis
    return {
      timeframe,
      trend: player.trends.recentForm.trend,
      momentum: player.trends.recentForm.momentum,
      keyMetrics: {
        fantasyPoints: player.fantasyData.averageScore,
        efficiency: player.advancedMetrics.efficiency.efficiency,
        consistency: 100 - (player.fantasyData.coefficient * 100)
      },
      projections: player.fantasyData.projections
    };
  }

  async getAdvancedStats(playerId: string): Promise<AdvancedMetrics | null> {
    const player = await this.getPlayerProfile(playerId);
    return player?.advancedMetrics || null;
  }

  async generatePlayerReport(playerId: string): Promise<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    outlook: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
  } | null> {
    const player = await this.getPlayerProfile(playerId);
    if (!player) return null;

    // AI-generated report (mock)
    return {
      summary: `${player.name} is currently the #${player.fantasyData.positionRank} ${player.position} with ${player.fantasyData.fantasyPoints} fantasy points this season.`,
      strengths: [
        'Dual-threat capability with rushing upside',
        'Strong red zone production',
        'Consistent target volume in passing game'
      ],
      weaknesses: [
        'Matchup-dependent ceiling',
        'Injury concerns with rushing usage',
        'Turnover-prone in pressure situations'
      ],
      outlook: `Expect continued ${player.position} production with ${player.trends.scheduleStrength.remainingSOS < 16 ? 'favorable' : 'challenging'} remaining schedule.`,
      recommendation: player.trends.recentForm.trend === 'HOT' ? 'BUY' : player.trends.recentForm.trend === 'COLD' ? 'SELL' : 'HOLD',
      confidence: 82
    };
  }

  async updatePlayerNews(playerId: string, news: Omit<NewsUpdate, 'id'>): Promise<void> {
    const player = this.playerProfiles.get(playerId);
    if (player) {
      const newsUpdate: NewsUpdate = {
        ...news,
        id: `news_${Date.now()}`
      };
      
      player.recentNews.unshift(newsUpdate);
      player.recentNews = player.recentNews.slice(0, 10); // Keep only 10 most recent
      
      this.playerProfiles.set(playerId, player);
      this.emit('playerNewsUpdate', { playerId, news: newsUpdate });
    }
  }

  async getInjuryRisk(playerId: string): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
    recommendation: string;
  } | null> {
    const player = await this.getPlayerProfile(playerId);
    if (!player) return null;

    // Calculate injury risk based on history and usage
    const majorInjuries = player.injuryHistory.filter(i => i.severity === 'MAJOR').length;
    const recentInjuries = player.injuryHistory.filter(i => 
      new Date().getTime() - i.dateInjured.getTime() < 365 * 24 * 60 * 60 * 1000
    ).length;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const factors: string[] = [];

    if (majorInjuries > 1) {
      riskLevel = 'HIGH';
      factors.push('Multiple major injuries in career');
    } else if (majorInjuries === 1) {
      riskLevel = 'MEDIUM';
      factors.push('One major injury in career');
    }

    if (recentInjuries > 0) {
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
      factors.push('Recent injury history');
    }

    if (player.basicInfo.age > 30) {
      factors.push('Age-related injury risk');
    }

    return {
      riskLevel,
      factors,
      recommendation: riskLevel === 'HIGH' ? 'Consider handcuff options' : 
                     riskLevel === 'MEDIUM' ? 'Monitor closely' : 
                     'No immediate concerns'
    };
  }
}

export const playerAnalyticsService = new PlayerAnalyticsService();