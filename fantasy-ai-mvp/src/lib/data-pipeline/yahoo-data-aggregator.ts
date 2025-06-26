/**
 * Yahoo Sports Data Aggregator
 * Real-time collection from Yahoo Sports and Yahoo Fantasy
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { playerPerformancePredictor } from '@/lib/ml/models/player-performance-predictor';

interface YahooPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  status: string;
  stats: {
    season: any;
    recent: any;
    averages: any;
  };
  fantasy: {
    ownership: number;
    points: number;
    projectedPoints: number;
    trend: string;
  };
  news?: Array<{
    title: string;
    summary: string;
    timestamp: string;
    source: string;
  }>;
}

interface YahooGame {
  id: string;
  gameKey: string;
  status: string;
  startTime: string;
  venue: string;
  weather?: {
    temp: number;
    windSpeed: number;
    windDirection: string;
    conditions: string;
  };
  teams: {
    home: {
      name: string;
      score: number;
      stats: any;
    };
    away: {
      name: string;
      score: number;
      stats: any;
    };
  };
  odds?: {
    spread: number;
    overUnder: number;
    homeMoneyline: number;
    awayMoneyline: number;
  };
}

export class YahooDataAggregator {
  private baseUrl = 'https://sports.yahoo.com/api';
  private fantasyUrl = 'https://fantasysports.yahooapis.com/fantasy/v2';
  private updateInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start real-time data collection
   */
  async startRealTimeUpdates(intervalSeconds = 30) {
    console.log('🚀 Starting Yahoo real-time data pipeline...');
    
    // Initial fetch
    await this.fetchAllData();
    
    // Set up interval
    this.updateInterval = setInterval(async () => {
      await this.fetchAllData();
    }, intervalSeconds * 1000);
    
    console.log(`✅ Yahoo data pipeline running (updates every ${intervalSeconds}s)`);
  }
  
  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 Yahoo data pipeline stopped');
    }
  }
  
  /**
   * Fetch all data types
   */
  private async fetchAllData() {
    try {
      const timestamp = new Date();
      console.log(`📊 Fetching Yahoo data at ${timestamp.toISOString()}`);
      
      // Fetch different sports in parallel
      const [nflData, nbaData, mlbData, nhlData] = await Promise.all([
        this.fetchSportData('nfl'),
        this.fetchSportData('nba'),
        this.fetchSportData('mlb'),
        this.fetchSportData('nhl')
      ]);
      
      // Process all data
      await this.processAllData({
        nfl: nflData,
        nba: nbaData,
        mlb: mlbData,
        nhl: nhlData
      });
      
      console.log('✅ Yahoo data update complete');
    } catch (error) {
      console.error('❌ Yahoo data fetch error:', error);
    }
  }
  
  /**
   * Fetch sport-specific data from Yahoo
   */
  private async fetchSportData(sport: string) {
    const players: YahooPlayer[] = [];
    const games: YahooGame[] = [];
    
    try {
      // Simulate Yahoo API calls (would need real Yahoo API access)
      // This is a mock implementation showing the structure
      
      // Fetch top players and trending data
      const trendingRes = await this.fetchTrendingPlayers(sport);
      const topPlayersRes = await this.fetchTopPlayers(sport);
      
      // Combine player data
      const allPlayers = [...trendingRes, ...topPlayersRes];
      
      for (const playerData of allPlayers.slice(0, 50)) {
        const player: YahooPlayer = {
          id: playerData.id,
          name: playerData.name,
          position: playerData.position,
          team: playerData.team,
          status: playerData.status || 'active',
          stats: {
            season: playerData.seasonStats || {},
            recent: playerData.recentStats || {},
            averages: playerData.averages || {}
          },
          fantasy: {
            ownership: playerData.ownership || 0,
            points: playerData.fantasyPoints || 0,
            projectedPoints: playerData.projectedPoints || 0,
            trend: playerData.trend || 'stable'
          }
        };
        
        // Add news if available
        if (playerData.news) {
          player.news = playerData.news.map((item: any) => ({
            title: item.title,
            summary: item.summary,
            timestamp: item.timestamp,
            source: item.source || 'Yahoo Sports'
          }));
        }
        
        players.push(player);
      }
      
      // Fetch live games
      const gamesData = await this.fetchLiveGames(sport);
      
      for (const gameData of gamesData) {
        const game: YahooGame = {
          id: gameData.id,
          gameKey: gameData.gameKey,
          status: gameData.status,
          startTime: gameData.startTime,
          venue: gameData.venue,
          teams: {
            home: {
              name: gameData.homeTeam.name,
              score: gameData.homeTeam.score || 0,
              stats: gameData.homeTeam.stats || {}
            },
            away: {
              name: gameData.awayTeam.name,
              score: gameData.awayTeam.score || 0,
              stats: gameData.awayTeam.stats || {}
            }
          }
        };
        
        // Add weather if outdoor sport
        if (sport === 'nfl' || sport === 'mlb') {
          game.weather = await this.fetchGameWeather(game.venue);
        }
        
        // Add betting odds
        game.odds = await this.fetchGameOdds(game.id);
        
        games.push(game);
      }
      
    } catch (error) {
      console.error(`Error fetching Yahoo ${sport} data:`, error);
    }
    
    return { players, games };
  }
  
  /**
   * Mock implementation - fetch trending players
   */
  private async fetchTrendingPlayers(sport: string): Promise<any[]> {
    // In production, this would call Yahoo's API
    // For now, return mock structure
    return [];
  }
  
  /**
   * Mock implementation - fetch top players
   */
  private async fetchTopPlayers(sport: string): Promise<any[]> {
    // In production, this would call Yahoo's API
    return [];
  }
  
  /**
   * Mock implementation - fetch live games
   */
  private async fetchLiveGames(sport: string): Promise<any[]> {
    // In production, this would call Yahoo's API
    return [];
  }
  
  /**
   * Fetch weather data for outdoor games
   */
  private async fetchGameWeather(venue: string) {
    // Would integrate with weather API
    return {
      temp: 72,
      windSpeed: 5,
      windDirection: 'NW',
      conditions: 'clear'
    };
  }
  
  /**
   * Fetch betting odds
   */
  private async fetchGameOdds(gameId: string) {
    // Would integrate with odds API
    return {
      spread: -3.5,
      overUnder: 48.5,
      homeMoneyline: -150,
      awayMoneyline: +130
    };
  }
  
  /**
   * Process and store all collected data
   */
  private async processAllData(data: Record<string, any>) {
    console.log('💾 Processing Yahoo data...');
    
    for (const [sport, sportData] of Object.entries(data)) {
      // Process players
      for (const player of sportData.players || []) {
        try {
          await prisma.dataSourceRecord.upsert({
            where: {
              sourceId_dataType: {
                sourceId: `yahoo_${player.id}`,
                dataType: 'PLAYER_STATS'
              }
            },
            update: {
              data: {
                ...player,
                sport,
                source: 'Yahoo',
                lastUpdated: new Date()
              }
            },
            create: {
              sourceId: `yahoo_${player.id}`,
              dataType: 'PLAYER_STATS',
              source: 'Yahoo',
              data: {
                ...player,
                sport,
                source: 'Yahoo',
                lastUpdated: new Date()
              }
            }
          });
          
          // Update ML model cache
          if (player.fantasy.projectedPoints > 0) {
            playerPerformancePredictor.updatePlayerCache(player.id, {
              yahooProjection: player.fantasy.projectedPoints,
              ownership: player.fantasy.ownership,
              trend: player.fantasy.trend
            });
          }
          
        } catch (error) {
          console.error(`Error processing Yahoo player ${player.name}:`, error);
        }
      }
      
      // Process games
      for (const game of sportData.games || []) {
        try {
          await prisma.dataSourceRecord.upsert({
            where: {
              sourceId_dataType: {
                sourceId: `yahoo_game_${game.id}`,
                dataType: 'GAME_DATA'
              }
            },
            update: {
              data: {
                ...game,
                sport,
                lastUpdated: new Date()
              }
            },
            create: {
              sourceId: `yahoo_game_${game.id}`,
              dataType: 'GAME_DATA',
              source: 'Yahoo',
              data: {
                ...game,
                sport,
                lastUpdated: new Date()
              }
            }
          });
        } catch (error) {
          console.error(`Error processing Yahoo game ${game.id}:`, error);
        }
      }
    }
    
    console.log('✅ Yahoo data processing complete');
  }
  
  /**
   * Get fantasy ownership percentages
   */
  async getFantasyOwnership(playerIds: string[]) {
    const records = await prisma.dataSourceRecord.findMany({
      where: {
        sourceId: { in: playerIds.map(id => `yahoo_${id}`) },
        dataType: 'PLAYER_STATS'
      }
    });
    
    return records.reduce((acc, record) => {
      const data = record.data as any;
      acc[data.id] = data.fantasy?.ownership || 0;
      return acc;
    }, {} as Record<string, number>);
  }
  
  /**
   * Get trending players by position
   */
  async getTrendingPlayersByPosition(position: string, sport: string) {
    const records = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'PLAYER_STATS',
        source: 'Yahoo',
        data: {
          path: ['position'],
          equals: position
        }
      },
      orderBy: {
        data: {
          path: ['fantasy', 'trend'],
          sort: 'desc'
        }
      },
      take: 10
    });
    
    return records.map(r => r.data);
  }
}

export const yahooDataAggregator = new YahooDataAggregator();