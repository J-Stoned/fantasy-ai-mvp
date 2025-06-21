/**
 * ⚾ MLB DATA PIPELINE - Real Baseball Data Collection
 * Mission: "Either we know it or we don't... yet!"
 * 
 * Collects REAL MLB data for Fantasy Baseball dominance!
 */

import { createClient } from '@supabase/supabase-js';
import { unifiedMCPManager } from '../mcp-integration/unified-mcp-manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export interface MLBPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  jersey_number: number;
  age: number;
  height: string;
  weight: string;
  bats: 'L' | 'R' | 'S'; // Switch
  throws: 'L' | 'R';
  stats: {
    // Batting Stats
    avg: number;
    obp: number;
    slg: number;
    ops: number;
    home_runs: number;
    rbi: number;
    runs: number;
    stolen_bases: number;
    strikeouts: number;
    walks: number;
    // Pitching Stats
    era?: number;
    whip?: number;
    wins?: number;
    saves?: number;
    strikeouts_per_9?: number;
    innings_pitched?: number;
  };
  projections: {
    home_runs: number;
    rbi: number;
    runs: number;
    stolen_bases: number;
    avg: number;
    // Pitcher projections
    wins?: number;
    saves?: number;
    era?: number;
    strikeouts?: number;
  };
  injury_status: 'healthy' | 'day_to_day' | 'il_10' | 'il_15' | 'il_60';
  salary: {
    draftkings: number;
    fanduel: number;
    yahoo: number;
  };
}

export interface MLBGame {
  id: string;
  home_team: string;
  away_team: string;
  game_date: string;
  game_time: string;
  ballpark: string;
  total: number; // Over/under runs
  run_line: number; // Spread
  home_pitcher: string;
  away_pitcher: string;
  weather: {
    temperature: number;
    wind_speed: number;
    wind_direction: string;
    conditions: string;
  };
  home_score?: number;
  away_score?: number;
  inning: number;
  status: 'scheduled' | 'live' | 'rain_delay' | 'final' | 'postponed';
}

export class MLBDataPipeline {
  
  /**
   * ⚾ COLLECT ALL MLB DATA - Players, Games, Pitchers, Weather
   */
  async collectAllMLBData(): Promise<any> {
    console.log('⚾ COLLECTING REAL MLB DATA FROM ALL SOURCES');
    
    try {
      const [players, games, injuries, pitchers, weather] = await Promise.all([
        this.collectMLBPlayers(),
        this.collectMLBGames(),
        this.collectMLBInjuries(),
        this.collectMLBPitchers(),
        this.collectMLBWeather()
      ]);

      // 💾 INSERT INTO DATABASE
      await Promise.all([
        this.insertMLBPlayers(players),
        this.insertMLBGames(games),
        this.insertMLBInjuries(injuries),
        this.insertMLBPitchers(pitchers),
        this.insertMLBWeather(weather)
      ]);

      return {
        players: players.length,
        games: games.length,
        injuries: injuries.length,
        pitchers: pitchers.length,
        weather: weather.length,
        dataSource: 'real_mlb_mcp',
        missionStatement: 'Either we know it or we don\'t... yet!'
      };

    } catch (error) {
      console.error('❌ MLB data collection failed:', error);
      return {
        error: 'MLB data collection failed... yet!',
        missionStatement: 'Either we know it or we don\'t... yet!'
      };
    }
  }

