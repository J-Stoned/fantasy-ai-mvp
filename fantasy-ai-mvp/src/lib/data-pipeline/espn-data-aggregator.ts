/**
 * ESPN Sports Data Aggregator
 * Real-time collection of player stats, game scores, and injury reports
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { playerPerformancePredictor } from '@/lib/ml/models/player-performance-predictor';
import { injuryRiskAssessment } from '@/lib/ml/models/injury-risk-assessment';

interface ESPNPlayer {
  id: string;
  fullName: string;
  position: string;
  team: string;
  stats: {
    season: any;
    lastGame: any;
    projections: any;
  };
  injuryStatus?: {
    status: string;
    description: string;
    date: string;
  };
  news?: Array<{
    headline: string;
    description: string;
    published: string;
  }>;
}

interface ESPNGame {
  id: string;
  status: string;
  period: number;
  clock: string;
  home: {
    team: string;
    score: number;
    stats: any;
  };
  away: {
    team: string;
    score: number;
    stats: any;
  };
  weather?: {
    temperature: number;
    wind: number;
    precipitation: number;
    conditions: string;
  };
}

export class ESPNDataAggregator {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
  private fantasyUrl = 'https://fantasy.espn.com/apis/v3/games';
  private updateInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start real-time data collection
   */
  async startRealTimeUpdates(intervalSeconds = 30) {
    console.log('🚀 Starting ESPN real-time data pipeline...');
    
    // Initial fetch
    await this.fetchAllData();
    
    // Set up interval
    this.updateInterval = setInterval(async () => {
      await this.fetchAllData();
    }, intervalSeconds * 1000);
    
    console.log(`✅ ESPN data pipeline running (updates every ${intervalSeconds}s)`);
  }
  
  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 ESPN data pipeline stopped');
    }
  }
  
  /**
   * Fetch all data types
   */
  private async fetchAllData() {
    try {
      const timestamp = new Date();
      console.log(`📊 Fetching ESPN data at ${timestamp.toISOString()}`);
      
      // Fetch data in parallel
      const [nflData, nbaData, mlbData, nhlData] = await Promise.all([
        this.fetchSportData('football', 'nfl'),
        this.fetchSportData('basketball', 'nba'),
        this.fetchSportData('baseball', 'mlb'),
        this.fetchSportData('hockey', 'nhl')
      ]);
      
      // Process and store data
      await this.processPlayerData([...nflData.players, ...nbaData.players, ...mlbData.players, ...nhlData.players]);
      await this.processGameData([...nflData.games, ...nbaData.games, ...mlbData.games, ...nhlData.games]);
      
      // Update ML models with fresh data
      await this.updateMLModels();
      
      console.log('✅ ESPN data update complete');
    } catch (error) {
      console.error('❌ ESPN data fetch error:', error);
    }
  }
  
  /**
   * Fetch sport-specific data
   */
  private async fetchSportData(sport: string, league: string) {
    const players: ESPNPlayer[] = [];
    const games: ESPNGame[] = [];
    
    try {
      // Fetch current games/scoreboard
      const scoreboardRes = await axios.get(
        `${this.baseUrl}/${sport}/${league}/scoreboard`,
        { 
          headers: { 'User-Agent': 'FantasyAI/1.0' },
          timeout: 10000 
        }
      );
      
      const events = scoreboardRes.data?.events || [];
      
      for (const event of events) {
        // Extract game data
        const game: ESPNGame = {
          id: event.id,
          status: event.status.type.name,
          period: event.status.period || 0,
          clock: event.status.displayClock || '',
          home: {
            team: event.competitions[0].competitors.find((c: any) => c.homeAway === 'home')?.team.abbreviation,
            score: parseInt(event.competitions[0].competitors.find((c: any) => c.homeAway === 'home')?.score || 0),
            stats: event.competitions[0].competitors.find((c: any) => c.homeAway === 'home')?.statistics || {}
          },
          away: {
            team: event.competitions[0].competitors.find((c: any) => c.homeAway === 'away')?.team.abbreviation,
            score: parseInt(event.competitions[0].competitors.find((c: any) => c.homeAway === 'away')?.score || 0),
            stats: event.competitions[0].competitors.find((c: any) => c.homeAway === 'away')?.statistics || {}
          }
        };
        
        // Add weather if available
        if (event.weather) {
          game.weather = {
            temperature: event.weather.temperature || 72,
            wind: event.weather.windSpeed || 0,
            precipitation: event.weather.precipitation || 0,
            conditions: event.weather.conditions || 'clear'
          };
        }
        
        games.push(game);
      }
      
      // Fetch top players and injuries
      const athletesRes = await axios.get(
        `${this.baseUrl}/${sport}/${league}/athletes`,
        { 
          params: { limit: 100 },
          headers: { 'User-Agent': 'FantasyAI/1.0' },
          timeout: 10000
        }
      ).catch(() => ({ data: { items: [] } }));
      
      const athletes = athletesRes.data?.items || [];
      
      for (const athlete of athletes.slice(0, 50)) { // Top 50 players
        try {
          // Fetch detailed player info
          const playerRes = await axios.get(
            `${this.baseUrl}/${sport}/${league}/athletes/${athlete.id}`,
            { 
              headers: { 'User-Agent': 'FantasyAI/1.0' },
              timeout: 5000
            }
          );
          
          const playerData = playerRes.data?.athlete;
          if (!playerData) continue;
          
          const player: ESPNPlayer = {
            id: playerData.id,
            fullName: playerData.fullName,
            position: playerData.position?.abbreviation || 'N/A',
            team: playerData.team?.abbreviation || 'FA',
            stats: {
              season: playerData.statistics?.filter((s: any) => s.type === 'season')[0]?.stats || {},
              lastGame: playerData.statistics?.filter((s: any) => s.type === 'game')[0]?.stats || {},
              projections: {}
            }
          };
          
          // Add injury info if available
          if (playerData.injuries?.length > 0) {
            const injury = playerData.injuries[0];
            player.injuryStatus = {
              status: injury.status,
              description: injury.details?.detail || 'Unknown',
              date: injury.date
            };
          }
          
          // Add recent news
          if (playerData.news?.length > 0) {
            player.news = playerData.news.slice(0, 3).map((n: any) => ({
              headline: n.headline,
              description: n.description || '',
              published: n.published
            }));
          }
          
          players.push(player);
        } catch (error) {
          // Skip individual player errors
          continue;
        }
      }
      
    } catch (error) {
      console.error(`Error fetching ${sport} data:`, error.message);
    }
    
    return { players, games };
  }
  
  /**
   * Process and store player data
   */
  private async processPlayerData(players: ESPNPlayer[]) {
    console.log(`💾 Processing ${players.length} players...`);
    
    for (const player of players) {
      try {
        // Update or create player record
        await prisma.dataSourceRecord.upsert({
          where: {
            sourceId_dataType: {
              sourceId: `espn_${player.id}`,
              dataType: 'PLAYER_STATS'
            }
          },
          update: {
            data: {
              name: player.fullName,
              position: player.position,
              team: player.team,
              stats: player.stats,
              injuryStatus: player.injuryStatus,
              news: player.news,
              lastUpdated: new Date()
            }
          },
          create: {
            sourceId: `espn_${player.id}`,
            dataType: 'PLAYER_STATS',
            source: 'ESPN',
            data: {
              name: player.fullName,
              position: player.position,
              team: player.team,
              stats: player.stats,
              injuryStatus: player.injuryStatus,
              news: player.news,
              lastUpdated: new Date()
            }
          }
        });
        
        // Update ML features if injury status changed
        if (player.injuryStatus) {
          await injuryRiskAssessment.updatePlayerInjuryStatus(
            player.id,
            player.injuryStatus.status,
            player.injuryStatus.description
          );
        }
        
      } catch (error) {
        console.error(`Error processing player ${player.fullName}:`, error);
      }
    }
  }
  
  /**
   * Process and store game data
   */
  private async processGameData(games: ESPNGame[]) {
    console.log(`🎮 Processing ${games.length} games...`);
    
    for (const game of games) {
      try {
        await prisma.dataSourceRecord.upsert({
          where: {
            sourceId_dataType: {
              sourceId: `espn_game_${game.id}`,
              dataType: 'GAME_DATA'
            }
          },
          update: {
            data: {
              ...game,
              lastUpdated: new Date()
            }
          },
          create: {
            sourceId: `espn_game_${game.id}`,
            dataType: 'GAME_DATA',
            source: 'ESPN',
            data: {
              ...game,
              lastUpdated: new Date()
            }
          }
        });
      } catch (error) {
        console.error(`Error processing game ${game.id}:`, error);
      }
    }
  }
  
  /**
   * Update ML models with fresh data
   */
  private async updateMLModels() {
    console.log('🤖 Updating ML models with fresh data...');
    
    try {
      // Get recent player data
      const recentData = await prisma.dataSourceRecord.findMany({
        where: {
          dataType: 'PLAYER_STATS',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        take: 100
      });
      
      // Extract features for ML models
      const features = recentData.map(record => {
        const data = record.data as any;
        return {
          playerId: record.sourceId.replace('espn_', ''),
          name: data.name,
          position: data.position,
          team: data.team,
          recentStats: data.stats.lastGame || {},
          seasonStats: data.stats.season || {},
          injuryStatus: data.injuryStatus?.status || 'healthy',
          newsCount: data.news?.length || 0
        };
      });
      
      // Update player performance model cache
      for (const feature of features) {
        playerPerformancePredictor.updatePlayerCache(feature.playerId, feature);
      }
      
      console.log(`✅ Updated ${features.length} player features in ML models`);
      
    } catch (error) {
      console.error('Error updating ML models:', error);
    }
  }
  
  /**
   * Get real-time player stats
   */
  async getRealTimePlayerStats(playerId: string) {
    const record = await prisma.dataSourceRecord.findFirst({
      where: {
        sourceId: `espn_${playerId}`,
        dataType: 'PLAYER_STATS'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return record?.data || null;
  }
  
  /**
   * Get live game data
   */
  async getLiveGameData(teamAbbr: string) {
    const games = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'GAME_DATA',
        OR: [
          { data: { path: ['home', 'team'], equals: teamAbbr } },
          { data: { path: ['away', 'team'], equals: teamAbbr } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    return games[0]?.data || null;
  }
}

export const espnDataAggregator = new ESPNDataAggregator();