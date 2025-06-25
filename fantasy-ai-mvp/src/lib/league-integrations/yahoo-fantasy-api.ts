/**
 * Yahoo Fantasy Sports API Integration
 * OAuth 2.0 flow and comprehensive league data import
 */

import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

interface YahooTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  url: string;
  num_teams: number;
  current_week: number;
  season: string;
  game_code: string; // nfl, nba, mlb, nhl
  scoring_type: string;
}

interface YahooPlayer {
  player_key: string;
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
  };
  editorial_team_abbr: string;
  positions: string[];
  status: string;
  injury_note?: string;
}

export class YahooFantasyAPI {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl = 'https://fantasysports.yahooapis.com/fantasy/v2';
  
  constructor() {
    this.clientId = process.env.YAHOO_CLIENT_ID || '';
    this.clientSecret = process.env.YAHOO_CLIENT_SECRET || '';
    this.redirectUri = process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/api/auth/yahoo/callback';
  }
  
  /**
   * Step 1: Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in database for verification
    prisma.oAuthState.create({
      data: {
        state,
        userId,
        provider: 'yahoo',
        expiresAt: new Date(Date.now() + 600000) // 10 minutes
      }
    });
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
      language: 'en-us'
    });
    
    return `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
  }
  
  /**
   * Step 2: Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<YahooTokens> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code,
      grant_type: 'authorization_code'
    });
    
    try {
      const response = await axios.post(
        'https://api.login.yahoo.com/oauth2/get_token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Yahoo token exchange error:', error);
      throw new Error('Failed to exchange code for tokens');
    }
  }
  
  /**
   * Step 3: Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<YahooTokens> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    try {
      const response = await axios.post(
        'https://api.login.yahoo.com/oauth2/get_token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Yahoo token refresh error:', error);
      throw new Error('Failed to refresh token');
    }
  }
  
  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, accessToken: string) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        },
        params: {
          format: 'json'
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw error;
    }
  }
  
  /**
   * Get user's leagues
   */
  async getUserLeagues(accessToken: string, gameCode?: string): Promise<YahooLeague[]> {
    const endpoint = gameCode 
      ? `/users;use_login=1/games;game_codes=${gameCode}/leagues`
      : '/users;use_login=1/games/leagues';
    
    const data = await this.makeRequest(endpoint, accessToken);
    
    // Parse Yahoo's complex XML-to-JSON structure
    const leagues: YahooLeague[] = [];
    const gamesData = data.fantasy_content.users[0].user[1].games;
    
    if (gamesData && gamesData.count > 0) {
      for (let i = 0; i < gamesData.count; i++) {
        const game = gamesData[i].game;
        if (game && game.leagues) {
          for (let j = 0; j < game.leagues.count; j++) {
            const league = game.leagues[j].league;
            leagues.push({
              league_key: league.league_key,
              league_id: league.league_id,
              name: league.name,
              url: league.url,
              num_teams: league.num_teams,
              current_week: league.current_week,
              season: league.season,
              game_code: game.game_code,
              scoring_type: league.scoring_type
            });
          }
        }
      }
    }
    
    return leagues;
  }
  
  /**
   * Get user's team in a league
   */
  async getUserTeam(accessToken: string, leagueKey: string) {
    const endpoint = `/league/${leagueKey}/teams;use_login=1`;
    const data = await this.makeRequest(endpoint, accessToken);
    
    const team = data.fantasy_content.league[1].teams[0].team;
    return {
      team_key: team.team_key,
      team_id: team.team_id,
      name: team.name,
      url: team.url,
      waiver_priority: team.waiver_priority,
      number_of_moves: team.number_of_moves,
      number_of_trades: team.number_of_trades,
      roster: await this.getTeamRoster(accessToken, team.team_key)
    };
  }
  
  /**
   * Get team roster
   */
  async getTeamRoster(accessToken: string, teamKey: string): Promise<YahooPlayer[]> {
    const endpoint = `/team/${teamKey}/roster/players`;
    const data = await this.makeRequest(endpoint, accessToken);
    
    const players: YahooPlayer[] = [];
    const rosterData = data.fantasy_content.team[1].roster[0].players;
    
    if (rosterData && rosterData.count > 0) {
      for (let i = 0; i < rosterData.count; i++) {
        const player = rosterData[i].player;
        players.push({
          player_key: player.player_key,
          player_id: player.player_id,
          name: player.name,
          editorial_team_abbr: player.editorial_team_abbr,
          positions: player.eligible_positions.map(p => p.position),
          status: player.status || 'active',
          injury_note: player.injury_note
        });
      }
    }
    
    return players;
  }
  
  /**
   * Get league standings
   */
  async getLeagueStandings(accessToken: string, leagueKey: string) {
    const endpoint = `/league/${leagueKey}/standings`;
    const data = await this.makeRequest(endpoint, accessToken);
    
    const standings = [];
    const teamsData = data.fantasy_content.league[1].standings[0].teams;
    
    if (teamsData && teamsData.count > 0) {
      for (let i = 0; i < teamsData.count; i++) {
        const team = teamsData[i].team;
        standings.push({
          rank: team.team_standings.rank,
          team_key: team.team_key,
          name: team.name,
          wins: team.team_standings.outcome_totals.wins,
          losses: team.team_standings.outcome_totals.losses,
          ties: team.team_standings.outcome_totals.ties,
          points_for: team.team_standings.points_for,
          points_against: team.team_standings.points_against
        });
      }
    }
    
    return standings;
  }
  