  /**
   * 👨‍💼 Collect REAL MLB player data
   */
  private async collectMLBPlayers(): Promise<MLBPlayer[]> {
    try {
      const result = await unifiedMCPManager.executeCapability({
        operation: "scrape_mlb_players",
        servers: ["firecrawl", "puppeteer"],
        priority: "high" as const,
        parameters: {
          sources: [
            'https://www.mlb.com/players/',
            'https://www.espn.com/mlb/players/',
            'https://www.baseball-reference.com/players/',
            'https://www.fangraphs.com/players/'
          ],
          includeStats: true,
          includeProjections: true,
          includeSalaries: true,
          season: 2024
        }
      });

      if (!result?.players) {
        console.log('📝 No real MLB player data available... yet!');
        return [];
      }

      return result.players.map((player: any) => ({
        id: player.id || `mlb_${player.name?.replace(/\s+/g, '_')}`,
        name: player.name,
        team: player.team || 'UNK',
        position: player.position || 'OF',
        jersey_number: player.jersey || 0,
        age: player.age || 25,
        height: player.height || '6-0',
        weight: player.weight || '180',
        bats: player.bats || 'R',
        throws: player.throws || 'R',
        stats: {
          avg: player.stats?.avg || 0,
          obp: player.stats?.obp || 0,
          slg: player.stats?.slg || 0,
          ops: player.stats?.ops || 0,
          home_runs: player.stats?.hr || 0,
          rbi: player.stats?.rbi || 0,
          runs: player.stats?.runs || 0,
          stolen_bases: player.stats?.sb || 0,
          strikeouts: player.stats?.so || 0,
          walks: player.stats?.bb || 0,
          era: player.stats?.era,
          whip: player.stats?.whip,
          wins: player.stats?.wins,
          saves: player.stats?.saves,
          strikeouts_per_9: player.stats?.k_9,
          innings_pitched: player.stats?.ip
        },
        projections: {
          home_runs: player.projections?.hr || 0,
          rbi: player.projections?.rbi || 0,
          runs: player.projections?.runs || 0,
          stolen_bases: player.projections?.sb || 0,
          avg: player.projections?.avg || 0,
          wins: player.projections?.wins,
          saves: player.projections?.saves,
          era: player.projections?.era,
          strikeouts: player.projections?.k
        },
        injury_status: player.injury_status || 'healthy',
        salary: {
          draftkings: player.salary?.dk || 0,
          fanduel: player.salary?.fd || 0,
          yahoo: player.salary?.yahoo || 0
        }
      }));

    } catch (error) {
      console.error('Failed to collect MLB players:', error);
      return [];
    }
  }

  /**
   * 🏟️ Collect REAL MLB games with weather
   */
  private async collectMLBGames(): Promise<MLBGame[]> {
    try {
      const result = await unifiedMCPManager.executeCapability({
        operation: "scrape_mlb_schedule",
        servers: ["firecrawl", "puppeteer"],
        priority: "high" as const,
        parameters: {
          sources: [
            'https://www.mlb.com/schedule/',
            'https://www.espn.com/mlb/schedule/',
            'https://www.baseball-reference.com/previews/'
          ],
          includePitchers: true,
          includeWeather: true,
          includeBettingLines: true,
          timeframe: '7_days'
        }
      });

      return result?.games?.map((game: any) => ({
        id: game.id || `mlb_game_${Date.now()}`,
        home_team: game.home_team,
        away_team: game.away_team,
        game_date: game.date,
        game_time: game.time,
        ballpark: game.venue || 'TBD',
        total: game.total || 0,
        run_line: game.run_line || 0,
        home_pitcher: game.home_pitcher || 'TBD',
        away_pitcher: game.away_pitcher || 'TBD',
        weather: {
          temperature: game.weather?.temp || 75,
          wind_speed: game.weather?.wind_speed || 0,
          wind_direction: game.weather?.wind_dir || 'Calm',
          conditions: game.weather?.conditions || 'Clear'
        },
        home_score: game.home_score || null,
        away_score: game.away_score || null,
        inning: game.inning || 0,
        status: game.status || 'scheduled'
      })) || [];

    } catch (error) {
      console.error('Failed to collect MLB games:', error);
      return [];
    }
  }

  /**
   * 🏥 Collect MLB injury reports
   */
  private async collectMLBInjuries(): Promise<any[]> {
    try {
      const result = await unifiedMCPManager.executeCapability({
        operation: "scrape_mlb_injuries",
        servers: ["firecrawl"],
        priority: "high" as const,
        parameters: {
          sources: [
            'https://www.mlb.com/news/injuries/',
            'https://www.espn.com/mlb/injuries/',
            'https://rotoworld.com/baseball/mlb/injury-report'
          ],
          timeframe: '14d' // Baseball has longer injury timelines
        }
      });

      return result?.injuries || [];
    } catch (error) {
      console.error('Failed to collect MLB injuries:', error);
      return [];
    }
  }

  /**
   * ⚾ Collect pitcher rotations and bullpen data
   */
  private async collectMLBPitchers(): Promise<any[]> {
    try {
      const result = await unifiedMCPManager.executeCapability({
        operation: "scrape_mlb_pitchers",
        servers: ["firecrawl"],
        priority: "medium" as const,
        parameters: {
          sources: [
            'https://www.mlb.com/news/probable-pitchers/',
            'https://www.rotowire.com/baseball/daily-lineups.php',
            'https://rotogrinders.com/lineups/mlb'
          ],
          includeRotations: true,
          includeBullpen: true
        }
      });

      return result?.pitchers || [];
    } catch (error) {
      console.error('Failed to collect MLB pitchers:', error);
      return [];
    }
  }

