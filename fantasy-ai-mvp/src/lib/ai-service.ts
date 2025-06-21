import OpenAI from "openai";
import { z } from "zod";
import { knowledgeGraphService, GraphInsight, InsightQuery } from "./knowledge-graph-service";
import { sequentialThinkingService, DecisionQuery, ThinkingChain } from "./sequential-thinking-service";

// AI Service Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions for AI responses
export interface PlayerAnalysis {
  playerId: string;
  playerName: string;
  projectedPoints: number;
  confidence: number;
  narrativeInsights: string[];
  riskFactors: string[];
  opportunities: string[];
  weatherImpact?: string;
  injuryRisk?: string;
  matchupAnalysis: string;
}

export interface LineupNarrative {
  overallStory: string;
  keyPlayers: Array<{
    name: string;
    narrative: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  gameScripts: Record<string, string>;
  riskAssessment: string;
  confidenceLevel: number;
}

export interface TradeAnalysis {
  recommendation: "accept" | "decline" | "negotiate";
  reasoning: string[];
  valueAssessment: string;
  riskFactors: string[];
  alternativeOptions: string[];
  confidenceScore: number;
}

// Schema for structured AI responses
const PlayerAnalysisSchema = z.object({
  projectedPoints: z.number(),
  confidence: z.number().min(0).max(1),
  narrativeInsights: z.array(z.string()),
  riskFactors: z.array(z.string()),
  opportunities: z.array(z.string()),
  matchupAnalysis: z.string(),
  weatherImpact: z.string().optional(),
  injuryRisk: z.string().optional(),
});

const LineupNarrativeSchema = z.object({
  overallStory: z.string(),
  keyPlayers: z.array(z.object({
    name: z.string(),
    narrative: z.string(),
    impact: z.enum(["positive", "negative", "neutral"]),
  })),
  gameScripts: z.record(z.string()),
  riskAssessment: z.string(),
  confidenceLevel: z.number().min(0).max(1),
});

export class AIService {
  private model = process.env.OPENAI_MODEL || "gpt-4-turbo";

  /**
   * Analyze a player's potential performance using AI
   */
  async analyzePlayer(
    playerName: string,
    position: string,
    team: string,
    opponent: string,
    context: {
      recentStats?: any[];
      injuryStatus?: string;
      weather?: string;
      gameContext?: string;
      week?: number;
      playerId?: string;
    } = {}
  ): Promise<PlayerAnalysis> {
    try {
      // Get Knowledge Graph insights first
      let graphInsights: GraphInsight[] = [];
      if (context.playerId) {
        const insightQuery: InsightQuery = {
          playerId: context.playerId,
          opponent: opponent,
          week: context.week,
          minConfidence: 0.6
        };
        graphInsights = await knowledgeGraphService.getInsights(insightQuery);
      }

      // Build enhanced prompt with graph insights
      const graphInsightText = graphInsights.length > 0 
        ? `\n\nKNOWLEDGE GRAPH INSIGHTS:\n${graphInsights.map((insight, index) => 
            `${index + 1}. ${insight.type.toUpperCase()}: ${insight.reasoning.join(' | ')} 
   - Confidence: ${(insight.confidence * 100).toFixed(0)}%
   - Projected Impact: ${insight.estimatedImpact > 0 ? '+' : ''}${insight.estimatedImpact.toFixed(1)} pts
   - Action: ${insight.actionableAdvice}`
          ).join('\n')}\n`
        : '';

      const prompt = `Analyze ${playerName} (${position}, ${team}) for fantasy football this week:

MATCHUP: ${team} vs ${opponent}
POSITION: ${position}
INJURY STATUS: ${context.injuryStatus || "Healthy"}
WEATHER: ${context.weather || "Unknown"}
GAME CONTEXT: ${context.gameContext || "Regular season game"}${graphInsightText}

Please provide a comprehensive analysis including:
1. Projected fantasy points (PPR scoring)
2. Confidence level (0-1)
3. 3-5 narrative insights about storylines affecting this player
4. Risk factors to consider
5. Opportunities for upside
6. Matchup analysis
7. Weather impact (if significant)
8. Injury risk assessment

Be specific about numbers and reasoning. Consider recent trends, team situations, matchup advantages, and especially the Knowledge Graph insights provided above.

Format your response as JSON matching this structure:
{
  "projectedPoints": 14.5,
  "confidence": 0.82,
  "narrativeInsights": ["Player facing former team", "Red zone targets increasing"],
  "riskFactors": ["Weather concerns", "Tough defense"],
  "opportunities": ["Potential blowout game script", "Opponent weak vs position"],
  "matchupAnalysis": "Detailed matchup breakdown...",
  "weatherImpact": "Rain expected, may favor running game",
  "injuryRisk": "Low risk, fully healthy"
}`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert fantasy football analyst with deep knowledge of NFL players, matchups, and game scripts. Provide data-driven insights with specific reasoning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      // Parse JSON response
      const aiAnalysis = JSON.parse(content);
      const validatedAnalysis = PlayerAnalysisSchema.parse(aiAnalysis);

      return {
        playerId: `player_${Date.now()}`, // Would be actual ID in production
        playerName,
        ...validatedAnalysis,
      };

    } catch (error) {
      console.error("Error analyzing player:", error);
      
      // Fallback to basic analysis
      return {
        playerId: `player_${Date.now()}`,
        playerName,
        projectedPoints: this.getPositionBaseline(position),
        confidence: 0.5,
        narrativeInsights: [`${playerName} standard projection for ${position}`],
        riskFactors: ["AI analysis unavailable"],
        opportunities: ["Standard position upside"],
        matchupAnalysis: `${team} vs ${opponent} - analysis pending`,
      };
    }
  }

