import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const SoccerLeagueSchema = z.object({
  league: z.enum(["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1", "mls", "champions-league"]),
  season: z.string().default("2024-25"),
});

const SoccerPlayerSchema = z.object({
  playerId: z.string(),
  league: z.string().optional(),
});

class SoccerFantasyServer {
  private server: Server;
  
  // Multiple API endpoints for different leagues
  private apiEndpoints = {
    'premier-league': 'https://fantasy.premierleague.com/api',
    'football-data': 'https://api.football-data.org/v4',
    'api-football': 'https://v3.football.api-sports.io',
  };

  constructor() {
    this.server = new Server(
      {
        name: "soccer-fantasy-mcp",
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
          uri: "soccer://leagues",
          mimeType: "application/json",
          name: "Soccer Leagues",
        },
        {
          uri: "soccer://players",
          mimeType: "application/json",
          name: "Soccer Players",
        },
        {
          uri: "soccer://teams",
          mimeType: "application/json",
          name: "Soccer Teams",
        },
      ],
    }));

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_all_soccer_players",
          description: "Get all players from major soccer leagues",
          inputSchema: z.object({
            leagues: z.array(z.string()).default(["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"]),
            includeStats: z.boolean().default(true),
          }),
        },
        {
          name: "get_league_players",
          description: "Get all players from a specific league",
          inputSchema: SoccerLeagueSchema,
        },
        {
          name: "get_premier_league_fpl",
          description: "Get Fantasy Premier League data including all players",
          inputSchema: z.object({
            dataType: z.enum(["bootstrap", "players", "teams", "fixtures"]).default("bootstrap"),
          }),
        },
        {
          name: "get_soccer_teams",
          description: "Get all teams from a league",
          inputSchema: SoccerLeagueSchema,
        },
        {
          name: "get_player_details",
          description: "Get detailed player information",
          inputSchema: SoccerPlayerSchema,
        },
        {
          name: "get_transfer_values",
          description: "Get player market values from Transfermarkt style data",
          inputSchema: z.object({
            league: z.string(),
            minValue: z.number().default(0),
          }),
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        switch (request.params.name) {
          case "get_all_soccer_players":
            return this.getAllSoccerPlayers(request.params.arguments);
          case "get_league_players":
            return this.getLeaguePlayers(request.params.arguments);
          case "get_premier_league_fpl":
            return this.getPremierLeagueFPL(request.params.arguments);
          case "get_soccer_teams":
            return this.getSoccerTeams(request.params.arguments);
          case "get_player_details":
            return this.getPlayerDetails(request.params.arguments);
          case "get_transfer_values":
            return this.getTransferValues(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    );
  }

  private async getAllSoccerPlayers(args: any) {
    const { leagues, includeStats } = z.object({
      leagues: z.array(z.string()).default(["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"]),
      includeStats: z.boolean().default(true),
    }).parse(args);

    try {
      const allPlayers = [];
      
      // Collect players from each league
      for (const league of leagues) {
        try {
          let players = [];
          
          switch (league) {
            case 'premier-league':
              players = await this.fetchPremierLeaguePlayers();
              break;
            case 'la-liga':
              players = await this.fetchLaLigaPlayers();
              break;
            case 'serie-a':
              players = await this.fetchSerieAPlayers();
              break;
            case 'bundesliga':
              players = await this.fetchBundesligaPlayers();
              break;
            case 'ligue-1':
              players = await this.fetchLigue1Players();
              break;
            case 'mls':
              players = await this.fetchMLSPlayers();
              break;
          }
          
          allPlayers.push({
            league,
            playerCount: players.length,
            players: includeStats ? players : players.map(p => ({
              id: p.id,
              name: p.name,
              team: p.team,
              position: p.position,
            })),
          });
          
        } catch (error) {
          console.error(`Error fetching ${league} players:`, error);
          allPlayers.push({
            league,
            playerCount: 0,
            error: error.message,
          });
        }
      }

      const totalPlayers = allPlayers.reduce((sum, league) => sum + league.playerCount, 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              totalPlayers,
              leaguesProcessed: allPlayers.length,
              leagues: allPlayers,
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
            text: `Error fetching soccer players: ${error}`,
          },
        ],
      };
    }
  }

  private async fetchPremierLeaguePlayers() {
    try {
      const response = await fetch(`${this.apiEndpoints['premier-league']}/bootstrap-static/`);
      const data = await response.json();
      
      return data.elements.map(player => ({
        id: `epl_${player.id}`,
        name: `${player.first_name} ${player.second_name}`,
        team: data.teams.find(t => t.id === player.team)?.name || 'Unknown',
        position: this.mapFPLPosition(player.element_type),
        price: player.now_cost / 10, // FPL prices are in tenths
        stats: {
          totalPoints: player.total_points,
          goalsScored: player.goals_scored,
          assists: player.assists,
          cleanSheets: player.clean_sheets,
          saves: player.saves,
          yellowCards: player.yellow_cards,
          redCards: player.red_cards,
          form: player.form,
          pointsPerGame: player.points_per_game,
          selectedBy: `${player.selected_by_percent}%`,
          influence: player.influence,
          creativity: player.creativity,
          threat: player.threat,
          ictIndex: player.ict_index,
        },
        availability: {
          status: player.status,
          injuryNews: player.news,
          chanceOfPlaying: player.chance_of_playing_next_round,
        },
      }));
    } catch (error) {
      console.error('Error fetching Premier League players:', error);
      return [];
    }
  }

  private async fetchLaLigaPlayers() {
    // Simulated La Liga data structure
    // In production, this would connect to a real La Liga API
    const mockLaLigaTeams = [
      'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad',
      'Villarreal', 'Athletic Bilbao', 'Real Betis', 'Valencia', 'Getafe',
      'Celta Vigo', 'Rayo Vallecano', 'Osasuna', 'Mallorca', 'Girona',
      'Las Palmas', 'Alaves', 'Granada', 'Cadiz', 'Almeria'
    ];

    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    const players = [];

    // Generate realistic player data for each team
    mockLaLigaTeams.forEach((team, teamIndex) => {
      // 25 players per team
      for (let i = 0; i < 25; i++) {
        const position = i < 3 ? 'GK' : i < 10 ? 'DEF' : i < 18 ? 'MID' : 'FWD';
        players.push({
          id: `laliga_${teamIndex}_${i}`,
          name: `La Liga Player ${teamIndex}-${i}`,
          team,
          position,
          nationality: ['Spain', 'Brazil', 'Argentina', 'France'][Math.floor(Math.random() * 4)],
          age: 18 + Math.floor(Math.random() * 20),
          marketValue: Math.floor(Math.random() * 100) + 1, // millions
          stats: {
            appearances: Math.floor(Math.random() * 38),
            goals: position === 'FWD' ? Math.floor(Math.random() * 25) : Math.floor(Math.random() * 10),
            assists: Math.floor(Math.random() * 15),
            yellowCards: Math.floor(Math.random() * 10),
            redCards: Math.floor(Math.random() * 2),
          },
        });
      }
    });

    return players;
  }

  private async fetchSerieAPlayers() {
    // Serie A teams
    const serieATeams = [
      'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma',
      'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino',
      'Monza', 'Udinese', 'Sassuolo', 'Empoli', 'Salernitana',
      'Lecce', 'Hellas Verona', 'Cagliari', 'Frosinone', 'Genoa'
    ];

    return this.generateLeaguePlayers(serieATeams, 'serie-a');
  }

  private async fetchBundesligaPlayers() {
    const bundesligaTeams = [
      'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Union Berlin', 'Freiburg',
      'Bayer Leverkusen', 'Eintracht Frankfurt', 'Wolfsburg', 'Mainz 05', 'Borussia Monchengladbach',
      'FC Koln', 'Hoffenheim', 'Werder Bremen', 'Bochum', 'Augsburg',
      'Stuttgart', 'Darmstadt', 'Heidenheim'
    ];

    return this.generateLeaguePlayers(bundesligaTeams, 'bundesliga');
  }

  private async fetchLigue1Players() {
    const ligue1Teams = [
      'PSG', 'Monaco', 'Marseille', 'Lille', 'Nice',
      'Rennes', 'Lens', 'Lyon', 'Reims', 'Toulouse',
      'Montpellier', 'Nantes', 'Brest', 'Strasbourg', 'Lorient',
      'Le Havre', 'Metz', 'Clermont'
    ];

    return this.generateLeaguePlayers(ligue1Teams, 'ligue1');
  }

  private async fetchMLSPlayers() {
    const mlsTeams = [
      'LA Galaxy', 'LAFC', 'Seattle Sounders', 'Portland Timbers', 'Atlanta United',
      'NYCFC', 'NY Red Bulls', 'Philadelphia Union', 'Columbus Crew', 'FC Cincinnati',
      'Nashville SC', 'Orlando City', 'Inter Miami', 'Charlotte FC', 'Chicago Fire',
      'DC United', 'New England Revolution', 'Toronto FC', 'CF Montreal', 'Vancouver Whitecaps',
      'Minnesota United', 'Real Salt Lake', 'Colorado Rapids', 'Sporting KC', 'FC Dallas',
      'Houston Dynamo', 'Austin FC', 'San Jose Earthquakes', 'St. Louis City'
    ];

    return this.generateLeaguePlayers(mlsTeams, 'mls');
  }

  private generateLeaguePlayers(teams: string[], leagueId: string) {
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    const players = [];

    teams.forEach((team, teamIndex) => {
      // Generate 25-30 players per team
      const squadSize = 25 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < squadSize; i++) {
        const position = i < 3 ? 'GK' : i < 11 ? 'DEF' : i < 19 ? 'MID' : 'FWD';
        
        players.push({
          id: `${leagueId}_${teamIndex}_${i}`,
          name: `${team} Player ${i + 1}`,
          team,
          position,
          jerseyNumber: i + 1,
          age: 18 + Math.floor(Math.random() * 20),
          nationality: this.getRandomNationality(leagueId),
          height: 165 + Math.floor(Math.random() * 30), // cm
          weight: 60 + Math.floor(Math.random() * 35), // kg
          preferredFoot: Math.random() > 0.8 ? 'Left' : 'Right',
          marketValue: this.calculateMarketValue(position, leagueId),
          stats: this.generatePlayerStats(position),
          fantasyPoints: Math.floor(Math.random() * 200),
          fantasyPrice: 4.5 + (Math.random() * 10),
        });
      }
    });

    return players;
  }

  private getRandomNationality(leagueId: string) {
    const nationalities = {
      'serie-a': ['Italy', 'Brazil', 'Argentina', 'France', 'Serbia'],
      'bundesliga': ['Germany', 'Austria', 'Poland', 'France', 'Netherlands'],
      'ligue1': ['France', 'Brazil', 'Senegal', 'Argentina', 'Morocco'],
      'mls': ['USA', 'Canada', 'Mexico', 'Brazil', 'Argentina'],
    };

    const leagueNationalities = nationalities[leagueId] || ['Various'];
    return leagueNationalities[Math.floor(Math.random() * leagueNationalities.length)];
  }

  private calculateMarketValue(position: string, leagueId: string) {
    const baseValues = {
      'GK': 5,
      'DEF': 15,
      'MID': 25,
      'FWD': 30,
    };

    const leagueMultipliers = {
      'serie-a': 0.9,
      'bundesliga': 0.95,
      'ligue1': 0.85,
      'mls': 0.4,
    };

    const base = baseValues[position] || 20;
    const multiplier = leagueMultipliers[leagueId] || 1;
    const variance = Math.random() * 50; // 0-50M variance

    return Math.floor((base + variance) * multiplier);
  }

  private generatePlayerStats(position: string) {
    const baseStats = {
      'GK': {
        appearances: Math.floor(Math.random() * 38),
        cleanSheets: Math.floor(Math.random() * 15),
        saves: Math.floor(Math.random() * 150),
        goalsConceded: Math.floor(Math.random() * 50),
      },
      'DEF': {
        appearances: Math.floor(Math.random() * 38),
        goals: Math.floor(Math.random() * 5),
        assists: Math.floor(Math.random() * 8),
        cleanSheets: Math.floor(Math.random() * 15),
        tackles: Math.floor(Math.random() * 100),
      },
      'MID': {
        appearances: Math.floor(Math.random() * 38),
        goals: Math.floor(Math.random() * 15),
        assists: Math.floor(Math.random() * 20),
        keyPasses: Math.floor(Math.random() * 80),
        dribbles: Math.floor(Math.random() * 100),
      },
      'FWD': {
        appearances: Math.floor(Math.random() * 38),
        goals: Math.floor(Math.random() * 30),
        assists: Math.floor(Math.random() * 10),
        shotsOnTarget: Math.floor(Math.random() * 100),
        conversationRate: Math.floor(Math.random() * 30),
      },
    };

    return baseStats[position] || baseStats['MID'];
  }

  private mapFPLPosition(elementType: number): string {
    const positions = {
      1: 'GK',
      2: 'DEF',
      3: 'MID',
      4: 'FWD',
    };
    return positions[elementType] || 'MID';
  }

  private async getLeaguePlayers(args: any) {
    const { league, season } = SoccerLeagueSchema.parse(args);
    
    try {
      let players = [];
      
      switch (league) {
        case 'premier-league':
          players = await this.fetchPremierLeaguePlayers();
          break;
        case 'la-liga':
          players = await this.fetchLaLigaPlayers();
          break;
        case 'serie-a':
          players = await this.fetchSerieAPlayers();
          break;
        case 'bundesliga':
          players = await this.fetchBundesligaPlayers();
          break;
        case 'ligue-1':
          players = await this.fetchLigue1Players();
          break;
        case 'mls':
          players = await this.fetchMLSPlayers();
          break;
        default:
          throw new Error(`Unsupported league: ${league}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              league,
              season,
              totalPlayers: players.length,
              players,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching league players: ${error}`,
          },
        ],
      };
    }
  }

  private async getPremierLeagueFPL(args: any) {
    const { dataType } = z.object({
      dataType: z.enum(["bootstrap", "players", "teams", "fixtures"]).default("bootstrap"),
    }).parse(args);

    try {
      let endpoint = '/bootstrap-static/';
      
      switch (dataType) {
        case 'fixtures':
          endpoint = '/fixtures/';
          break;
        case 'players':
          endpoint = '/bootstrap-static/'; // Players are in bootstrap
          break;
        case 'teams':
          endpoint = '/bootstrap-static/'; // Teams are in bootstrap
          break;
      }

      const response = await fetch(`${this.apiEndpoints['premier-league']}${endpoint}`);
      const data = await response.json();

      let result = data;
      
      if (dataType === 'players' && data.elements) {
        result = {
          totalPlayers: data.elements.length,
          players: data.elements,
        };
      } else if (dataType === 'teams' && data.teams) {
        result = {
          totalTeams: data.teams.length,
          teams: data.teams,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching FPL data: ${error}`,
          },
        ],
      };
    }
  }

  private async getSoccerTeams(args: any) {
    const { league, season } = SoccerLeagueSchema.parse(args);
    
    try {
      const leagueTeams = {
        'premier-league': [
          'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
          'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
          'Liverpool', 'Luton Town', 'Manchester City', 'Manchester United', 'Newcastle United',
          'Nottingham Forest', 'Sheffield United', 'Tottenham', 'West Ham', 'Wolves'
        ],
        'la-liga': [
          'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad',
          'Villarreal', 'Athletic Bilbao', 'Real Betis', 'Valencia', 'Getafe',
          'Celta Vigo', 'Rayo Vallecano', 'Osasuna', 'Mallorca', 'Girona',
          'Las Palmas', 'Alaves', 'Granada', 'Cadiz', 'Almeria'
        ],
        'serie-a': [
          'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma',
          'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino',
          'Monza', 'Udinese', 'Sassuolo', 'Empoli', 'Salernitana',
          'Lecce', 'Hellas Verona', 'Cagliari', 'Frosinone', 'Genoa'
        ],
        // ... other leagues
      };

      const teams = leagueTeams[league] || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              league,
              season,
              totalTeams: teams.length,
              teams: teams.map((name, index) => ({
                id: `${league}_team_${index + 1}`,
                name,
                shortName: name.substring(0, 3).toUpperCase(),
                stadium: `${name} Stadium`,
                founded: 1900 + Math.floor(Math.random() * 100),
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching soccer teams: ${error}`,
          },
        ],
      };
    }
  }

  private async getPlayerDetails(args: any) {
    const { playerId, league } = SoccerPlayerSchema.parse(args);
    
    try {
      // Simulated player details
      const playerDetails = {
        id: playerId,
        name: "Example Player",
        fullName: "Example Full Player Name",
        dateOfBirth: "1995-01-15",
        age: 29,
        nationality: "Brazil",
        height: "180cm",
        weight: "75kg",
        position: "MID",
        jerseyNumber: 10,
        preferredFoot: "Right",
        team: {
          id: "team_1",
          name: "Example FC",
          league: league || "premier-league",
        },
        marketValue: "€50M",
        contract: {
          start: "2022-07-01",
          end: "2026-06-30",
          salary: "€200,000/week",
        },
        stats: {
          currentSeason: {
            appearances: 25,
            goals: 12,
            assists: 8,
            yellowCards: 3,
            redCards: 0,
            avgRating: 7.8,
          },
          career: {
            totalAppearances: 250,
            totalGoals: 85,
            totalAssists: 65,
            trophies: ["League Title x2", "Cup Winner x1", "Champions League x1"],
          },
        },
        fantasyInfo: {
          price: 10.5,
          ownership: "25.3%",
          totalPoints: 185,
          pointsPerGame: 7.4,
          form: 8.2,
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(playerDetails, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching player details: ${error}`,
          },
        ],
      };
    }
  }

  private async getTransferValues(args: any) {
    const { league, minValue } = z.object({
      league: z.string(),
      minValue: z.number().default(0),
    }).parse(args);

    try {
      // Simulated transfer market data
      const topTransfers = [
        {
          player: "Kylian Mbappé",
          from: "PSG",
          to: "Real Madrid",
          value: "€180M",
          league: "la-liga",
        },
        {
          player: "Erling Haaland",
          from: "Borussia Dortmund", 
          to: "Manchester City",
          value: "€150M",
          league: "premier-league",
        },
        {
          player: "Jude Bellingham",
          from: "Borussia Dortmund",
          to: "Real Madrid", 
          value: "€120M",
          league: "la-liga",
        },
      ];

      const filteredTransfers = topTransfers.filter(t => 
        (!league || t.league === league) && 
        parseInt(t.value.replace(/[€M]/g, '')) >= minValue
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              transfers: filteredTransfers,
              totalValue: filteredTransfers.reduce((sum, t) => 
                sum + parseInt(t.value.replace(/[€M]/g, '')), 0
              ),
              count: filteredTransfers.length,
              filters: { league, minValue },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching transfer values: ${error}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Soccer Fantasy MCP server running on stdio");
  }
}

const server = new SoccerFantasyServer();
server.run().catch(console.error);