  /**
   * Get league transactions
   */
  async getLeagueTransactions(accessToken: string, leagueKey: string, types?: string[]) {
    const typeFilter = types ? `;types=${types.join(',')}` : '';
    const endpoint = `/league/${leagueKey}/transactions${typeFilter}`;
    const data = await this.makeRequest(endpoint, accessToken);
    
    const transactions = [];
    const transData = data.fantasy_content.league[1].transactions;
    
    if (transData && transData.count > 0) {
      for (let i = 0; i < transData.count; i++) {
        const trans = transData[i].transaction;
        transactions.push({
          transaction_key: trans.transaction_key,
          type: trans.type,
          status: trans.status,
          timestamp: trans.timestamp,
          players: trans.players
        });
      }
    }
    
    return transactions;
  }
  
  /**
   * Get player stats
   */
  async getPlayerStats(accessToken: string, playerKey: string, week?: number) {
    const weekParam = week ? `;week=${week}` : '';
    const endpoint = `/player/${playerKey}/stats${weekParam}`;
    const data = await this.makeRequest(endpoint, accessToken);
    
    const player = data.fantasy_content.player;
    return {
      player_key: player.player_key,
      name: player.name,
      position: player.primary_position,
      team: player.editorial_team_abbr,
      stats: player.player_stats.stats
    };
  }
  
  /**
   * Get live scoreboard
   */
  async getLiveScoreboard(accessToken: string, leagueKey: string, week?: number) {
    const weekParam = week ? `;week=${week}` : '';
    const endpoint = `/league/${leagueKey}/scoreboard${weekParam}`;
    const data = await this.makeRequest(endpoint, accessToken);
    
    const matchups = [];
    const matchupsData = data.fantasy_content.league[1].scoreboard[0].matchups;
    
    if (matchupsData && matchupsData.count > 0) {
      for (let i = 0; i < matchupsData.count; i++) {
        const matchup = matchupsData[i].matchup;
        matchups.push({
          week: matchup.week,
          status: matchup.status,
          is_playoffs: matchup.is_playoffs,
          teams: matchup.teams.map(t => ({
            team_key: t.team.team_key,
            name: t.team.name,
            score: t.team.team_points.total,
            projected: t.team.team_projected_points.total,
            win_probability: t.team.win_probability
          }))
        });
      }
    }
    
    return matchups;
  }
  
  /**
   * Import all user leagues and data
   */
  async importUserLeagues(userId: string, accessToken: string) {
    console.log('🏈 Importing Yahoo Fantasy leagues...');
    
    try {
      // Get all leagues
      const leagues = await this.getUserLeagues(accessToken);
      console.log(`Found ${leagues.length} leagues`);
      
      for (const league of leagues) {
        // Store league in database
        const dbLeague = await prisma.connectedLeague.upsert({
          where: {
            platformLeagueId_platform: {
              platformLeagueId: league.league_key,
              platform: 'YAHOO'
            }
          },
          update: {
            name: league.name,
            sport: this.mapGameCodeToSport(league.game_code),
            season: parseInt(league.season),
            currentWeek: league.current_week,
            settings: {
              numTeams: league.num_teams,
              scoringType: league.scoring_type,
              url: league.url
            }
          },
          create: {
            userId,
            platform: 'YAHOO',
            platformLeagueId: league.league_key,
            name: league.name,
            sport: this.mapGameCodeToSport(league.game_code),
            season: parseInt(league.season),
            currentWeek: league.current_week,
            settings: {
              numTeams: league.num_teams,
              scoringType: league.scoring_type,
              url: league.url
            }
          }
        });
        
        // Get user's team
        const team = await this.getUserTeam(accessToken, league.league_key);
        
        // Store team and roster
        await prisma.fantasyTeam.upsert({
          where: {
            platformTeamId_leagueId: {
              platformTeamId: team.team_key,
              leagueId: dbLeague.id
            }
          },
          update: {
            name: team.name,
            roster: team.roster
          },
          create: {
            leagueId: dbLeague.id,
            platformTeamId: team.team_key,
            name: team.name,
            roster: team.roster,
            userId
          }
        });
        
        // Get standings
        const standings = await this.getLeagueStandings(accessToken, league.league_key);
        await prisma.leagueStandings.create({
          data: {
            leagueId: dbLeague.id,
            standings,
            week: league.current_week
          }
        });
      }
      
      console.log('✅ Yahoo Fantasy import complete!');
      return leagues;
      
    } catch (error) {
      console.error('Yahoo import error:', error);
      throw error;
    }
  }
  
  private mapGameCodeToSport(gameCode: string): string {
    const mapping: Record<string, string> = {
      nfl: 'FOOTBALL',
      nba: 'BASKETBALL',
      mlb: 'BASEBALL',
      nhl: 'HOCKEY'
    };
    return mapping[gameCode] || 'OTHER';
  }
}

export const yahooFantasyAPI = new YahooFantasyAPI();