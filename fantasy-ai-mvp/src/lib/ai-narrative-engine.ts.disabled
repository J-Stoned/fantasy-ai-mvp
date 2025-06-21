import { z } from "zod";
import { realtimeDataManager, type LivePlayerData } from "./realtime-data-manager";

export const NarrativeInsightSchema = z.object({
  type: z.enum([
    "revenge_game", "milestone_chase", "primetime_boost", "weather_impact",
    "injury_return", "coaching_change", "contract_year", "playoff_push",
    "division_rivalry", "home_field", "rest_advantage", "motivation_factor"
  ]),
  playerId: z.string(),
  playerName: z.string(),
  insight: z.string(),
  confidence: z.number().min(0).max(1),
  fantasyImpact: z.number(), // Expected points impact
  reasoning: z.string(),
  aiSource: z.enum(["gpt4", "claude", "gemini"]),
  narrativeScore: z.number().min(0).max(10),
});

export const ContextualAnalysisSchema = z.object({
  gameContext: z.object({
    gameId: z.string(),
    homeTeam: z.string(),
    awayTeam: z.string(),
    venue: z.string(),
    weather: z.record(z.any()).optional(),
    primetime: z.boolean(),
    stakes: z.enum(["regular", "division", "playoff", "championship"]),
  }),
  playerContext: z.object({
    playerId: z.string(),
    recentNews: z.array(z.string()),
    injuryHistory: z.array(z.string()),
    careerMilestones: z.array(z.string()),
    teamChanges: z.array(z.string()),
  }),
  narrativeFactors: z.array(z.string()),
});

export type NarrativeInsight = z.infer<typeof NarrativeInsightSchema>;
export type ContextualAnalysis = z.infer<typeof ContextualAnalysisSchema>;

