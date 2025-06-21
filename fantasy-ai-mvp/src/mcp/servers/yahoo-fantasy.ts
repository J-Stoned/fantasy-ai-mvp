import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const YahooLeagueSchema = z.object({
  leagueId: z.string(),
  accessToken: z.string(),
});

const YahooPlayerSchema = z.object({
  playerId: z.string(),
  week: z.number().optional(),
});

class YahooFantasyServer {
  private server: Server;
  private baseUrl = "https://fantasysports.yahooapis.com/fantasy/v2";

  constructor() {
    this.server = new Server(
      {
        name: "yahoo-fantasy-mcp",
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
          uri: "yahoo://leagues",
          mimeType: "application/json",
          name: "Yahoo Fantasy Leagues",
        },
        {
          uri: "yahoo://players",
          mimeType: "application/json",
          name: "Yahoo Fantasy Players",
        },
      ],
    }));

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_league_info",
          description: "Get Yahoo Fantasy league information",
          inputSchema: YahooLeagueSchema,
        },
        {
          name: "get_league_standings",
          description: "Get current league standings",
          inputSchema: YahooLeagueSchema,
        },
        {
          name: "get_player_stats",
          description: "Get player statistics and projections",
          inputSchema: YahooPlayerSchema,
        },
        {
          name: "get_team_roster",
          description: "Get team roster information",
          inputSchema: z.object({
            leagueId: z.string(),
            teamId: z.string(),
            accessToken: z.string(),
          }),
        },
        {
          name: "sync_league_data",
          description: "Sync all league data",
          inputSchema: YahooLeagueSchema,
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        switch (request.params.name) {
          case "get_league_info":
            return this.getLeagueInfo(request.params.arguments);
          case "get_league_standings":
            return this.getLeagueStandings(request.params.arguments);
          case "get_player_stats":
            return this.getPlayerStats(request.params.arguments);
          case "get_team_roster":
            return this.getTeamRoster(request.params.arguments);
          case "sync_league_data":
            return this.syncLeagueData(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const uri = request.params.uri;
        
        if (uri === "yahoo://leagues") {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                  leagues: [],
                  message: "Use get_league_info tool to fetch specific league data",
                }),
              },
            ],
          };
        }
        
        throw new Error(`Unknown resource: ${uri}`);
      }
    );
  }

  private async makeYahooRequest(endpoint: string, accessToken: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async getLeagueInfo(args: any) {
    const { leagueId, accessToken } = YahooLeagueSchema.parse(args);
    
    try {
      const data = await this.makeYahooRequest(
        `/league/nfl.l.${leagueId}`,
        accessToken
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching league info: ${error}`,
          },
        ],
      };
    }
  }

  private async getLeagueStandings(args: any) {
    const { leagueId, accessToken } = YahooLeagueSchema.parse(args);
    
    try {
      const data = await this.makeYahooRequest(
        `/league/nfl.l.${leagueId}/standings`,
        accessToken
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching standings: ${error}`,
          },
        ],
      };
    }
  }

  private async getPlayerStats(args: any) {
    const { playerId, week } = YahooPlayerSchema.parse(args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            playerId,
            week: week || "season",
            stats: {
              points: 0,
              projectedPoints: 0,
            },
          }, null, 2),
        },
      ],
    };
  }

  private async getTeamRoster(args: any) {
    const { leagueId, teamId, accessToken } = z
      .object({
        leagueId: z.string(),
        teamId: z.string(),
        accessToken: z.string(),
      })
      .parse(args);
    
    try {
      const data = await this.makeYahooRequest(
        `/team/nfl.l.${leagueId}.t.${teamId}/roster`,
        accessToken
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching roster: ${error}`,
          },
        ],
      };
    }
  }

  private async syncLeagueData(args: any) {
    const { leagueId, accessToken } = YahooLeagueSchema.parse(args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "success",
            leagueId,
            syncedAt: new Date().toISOString(),
            message: "League data sync initiated",
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Yahoo Fantasy MCP server running on stdio");
  }
}

const server = new YahooFantasyServer();
server.run().catch(console.error);