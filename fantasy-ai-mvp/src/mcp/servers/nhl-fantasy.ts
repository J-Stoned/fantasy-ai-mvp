import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const NHLTeamSchema = z.object({
  teamId: z.string().optional(),
  season: z.string().default("20242025"),
});

const NHLPlayerSchema = z.object({
  playerId: z.string(),
  season: z.string().default("20242025"),
  gameType: z.enum(["regular", "playoffs"]).default("regular"),
});

class NHLFantasyServer {
  private server: Server;
  private baseUrl = "https://api-web.nhle.com/v1";
  private statsApiUrl = "https://api.nhle.com/stats/rest/en";

  constructor() {
    this.server = new Server(
      {
        name: "nhl-fantasy-mcp",
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
          uri: "nhl://teams",
          mimeType: "application/json",
          name: "NHL Teams",
        },
        {
          uri: "nhl://players",
          mimeType: "application/json",
          name: "NHL Players",
        },
        {
          uri: "nhl://standings",
          mimeType: "application/json",
          name: "NHL Standings",
        },
      ],
    }));

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_nhl_all_players",
          description: "Get all NHL players with basic info",
          inputSchema: z.object({
            includeProspects: z.boolean().default(false),
          }),
        },
        {
          name: "get_nhl_team_rosters",
          description: "Get all NHL team rosters",
          inputSchema: NHLTeamSchema,
        },
        {
          name: "get_nhl_player_stats",
          description: "Get detailed NHL player statistics",
          inputSchema: NHLPlayerSchema,
        },
        {
          name: "get_nhl_goalies",
          description: "Get all NHL goalies with stats",
          inputSchema: z.object({
            minGames: z.number().default(10),
          }),
        },
        {
          name: "get_nhl_skaters", 
          description: "Get all NHL skaters (non-goalies) with stats",
          inputSchema: z.object({
            position: z.enum(["C", "LW", "RW", "D", "all"]).default("all"),
            minGames: z.number().default(10),
          }),
        },
        {
          name: "get_nhl_injuries",
          description: "Get current NHL injury report",
          inputSchema: z.object({}),
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        switch (request.params.name) {
          case "get_nhl_all_players":
            return this.getAllPlayers(request.params.arguments);
          case "get_nhl_team_rosters":
            return this.getTeamRosters(request.params.arguments);
          case "get_nhl_player_stats":
            return this.getPlayerStats(request.params.arguments);
          case "get_nhl_goalies":
            return this.getGoalies(request.params.arguments);
          case "get_nhl_skaters":
            return this.getSkaters(request.params.arguments);
          case "get_nhl_injuries":
            return this.getInjuries(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    );
  }

  private async makeNHLRequest(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Fantasy.AI NHL MCP/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`NHL API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async getAllPlayers(args: any) {
    const { includeProspects } = z.object({
      includeProspects: z.boolean().default(false),
    }).parse(args);

    try {
      // Get all teams first
      const teams = await this.makeNHLRequest('/standings/now');
      const allPlayers = [];

      // Fetch roster for each team
      for (const team of teams.standings || []) {
        try {
          const roster = await this.makeNHLRequest(`/roster/${team.teamAbbrev.default}/current`);
          
          // Process forwards
          if (roster.forwards) {
            roster.forwards.forEach(player => {
              allPlayers.push({
                id: player.id,
                name: `${player.firstName.default} ${player.lastName.default}`,
                team: team.teamAbbrev.default,
                position: player.positionCode,
                jerseyNumber: player.sweaterNumber,
                height: player.heightInInches,
                weight: player.weightInPounds,
                birthDate: player.birthDate,
                birthCountry: player.birthCountry,
                shootsCatches: player.shootsCatches,
              });
            });
          }

          // Process defensemen
          if (roster.defensemen) {
            roster.defensemen.forEach(player => {
              allPlayers.push({
                id: player.id,
                name: `${player.firstName.default} ${player.lastName.default}`,
                team: team.teamAbbrev.default,
                position: 'D',
                jerseyNumber: player.sweaterNumber,
                height: player.heightInInches,
                weight: player.weightInPounds,
                birthDate: player.birthDate,
                birthCountry: player.birthCountry,
                shootsCatches: player.shootsCatches,
              });
            });
          }

          // Process goalies
          if (roster.goalies) {
            roster.goalies.forEach(player => {
              allPlayers.push({
                id: player.id,
                name: `${player.firstName.default} ${player.lastName.default}`,
                team: team.teamAbbrev.default,
                position: 'G',
                jerseyNumber: player.sweaterNumber,
                height: player.heightInInches,
                weight: player.weightInPounds,
                birthDate: player.birthDate,
                birthCountry: player.birthCountry,
                glove: player.shootsCatches,
              });
            });
          }

        } catch (error) {
          console.error(`Error fetching roster for ${team.teamAbbrev.default}:`, error);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              totalPlayers: allPlayers.length,
              players: allPlayers,
              teams: teams.standings?.length || 0,
              timestamp: new Date(),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching NHL players: ${error}`,
          },
        ],
      };
    }
  }

  private async getTeamRosters(args: any) {
    const { teamId, season } = NHLTeamSchema.parse(args);
    
    try {
      const teams = await this.makeNHLRequest('/standings/now');
      const rosters = [];

      for (const team of teams.standings || []) {
        if (teamId && team.teamAbbrev.default !== teamId) continue;

        const roster = await this.makeNHLRequest(`/roster/${team.teamAbbrev.default}/current`);
        
        rosters.push({
          team: team.teamName.default,
          abbreviation: team.teamAbbrev.default,
          conference: team.conferenceName,
          division: team.divisionName,
          roster: {
            forwards: roster.forwards?.length || 0,
            defensemen: roster.defensemen?.length || 0,
            goalies: roster.goalies?.length || 0,
            total: (roster.forwards?.length || 0) + (roster.defensemen?.length || 0) + (roster.goalies?.length || 0),
          },
          players: roster,
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              teams: rosters,
              totalTeams: rosters.length,
              season,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching NHL rosters: ${error}`,
          },
        ],
      };
    }
  }

  private async getPlayerStats(args: any) {
    const { playerId, season, gameType } = NHLPlayerSchema.parse(args);
    
    try {
      const playerData = await this.makeNHLRequest(`/player/${playerId}/landing`);
      
      // Get current season stats
      const stats = playerData.featuredStats?.regularSeason || {};
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              player: {
                id: playerData.playerId,
                name: playerData.firstName + ' ' + playerData.lastName,
                position: playerData.position,
                team: playerData.currentTeamAbbrev,
                number: playerData.sweaterNumber,
              },
              stats: {
                gamesPlayed: stats.gamesPlayed,
                goals: stats.goals,
                assists: stats.assists,
                points: stats.points,
                plusMinus: stats.plusMinus,
                pim: stats.pim,
                powerPlayGoals: stats.powerPlayGoals,
                powerPlayPoints: stats.powerPlayPoints,
                shots: stats.shots,
                shootingPct: stats.shootingPct,
                faceoffWinPct: stats.faceoffWinningPct,
                avgTimeOnIce: stats.avgToi,
              },
              careerStats: playerData.careerTotals?.regularSeason,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching NHL player stats: ${error}`,
          },
        ],
      };
    }
  }

  private async getGoalies(args: any) {
    const { minGames } = z.object({
      minGames: z.number().default(10),
    }).parse(args);

    try {
      // This would typically use a stats endpoint
      // For now, we'll get all goalies from team rosters
      const teams = await this.makeNHLRequest('/standings/now');
      const allGoalies = [];

      for (const team of teams.standings || []) {
        const roster = await this.makeNHLRequest(`/roster/${team.teamAbbrev.default}/current`);
        
        if (roster.goalies) {
          roster.goalies.forEach(goalie => {
            allGoalies.push({
              id: goalie.id,
              name: `${goalie.firstName.default} ${goalie.lastName.default}`,
              team: team.teamAbbrev.default,
              jerseyNumber: goalie.sweaterNumber,
              catches: goalie.shootsCatches,
              birthDate: goalie.birthDate,
              // Stats would be fetched from a different endpoint
              stats: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                otLosses: 0,
                gaa: 0,
                savePercentage: 0,
                shutouts: 0,
              },
            });
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              totalGoalies: allGoalies.length,
              goalies: allGoalies,
              minGamesFilter: minGames,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching NHL goalies: ${error}`,
          },
        ],
      };
    }
  }

  private async getSkaters(args: any) {
    const { position, minGames } = z.object({
      position: z.enum(["C", "LW", "RW", "D", "all"]).default("all"),
      minGames: z.number().default(10),
    }).parse(args);

    try {
      const teams = await this.makeNHLRequest('/standings/now');
      const allSkaters = [];

      for (const team of teams.standings || []) {
        const roster = await this.makeNHLRequest(`/roster/${team.teamAbbrev.default}/current`);
        
        // Process forwards
        if (roster.forwards) {
          roster.forwards.forEach(player => {
            if (position === "all" || player.positionCode === position) {
              allSkaters.push({
                id: player.id,
                name: `${player.firstName.default} ${player.lastName.default}`,
                team: team.teamAbbrev.default,
                position: player.positionCode,
                jerseyNumber: player.sweaterNumber,
                shoots: player.shootsCatches,
                // Basic placeholder stats
                stats: {
                  gamesPlayed: 0,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  plusMinus: 0,
                  pim: 0,
                },
              });
            }
          });
        }

        // Process defensemen
        if (roster.defensemen && (position === "all" || position === "D")) {
          roster.defensemen.forEach(player => {
            allSkaters.push({
              id: player.id,
              name: `${player.firstName.default} ${player.lastName.default}`,
              team: team.teamAbbrev.default,
              position: 'D',
              jerseyNumber: player.sweaterNumber,
              shoots: player.shootsCatches,
              stats: {
                gamesPlayed: 0,
                goals: 0,
                assists: 0,
                points: 0,
                plusMinus: 0,
                pim: 0,
              },
            });
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              totalSkaters: allSkaters.length,
              skaters: allSkaters,
              positionFilter: position,
              minGamesFilter: minGames,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching NHL skaters: ${error}`,
          },
        ],
      };
    }
  }

  private async getInjuries(args: any) {
    try {
      // NHL doesn't have a public injury API, so we'd need to scrape or use third-party
      // For now, return a structure showing what would be available
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "NHL injury data requires web scraping or third-party API",
              suggestedSources: [
                "https://www.tsn.ca/nhl/injuries",
                "https://www.dailyfaceoff.com/teams/injuries",
                "https://www.rotowire.com/hockey/injury-report.php",
              ],
              structure: {
                player: "Player Name",
                team: "Team Abbreviation",
                injury: "Injury Type",
                status: "Day-to-Day | Week-to-Week | IR | LTIR",
                lastUpdate: "Date",
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching NHL injuries: ${error}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("NHL Fantasy MCP server running on stdio");
  }
}

const server = new NHLFantasyServer();
server.run().catch(console.error);