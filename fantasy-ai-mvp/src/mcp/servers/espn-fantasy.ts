import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const ESPNLeagueSchema = z.object({
  leagueId: z.string(),
  season: z.number().default(2024),
  cookies: z.string().optional(), // ESPN uses cookie auth
});

const ESPNPlayerSchema = z.object({
  playerId: z.string(),
  week: z.number().optional(),
});

class ESPNFantasyServer {
  private server: Server;
  private baseUrl = "https://fantasy.espn.com/apis/v3/games/ffl";

  constructor() {
    this.server = new Server(
      {
        name: "espn-fantasy-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "espn://leagues",
          mimeType: "application/json",
          name: "ESPN Fantasy Leagues",
        },
        {
          uri: "espn://players",
          mimeType: "application/json",
          name: "ESPN Fantasy Players",
        },
      ],
    }));

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_espn_league_info",
          description: "Get ESPN Fantasy league information",
          inputSchema: ESPNLeagueSchema,
        },
        {
          name: "get_espn_teams",
          description: "Get all teams in ESPN league",
          inputSchema: ESPNLeagueSchema,
        },
        {
          name: "get_espn_player_stats",
          description: "Get ESPN player statistics",
          inputSchema: ESPNPlayerSchema.extend({
            leagueId: z.string(),
            season: z.number().default(2024),
          }),
        },
        {
          name: "get_espn_scoreboard",
          description: "Get current week matchups and scores",
          inputSchema: ESPNLeagueSchema.extend({
            week: z.number().optional(),
          }),
        },
        {
          name: "get_espn_rosters",
          description: "Get team rosters for a specific week",
          inputSchema: ESPNLeagueSchema.extend({
            week: z.number().optional(),
          }),
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        switch (request.params.name) {
          case "get_espn_league_info":
            return this.getLeagueInfo(request.params.arguments);
          case "get_espn_teams":
            return this.getTeams(request.params.arguments);
          case "get_espn_player_stats":
            return this.getPlayerStats(request.params.arguments);
          case "get_espn_scoreboard":
            return this.getScoreboard(request.params.arguments);
          case "get_espn_rosters":
            return this.getRosters(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const uri = request.params.uri;
        
        if (uri === "espn://leagues") {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                  leagues: [],
                  message: "Use get_espn_league_info tool to fetch specific league data",
                  note: "ESPN requires league ID and optional cookies for private leagues",
                }),
              },
            ],
          };
        }
        
        throw new Error(`Unknown resource: ${uri}`);
      }
    );
  }

  private async makeESPNRequest(endpoint: string, cookies?: string) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "Fantasy.AI/1.0",
    };
    
    if (cookies) {
      headers.Cookie = cookies;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async getLeagueInfo(args: any) {
    const { leagueId, season, cookies } = ESPNLeagueSchema.parse(args);
    
    try {
      const data = await this.makeESPNRequest(
        `/seasons/${season}/segments/0/leagues/${leagueId}`,
        cookies
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              league: {
                id: data.id,
                name: data.settings?.name || "ESPN League",
                size: data.settings?.size || data.teams?.length || 0,
                scoringType: data.settings?.scoringSettings?.scoringType || "H2H",
                teams: data.teams?.length || 0,
                currentWeek: data.currentMatchupPeriod || 1,
                status: data.status?.currentMatchupPeriod ? "active" : "draft",
              },
              settings: {
                scoring: data.settings?.scoringSettings,
                roster: data.settings?.rosterSettings,
                schedule: data.settings?.scheduleSettings,
              },
              raw: data,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching ESPN league info: ${error}`,
          },
        ],
      };
    }
  }

  private async getTeams(args: any) {
    const { leagueId, season, cookies } = ESPNLeagueSchema.parse(args);
    
    try {
      const data = await this.makeESPNRequest(
        `/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam`,
        cookies
      );
      
      const teams = data.teams?.map((team: any) => ({
        id: team.id,
        name: `${team.location} ${team.nickname}`,
        abbreviation: team.abbrev,
        owner: team.primaryOwner,
        record: {
          wins: team.record?.overall?.wins || 0,
          losses: team.record?.overall?.losses || 0,
          ties: team.record?.overall?.ties || 0,
          pointsFor: team.record?.overall?.pointsFor || 0,
          pointsAgainst: team.record?.overall?.pointsAgainst || 0,
        },
        currentRank: team.playoffSeed || 0,
        division: team.divisionId,
      })) || [];
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ 
              teams,
              totalTeams: teams.length,
              leagueId,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching ESPN teams: ${error}`,
          },
        ],
      };
    }
  }

  private async getPlayerStats(args: any) {
    const { playerId, leagueId, season, week } = ESPNPlayerSchema.extend({
      leagueId: z.string(),
      season: z.number().default(2024),
    }).parse(args);
    
    try {
      // ESPN player stats endpoint - this is a simplified approach
      // Real implementation would need more complex player data fetching
      const data = await this.makeESPNRequest(
        `/seasons/${season}/segments/0/leagues/${leagueId}?view=kona_player_info&view=player_waivers`,
        undefined
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              playerId,
              week: week || "season",
              stats: {
                message: "ESPN player stats require team roster context",
                suggestion: "Use get_espn_rosters to see player data",
              },
              availableViews: [
                "kona_player_info",
                "player_waivers", 
                "kona_playercard",
                "mRoster",
              ],
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching ESPN player stats: ${error}`,
          },
        ],
      };
    }
  }

  private async getScoreboard(args: any) {
    const { leagueId, season, week, cookies } = ESPNLeagueSchema.extend({
      week: z.number().optional(),
    }).parse(args);
    
    try {
      const currentWeek = week || 1;
      const data = await this.makeESPNRequest(
        `/seasons/${season}/segments/0/leagues/${leagueId}?view=mMatchup&view=mMatchupScore&scoringPeriodId=${currentWeek}`,
        cookies
      );
      
      const matchups = data.schedule?.filter((matchup: any) => 
        matchup.matchupPeriodId === currentWeek
      ).map((matchup: any) => ({
        id: matchup.id,
        week: matchup.matchupPeriodId,
        home: {
          teamId: matchup.home?.teamId,
          score: matchup.home?.totalPoints || 0,
          projectedScore: matchup.home?.totalProjectedPointsLive || 0,
        },
        away: {
          teamId: matchup.away?.teamId,
          score: matchup.away?.totalPoints || 0,
          projectedScore: matchup.away?.totalProjectedPointsLive || 0,
        },
        winner: matchup.winner === "HOME" ? "home" : matchup.winner === "AWAY" ? "away" : "tie",
        status: matchup.playoffTierType || "regular",
      })) || [];
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ 
              week: currentWeek, 
              matchups,
              totalMatchups: matchups.length,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching ESPN scoreboard: ${error}`,
          },
        ],
      };
    }
  }

  private async getRosters(args: any) {
    const { leagueId, season, week, cookies } = ESPNLeagueSchema.extend({
      week: z.number().optional(),
    }).parse(args);
    
    try {
      const currentWeek = week || 1;
      const data = await this.makeESPNRequest(
        `/seasons/${season}/segments/0/leagues/${leagueId}?view=mRoster&scoringPeriodId=${currentWeek}`,
        cookies
      );
      
      const rosters = data.teams?.map((team: any) => ({
        teamId: team.id,
        teamName: `${team.location} ${team.nickname}`,
        roster: team.roster?.entries?.map((entry: any) => ({
          playerId: entry.playerId,
          playerName: entry.playerPoolEntry?.player?.fullName,
          position: entry.playerPoolEntry?.player?.defaultPositionId,
          slotPosition: entry.lineupSlotId,
          acquisitionType: entry.acquisitionType,
          stats: entry.playerPoolEntry?.player?.stats,
        })) || [],
      })) || [];
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              week: currentWeek,
              rosters,
              totalTeams: rosters.length,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching ESPN rosters: ${error}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ESPN Fantasy MCP server running on stdio");
  }
}

const server = new ESPNFantasyServer();
server.run().catch(console.error);