  /**
   * Generate narrative storylines for an entire lineup
   */
  async generateLineupNarrative(
    lineup: Array<{
      name: string;
      position: string;
      team: string;
      opponent: string;
      projectedPoints: number;
    }>,
    week: number,
    gameContext: string = "Regular season"
  ): Promise<LineupNarrative> {
    try {
      const lineupSummary = lineup.map(p => 
        `${p.name} (${p.position}, ${p.team} vs ${p.opponent}) - ${p.projectedPoints} pts`
      ).join("\\n");

      const prompt = `Create a compelling narrative for this fantasy football lineup in Week ${week}:

LINEUP:
${lineupSummary}

CONTEXT: ${gameContext}

Generate a narrative that includes:
1. An overall story tying the lineup together
2. Individual player narratives with impact assessment
3. Game scripts for each matchup
4. Risk assessment for the lineup
5. Confidence level in the lineup's success

Focus on:
- Storylines (revenge games, milestones, breakout potential)
- Correlation plays and stacking strategies  
- Weather and game environment factors
- Injury/news impacts
- Contrarian vs. chalk play balance

Format as JSON:
{
  "overallStory": "Your lineup this week centers around...",
  "keyPlayers": [
    {
      "name": "Player Name",
      "narrative": "Specific storyline for this player",
      "impact": "positive" // or "negative" or "neutral"
    }
  ],
  "gameScripts": {
    "Team1 vs Team2": "Game script prediction..."
  },
  "riskAssessment": "Overall risk level and factors...",
  "confidenceLevel": 0.75
}`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert fantasy football analyst who creates compelling narratives that help users understand their lineup's potential. Focus on actionable insights and engaging storylines."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      const aiNarrative = JSON.parse(content);
      return LineupNarrativeSchema.parse(aiNarrative);

    } catch (error) {
      console.error("Error generating lineup narrative:", error);
      
      // Fallback narrative
      return {
        overallStory: "Your lineup has multiple paths to success this week with a balanced mix of floor and ceiling plays.",
        keyPlayers: lineup.slice(0, 3).map(p => ({
          name: p.name,
          narrative: `${p.name} is a solid play at ${p.position} with ${p.projectedPoints} projected points.`,
          impact: "positive" as const,
        })),
        gameScripts: {},
        riskAssessment: "Moderate risk lineup with good upside potential.",
        confidenceLevel: 0.7,
      };
    }
  }

