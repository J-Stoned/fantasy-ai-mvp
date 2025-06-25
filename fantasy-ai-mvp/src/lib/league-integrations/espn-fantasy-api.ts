/**
 * ESPN Fantasy Sports API Integration
 * Uses ESPN's v3 API with cookie-based authentication
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';

interface ESPNLeague {
  id: string;
  name: string;
  seasonId: number;
  scoringPeriodId: number;
  settings: {
    name: string;
    size: number;
    scoringType: string;
    playoffTeamCount: number;
  };
}

interface ESPNTeam {
  id: number;
  abbrev: string;
  location: string;
  nickname: string;
  roster: {
    entries: ESPNRosterEntry[];
  };
  points: number;
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
    };
  };
}

interface ESPNRosterEntry {
  playerId: number;
  playerPoolEntry: {
    player: {
      id: number;
      fullName: string;
      defaultPositionId: number;
      proTeamId: number;
      injured: boolean;
      injuryStatus?: string;
      stats: any[];
    };
  };
  lineupSlotId: number;
  acquisitionDate: number;
}

interface ESPNPlayer {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  proTeamId: number;
  defaultPositionId: number;
  injured: boolean;
  injuryStatus?: string;
  ownership: {
    percentOwned: number;
    percentStarted: number;
  };
  stats: any[];
}

export class ESPNFantasyAPI {
  private baseUrl = 'https://fantasy.espn.com/apis/v3/games';
  private cookieHeader: string = '';
  
  /**
   * Set ESPN cookies (espn_s2 and SWID)
   */
  setCookies(espn_s2: string, SWID: string) {
    this.cookieHeader = `espn_s2=${espn_s2}; SWID=${SWID}`;
  }
  
  /**
   * Make authenticated request to ESPN API
   */
  private async makeRequest(url: string, params?: any) {
    try {
      const response = await axios.get(url, {
        headers: {
          Cookie: this.cookieHeader,
          Accept: 'application/json'
        },
        params
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid ESPN credentials');
      }
      throw error;
    }
  }
  
  /**
   * Get user's leagues for a specific sport
   */
  async getUserLeagues(sport: 'ffl' | 'fba' | 'flb' | 'fhl', year?: number): Promise<ESPNLeague[]> {
    const season = year || new Date().getFullYear();
    const url = `${this.baseUrl}/${sport}/seasons/${season}`;
    
    const data = await this.makeRequest(url);
    
    // Filter to only user's leagues
    return data.map((league: any) => ({
      id: league.id,
      name: league.settings.name,
      seasonId: season,
      scoringPeriodId: league.scoringPeriodId,
      settings: {
        name: league.settings.name,
        size: league.settings.size,
        scoringType: league.settings.scoringSettings?.scoringType || 'STANDARD',
        playoffTeamCount: league.settings.playoffTeamCount
      }
    }));
  }
  
  /**
   * Get detailed league information
   */
  async getLeague(sport: string, leagueId: string, year?: number) {
    const season = year || new Date().getFullYear();
    const url = `${this.baseUrl}/${sport}/seasons/${season}/segments/0/leagues/${leagueId}`;
    
    const params = {
      view: 'mTeam,mRoster,mSettings,mStandings,mSchedule,mStatus'
    };
    
    const data = await this.makeRequest(url, params);
    
    return {
      league: data,
      teams: data.teams,
      schedule: data.schedule,
      settings: data.settings,
      status: data.status
    };
  }
  
  /**
   * Get user's team in a league
   */
  async getUserTeam(sport: string, leagueId: string, year?: number): Promise<ESPNTeam | null> {
    const leagueData = await this.getLeague(sport, leagueId, year);
    
    // Find user's team by checking ownership
    // This requires additional logic to identify which team belongs to the user
    // For now, we'll return the first team as a placeholder
    return leagueData.teams[0] || null;
  }
  
  /**
   * Get team roster
   */
  async getTeamRoster(sport: string, leagueId: string, teamId: number, year?: number) {
    const season = year || new Date().getFullYear();
    const url = `${this.baseUrl}/${sport}/seasons/${season}/segments/0/leagues/${leagueId}`;
    
    const params = {
      view: 'mRoster',
      teamId
    };
    
    const data = await this.makeRequest(url, params);
    const team = data.teams.find((t: any) => t.id === teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    return team.roster.entries.map((entry: ESPNRosterEntry) => ({
      playerId: entry.playerId,
      player: entry.playerPoolEntry.player,
      lineupSlotId: entry.lineupSlotId,
      acquisitionDate: entry.acquisitionDate
    }));
  }
  
  /**
   * Get league standings
   */
  async getStandings(sport: string, leagueId: string, year?: number) {
    const leagueData = await this.getLeague(sport, leagueId, year);
    
    return leagueData.teams
      .sort((a: ESPNTeam, b: ESPNTeam) => {
        // Sort by wins, then by points
        const aWins = a.record.overall.wins;
        const bWins = b.record.overall.wins;
        if (aWins !== bWins) return bWins - aWins;
        return b.points - a.points;
      })
      .map((team: ESPNTeam, index: number) => ({
        rank: index + 1,
        teamId: team.id,
        name: `${team.location} ${team.nickname}`,
        abbrev: team.abbrev,
        wins: team.record.overall.wins,
        losses: team.record.overall.losses,
        ties: team.record.overall.ties,
        points: team.points,
        pointsAgainst: team.pointsAgainst || 0
      }));
  }
  
  /**
   * Get player information
   */
  async getPlayer(sport: string, playerId: number, year?: number): Promise<ESPNPlayer> {
    const season = year || new Date().getFullYear();
    const url = `${this.baseUrl}/${sport}/seasons/${season}/players/${playerId}`;
    
    const params = {
      view: 'players'
    };
    
    const data = await this.makeRequest(url, params);
    return data;
  }
  
  /**
   * Get live scoreboard
   */
  async getScoreboard(sport: string, leagueId: string, week?: number, year?: number) {
    const season = year || new Date().getFullYear();
    const url = `${this.baseUrl}/${sport}/seasons/${season}/segments/0/leagues/${leagueId}`;
    
    const params = {
      view: 'mMatchup,mMatchupScore',
      scoringPeriodId: week
    };
    
    const data = await this.makeRequest(url, params);
    
    return data.schedule
      .filter((matchup: any) => matchup.matchupPeriodId === week)
      .map((matchup: any) => ({
        matchupId: matchup.id,
        homeTeam: {
          teamId: matchup.home.teamId,
          score: matchup.home.totalPoints,
          projected: matchup.home.totalProjectedPoints
        },
        awayTeam: {
          teamId: matchup.away.teamId,
          score: matchup.away.totalPoints,
          projected: matchup.away.totalProjectedPoints
        },
        winner: matchup.winner
      }));
  }
  
  /**
   * Get recent transactions
   */
  async getRecentTransactions(sport: string, leagueId: string, year?: number) {
    const season = year || new Date().getFullYear();
    const url = `${this.baseUrl}/${sport}/seasons/${season}/segments/0/leagues/${leagueId}`;
    
    const params = {
      view: 'mTransactions2'
    };
    
    const data = await this.makeRequest(url, params);
    
    return (data.transactions || []).map((trans: any) => ({
      id: trans.id,
      type: trans.type,
      status: trans.status,
      date: trans.proposedDate,
      executionDate: trans.executionDate,
      items: trans.items.map((item: any) => ({
        playerId: item.playerId,
        type: item.type,
        fromTeamId: item.fromTeamId,
        toTeamId: item.toTeamId
      }))
    }));
  }
  
  /**
   * Import all ESPN leagues for a user
   */
  async importUserLeagues(userId: string, espn_s2: string, SWID: string) {
    console.log('🏈 Importing ESPN Fantasy leagues...');
    
    // Set cookies
    this.setCookies(espn_s2, SWID);
    
    try {
      // Check all major sports
      const sports = [
        { code: 'ffl' as const, name: 'FOOTBALL' },
        { code: 'fba' as const, name: 'BASKETBALL' },
        { code: 'flb' as const, name: 'BASEBALL' },
        { code: 'fhl' as const, name: 'HOCKEY' }
      ];
      
      const allLeagues = [];
      
      for (const sport of sports) {
        try {
          const leagues = await this.getUserLeagues(sport.code);
          
          for (const league of leagues) {
            // Get detailed league info
            const leagueData = await this.getLeague(sport.code, league.id);
            
            // Store in database
            const dbLeague = await prisma.connectedLeague.upsert({
              where: {
                platformLeagueId_platform: {
                  platformLeagueId: league.id,
                  platform: 'ESPN'
                }
              },
              update: {
                name: league.name,
                sport: sport.name,
                season: league.seasonId,
                currentWeek: league.scoringPeriodId,
                settings: league.settings
              },
              create: {
                userId,
                platform: 'ESPN',
                platformLeagueId: league.id,
                name: league.name,
                sport: sport.name,
                season: league.seasonId,
                currentWeek: league.scoringPeriodId,
                settings: league.settings
              }
            });
            
            // Import standings
            const standings = await this.getStandings(sport.code, league.id);
            await prisma.leagueStandings.create({
              data: {
                leagueId: dbLeague.id,
                standings,
                week: league.scoringPeriodId
              }
            });
            
            allLeagues.push(dbLeague);
          }
        } catch (error) {
          console.log(`No ${sport.name} leagues found`);
        }
      }
      
      // Store ESPN credentials
      await prisma.platformConnection.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'ESPN'
          }
        },
        update: {
          accessToken: espn_s2,
          refreshToken: SWID,
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        },
        create: {
          userId,
          platform: 'ESPN',
          accessToken: espn_s2,
          refreshToken: SWID,
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });
      
      console.log(`✅ ESPN Fantasy import complete! Found ${allLeagues.length} leagues`);
      return allLeagues;
      
    } catch (error) {
      console.error('ESPN import error:', error);
      throw error;
    }
  }
  
  /**
   * Map ESPN position IDs to standard positions
   */
  private positionIdToString(positionId: number): string {
    const positions: Record<number, string> = {
      1: 'QB',
      2: 'RB',
      3: 'WR',
      4: 'TE',
      5: 'K',
      16: 'DST'
    };
    return positions[positionId] || 'FLEX';
  }
}

export const espnFantasyAPI = new ESPNFantasyAPI();