/**
 * Injury & Weather Data Pipeline
 * Collects real-time injury reports and weather conditions for games
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { injuryRiskModel } from '@/lib/ml/models/injury-risk-assessment';

interface InjuryReport {
  playerId: string;
  playerName: string;
  team: string;
  injuryType: string;
  bodyPart: string;
  status: 'questionable' | 'doubtful' | 'out' | 'ir' | 'day-to-day';
  description: string;
  reportedDate: Date;
  estimatedReturn?: string;
  practiceStatus?: string;
  source: string;
  confidence: number;
}

interface WeatherData {
  gameId: string;
  venue: string;
  gameTime: Date;
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  precipitation: number;
  conditions: string;
  visibility: number;
  pressure: number;
  uvIndex: number;
  fieldCondition?: 'dry' | 'wet' | 'muddy' | 'frozen';
}

interface TeamHealthReport {
  teamId: string;
  teamName: string;
  injuredPlayers: number;
  questionablePlayers: number;
  healthScore: number; // 0-100
  keyPlayersStatus: Array<{
    player: string;
    position: string;
    status: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export class InjuryWeatherPipeline {
  private injurySources = [
    'https://www.espn.com/apis/injury-report',
    'https://sports.yahoo.com/injuries',
    'https://www.rotoworld.com/api/injuries',
    'https://www.cbssports.com/injuries'
  ];
  
  private weatherAPIs = [
    'https://api.openweathermap.org/data/2.5',
    'https://api.weather.gov',
    'https://api.weatherapi.com/v1'
  ];
  
  private updateInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start the injury & weather pipeline
   */
  async startPipeline(intervalSeconds = 60) {
    console.log('🏥 Starting Injury & Weather pipeline...');
    
    // Initial fetch
    await this.fetchAllData();
    
    // Set up interval (less frequent than game data)
    this.updateInterval = setInterval(async () => {
      await this.fetchAllData();
    }, intervalSeconds * 1000);
    
    console.log(`✅ Injury & Weather pipeline running (updates every ${intervalSeconds}s)`);
  }
  
  /**
   * Stop the pipeline
   */
  stopPipeline() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 Injury & Weather pipeline stopped');
    }
  }
  
  /**
   * Fetch all injury and weather data
   */
  private async fetchAllData() {
    try {
      console.log('🔄 Fetching injury & weather data...');
      
      // Fetch in parallel
      const [injuries, weather] = await Promise.all([
        this.fetchInjuryReports(),
        this.fetchWeatherData()
      ]);
      
      // Process and store
      await this.processInjuryReports(injuries);
      await this.processWeatherData(weather);
      
      // Generate team health reports
      await this.generateTeamHealthReports();
      
      // Update ML models
      await this.updateInjuryRiskModel(injuries);
      
      console.log('✅ Injury & Weather update complete');
    } catch (error) {
      console.error('❌ Injury & Weather pipeline error:', error);
    }
  }
  
  /**
   * Fetch injury reports from multiple sources
   */
  private async fetchInjuryReports(): Promise<InjuryReport[]> {
    const allInjuries: InjuryReport[] = [];
    
    // Mock implementation - would scrape/API call real sources
    const mockInjuries: InjuryReport[] = [
      {
        playerId: 'mahomes_15',
        playerName: 'Patrick Mahomes',
        team: 'KC',
        injuryType: 'ankle',
        bodyPart: 'right ankle',
        status: 'questionable',
        description: 'Limited in practice with ankle soreness',
        reportedDate: new Date(),
        estimatedReturn: 'Week 15',
        practiceStatus: 'limited',
        source: 'ESPN',
        confidence: 0.85
      },
      {
        playerId: 'mccaffrey_22',
        playerName: 'Christian McCaffrey',
        team: 'SF',
        injuryType: 'knee',
        bodyPart: 'left knee',
        status: 'out',
        description: 'PCL strain, expected to miss 2-3 weeks',
        reportedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        estimatedReturn: 'Week 17',
        practiceStatus: 'dnp',
        source: 'Yahoo',
        confidence: 0.95
      },
      {
        playerId: 'jefferson_18',
        playerName: 'Justin Jefferson',
        team: 'MIN',
        injuryType: 'hamstring',
        bodyPart: 'right hamstring',
        status: 'day-to-day',
        description: 'Mild hamstring tightness, expected to play',
        reportedDate: new Date(),
        practiceStatus: 'full',
        source: 'Rotoworld',
        confidence: 0.75
      }
    ];
    
    // In production, would aggregate from multiple sources
    // and use NLP to extract injury information
    
    // Deduplicate and validate injuries
    const injuryMap = new Map<string, InjuryReport>();
    
    for (const injury of mockInjuries) {
      const key = `${injury.playerId}_${injury.injuryType}`;
      const existing = injuryMap.get(key);
      
      // Keep the most recent or highest confidence report
      if (!existing || injury.confidence > existing.confidence) {
        injuryMap.set(key, injury);
      }
    }
    
    return Array.from(injuryMap.values());
  }
  
  /**
   * Fetch weather data for upcoming games
   */
  private async fetchWeatherData(): Promise<WeatherData[]> {
    const weatherReports: WeatherData[] = [];
    
    // Get upcoming games from database
    const upcomingGames = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'GAME_DATA',
        data: {
          path: ['status'],
          string_contains: 'scheduled'
        }
      },
      take: 20
    });
    
    // Mock weather data - would use real weather APIs
    for (const game of upcomingGames) {
      const gameData = game.data as any;
      
      const weather: WeatherData = {
        gameId: gameData.id,
        venue: gameData.venue || 'Unknown Stadium',
        gameTime: new Date(gameData.startTime || Date.now()),
        temperature: Math.round(50 + Math.random() * 40), // 50-90°F
        feelsLike: Math.round(45 + Math.random() * 45),
        windSpeed: Math.round(Math.random() * 20), // 0-20 mph
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        humidity: Math.round(30 + Math.random() * 60), // 30-90%
        precipitation: Math.random() < 0.3 ? Math.random() * 0.5 : 0, // 30% chance of rain
        conditions: Math.random() < 0.7 ? 'clear' : Math.random() < 0.5 ? 'cloudy' : 'rainy',
        visibility: Math.round(5 + Math.random() * 5), // 5-10 miles
        pressure: Math.round(29.5 + Math.random() * 1), // 29.5-30.5 inHg
        uvIndex: Math.round(Math.random() * 10),
        fieldCondition: Math.random() < 0.8 ? 'dry' : 'wet'
      };
      
      weatherReports.push(weather);
    }
    
    return weatherReports;
  }
  
  /**
   * Process and store injury reports
   */
  private async processInjuryReports(injuries: InjuryReport[]) {
    console.log(`🏥 Processing ${injuries.length} injury reports...`);
    
    for (const injury of injuries) {
      try {
        // Store injury report
        await prisma.dataSourceRecord.upsert({
          where: {
            sourceId_dataType: {
              sourceId: `injury_${injury.playerId}_${injury.reportedDate.getTime()}`,
              dataType: 'INJURY_REPORT'
            }
          },
          update: {
            data: injury
          },
          create: {
            sourceId: `injury_${injury.playerId}_${injury.reportedDate.getTime()}`,
            dataType: 'INJURY_REPORT',
            source: injury.source,
            data: injury as any
          }
        });
        
        // Create alert for significant injuries
        if (injury.status === 'out' || injury.status === 'ir') {
          await prisma.alert.create({
            data: {
              type: 'INJURY',
              severity: injury.status === 'ir' ? 'high' : 'medium',
              title: `${injury.playerName} ${injury.status.toUpperCase()}`,
              message: injury.description,
              data: {
                playerId: injury.playerId,
                team: injury.team,
                returnDate: injury.estimatedReturn
              }
            }
          });
        }
        
      } catch (error) {
        console.error(`Error processing injury for ${injury.playerName}:`, error);
      }
    }
  }
  
  /**
   * Process and store weather data
   */
  private async processWeatherData(weatherReports: WeatherData[]) {
    console.log(`🌤️ Processing ${weatherReports.length} weather reports...`);
    
    for (const weather of weatherReports) {
      try {
        await prisma.dataSourceRecord.upsert({
          where: {
            sourceId_dataType: {
              sourceId: `weather_${weather.gameId}`,
              dataType: 'WEATHER_DATA'
            }
          },
          update: {
            data: weather
          },
          create: {
            sourceId: `weather_${weather.gameId}`,
            dataType: 'WEATHER_DATA',
            source: 'WeatherAPI',
            data: weather as any
          }
        });
        
        // Create alert for extreme weather
        if (weather.windSpeed > 15 || weather.precipitation > 0.3 || weather.temperature < 32) {
          await prisma.alert.create({
            data: {
              type: 'WEATHER',
              severity: 'medium',
              title: `Extreme weather for ${weather.venue}`,
              message: `${weather.conditions} - ${weather.temperature}°F, ${weather.windSpeed}mph winds`,
              data: {
                gameId: weather.gameId,
                venue: weather.venue,
                conditions: weather
              }
            }
          });
        }
        
      } catch (error) {
        console.error(`Error processing weather for game ${weather.gameId}:`, error);
      }
    }
  }
  
  /**
   * Generate team health reports
   */
  private async generateTeamHealthReports() {
    console.log('📊 Generating team health reports...');
    
    // Get all recent injuries grouped by team
    const recentInjuries = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'INJURY_REPORT',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    // Group by team
    const teamInjuries = new Map<string, InjuryReport[]>();
    
    for (const record of recentInjuries) {
      const injury = record.data as unknown as InjuryReport;
      const team = injury.team;
      
      if (!teamInjuries.has(team)) {
        teamInjuries.set(team, []);
      }
      
      teamInjuries.get(team)!.push(injury);
    }
    
    // Generate reports
    for (const [team, injuries] of teamInjuries) {
      const injuredCount = injuries.filter(i => i.status === 'out' || i.status === 'ir').length;
      const questionableCount = injuries.filter(i => i.status === 'questionable').length;
      
      const healthScore = Math.max(0, 100 - (injuredCount * 15) - (questionableCount * 5));
      
      const report: TeamHealthReport = {
        teamId: team,
        teamName: team,
        injuredPlayers: injuredCount,
        questionablePlayers: questionableCount,
        healthScore,
        keyPlayersStatus: injuries
          .filter(i => i.confidence > 0.8)
          .map(i => ({
            player: i.playerName,
            position: 'N/A', // Would need position data
            status: i.status,
            impact: injuredCount > 3 ? 'high' : injuredCount > 1 ? 'medium' : 'low'
          }))
      };
      
      // Store team health report
      await prisma.dataSourceRecord.upsert({
        where: {
          sourceId_dataType: {
            sourceId: `team_health_${team}`,
            dataType: 'TEAM_HEALTH'
          }
        },
        update: {
          data: report
        },
        create: {
          sourceId: `team_health_${team}`,
          dataType: 'TEAM_HEALTH',
          source: 'Internal',
          data: report as any
        }
      });
    }
  }
  
  /**
   * Update injury risk ML model
   */
  private async updateInjuryRiskModel(injuries: InjuryReport[]) {
    console.log('🤖 Updating injury risk model...');
    
    for (const injury of injuries) {
      await injuryRiskModel.updatePlayerInjuryStatus(
        injury.playerId,
        injury.status,
        injury.description
      );
    }
  }
  
  /**
   * Get injury status for specific players
   */
  async getPlayerInjuryStatus(playerIds: string[]) {
    const injuries = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'INJURY_REPORT',
        sourceId: {
          in: playerIds.map(id => `injury_${id}`)
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return injuries.map(i => i.data);
  }
  
  /**
   * Get weather for specific game
   */
  async getGameWeather(gameId: string) {
    const weather = await prisma.dataSourceRecord.findFirst({
      where: {
        sourceId: `weather_${gameId}`,
        dataType: 'WEATHER_DATA'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return weather?.data || null;
  }
}

export const injuryWeatherPipeline = new InjuryWeatherPipeline();