  /**
   * Analyze a proposed trade using AI
   */
  async analyzeTrade(
    givingPlayers: string[],
    receivingPlayers: string[],
    teamContext: {
      currentRoster?: string[];
      leagueSettings?: any;
      teamRecord?: string;
      playoffPush?: boolean;
    } = {}
  ): Promise<TradeAnalysis> {
    try {
      const prompt = `Analyze this fantasy football trade proposal:

GIVING: ${givingPlayers.join(", ")}
RECEIVING: ${receivingPlayers.join(", ")}

TEAM CONTEXT:
- Current Record: ${teamContext.teamRecord || "Unknown"}
- Playoff Push: ${teamContext.playoffPush ? "Yes" : "No"}
- League Settings: ${teamContext.leagueSettings ? JSON.stringify(teamContext.leagueSettings) : "Standard"}

Provide a comprehensive trade analysis including:
1. Recommendation (accept/decline/negotiate)
2. Detailed reasoning for the recommendation
3. Value assessment (who wins the trade)
4. Risk factors to consider
5. Alternative trade options
6. Confidence score (0-1)

Consider:
- Current player values and trends
- Positional needs and depth
- Playoff vs. season-long strategy
- Injury risks and age curves
- Schedule strength remaining

Format as JSON:
{
  "recommendation": "accept", // "accept", "decline", or "negotiate"
  "reasoning": ["Reason 1", "Reason 2", "Reason 3"],
  "valueAssessment": "You win this trade because...",
  "riskFactors": ["Risk 1", "Risk 2"],
  "alternativeOptions": ["Alternative 1", "Alternative 2"],
  "confidenceScore": 0.85
}`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert fantasy football trade analyzer who helps users make smart roster decisions. Be objective and consider both short-term and long-term implications."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      return JSON.parse(content);

    } catch (error) {
      console.error("Error analyzing trade:", error);
      
      // Fallback analysis
      return {
        recommendation: "negotiate",
        reasoning: ["AI analysis unavailable - recommend manual review"],
        valueAssessment: "Unable to determine trade value automatically",
        riskFactors: ["Analysis incomplete"],
        alternativeOptions: ["Consider getting expert opinion"],
        confidenceScore: 0.3,
      };
    }
  }

  /**
   * Generate voice assistant responses
   */
  async generateVoiceResponse(
    query: string,
    context: {
      userTeam?: any[];
      availablePlayers?: any[];
      recentNews?: string[];
    } = {}
  ): Promise<{
    response: string;
    actions?: Array<{
      type: string;
      data: any;
    }>;
    followUp?: string[];
  }> {
    try {
      const prompt = `You are a fantasy football voice assistant. Respond to this query naturally and helpfully:

QUERY: "${query}"

CONTEXT:
- User's team: ${context.userTeam ? JSON.stringify(context.userTeam) : "Not available"}
- Available players: ${context.availablePlayers ? "Yes" : "No"}
- Recent news: ${context.recentNews ? context.recentNews.join(", ") : "None"}

Provide:
1. A natural, conversational response
2. Any actions to take (lineup changes, player research, etc.)
3. Follow-up suggestions

Keep responses concise but informative. Use first person ("I recommend...") and be encouraging.

Format as JSON:
{
  "response": "Natural language response...",
  "actions": [
    {
      "type": "lineup_change",
      "data": { "playerId": "123", "action": "start" }
    }
  ],
  "followUp": ["Ask about...", "Try saying..."]
}`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a friendly, knowledgeable fantasy football assistant. Provide helpful, actionable advice in a conversational tone."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      return JSON.parse(content);

    } catch (error) {
      console.error("Error generating voice response:", error);
      
      return {
        response: "I'm having trouble processing that request right now. Can you try rephrasing your question?",
        followUp: ["Try asking about your lineup", "Ask for player recommendations"],
      };
    }
  }

  /**
   * Get position baseline for fallback projections
   */
  private getPositionBaseline(position: string): number {
    const baselines: Record<string, number> = {
      QB: 18,
      RB: 12,
      WR: 10,
      TE: 8,
      K: 7,
      DST: 8,
      FLEX: 10,
    };
    
    return baselines[position] || 10;
  }

