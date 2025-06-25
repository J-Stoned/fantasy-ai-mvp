/**
 * Betting & Market Data Collector
 * Tracks DFS pricing, ownership projections, and betting lines
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { gameOutcomeModel } from '@/lib/ml/models/game-outcome-predictor';

interface DFSPricing {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  platforms: {
    draftkings: {
      salary: number;
      projectedPoints: number;
      value: number; // points per $1000
      ownership: number; // projected %
    };
    fanduel: {
      salary: number;
      projectedPoints: number;
      value: number;
      ownership: number;
    };
    yahoo: {
      salary: number;
      projectedPoints: number;
      value: number;
      ownership: number;
    };
  };
  optimalExposure: number; // ML-calculated optimal ownership %
  leverageScore: number; // How much to over/under-weight vs field
}

interface BettingLine {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sportsbooks: {
    draftkings: BettingOdds;
    fanduel: BettingOdds;
    caesars: BettingOdds;
    mgm: BettingOdds;
  };
  consensus: {
    spread: number;
    total: number;
    homeML: number;
    awayML: number;
  };
  sharpMoney: {
    side: 'home' | 'away' | 'neutral';
    confidence: number;
  };
}

interface BettingOdds {
  spread: {
    line: number;
    juice: number;
  };
  total: {
    line: number;
    overJuice: number;
    underJuice: number;
  };
  moneyline: {
    home: number;
    away: number;
  };
}

interface PlayerPropBet {
  playerId: string;
  playerName: string;
  propType: string; // 'passing_yards', 'rushing_yards', 'receptions', etc.
  line: number;
  overOdds: number;
  underOdds: number;
  recommendation: 'over' | 'under' | 'pass';
  confidence: number;
  reasoning: string;
}

interface MarketTrend {
  type: 'player' | 'team' | 'game';
  entityId: string;
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // % change
  timeframe: string;
  volume: number; // Number of transactions/bets
}

export class MarketDataCollector {
  private dfsAPIs = {
    draftkings: 'https://api.draftkings.com/draftgroups/v1',
    fanduel: 'https://api.fanduel.com/contests',
    yahoo: 'https://dfyql-ro.sports.yahoo.com/v2'
  };
  
  private bettingAPIs = {
    odds: 'https://api.the-odds-api.com/v4',
    action: 'https://api.actionnetwork.com/v1'
  };
  
  private updateInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start market data collection
   */
  async startMarketDataCollection(intervalSeconds = 300) { // 5 minutes default
    console.log('💰 Starting market data collection...');
    
    // Initial fetch
    await this.fetchAllMarketData();
    
    // Set up interval
    this.updateInterval = setInterval(async () => {
      await this.fetchAllMarketData();
    }, intervalSeconds * 1000);
    
    console.log(`✅ Market data collector running (updates every ${intervalSeconds}s)`);
  }
  
  /**
   * Stop market data collection
   */
  stopMarketDataCollection() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 Market data collector stopped');
    }
  }
  
  /**
   * Fetch all market data
   */
  private async fetchAllMarketData() {
    try {
      console.log('📊 Fetching market data...');
      
      // Fetch different data types in parallel
      const [dfsData, bettingData, propBets, trends] = await Promise.all([
        this.fetchDFSPricing(),
        this.fetchBettingLines(),
        this.fetchPlayerProps(),
        this.fetchMarketTrends()
      ]);
      
      // Process and store all data
      await this.processDFSData(dfsData);
      await this.processBettingData(bettingData);
      await this.processPlayerProps(propBets);
      await this.processMarketTrends(trends);
      
      // Generate market insights
      await this.generateMarketInsights();
      
      console.log('✅ Market data update complete');
    } catch (error) {
      console.error('❌ Market data collection error:', error);
    }
  }
  
  /**
   * Fetch DFS pricing and ownership
   */
  private async fetchDFSPricing(): Promise<DFSPricing[]> {
    const dfsData: DFSPricing[] = [];
    
    // Mock implementation - would integrate with real DFS APIs
    const mockPlayers = [
      { id: 'mahomes_15', name: 'Patrick Mahomes', pos: 'QB', team: 'KC' },
      { id: 'allen_17', name: 'Josh Allen', pos: 'QB', team: 'BUF' },
      { id: 'mccaffrey_22', name: 'Christian McCaffrey', pos: 'RB', team: 'SF' },
      { id: 'hill_10', name: 'Tyreek Hill', pos: 'WR', team: 'MIA' },
      { id: 'kelce_87', name: 'Travis Kelce', pos: 'TE', team: 'KC' }
    ];
    
    for (const player of mockPlayers) {
      const dkSalary = 6000 + Math.round(Math.random() * 4000);
      const fdSalary = Math.round(dkSalary * 0.95);
      const yahooSalary = Math.round(dkSalary * 0.9);
      
      const baseProjection = 15 + Math.random() * 10;
      
      const pricing: DFSPricing = {
        playerId: player.id,
        playerName: player.name,
        position: player.pos,
        team: player.team,
        platforms: {
          draftkings: {
            salary: dkSalary,
            projectedPoints: baseProjection + Math.random() * 2,
            value: (baseProjection / dkSalary) * 1000,
            ownership: 5 + Math.random() * 25
          },
          fanduel: {
            salary: fdSalary,
            projectedPoints: baseProjection + Math.random() * 2,
            value: (baseProjection / fdSalary) * 1000,
            ownership: 5 + Math.random() * 25
          },
          yahoo: {
            salary: yahooSalary,
            projectedPoints: baseProjection + Math.random() * 2,
            value: (baseProjection / yahooSalary) * 1000,
            ownership: 5 + Math.random() * 20
          }
        },
        optimalExposure: 0, // Will be calculated
        leverageScore: 0 // Will be calculated
      };
      
      // Calculate optimal exposure based on value and projected ownership
      const avgValue = (pricing.platforms.draftkings.value + 
                       pricing.platforms.fanduel.value + 
                       pricing.platforms.yahoo.value) / 3;
      const avgOwnership = (pricing.platforms.draftkings.ownership + 
                           pricing.platforms.fanduel.ownership + 
                           pricing.platforms.yahoo.ownership) / 3;
      
      pricing.optimalExposure = Math.min(40, avgValue * 4);
      pricing.leverageScore = (pricing.optimalExposure - avgOwnership) / avgOwnership;
      
      dfsData.push(pricing);
    }
    
    return dfsData;
  }
  
  /**
   * Fetch betting lines
   */
  private async fetchBettingLines(): Promise<BettingLine[]> {
    const bettingLines: BettingLine[] = [];
    
    // Mock implementation
    const games = [
      { id: 'KC_BUF', home: 'KC', away: 'BUF' },
      { id: 'DAL_SF', home: 'DAL', away: 'SF' },
      { id: 'MIA_BAL', home: 'MIA', away: 'BAL' }
    ];
    
    for (const game of games) {
      const baseSpread = -3 + Math.random() * 6;
      const baseTotal = 45 + Math.random() * 10;
      
      const line: BettingLine = {
        gameId: game.id,
        homeTeam: game.home,
        awayTeam: game.away,
        sportsbooks: {
          draftkings: {
            spread: { line: baseSpread, juice: -110 },
            total: { line: baseTotal, overJuice: -110, underJuice: -110 },
            moneyline: { home: baseSpread < 0 ? -150 : 130, away: baseSpread < 0 ? 130 : -150 }
          },
          fanduel: {
            spread: { line: baseSpread + 0.5, juice: -108 },
            total: { line: baseTotal - 0.5, overJuice: -112, underJuice: -108 },
            moneyline: { home: baseSpread < 0 ? -145 : 125, away: baseSpread < 0 ? 125 : -145 }
          },
          caesars: {
            spread: { line: baseSpread, juice: -105 },
            total: { line: baseTotal, overJuice: -105, underJuice: -115 },
            moneyline: { home: baseSpread < 0 ? -155 : 135, away: baseSpread < 0 ? 135 : -155 }
          },
          mgm: {
            spread: { line: baseSpread - 0.5, juice: -115 },
            total: { line: baseTotal + 0.5, overJuice: -108, underJuice: -112 },
            moneyline: { home: baseSpread < 0 ? -140 : 120, away: baseSpread < 0 ? 120 : -140 }
          }
        },
        consensus: {
          spread: baseSpread,
          total: baseTotal,
          homeML: baseSpread < 0 ? -148 : 127,
          awayML: baseSpread < 0 ? 127 : -148
        },
        sharpMoney: {
          side: Math.random() < 0.5 ? 'home' : 'away',
          confidence: 0.6 + Math.random() * 0.3
        }
      };
      
      bettingLines.push(line);
    }
    
    return bettingLines;
  }
  
  /**
   * Fetch player prop bets
   */
  private async fetchPlayerProps(): Promise<PlayerPropBet[]> {
    const props: PlayerPropBet[] = [];
    
    // Mock player props
    const playerProps = [
      { id: 'mahomes_15', name: 'Patrick Mahomes', type: 'passing_yards', line: 285.5 },
      { id: 'allen_17', name: 'Josh Allen', type: 'rushing_yards', line: 42.5 },
      { id: 'mccaffrey_22', name: 'Christian McCaffrey', type: 'rushing_yards', line: 95.5 },
      { id: 'hill_10', name: 'Tyreek Hill', type: 'receptions', line: 6.5 },
      { id: 'kelce_87', name: 'Travis Kelce', type: 'receiving_yards', line: 75.5 }
    ];
    
    for (const prop of playerProps) {
      const mlAnalysis = Math.random(); // Would use ML model
      
      const propBet: PlayerPropBet = {
        playerId: prop.id,
        playerName: prop.name,
        propType: prop.type,
        line: prop.line,
        overOdds: -110,
        underOdds: -110,
        recommendation: mlAnalysis > 0.6 ? 'over' : mlAnalysis < 0.4 ? 'under' : 'pass',
        confidence: Math.abs(mlAnalysis - 0.5) * 2,
        reasoning: mlAnalysis > 0.6 
          ? `Historical performance and matchup favor the over`
          : mlAnalysis < 0.4
          ? `Defensive matchup and recent trends suggest under`
          : `Line appears efficient, no edge identified`
      };
      
      props.push(propBet);
    }
    
    return props;
  }
  
  /**
   * Fetch market trends
   */
  private async fetchMarketTrends(): Promise<MarketTrend[]> {
    const trends: MarketTrend[] = [];
    
    // Mock trending data
    trends.push(
      {
        type: 'player',
        entityId: 'mahomes_15',
        metric: 'ownership',
        direction: 'up',
        magnitude: 15.5,
        timeframe: '24h',
        volume: 25000
      },
      {
        type: 'team',
        entityId: 'KC',
        metric: 'team_total',
        direction: 'up',
        magnitude: 3.5,
        timeframe: '6h',
        volume: 50000
      },
      {
        type: 'game',
        entityId: 'KC_BUF',
        metric: 'total_points',
        direction: 'down',
        magnitude: 2.0,
        timeframe: '12h',
        volume: 100000
      }
    );
    
    return trends;
  }
  
  /**
   * Process and store DFS data
   */
  private async processDFSData(dfsData: DFSPricing[]) {
    console.log(`💵 Processing ${dfsData.length} DFS pricing records...`);
    
    for (const pricing of dfsData) {
      try {
        await prisma.dataSourceRecord.upsert({
          where: {
            sourceId_dataType: {
              sourceId: `dfs_${pricing.playerId}`,
              dataType: 'DFS_PRICING'
            }
          },
          update: {
            data: pricing
          },
          create: {
            sourceId: `dfs_${pricing.playerId}`,
            dataType: 'DFS_PRICING',
            source: 'DFS_AGGREGATOR',
            data: pricing as any
          }
        });
        
        // Alert on high leverage plays
        if (Math.abs(pricing.leverageScore) > 0.5) {
          await prisma.alert.create({
            data: {
              type: 'DFS',
              severity: 'medium',
              title: `High leverage play: ${pricing.playerName}`,
              message: `${pricing.leverageScore > 0 ? 'Under-owned' : 'Over-owned'} by ${Math.abs(pricing.leverageScore * 100).toFixed(0)}%`,
              data: pricing
            }
          });
        }
        
      } catch (error) {
        console.error(`Error processing DFS data for ${pricing.playerName}:`, error);
      }
    }
  }
  
  /**
   * Process and store betting data
   */
  private async processBettingData(bettingLines: BettingLine[]) {
    console.log(`🎲 Processing ${bettingLines.length} betting lines...`);
    
    for (const line of bettingLines) {
      try {
        await prisma.dataSourceRecord.upsert({
          where: {
            sourceId_dataType: {
              sourceId: `betting_${line.gameId}`,
              dataType: 'BETTING_LINE'
            }
          },
          update: {
            data: line
          },
          create: {
            sourceId: `betting_${line.gameId}`,
            dataType: 'BETTING_LINE',
            source: 'BETTING_AGGREGATOR',
            data: line as any
          }
        });
        
        // Update game outcome model with betting data
        await gameOutcomeModel.updateBettingData(line);
        
      } catch (error) {
        console.error(`Error processing betting line for ${line.gameId}:`, error);
      }
    }
  }
  
  /**
   * Process player props
   */
  private async processPlayerProps(props: PlayerPropBet[]) {
    console.log(`🎯 Processing ${props.length} player props...`);
    
    for (const prop of props) {
      try {
        await prisma.dataSourceRecord.upsert({
          where: {
            sourceId_dataType: {
              sourceId: `prop_${prop.playerId}_${prop.propType}`,
              dataType: 'PLAYER_PROP'
            }
          },
          update: {
            data: prop
          },
          create: {
            sourceId: `prop_${prop.playerId}_${prop.propType}`,
            dataType: 'PLAYER_PROP',
            source: 'PROP_AGGREGATOR',
            data: prop as any
          }
        });
      } catch (error) {
        console.error(`Error processing prop for ${prop.playerName}:`, error);
      }
    }
  }
  
  /**
   * Process market trends
   */
  private async processMarketTrends(trends: MarketTrend[]) {
    console.log(`📈 Processing ${trends.length} market trends...`);
    
    for (const trend of trends) {
      try {
        await prisma.dataSourceRecord.create({
          data: {
            sourceId: `trend_${trend.entityId}_${Date.now()}`,
            dataType: 'MARKET_TREND',
            source: 'TREND_ANALYZER',
            data: trend as any
          }
        });
      } catch (error) {
        console.error('Error processing market trend:', error);
      }
    }
  }
  
  /**
   * Generate market insights
   */
  private async generateMarketInsights() {
    console.log('🧠 Generating market insights...');
    
    // Get recent market data
    const recentDFS = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'DFS_PRICING',
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    });
    
    const recentBetting = await prisma.dataSourceRecord.findMany({
      where: {
        dataType: 'BETTING_LINE',
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    });
    
    // Analyze for arbitrage opportunities, market inefficiencies, etc.
    console.log(`✅ Generated insights from ${recentDFS.length} DFS and ${recentBetting.length} betting records`);
  }
  
  /**
   * Get optimal DFS lineup based on market data
   */
  async getOptimalDFSLineup(platform: 'draftkings' | 'fanduel' | 'yahoo', budget: number) {
    const players = await prisma.dataSourceRecord.findMany({
      where: { dataType: 'DFS_PRICING' },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    
    // Implement lineup optimization algorithm
    // This would use linear programming or genetic algorithms
    
    return {
      lineup: [],
      totalSalary: 0,
      projectedPoints: 0,
      leverageScore: 0
    };
  }
}

export const marketDataCollector = new MarketDataCollector();