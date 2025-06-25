/**
 * Sleeper Fantasy Sports API Integration
 * Modern REST API with no authentication required for public data
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';

interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

interface SleeperLeague {
  league_id: string;
  name: string;
  sport: string;
  season: string;
  season_type: string;
  total_rosters: number;
  status: string;
  settings: {
    playoff_teams: number;
    num_teams: number;
    playoff_type: number;
    scoring_settings: Record<string, number>;
  };
  roster_positions: string[];
  previous_league_id: string;
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: string[];
  starters: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    total_moves: number;
    waiver_position: number;
    waiver_budget_used: number;
  };
}

interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  team: string;
  position: string;
  status: string;
  injury_status?: string;
  injury_notes?: string;
  fantasy_positions: string[];
  age: number;
  years_exp: number;
}

interface SleeperMatchup {
  matchup_id: number;
  roster_id: number;
  points: number;
  custom_points: number;
  players: string[];
  starters: string[];
  players_points: Record<string, number>;
}

interface SleeperTransaction {
  transaction_id: string;
  type: string;
  status: string;
  created: number;
  roster_ids: number[];
  adds: Record<string, number>;
  drops: Record<string, number>;
  waiver_budget: number[];
}

export class SleeperAPI {
  private baseUrl = 'https://api.sleeper.app/v1';
  private playerCache: Map<string, SleeperPlayer> = new Map();
  
  /**
   * Get user by username
   */
  async getUser(username: string): Promise<SleeperUser> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/${username}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  }
  
  /**
   * Get all leagues for a user
   */
  async getUserLeagues(userId: string, sport: string, season: string): Promise<SleeperLeague[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/${userId}/leagues/${sport}/${season}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Sleeper leagues:', error);
      return [];
    }
  }
  
  /**
   * Get league details
   */
  async getLeague(leagueId: string): Promise<SleeperLeague> {
    const response = await axios.get(`${this.baseUrl}/league/${leagueId}`);
    return response.data;
  }
  
  /**
   * Get all rosters in a league
   */
  async getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
    const response = await axios.get(`${this.baseUrl}/league/${leagueId}/rosters`);
    return response.data;
  }
  
  /**
   * Get league users (for mapping roster_id to user)
   */
  async getLeagueUsers(leagueId: string): Promise<Array<{
    user_id: string;
    display_name: string;
    metadata: {
      team_name?: string;
    };
  }>> {
    const response = await axios.get(`${this.baseUrl}/league/${leagueId}/users`);
    return response.data;
  }
  
  /**
   * Get matchups for a specific week
   */
  async getMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]> {
    const response = await axios.get(
      `${this.baseUrl}/league/${leagueId}/matchups/${week}`
    );
    return response.data;
  }
  
  /**
   * Get transactions for a league
   */
  async getTransactions(leagueId: string, week: number): Promise<SleeperTransaction[]> {
    const response = await axios.get(
      `${this.baseUrl}/league/${leagueId}/transactions/${week}`
    );
    return response.data;
  }
  
  /**
   * Get all players (cached)
   */
  async getAllPlayers(): Promise<Map<string, SleeperPlayer>> {
    if (this.playerCache.size === 0) {
      try {
        const response = await axios.get(`${this.baseUrl}/players/nfl`);
        const players = response.data;
        
        // Cache players
        Object.entries(players).forEach(([id, player]: [string, any]) => {
          this.playerCache.set(id, {
            player_id: id,
            first_name: player.first_name,
            last_name: player.last_name,
            full_name: player.full_name,
            team: player.team,
            position: player.position,
            status: player.status,
            injury_status: player.injury_status,
            injury_notes: player.injury_notes,
            fantasy_positions: player.fantasy_positions,
            age: player.age,
            years_exp: player.years_exp
          });
        });
      } catch (error) {
        console.error('Error fetching player data:', error);
      }
    }
    
    return this.playerCache;
  }
  
  /**
   * Get player by ID
   */
  async getPlayer(playerId: string): Promise<SleeperPlayer | null> {
    const players = await this.getAllPlayers();
    return players.get(playerId) || null;
  }
  
  /**
   * Get trending players
   */
  async getTrendingPlayers(sport: string, type: 'add' | 'drop', hours = 24, limit = 25) {
    const response = await axios.get(
      `${this.baseUrl}/players/${sport}/trending/${type}`,
      {
        params: { lookback_hours: hours, limit }
      }
    );
    return response.data;
  }
  
  /**
   * Get NFL state (current week, season, etc.)
   */
  async getNFLState() {
    const response = await axios.get(`${this.baseUrl}/state/nfl`);
    return response.data;
  }
  
  /**
   * Import all Sleeper leagues for a user
   */
  async importUserLeagues(userId: string, username: string) {
    console.log('😴 Importing Sleeper leagues...');
    
    try {
      // Get Sleeper user
      const sleeperUser = await this.getUser(username);
      
      if (!sleeperUser) {
        throw new Error('Sleeper user not found');
      }
      
      // Get current NFL state
      const nflState = await this.getNFLState();
      const currentSeason = nflState.season;
      
      // Get all sports leagues
      const sports = ['nfl', 'nba', 'nhl', 'mlb'];
      const allLeagues = [];
      
      for (const sport of sports) {
        const leagues = await this.getUserLeagues(
          sleeperUser.user_id,
          sport,
          currentSeason
        );
        
        for (const league of leagues) {
          // Get detailed league info
          const rosters = await this.getLeagueRosters(league.league_id);
          const users = await this.getLeagueUsers(league.league_id);
          
          // Find user's roster
          const userRoster = rosters.find(r => 
            users.find(u => u.user_id === sleeperUser.user_id)
          );
          
          // Store in database
          const dbLeague = await prisma.connectedLeague.upsert({
            where: {
              platformLeagueId_platform: {
                platformLeagueId: league.league_id,
                platform: 'SLEEPER'
              }
            },
            update: {
              name: league.name,
              sport: this.mapSleeperSport(sport),
              season: parseInt(league.season),
              currentWeek: nflState.week || 1,
              settings: {
                ...league.settings,
                rosterPositions: league.roster_positions
              }
            },
            create: {
              userId,
              platform: 'SLEEPER',
              platformLeagueId: league.league_id,
              name: league.name,
              sport: this.mapSleeperSport(sport),
              season: parseInt(league.season),
              currentWeek: nflState.week || 1,
              settings: {
                ...league.settings,
                rosterPositions: league.roster_positions
              }
            }
          });
          
          // Store roster if found
          if (userRoster) {
            const players = await this.getAllPlayers();
            const rosterPlayers = userRoster.players
              .map(playerId => players.get(playerId))
              .filter(p => p !== null);
            
            await prisma.fantasyTeam.upsert({
              where: {
                platformTeamId_leagueId: {
                  platformTeamId: `${league.league_id}_${userRoster.roster_id}`,
                  leagueId: dbLeague.id
                }
              },
              update: {
                name: users.find(u => u.user_id === sleeperUser.user_id)?.metadata?.team_name || 'My Team',
                roster: {
                  players: rosterPlayers,
                  starters: userRoster.starters
                }
              },
              create: {
                leagueId: dbLeague.id,
                platformTeamId: `${league.league_id}_${userRoster.roster_id}`,
                name: users.find(u => u.user_id === sleeperUser.user_id)?.metadata?.team_name || 'My Team',
                roster: {
                  players: rosterPlayers,
                  starters: userRoster.starters
                },
                userId
              }
            });
          }
          
          // Store standings
          const standings = rosters
            .sort((a, b) => {
              const aWins = a.settings.wins || 0;
              const bWins = b.settings.wins || 0;
              if (aWins !== bWins) return bWins - aWins;
              return 0;
            })
            .map((roster, index) => ({
              rank: index + 1,
              rosterId: roster.roster_id,
              wins: roster.settings.wins || 0,
              losses: roster.settings.losses || 0,
              ties: roster.settings.ties || 0,
              totalMoves: roster.settings.total_moves || 0
            }));
          
          await prisma.leagueStandings.create({
            data: {
              leagueId: dbLeague.id,
              standings,
              week: nflState.week || 1
            }
          });
          
          allLeagues.push(dbLeague);
        }
      }
      
      // Store Sleeper connection
      await prisma.platformConnection.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'SLEEPER'
          }
        },
        update: {
          accessToken: sleeperUser.user_id,
          refreshToken: username,
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        },
        create: {
          userId,
          platform: 'SLEEPER',
          accessToken: sleeperUser.user_id,
          refreshToken: username,
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });
      
      console.log(`✅ Sleeper import complete! Found ${allLeagues.length} leagues`);
      return allLeagues;
      
    } catch (error) {
      console.error('Sleeper import error:', error);
      throw error;
    }
  }
  
  private mapSleeperSport(sport: string): string {
    const mapping: Record<string, string> = {
      nfl: 'FOOTBALL',
      nba: 'BASKETBALL',
      mlb: 'BASEBALL',
      nhl: 'HOCKEY'
    };
    return mapping[sport] || 'OTHER';
  }
}

export const sleeperAPI = new SleeperAPI();