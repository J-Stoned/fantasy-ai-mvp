import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Import compliance checking
const GAMBLING_ENABLED = process.env.ENABLE_WAGERING === 'true' && process.env.NODE_ENV !== 'production';

const WagerCreationSchema = z.object({
  creatorId: z.string(),
  opponentId: z.string(),
  wagerType: z.enum(["player_performance", "head_to_head", "prop_bet", "season_long"]),
  amount: z.number().positive(),
  terms: z.object({
    description: z.string(),
    conditions: z.array(z.string()),
    timeframe: z.string(),
    metric: z.string(),
  }),
  jurisdiction: z.string().optional(),
});

const EscrowManagementSchema = z.object({
  wagerId: z.string(),
  action: z.enum(["create", "fund", "release", "dispute"]),
  amount: z.number().positive().optional(),
  userId: z.string(),
});

const OddsCalculationSchema = z.object({
  playerId: z.string(),
  metric: z.string(),
  timeframe: z.string(),
  marketConditions: z.record(z.any()).optional(),
});

class GamblingWageringServer {
  private server: Server;
  private complianceMode: boolean;

  constructor() {
    this.complianceMode = !GAMBLING_ENABLED;
    
    this.server = new Server(
      {
        name: "gambling-wagering-mcp",
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
          uri: "gambling://wagers",
          mimeType: "application/json",
          name: "Active Wagers",
        },
        {
          uri: "gambling://compliance",
          mimeType: "application/json", 
          name: "Compliance Status",
        },
      ],
    }));

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (this.complianceMode) {
        return {
          tools: [
            {
              name: "check_compliance_status",
              description: "Check gambling compliance and licensing status",
              inputSchema: z.object({
                jurisdiction: z.string().optional(),
              }),
            },
            {
              name: "preview_gambling_features", 
              description: "Preview upcoming gambling features (disabled in compliance mode)",
              inputSchema: z.object({}),
            },
          ],
        };
      }

      return {
        tools: [
          {
            name: "create_wager",
            description: "Create a new peer-to-peer wager between users",
            inputSchema: WagerCreationSchema,
          },
          {
            name: "manage_escrow",
            description: "Manage escrow accounts for wager funds",
            inputSchema: EscrowManagementSchema,
          },
          {
            name: "calculate_odds",
            description: "Calculate real-time odds for player performance",
            inputSchema: OddsCalculationSchema,
          },
          {
            name: "settle_wager",
            description: "Settle completed wagers and distribute funds",
            inputSchema: z.object({
              wagerId: z.string(),
              outcome: z.enum(["creator_wins", "opponent_wins", "tie", "void"]),
              finalStats: z.record(z.any()),
            }),
          },
          {
            name: "create_bounty",
            description: "Create performance bounties for community participation",
            inputSchema: z.object({
              creatorId: z.string(),
              targetMetric: z.string(),
              threshold: z.number(),
              bountyAmount: z.number().positive(),
              maxParticipants: z.number().positive(),
              deadline: z.string(),
            }),
          },
          {
            name: "verify_age_jurisdiction",
            description: "Verify user age and jurisdiction for gambling eligibility",
            inputSchema: z.object({
              userId: z.string(),
              birthDate: z.string(),
              jurisdiction: z.string(),
              documentId: z.string().optional(),
            }),
          },
          {
            name: "responsible_gambling_check",
            description: "Perform responsible gambling checks and limits",
            inputSchema: z.object({
              userId: z.string(),
              requestedAmount: z.number(),
              timeframe: z.enum(["daily", "weekly", "monthly"]),
            }),
          },
        ],
      };
    });

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        // Always check compliance first
        if (this.complianceMode && !["check_compliance_status", "preview_gambling_features"].includes(request.params.name)) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "COMPLIANCE_MODE_ACTIVE",
                  message: "Gambling features are disabled in compliance mode",
                  status: "GAMBLING_DISABLED",
                  enabledFeatures: ["fantasy_analytics", "social_features", "premium_subscriptions"],
                  contact: "legal@fantasy-ai.com",
                }, null, 2),
              },
            ],
          };
        }

        switch (request.params.name) {
          case "check_compliance_status":
            return this.checkComplianceStatus(request.params.arguments);
          case "preview_gambling_features":
            return this.previewGamblingFeatures(request.params.arguments);
          case "create_wager":
            return this.createWager(request.params.arguments);
          case "manage_escrow":
            return this.manageEscrow(request.params.arguments);
          case "calculate_odds":
            return this.calculateOdds(request.params.arguments);
          case "settle_wager":
            return this.settleWager(request.params.arguments);
          case "create_bounty":
            return this.createBounty(request.params.arguments);
          case "verify_age_jurisdiction":
            return this.verifyAgeJurisdiction(request.params.arguments);
          case "responsible_gambling_check":
            return this.responsibleGamblingCheck(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const uri = request.params.uri;
        
        if (uri === "gambling://compliance") {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                  complianceMode: this.complianceMode,
                  gamblingEnabled: GAMBLING_ENABLED,
                  environment: process.env.NODE_ENV,
                  status: this.complianceMode ? "SAFE_MODE" : "GAMBLING_ENABLED",
                  message: this.complianceMode 
                    ? "All gambling features are disabled for legal compliance"
                    : "Gambling features are active - ensure proper licensing",
                  requiredLicenses: [
                    "Gaming Commission License",
                    "Age Verification System", 
                    "Responsible Gambling Certification",
                    "Financial Services Authorization",
                  ],
                  lastChecked: new Date().toISOString(),
                }),
              },
            ],
          };
        }
        
        if (uri === "gambling://wagers") {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                  activeWagers: this.complianceMode ? [] : [
                    {
                      id: "wager_demo",
                      type: "DEMO_DATA",
                      message: "Real wager data would appear here when gambling is enabled",
                    },
                  ],
                  complianceMode: this.complianceMode,
                }),
              },
            ],
          };
        }
        
        throw new Error(`Unknown resource: ${uri}`);
      }
    );
  }

  private async checkComplianceStatus(args: any) {
    const { jurisdiction } = z.object({
      jurisdiction: z.string().optional(),
    }).parse(args);

    const complianceStatus = {
      timestamp: new Date().toISOString(),
      complianceMode: this.complianceMode,
      gamblingEnabled: GAMBLING_ENABLED,
      environment: process.env.NODE_ENV,
      jurisdiction: jurisdiction || "UNKNOWN",
      status: {
        overall: this.complianceMode ? "COMPLIANT" : "REQUIRES_REVIEW",
        gambling: this.complianceMode ? "DISABLED" : "ENABLED",
        licensing: "PENDING",
        ageVerification: "NOT_IMPLEMENTED",
        responsibleGambling: "NOT_IMPLEMENTED",
      },
      requiredActions: this.complianceMode ? [
        "✅ Gambling features safely disabled",
        "✅ Operating in compliance mode",
        "🔄 Obtain gambling licenses before enabling",
      ] : [
        "⚠️ Verify gambling licenses are active",
        "⚠️ Implement age verification",
        "⚠️ Enable responsible gambling tools",
        "⚠️ Ensure jurisdiction compliance",
      ],
      contactInfo: {
        legal: "legal@fantasy-ai.com",
        compliance: "compliance@fantasy-ai.com",
      },
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(complianceStatus, null, 2),
        },
      ],
    };
  }

  private async previewGamblingFeatures(args: any) {
    const preview = {
      message: "Preview of gambling features (currently disabled)",
      plannedFeatures: {
        peerToPeerWagering: {
          description: "Direct wagering between users on player performance",
          features: ["Custom wager creation", "Escrow management", "Automatic settlement"],
          compliance: "Requires gaming license and age verification",
        },
        liveBetting: {
          description: "Real-time betting during games",
          features: ["Live odds", "In-game prop bets", "Dynamic pricing"],
          compliance: "Requires sportsbook license in each jurisdiction",
        },
        bountySystem: {
          description: "Community bounties for performance achievements",
          features: ["Group challenges", "Prize pools", "Leaderboards"],
          compliance: "Requires tournament gaming authorization",
        },
        cryptoIntegration: {
          description: "Cryptocurrency payments and NFT trading",
          features: ["Crypto deposits", "NFT player cards", "Token rewards"],
          compliance: "Requires digital asset compliance",
        },
      },
      currentStatus: "DISABLED_FOR_COMPLIANCE",
      enablementRequirements: [
        "Obtain relevant gaming licenses",
        "Implement KYC/age verification",
        "Deploy responsible gambling tools",
        "Establish regulatory reporting",
        "Update terms of service",
      ],
      estimatedTimeToLaunch: "6-12 months (pending licensing)",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(preview, null, 2),
        },
      ],
    };
  }

  // Gambling feature implementations (only active when not in compliance mode)
  private async createWager(args: any) {
    const wagerData = WagerCreationSchema.parse(args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "WAGER_CREATED",
            wagerId: `wager_${Date.now()}`,
            ...wagerData,
            escrowStatus: "PENDING_FUNDS",
            createdAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async manageEscrow(args: any) {
    const escrowData = EscrowManagementSchema.parse(args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "ESCROW_ACTION_COMPLETED",
            escrowId: `escrow_${Date.now()}`,
            ...escrowData,
            processedAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async calculateOdds(args: any) {
    const oddsData = OddsCalculationSchema.parse(args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            playerId: oddsData.playerId,
            metric: oddsData.metric,
            odds: {
              over: 1.85,
              under: 1.95,
              exactValue: 2.45,
            },
            confidence: 0.78,
            lastUpdated: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async settleWager(args: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "WAGER_SETTLED",
            settlement: args,
            processedAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async createBounty(args: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "BOUNTY_CREATED",
            bountyId: `bounty_${Date.now()}`,
            ...args,
            createdAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async verifyAgeJurisdiction(args: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "VERIFICATION_PENDING",
            userId: args.userId,
            verificationId: `verify_${Date.now()}`,
            checks: {
              ageVerification: "PENDING",
              jurisdictionCheck: "PENDING",
              documentVerification: "PENDING",
            },
            estimatedCompletion: "24-48 hours",
          }, null, 2),
        },
      ],
    };
  }

  private async responsibleGamblingCheck(args: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "LIMITS_CHECKED",
            userId: args.userId,
            approved: true,
            limits: {
              daily: { limit: 500, used: 0 },
              weekly: { limit: 2000, used: 0 },
              monthly: { limit: 5000, used: 0 },
            },
            responsibleGamblingResources: [
              "https://www.ncpgambling.org/",
              "https://www.gamblersanonymous.org/",
            ],
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Gambling MCP server running on stdio (Compliance Mode: ${this.complianceMode})`);
  }
}

const server = new GamblingWageringServer();
server.run().catch(console.error);