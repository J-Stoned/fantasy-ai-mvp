import { prisma } from '@/lib/prisma';
import { cache, pubsub } from '@/lib/redis/redis-client';
import { getWebSocketServer } from '@/lib/websocket/websocket-server';
import { queues } from '@/lib/jobs/job-queue';

export class ScoreUpdater {
  private updateInterval: NodeJS.Timeout | null = null;
  private activeLeagues: Set<string> = new Set();

  // Start monitoring a league for score updates
  async startMonitoring(leagueId: string) {
    this.activeLeagues.add(leagueId);
    
    // Schedule immediate update
    await queues.scoreUpdate.add('immediate-update', {
      leagueId,
      week: await this.getCurrentWeek()
    });
    
    // Cache league as active
    await cache.set(`league:${leagueId}:monitoring`, true, 3600);
    
    console.log(`Started monitoring league: ${leagueId}`);
  }

  // Stop monitoring a league
  async stopMonitoring(leagueId: string) {
    this.activeLeagues.delete(leagueId);
    await cache.del(`league:${leagueId}:monitoring`);
    
    console.log(`Stopped monitoring league: ${leagueId}`);
  }

  // Process score update for a league
  async processScoreUpdate(leagueId: string, week: number) {
    try {
      // Get league details
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          User: true,
          players: {
            include: {
              player: true
            }
          }
        }
      });

      if (!league) {
        console.error(`League not found: ${leagueId}`);
        return;
      }

      // Fetch latest scores from platform
      const scores = await this.fetchPlatformScores(league.platform, league.externalId, week);
      
      // Calculate fantasy points
      const fantasyScores = await this.calculateFantasyScores(league, scores);
      
      // Update database
      await this.updateDatabaseScores(leagueId, fantasyScores);
      
      // Cache current scores
      await cache.set(
        `league:${leagueId}:scores:week:${week}`,
        fantasyScores,
        300 // 5 minute cache
      );
      
      // Send real-time updates
      const ws = getWebSocketServer();
      ws.sendScoreUpdate(leagueId, {
        week,
        scores: fantasyScores,
        lastUpdated: new Date()
      });
      
      // Publish to Redis pub/sub
      await pubsub.publish(`league:${leagueId}:scores`, {
        week,
        scores: fantasyScores,
        timestamp: new Date()
      });
      
      // Check for milestones and achievements
      await this.checkScoreMilestones(league.userId, fantasyScores);
      
    } catch (error) {
      console.error(`Score update failed for league ${leagueId}:`, error);
      throw error;
    }
  }

  // Fetch scores from fantasy platform
  private async fetchPlatformScores(platform: string, externalId: string, week: number) {
    // Simulate fetching from different platforms
    switch (platform) {
      case 'yahoo':
        return this.fetchYahooScores(externalId, week);
      case 'espn':
        return this.fetchESPNScores(externalId, week);
      case 'sleeper':
        return this.fetchSleeperScores(externalId, week);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // Yahoo Fantasy API integration
  private async fetchYahooScores(leagueId: string, week: number) {
    // In production, this would call Yahoo Fantasy API
    // For now, return simulated data
    return {
      teams: [
        {
          teamId: 'team1',
          score: Math.random() * 150 + 50,
          projectedScore: Math.random() * 150 + 50,
          players: []
        },
        {
          teamId: 'team2',
          score: Math.random() * 150 + 50,
          projectedScore: Math.random() * 150 + 50,
          players: []
        }
      ],
      players: await this.generatePlayerScores()
    };
  }

  // ESPN Fantasy API integration
  private async fetchESPNScores(leagueId: string, week: number) {
    // In production, this would call ESPN Fantasy API
    return {
      teams: [],
      players: await this.generatePlayerScores()
    };
  }

  // Sleeper API integration
  private async fetchSleeperScores(leagueId: string, week: number) {
    // In production, this would call Sleeper API
    return {
      teams: [],
      players: await this.generatePlayerScores()
    };
  }

  // Generate simulated player scores
  private async generatePlayerScores() {
    const players = await prisma.player.findMany({
      take: 20,
      where: {
        position: {
          in: ['QB', 'RB', 'WR', 'TE']
        }
      }
    });

    return players.map(player => ({
      playerId: player.id,
      points: Math.random() * 30,
      projectedPoints: Math.random() * 30,
      stats: {
        passingYards: player.position === 'QB' ? Math.floor(Math.random() * 400) : 0,
        passingTDs: player.position === 'QB' ? Math.floor(Math.random() * 4) : 0,
        rushingYards: ['RB', 'QB'].includes(player.position) ? Math.floor(Math.random() * 150) : 0,
        rushingTDs: ['RB', 'QB'].includes(player.position) ? Math.floor(Math.random() * 2) : 0,
        receivingYards: ['WR', 'TE', 'RB'].includes(player.position) ? Math.floor(Math.random() * 150) : 0,
        receivingTDs: ['WR', 'TE', 'RB'].includes(player.position) ? Math.floor(Math.random() * 2) : 0,
        receptions: ['WR', 'TE', 'RB'].includes(player.position) ? Math.floor(Math.random() * 10) : 0
      }
    }));
  }

  // Calculate fantasy scores based on scoring settings
  private async calculateFantasyScores(league: any, rawScores: any) {
    const scoringSettings = league.scoringSettings || this.getDefaultScoringSettings();
    const calculatedScores = {
      teams: [],
      players: []
    };

    // Calculate player fantasy points
    for (const playerScore of rawScores.players) {
      const stats = playerScore.stats;
      let fantasyPoints = 0;

      // Passing
      fantasyPoints += (stats.passingYards || 0) * scoringSettings.passingYardsPerPoint;
      fantasyPoints += (stats.passingTDs || 0) * scoringSettings.passingTDPoints;
      fantasyPoints += (stats.interceptions || 0) * scoringSettings.interceptionPoints;

      // Rushing
      fantasyPoints += (stats.rushingYards || 0) * scoringSettings.rushingYardsPerPoint;
      fantasyPoints += (stats.rushingTDs || 0) * scoringSettings.rushingTDPoints;

      // Receiving
      fantasyPoints += (stats.receivingYards || 0) * scoringSettings.receivingYardsPerPoint;
      fantasyPoints += (stats.receivingTDs || 0) * scoringSettings.receivingTDPoints;
      fantasyPoints += (stats.receptions || 0) * scoringSettings.receptionPoints;

      calculatedScores.players.push({
        playerId: playerScore.playerId,
        fantasyPoints: Math.round(fantasyPoints * 10) / 10,
        projectedPoints: playerScore.projectedPoints,
        stats: stats
      });
    }

    return calculatedScores;
  }

  // Get default scoring settings
  private getDefaultScoringSettings() {
    return {
      passingYardsPerPoint: 0.04, // 1 point per 25 yards
      passingTDPoints: 4,
      interceptionPoints: -2,
      rushingYardsPerPoint: 0.1, // 1 point per 10 yards
      rushingTDPoints: 6,
      receivingYardsPerPoint: 0.1, // 1 point per 10 yards
      receivingTDPoints: 6,
      receptionPoints: 0.5 // Half PPR
    };
  }

  // Update scores in database
  private async updateDatabaseScores(leagueId: string, scores: any) {
    // Update league last update time
    await prisma.league.update({
      where: { id: leagueId },
      data: {
        lastScoreUpdate: new Date()
      }
    });

    // Store score snapshot
    await prisma.scoreSnapshot.create({
      data: {
        leagueId,
        week: await this.getCurrentWeek(),
        scores,
        timestamp: new Date()
      }
    });
  }

  // Check for score-based achievements
  private async checkScoreMilestones(userId: string, scores: any) {
    const highScores = scores.players.filter((p: any) => p.fantasyPoints > 30);
    
    if (highScores.length > 0) {
      // Queue achievement check
      await queues.achievement.add('check-high-score', {
        userId,
        event: {
          type: 'high_score',
          data: {
            players: highScores,
            totalScore: highScores.reduce((sum: number, p: any) => sum + p.fantasyPoints, 0)
          }
        }
      });
    }
  }

  // Get current fantasy week
  private async getCurrentWeek(): Promise<number> {
    const seasonStart = new Date('2024-09-01');
    const now = new Date();
    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(17, weeksSinceStart + 1));
  }

  // Start global score update monitoring
  async startGlobalMonitoring() {
    if (this.updateInterval) {
      return;
    }

    // Check for leagues that need updates every minute
    this.updateInterval = setInterval(async () => {
      try {
        // Get all active leagues from cache
        const monitoringKeys = await cache.clear('league:*:monitoring');
        
        // Get leagues that haven't been updated recently
        const leagues = await prisma.league.findMany({
          where: {
            OR: [
              { lastScoreUpdate: null },
              {
                lastScoreUpdate: {
                  lt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
                }
              }
            ]
          },
          take: 10 // Process 10 at a time
        });

        // Queue updates
        for (const league of leagues) {
          await queues.scoreUpdate.add('scheduled-update', {
            leagueId: league.id,
            week: await this.getCurrentWeek()
          });
        }
      } catch (error) {
        console.error('Global monitoring error:', error);
      }
    }, 60000); // Every minute

    console.log('Started global score monitoring');
  }

  // Stop global monitoring
  stopGlobalMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('Stopped global score monitoring');
    }
  }
}

// Singleton instance
export const scoreUpdater = new ScoreUpdater();