interface AIProvider {
  name: string;
  apiKey: string;
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class AILineupNarrativeEngine {
  private aiProviders: AIProvider[] = [
    {
      name: "gpt4",
      apiKey: process.env.OPENAI_API_KEY || "",
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4-turbo-preview",
      maxTokens: 1000,
      temperature: 0.3,
    },
    {
      name: "claude",
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      endpoint: "https://api.anthropic.com/v1/messages",
      model: "claude-3-sonnet-20240229",
      maxTokens: 1000,
      temperature: 0.3,
    },
    {
      name: "gemini",
      apiKey: process.env.GOOGLE_AI_API_KEY || "",
      endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
      model: "gemini-pro",
      maxTokens: 1000,
      temperature: 0.3,
    }
  ];

  private narrativeCache = new Map<string, { insights: NarrativeInsight[]; timestamp: number }>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  async generateNarrativeInsights(
    playerId: string,
    gameContext: ContextualAnalysis['gameContext'],
    playerContext: ContextualAnalysis['playerContext']
  ): Promise<NarrativeInsight[]> {
    const cacheKey = `${playerId}_${gameContext.gameId}`;
    const cached = this.getCachedInsights(cacheKey);
    
    if (cached) {
      return cached;
    }

    const insights: NarrativeInsight[] = [];
    
    // Use multiple AI providers for diverse perspectives
    const providers = this.aiProviders.filter(p => p.apiKey);
    
    for (const provider of providers.slice(0, 2)) { // Use top 2 available providers
      try {
        const providerInsights = await this.generateInsightsFromProvider(
          provider,
          playerId,
          gameContext,
          playerContext
        );
        insights.push(...providerInsights);
      } catch (error) {
        console.error(`Error getting insights from ${provider.name}:`, error);
      }
    }

    // Deduplicate and rank insights
    const uniqueInsights = this.deduplicateInsights(insights);
    const rankedInsights = this.rankInsightsByImpact(uniqueInsights);
    
    // Cache for future requests
    this.cacheInsights(cacheKey, rankedInsights);
    
    return rankedInsights;
  }

  private async generateInsightsFromProvider(
    provider: AIProvider,
    playerId: string,
    gameContext: ContextualAnalysis['gameContext'],
    playerContext: ContextualAnalysis['playerContext']
  ): Promise<NarrativeInsight[]> {
    const prompt = this.buildNarrativePrompt(gameContext, playerContext);
    
    let response: any;
    
    switch (provider.name) {
      case "gpt4":
        response = await this.callOpenAI(provider, prompt);
        break;
      case "claude":
        response = await this.callClaude(provider, prompt);
        break;
      case "gemini":
        response = await this.callGemini(provider, prompt);
        break;
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }

    return this.parseNarrativeResponse(response, playerId, provider.name as any);
  }

  private buildNarrativePrompt(
    gameContext: ContextualAnalysis['gameContext'],
    playerContext: ContextualAnalysis['playerContext']
  ): string {
    return `As an expert fantasy football analyst, analyze the following scenario and provide narrative insights that could impact player performance:

GAME CONTEXT:
- Matchup: ${gameContext.awayTeam} @ ${gameContext.homeTeam}
- Venue: ${gameContext.venue}
- Game Stakes: ${gameContext.stakes}
- Primetime: ${gameContext.primetime}
- Weather: ${JSON.stringify(gameContext.weather || {})}

PLAYER CONTEXT:
- Recent News: ${playerContext.recentNews.join('; ')}
- Injury History: ${playerContext.injuryHistory.join('; ')}
- Career Milestones: ${playerContext.careerMilestones.join('; ')}
- Team Changes: ${playerContext.teamChanges.join('; ')}

Identify 3-5 narrative factors that could significantly impact this player's fantasy performance. For each factor, provide:

1. Narrative Type (revenge_game, milestone_chase, primetime_boost, etc.)
2. Specific Insight (2-3 sentences)
3. Fantasy Impact (expected points increase/decrease)
4. Confidence Level (0-100%)
5. Reasoning (why this matters)

Focus on storylines that actually affect performance, not just media narratives. Consider psychological factors, motivation levels, and situational advantages.

Format your response as JSON with this structure:
{
  "insights": [
    {
      "type": "narrative_type",
      "insight": "detailed insight",
      "fantasyImpact": 2.5,
      "confidence": 0.75,
      "reasoning": "explanation",
      "narrativeScore": 8
    }
  ]
}`;
  }

  private async callOpenAI(provider: AIProvider, prompt: string): Promise<any> {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert fantasy football analyst specializing in narrative analysis and psychological factors that impact player performance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callClaude(provider: AIProvider, prompt: string): Promise<any> {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callGemini(provider: AIProvider, prompt: string): Promise<any> {
    const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: provider.temperature,
          maxOutputTokens: provider.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private parseNarrativeResponse(
    response: string,
    playerId: string,
    aiSource: "gpt4" | "claude" | "gemini"
  ): NarrativeInsight[] {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const insights: NarrativeInsight[] = [];

      for (const insight of parsed.insights || []) {
        try {
          const narrativeInsight: NarrativeInsight = {
            type: insight.type,
            playerId,
            playerName: "", // Will be filled in later
            insight: insight.insight,
            confidence: Math.max(0, Math.min(1, insight.confidence)),
            fantasyImpact: insight.fantasyImpact || 0,
            reasoning: insight.reasoning,
            aiSource,
            narrativeScore: Math.max(0, Math.min(10, insight.narrativeScore || 5)),
          };

          // Validate with Zod
          const validated = NarrativeInsightSchema.parse(narrativeInsight);
          insights.push(validated);
        } catch (error) {
          console.warn("Invalid insight format, skipping:", insight);
        }
      }

      return insights;
    } catch (error) {
      console.error(`Error parsing narrative response from ${aiSource}:`, error);
      return [];
    }
  }

  private deduplicateInsights(insights: NarrativeInsight[]): NarrativeInsight[] {
    const seen = new Set<string>();
    const unique: NarrativeInsight[] = [];

    for (const insight of insights) {
      const key = `${insight.type}_${insight.playerId}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(insight);
      }
    }

    return unique;
  }

  private rankInsightsByImpact(insights: NarrativeInsight[]): NarrativeInsight[] {
    return insights.sort((a, b) => {
      // Primary sort: narrative score
      const scoreDiff = b.narrativeScore - a.narrativeScore;
      if (scoreDiff !== 0) return scoreDiff;

      // Secondary sort: fantasy impact
      const impactDiff = Math.abs(b.fantasyImpact) - Math.abs(a.fantasyImpact);
      if (impactDiff !== 0) return impactDiff;

      // Tertiary sort: confidence
      return b.confidence - a.confidence;
    });
  }

  async generateGameScript(
    gameId: string,
    playerIds: string[]
  ): Promise<{
    gameScript: string;
    keyNarratives: string[];
    impactPlayers: Array<{
      playerId: string;
      expectedScript: string;
      fantasyImpact: number;
    }>;
  }> {
    const gameContext = await this.getGameContext(gameId);
    const allInsights: NarrativeInsight[] = [];

    // Generate insights for all players
    for (const playerId of playerIds) {
      const playerContext = await this.getPlayerContext(playerId);
      const insights = await this.generateNarrativeInsights(playerId, gameContext, playerContext);
      allInsights.push(...insights);
    }

    // Combine insights into a cohesive game script
    const gameScript = await this.synthesizeGameScript(gameContext, allInsights);
    const keyNarratives = this.extractKeyNarratives(allInsights);
    const impactPlayers = this.identifyImpactPlayers(allInsights);

    return {
      gameScript,
      keyNarratives,
      impactPlayers
    };
  }

  private async synthesizeGameScript(
    gameContext: ContextualAnalysis['gameContext'],
    insights: NarrativeInsight[]
  ): Promise<string> {
    const prompt = `Based on these narrative insights, write a concise game script (3-4 sentences) that captures the key storylines and their potential fantasy impact:

GAME: ${gameContext.awayTeam} @ ${gameContext.homeTeam}

NARRATIVE INSIGHTS:
${insights.map(i => `- ${i.insight} (Impact: ${i.fantasyImpact > 0 ? '+' : ''}${i.fantasyImpact} pts)`).join('\n')}

Write a compelling narrative that weaves these storylines together and predicts how the game might unfold from a fantasy perspective.`;

    try {
      const provider = this.aiProviders.find(p => p.apiKey && p.name === "gpt4");
      if (!provider) return "Multiple narrative factors in play for this matchup.";

      const response = await this.callOpenAI(provider, prompt);
      return response.trim();
    } catch (error) {
      console.error("Error generating game script:", error);
      return "Multiple narrative factors could impact player performance in this matchup.";
    }
  }

  private extractKeyNarratives(insights: NarrativeInsight[]): string[] {
    return insights
      .sort((a, b) => b.narrativeScore - a.narrativeScore)
      .slice(0, 5)
      .map(i => i.insight);
  }

  private identifyImpactPlayers(insights: NarrativeInsight[]): Array<{
    playerId: string;
    expectedScript: string;
    fantasyImpact: number;
  }> {
    const playerImpacts = new Map<string, {
      totalImpact: number;
      insights: NarrativeInsight[];
    }>();

    // Group insights by player
    for (const insight of insights) {
      if (!playerImpacts.has(insight.playerId)) {
        playerImpacts.set(insight.playerId, {
          totalImpact: 0,
          insights: []
        });
      }
      
      const playerData = playerImpacts.get(insight.playerId)!;
      playerData.totalImpact += insight.fantasyImpact;
      playerData.insights.push(insight);
    }

    // Convert to result format
    return Array.from(playerImpacts.entries())
      .map(([playerId, data]) => ({
        playerId,
        expectedScript: data.insights
          .sort((a, b) => b.narrativeScore - a.narrativeScore)[0]
          ?.insight || "Standard performance expected",
        fantasyImpact: data.totalImpact
      }))
      .sort((a, b) => Math.abs(b.fantasyImpact) - Math.abs(a.fantasyImpact))
      .slice(0, 10); // Top 10 impact players
  }

  // Utility methods
  private async getGameContext(gameId: string): Promise<ContextualAnalysis['gameContext']> {
    // This would fetch from your database or API
    // For now, return mock data
    return {
      gameId,
      homeTeam: "SF",
      awayTeam: "DAL",
      venue: "Levi's Stadium",
      weather: { temperature: 72, windSpeed: 5, precipitation: 0 },
      primetime: false,
      stakes: "regular",
    };
  }

  private async getPlayerContext(playerId: string): Promise<ContextualAnalysis['playerContext']> {
    // This would fetch recent news, injury history, etc.
    // For now, return mock data
    return {
      playerId,
      recentNews: [
        "Coming off career-high performance",
        "New offensive coordinator taking over",
      ],
      injuryHistory: ["Ankle sprain (Week 3)", "Healthy all season"],
      careerMilestones: ["50 yards from 1,000 rushing yards"],
      teamChanges: ["New head coach hired"],
    };
  }

  private getCachedInsights(cacheKey: string): NarrativeInsight[] | null {
    const cached = this.narrativeCache.get(cacheKey);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.narrativeCache.delete(cacheKey);
      return null;
    }
    
    return cached.insights;
  }

  private cacheInsights(cacheKey: string, insights: NarrativeInsight[]): void {
    this.narrativeCache.set(cacheKey, {
      insights,
      timestamp: Date.now()
    });
  }

  // Real-time narrative updates
  async subscribeToNarrativeUpdates(
    gameId: string,
    callback: (narrativeUpdate: {
      type: 'breaking_news' | 'performance_update' | 'game_script_change';
      message: string;
      affectedPlayers: string[];
      fantasyImpact: number;
    }) => void
  ): Promise<() => void> {
    // Subscribe to real-time data and generate narrative updates
    return realtimeDataManager.subscribe('game_event', async (event) => {
      if (event.gameId === gameId && this.isNarrativeRelevant(event)) {
        const narrativeUpdate = await this.generateRealtimeNarrative(event);
        callback(narrativeUpdate);
      }
    });
  }

  private isNarrativeRelevant(event: any): boolean {
    const relevantEvents = ['touchdown', 'interception', 'fumble', 'injury'];
    return relevantEvents.includes(event.type) || 
           Math.abs(event.fantasyPointsImpact) >= 5;
  }

  private async generateRealtimeNarrative(event: any): Promise<any> {
    // Generate quick narrative updates for live events
    const narrativeMap = {
      'touchdown': {
        type: 'performance_update' as const,
        message: `🔥 ${event.description} - This could shift the game script significantly!`,
        fantasyImpact: event.fantasyPointsImpact
      },
      'injury': {
        type: 'breaking_news' as const,
        message: `⚠️ ${event.description} - Major narrative shift for affected players`,
        fantasyImpact: -10
      },
      'interception': {
        type: 'game_script_change' as const,
        message: `🎯 ${event.description} - Game script favor shifting dramatically`,
        fantasyImpact: event.fantasyPointsImpact
      }
    };

    const template = narrativeMap[event.type as keyof typeof narrativeMap] || {
      type: 'performance_update' as const,
      message: event.description,
      fantasyImpact: event.fantasyPointsImpact
    };

    return {
      ...template,
      affectedPlayers: event.playerId ? [event.playerId] : []
    };
  }
}

export const aiNarrativeEngine = new AILineupNarrativeEngine();