  /**
   * 🌤️ Collect detailed weather for all ballparks
   */
  private async collectMLBWeather(): Promise<any[]> {
    try {
      const result = await unifiedMCPManager.executeCapability({
        operation: "scrape_mlb_weather",
        servers: ["firecrawl", "puppeteer"],
        priority: "medium" as const,
        parameters: {
          sources: [
            'https://www.mlb.com/news/weather/',
            'https://rotogrinders.com/weather/mlb/',
            'https://weather.com/sports/baseball'
          ],
          includeForecast: true,
          includeWind: true // Critical for home runs
        }
      });

      return result?.weather || [];
    } catch (error) {
      console.error('Failed to collect MLB weather:', error);
      return [];
    }
  }

  // 💾 DATABASE INSERTION METHODS

  private async insertMLBPlayers(players: MLBPlayer[]): Promise<void> {
    if (players.length === 0) return;

    try {
      const { error } = await supabase
        .from('mlb_players')
        .upsert(players.map(player => ({
          ...player,
          sport: 'baseball',
          league: 'MLB',
          last_updated: new Date().toISOString(),
          data_source: 'real_mcp_scraping'
        })));

      if (error) throw error;
      console.log(`✅ Inserted ${players.length} MLB players`);

    } catch (error) {
      console.error('MLB players insert failed:', error);
    }
  }

  private async insertMLBGames(games: MLBGame[]): Promise<void> {
    if (games.length === 0) return;

    try {
      const { error } = await supabase
        .from('mlb_games')
        .upsert(games.map(game => ({
          ...game,
          sport: 'baseball',
          league: 'MLB',
          last_updated: new Date().toISOString(),
          data_source: 'real_mcp_scraping'
        })));

      if (error) throw error;
      console.log(`✅ Inserted ${games.length} MLB games`);

    } catch (error) {
      console.error('MLB games insert failed:', error);
    }
  }

  private async insertMLBInjuries(injuries: any[]): Promise<void> {
    if (injuries.length === 0) return;

    try {
      const { error } = await supabase
        .from('mlb_injuries')
        .upsert(injuries.map(injury => ({
          id: `mlb_injury_${Date.now()}_${Math.random()}`,
          player_id: injury.playerId,
          player_name: injury.playerName,
          team: injury.team,
          injury_type: injury.injuryType,
          status: injury.status,
          description: injury.description,
          estimated_return: injury.estimatedReturn,
          report_date: injury.reportDate || new Date().toISOString(),
          source: injury.source,
          sport: 'baseball',
          league: 'MLB',
          last_updated: new Date().toISOString(),
          data_source: 'real_mcp_scraping'
        })));

      if (error) throw error;
      console.log(`✅ Inserted ${injuries.length} MLB injuries`);

    } catch (error) {
      console.error('MLB injuries insert failed:', error);
    }
  }

  private async insertMLBPitchers(pitchers: any[]): Promise<void> {
    if (pitchers.length === 0) return;

    try {
      const { error } = await supabase
        .from('mlb_pitchers')
        .upsert(pitchers.map(pitcher => ({
          id: `mlb_pitcher_${Date.now()}_${Math.random()}`,
          player_id: pitcher.playerId,
          player_name: pitcher.playerName,
          team: pitcher.team,
          role: pitcher.role, // starter, closer, setup, etc.
          rotation_spot: pitcher.rotation_spot,
          probable_date: pitcher.probable_date,
          last_start: pitcher.last_start,
          next_start: pitcher.next_start,
          sport: 'baseball',
          league: 'MLB',
          last_updated: new Date().toISOString(),
          data_source: 'real_mcp_scraping'
        })));

      if (error) throw error;
      console.log(`✅ Inserted ${pitchers.length} MLB pitchers`);

    } catch (error) {
      console.error('MLB pitchers insert failed:', error);
    }
  }

  private async insertMLBWeather(weather: any[]): Promise<void> {
    if (weather.length === 0) return;

    try {
      const { error } = await supabase
        .from('mlb_weather')
        .upsert(weather.map(w => ({
          id: `mlb_weather_${Date.now()}_${Math.random()}`,
          game_id: w.gameId,
          ballpark: w.ballpark,
          temperature: w.temperature,
          wind_speed: w.windSpeed,
          wind_direction: w.windDirection,
          humidity: w.humidity,
          conditions: w.conditions,
          forecast_time: w.forecastTime || new Date().toISOString(),
          sport: 'baseball',
          league: 'MLB',
          last_updated: new Date().toISOString(),
          data_source: 'real_mcp_scraping'
        })));

      if (error) throw error;
      console.log(`✅ Inserted ${weather.length} MLB weather reports`);

    } catch (error) {
      console.error('MLB weather insert failed:', error);
    }
  }
}

export const mlbDataPipeline = new MLBDataPipeline();