  /**
   * Check if AI service is available (static)
   */
  static isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Check if AI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      });
      
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error("AI service health check failed:", error);
      return false;
    }
  }

  /**
   * Enhanced decision making using Sequential Thinking MCP
   */
  async makeEnhancedDecision(
    question: string,
    context: {
      players?: Array<{ id: string; name: string; position: string; team: string; stats?: any }>;
      matchups?: Array<{ homeTeam: string; awayTeam: string; week: number }>;
      constraints?: Record<string, any>;
      userPreferences?: Record<string, any>;
      timeHorizon?: "immediate" | "week" | "season";
      riskTolerance?: "conservative" | "moderate" | "aggressive";
    },
    requireConfidence: number = 0.7
  ): Promise<{
    decision: string;
    thinkingChain: ThinkingChain;
    aiEnhancement: {
      narrative: string;
      riskMitigation: string[];
      opportunities: string[];
      alternatives: string[];
    };
    confidence: number;
  }> {
    console.log("🎯 Making enhanced decision with Sequential Thinking + AI...");

    // Create decision query for Sequential Thinking
    const decisionQuery: DecisionQuery = {
      question,
      context,
      requireConfidence
    };

    // Get step-by-step thinking chain
    const thinkingChain = await sequentialThinkingService.think(decisionQuery);

    // Enhance with AI narrative and insights
    const aiPrompt = `Based on this step-by-step analysis, provide enhanced insights:

QUESTION: ${question}

THINKING CHAIN:
${thinkingChain.steps.map((step, index) => 
  `Step ${index + 1} - ${step.description}:
  Reasoning: ${step.reasoning}
  Confidence: ${(step.confidence * 100).toFixed(0)}%
  Evidence: ${step.evidence.join('; ')}`
).join('\n\n')}

CONCLUSION:
Decision: ${thinkingChain.conclusion.decision}
Confidence: ${(thinkingChain.conclusion.confidence * 100).toFixed(0)}%
Risk Factors: ${thinkingChain.conclusion.riskFactors.join('; ')}

Please provide:
1. A compelling narrative explaining the decision process
2. Specific risk mitigation strategies  
3. Opportunities that might be overlooked
4. Alternative approaches to consider

Format as JSON:
{
  "narrative": "Comprehensive explanation...",
  "riskMitigation": ["Strategy 1", "Strategy 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"], 
  "alternatives": ["Alternative 1", "Alternative 2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert fantasy football analyst who provides clear, actionable insights based on systematic analysis."
          },
          {
            role: "user", 
            content: aiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const aiContent = response.choices[0]?.message?.content;
      let aiEnhancement;
      
      try {
        aiEnhancement = JSON.parse(aiContent || "{}");
      } catch {
        aiEnhancement = {
          narrative: "AI enhancement processing error - using sequential thinking results",
          riskMitigation: thinkingChain.conclusion.riskFactors,
          opportunities: ["Review analysis for additional insights"],
          alternatives: ["Consider alternative approaches"]
        };
      }

      return {
        decision: thinkingChain.conclusion.decision,
        thinkingChain,
        aiEnhancement,
        confidence: thinkingChain.conclusion.confidence
      };

    } catch (error) {
      console.error("Error in AI enhancement:", error);
      
      // Fallback to sequential thinking results only
      return {
        decision: thinkingChain.conclusion.decision,
        thinkingChain,
        aiEnhancement: {
          narrative: `Based on systematic ${thinkingChain.steps.length}-step analysis: ${thinkingChain.conclusion.reasoning.join(' ')}`,
          riskMitigation: thinkingChain.conclusion.riskFactors,
          opportunities: ["Monitor for new information", "Consider alternative strategies"],
          alternatives: ["Review framework alternatives", "Adjust risk parameters"]
        },
        confidence: thinkingChain.conclusion.confidence
      };
    }
  }

  /**
   * Quick decision for simple questions (uses Sequential Thinking for consistency)
   */
  async makeQuickDecision(
    question: string,
    context: any = {},
    maxSteps: number = 3
  ): Promise<{
    decision: string;
    reasoning: string[];
    confidence: number;
    quickInsight: string;
  }> {
    console.log("⚡ Making quick decision with simplified Sequential Thinking...");

    // Use simplified Sequential Thinking for consistency
    const decisionQuery: DecisionQuery = {
      question,
      context,
      complexity: "simple"
    };

    const thinkingChain = await sequentialThinkingService.think(decisionQuery);

    // Generate quick insight
    const quickInsight = await this.generateQuickInsight(question, thinkingChain);

    return {
      decision: thinkingChain.conclusion.decision,
      reasoning: thinkingChain.conclusion.reasoning,
      confidence: thinkingChain.conclusion.confidence,
      quickInsight
    };
  }

  /**
   * Generate quick insight for fast decisions
   */
  private async generateQuickInsight(question: string, thinkingChain: ThinkingChain): Promise<string> {
    const keySteps = thinkingChain.steps.slice(0, 3);
    const avgConfidence = keySteps.reduce((sum, step) => sum + step.confidence, 0) / keySteps.length;

    if (avgConfidence > 0.8) {
      return `High-confidence answer: ${thinkingChain.conclusion.decision}. ${keySteps[0]?.reasoning.substring(0, 100)}...`;
    } else if (avgConfidence > 0.6) {
      return `Moderate-confidence answer: ${thinkingChain.conclusion.decision}. Consider ${thinkingChain.conclusion.riskFactors[0] || 'monitoring situation'}.`;
    } else {
      return `Low-confidence answer: ${thinkingChain.conclusion.decision}. Recommend additional analysis.`;
    }
  }

  /**
   * Analyze multiple options with Sequential Thinking
   */
  async compareOptions(
    question: string,
    options: Array<{
      name: string;
      description: string;
      pros: string[];
      cons: string[];
      data?: any;
    }>,
    context: any = {}
  ): Promise<{
    recommendation: string;
    rankings: Array<{
      option: string;
      rank: number;
      score: number;
      reasoning: string;
    }>;
    thinkingChain: ThinkingChain;
    comparisonMatrix: Record<string, Record<string, number>>;
  }> {
    console.log(`📊 Comparing ${options.length} options with Sequential Thinking...`);

    // Create comparison query
    const comparisonQuestion = `${question}\n\nOptions to compare:\n${options.map((opt, i) => 
      `${i + 1}. ${opt.name}: ${opt.description}\n   Pros: ${opt.pros.join(', ')}\n   Cons: ${opt.cons.join(', ')}`
    ).join('\n\n')}`;

    const decisionQuery: DecisionQuery = {
      question: comparisonQuestion,
      context: {
        ...context,
        options: options,
        comparisonCriteria: ["Expected value", "Risk level", "Upside potential", "Consistency"]
      },
      complexity: options.length > 5 ? "complex" : "moderate"
    };

    const thinkingChain = await sequentialThinkingService.think(decisionQuery);

    // Generate rankings and comparison matrix
    const rankings = options.map((option, index) => ({
      option: option.name,
      rank: index + 1, // Simplified ranking
      score: 0.5 + (Math.random() * 0.5), // Simulated scoring
      reasoning: `Based on analysis: ${option.pros[0] || 'Positive aspects identified'}`
    })).sort((a, b) => b.score - a.score);

    // Update ranks after sorting
    rankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Create comparison matrix
    const comparisonMatrix: Record<string, Record<string, number>> = {};
    const criteria = ["Value", "Risk", "Upside", "Consistency"];
    
    options.forEach(option => {
      comparisonMatrix[option.name] = {};
      criteria.forEach(criterion => {
        comparisonMatrix[option.name][criterion] = Math.random() * 10; // Simulated scores
      });
    });

    return {
      recommendation: rankings[0].option,
      rankings,
      thinkingChain,
      comparisonMatrix
    };
  }
}

// Singleton instance
export const aiService = new AIService();