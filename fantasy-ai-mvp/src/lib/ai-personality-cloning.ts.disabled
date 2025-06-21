import { z } from "zod";

export const PersonalityTraitSchema = z.enum([
  "risk_tolerance",
  "decision_speed", 
  "waiver_aggression",
  "trade_frequency",
  "streaming_tendency",
  "research_depth",
  "emotional_stability",
  "contrarian_instinct",
  "injury_aversion",
  "rookie_bias"
]);

export const DecisionContextSchema = z.enum([
  "draft_pick",
  "waiver_claim",
  "trade_offer",
  "lineup_decision", 
  "drop_candidate",
  "trade_target",
  "streaming_option",
  "injury_replacement"
]);

export const PersonalityProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  source: z.enum(["expert", "champion", "historical", "custom"]),
  traits: z.record(PersonalityTraitSchema, z.number().min(-1).max(1)), // Normalized values
  decisionPatterns: z.array(z.object({
    context: DecisionContextSchema,
    factors: z.array(z.object({
      factor: z.string(),
      weight: z.number(),
    })),
    examples: z.array(z.string()),
  })),
  successMetrics: z.object({
    winRate: z.number(),
    accuracy: z.number(),
    consistency: z.number(),
    innovativeness: z.number(),
  }),
  catchphrases: z.array(z.string()),
  communicationStyle: z.enum(["analytical", "casual", "aggressive", "cautious", "humorous"]),
});

export const ClonedDecisionSchema = z.object({
  personalityId: z.string(),
  context: DecisionContextSchema,
  input: z.record(z.any()),
  recommendation: z.string(),
  reasoning: z.string(),
  confidence: z.number(),
  alternativeOptions: z.array(z.string()),
  personalityInfluence: z.record(PersonalityTraitSchema, z.number()),
});

export type PersonalityTrait = z.infer<typeof PersonalityTraitSchema>;
export type DecisionContext = z.infer<typeof DecisionContextSchema>;
export type PersonalityProfile = z.infer<typeof PersonalityProfileSchema>;
export type ClonedDecision = z.infer<typeof ClonedDecisionSchema>;

export class AIPersonalityCloning {
  private personalities: Map<string, PersonalityProfile> = new Map();

  constructor() {
    this.initializeExpertPersonalities();
  }

  private initializeExpertPersonalities(): void {
    // Matthew Berry (The Talented Mr. Roto)
    this.personalities.set("matthew_berry", {
      id: "matthew_berry",
      name: "Matthew Berry",
      description: "The original fantasy football personality - balanced with slight risk-taking tendency",
      source: "expert",
      traits: {
        risk_tolerance: 0.3,
        decision_speed: 0.1,
        waiver_aggression: 0.2,
        trade_frequency: 0.4,
        streaming_tendency: 0.6,
        research_depth: 0.8,
        emotional_stability: 0.7,
        contrarian_instinct: 0.2,
        injury_aversion: 0.1,
        rookie_bias: 0.3,
      },
      decisionPatterns: [
        {
          context: "draft_pick",
          factors: [
            { factor: "opportunity", weight: 0.4 },
            { factor: "talent", weight: 0.3 },
            { factor: "situation", weight: 0.3 },
          ],
          examples: ["Always draft the best player available early", "Look for undervalued veterans in middle rounds"],
        },
      ],
      successMetrics: {
        winRate: 0.72,
        accuracy: 0.68,
        consistency: 0.82,
        innovativeness: 0.45,
      },
      catchphrases: [
        "Trust your gut, but verify with data",
        "It's just a game... that we take very seriously",
        "The most important position in fantasy is the one you get right",
      ],
      communicationStyle: "humorous",
    });

    // Sean Koerner (The Action Network)
    this.personalities.set("sean_koerner", {
      id: "sean_koerner",
      name: "Sean Koerner",
      description: "Data-driven analytical approach with high accuracy focus",
      source: "expert",
      traits: {
        risk_tolerance: -0.2,
        decision_speed: 0.6,
        waiver_aggression: 0.4,
        trade_frequency: 0.1,
        streaming_tendency: 0.3,
        research_depth: 0.9,
        emotional_stability: 0.9,
        contrarian_instinct: -0.1,
        injury_aversion: 0.3,
        rookie_bias: -0.2,
      },
      decisionPatterns: [
        {
          context: "lineup_decision",
          factors: [
            { factor: "target_share", weight: 0.35 },
            { factor: "red_zone_looks", weight: 0.25 },
            { factor: "matchup_rating", weight: 0.25 },
            { factor: "game_script", weight: 0.15 },
          ],
          examples: ["Start players with high target share regardless of name", "Fade players in negative game scripts"],
        },
      ],
      successMetrics: {
        winRate: 0.68,
        accuracy: 0.84,
        consistency: 0.91,
        innovativeness: 0.25,
      },
      catchphrases: [
        "The data doesn't lie",
        "Target share is king",
        "Process over results",
      ],
      communicationStyle: "analytical",
    });

    // Adam Aizer (Aggressive, High-Volume Trader)
    this.personalities.set("aggressive_trader", {
      id: "aggressive_trader",
      name: "The Aggressive Trader",
      description: "High-frequency trading approach with calculated risks",
      source: "champion",
      traits: {
        risk_tolerance: 0.8,
        decision_speed: 0.9,
        waiver_aggression: 0.9,
        trade_frequency: 0.9,
        streaming_tendency: 0.8,
        research_depth: 0.6,
        emotional_stability: 0.4,
        contrarian_instinct: 0.7,
        injury_aversion: -0.3,
        rookie_bias: 0.5,
      },
      decisionPatterns: [
        {
          context: "trade_offer",
          factors: [
            { factor: "upside_potential", weight: 0.5 },
            { factor: "schedule_strength", weight: 0.2 },
            { factor: "injury_risk", weight: 0.1 },
            { factor: "team_need", weight: 0.2 },
          ],
          examples: ["Trade for upside before name value", "Always looking to upgrade through trades"],
        },
      ],
      successMetrics: {
        winRate: 0.75,
        accuracy: 0.62,
        consistency: 0.45,
        innovativeness: 0.88,
      },
      catchphrases: [
        "Go big or go home",
        "You miss 100% of the trades you don't make",
        "High risk, high reward",
      ],
      communicationStyle: "aggressive",
    });

    // Conservative Championship Builder
    this.personalities.set("conservative_champion", {
      id: "conservative_champion",
      name: "The Conservative Champion",
      description: "Steady, consistent approach focused on avoiding mistakes",
      source: "champion",
      traits: {
        risk_tolerance: -0.6,
        decision_speed: -0.3,
        waiver_aggression: 0.1,
        trade_frequency: -0.4,
        streaming_tendency: -0.2,
        research_depth: 0.7,
        emotional_stability: 0.9,
        contrarian_instinct: -0.5,
        injury_aversion: 0.7,
        rookie_bias: -0.4,
      },
      decisionPatterns: [
        {
          context: "draft_pick",
          factors: [
            { factor: "floor_projection", weight: 0.4 },
            { factor: "injury_history", weight: 0.3 },
            { factor: "consistency", weight: 0.2 },
            { factor: "age", weight: 0.1 },
          ],
          examples: ["Draft proven veterans over upside plays", "Avoid injury-prone players"],
        },
      ],
      successMetrics: {
        winRate: 0.78,
        accuracy: 0.74,
        consistency: 0.95,
        innovativeness: 0.15,
      },
      catchphrases: [
        "Slow and steady wins the league",
        "Championships are lost, not won",
        "Don't get cute",
      ],
      communicationStyle: "cautious",
    });
  }

  async cloneDecision(
    personalityId: string,
    context: DecisionContext,
    input: Record<string, any>
  ): Promise<ClonedDecision> {
    const personality = this.personalities.get(personalityId);
    if (!personality) {
      throw new Error(`Personality ${personalityId} not found`);
    }

    // Find relevant decision pattern
    const pattern = personality.decisionPatterns.find(p => p.context === context) ||
                   personality.decisionPatterns[0]; // Fallback to first pattern

    // Calculate decision based on personality traits and patterns
    const decision = await this.generatePersonalityDecision(personality, pattern, input);

    return {
      personalityId,
      context,
      input,
      recommendation: decision.recommendation,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      alternativeOptions: decision.alternativeOptions,
      personalityInfluence: decision.personalityInfluence,
    };
  }

  private async generatePersonalityDecision(
    personality: PersonalityProfile,
    pattern: PersonalityProfile['decisionPatterns'][0],
    input: Record<string, any>
  ): Promise<{
    recommendation: string;
    reasoning: string;
    confidence: number;
    alternativeOptions: string[];
    personalityInfluence: Record<PersonalityTrait, number>;
  }> {
    // Simulate personality-driven decision making
    const options = input.options || ["Option A", "Option B", "Option C"];
    
    // Score options based on personality traits
    const scoredOptions = options.map((option: string, index: number) => {
      let score = 0.5; // Base score
      let reasoning = "";

      // Apply personality traits to scoring
      Object.entries(personality.traits).forEach(([trait, value]) => {
        const traitKey = trait as PersonalityTrait;
        const influence = this.calculateTraitInfluence(traitKey, value, input, index);
        score += influence * 0.1; // Weight trait influence
        
        if (Math.abs(influence) > 0.3) {
          reasoning += this.generateTraitReasoning(traitKey, value, influence);
        }
      });

      return { option, score: Math.max(0, Math.min(1, score)), reasoning };
    });

    // Sort by score
    scoredOptions.sort((a: any, b: any) => b.score - a.score);
    
    const topOption = scoredOptions[0];
    const confidence = topOption.score;
    
    // Generate personality-specific reasoning
    const personalityReasoning = this.generatePersonalityReasoning(
      personality,
      topOption.option,
      topOption.reasoning,
      input
    );

    return {
      recommendation: topOption.option,
      reasoning: personalityReasoning,
      confidence,
      alternativeOptions: scoredOptions.slice(1, 3).map((o: any) => o.option),
      personalityInfluence: this.calculatePersonalityInfluence(personality, input),
    };
  }

  private calculateTraitInfluence(
    trait: PersonalityTrait,
    value: number,
    input: Record<string, any>,
    optionIndex: number
  ): number {
    // Simulate how each trait influences the decision
    switch (trait) {
      case "risk_tolerance":
        return input.riskLevel ? value * input.riskLevel : value * (optionIndex * 0.2);
      
      case "decision_speed":
        return input.timeConstraint ? value * input.timeConstraint : 0;
      
      case "waiver_aggression":
        return input.context === "waiver_claim" ? value * 0.5 : 0;
      
      case "trade_frequency":
        return input.context === "trade_offer" ? value * 0.6 : 0;
      
      case "research_depth":
        return input.dataAvailable ? value * input.dataAvailable : value * 0.3;
      
      case "contrarian_instinct":
        return input.popularityRank ? value * (1 - input.popularityRank) : 0;
      
      case "injury_aversion":
        return input.injuryRisk ? -value * input.injuryRisk : 0;
      
      case "rookie_bias":
        return input.isRookie ? value * 0.4 : 0;
      
      default:
        return 0;
    }
  }

  private generateTraitReasoning(trait: PersonalityTrait, value: number, influence: number): string {
    const intensity = Math.abs(influence) > 0.5 ? "strongly" : "moderately";
    const direction = influence > 0 ? "favors" : "avoids";

    const traitReasons: Record<PersonalityTrait, string> = {
      risk_tolerance: `${intensity} ${direction} risky plays`,
      decision_speed: `prefers ${value > 0 ? 'quick' : 'deliberate'} decisions`,
      waiver_aggression: `${intensity} ${direction} aggressive waiver moves`,
      trade_frequency: `${value > 0 ? 'actively seeks' : 'rarely makes'} trades`,
      streaming_tendency: `${intensity} ${direction} streaming options`,
      research_depth: `relies ${value > 0 ? 'heavily' : 'lightly'} on research`,
      emotional_stability: `${value > 0 ? 'stays calm' : 'gets emotional'} under pressure`,
      contrarian_instinct: `${intensity} ${value > 0 ? 'goes against' : 'follows'} the crowd`,
      injury_aversion: `${intensity} ${direction} injury-prone players`,
      rookie_bias: `${intensity} ${value > 0 ? 'favors' : 'avoids'} rookie players`,
    };

    return traitReasons[trait] + "; ";
  }

  private generatePersonalityReasoning(
    personality: PersonalityProfile,
    recommendation: string,
    traitReasoning: string,
    input: Record<string, any>
  ): string {
    const style = personality.communicationStyle;
    const randomCatchphrase = personality.catchphrases[
      Math.floor(Math.random() * personality.catchphrases.length)
    ];

    let reasoning = "";

    switch (style) {
      case "analytical":
        reasoning = `Based on the data and my analysis: ${recommendation}. ${traitReasoning}The numbers support this decision with ${personality.successMetrics.accuracy}% historical accuracy.`;
        break;
      
      case "humorous":
        reasoning = `"${randomCatchphrase}" - I'm going with ${recommendation} here. ${traitReasoning}Sometimes you gotta trust the process (and maybe a little luck).`;
        break;
      
      case "aggressive":
        reasoning = `${randomCatchphrase}! I'm all-in on ${recommendation}. ${traitReasoning}This is how champions are made!`;
        break;
      
      case "cautious":
        reasoning = `After careful consideration, ${recommendation} is the safer play. ${traitReasoning}Remember: ${randomCatchphrase}`;
        break;
      
      case "casual":
        reasoning = `I like ${recommendation} in this spot. ${traitReasoning}${randomCatchphrase}`;
        break;
    }

    return reasoning;
  }

  private calculatePersonalityInfluence(
    personality: PersonalityProfile,
    input: Record<string, any>
  ): Record<PersonalityTrait, number> {
    const influence: Record<PersonalityTrait, number> = {} as any;

    Object.keys(personality.traits).forEach(trait => {
      const traitKey = trait as PersonalityTrait;
      influence[traitKey] = this.calculateTraitInfluence(
        traitKey,
        personality.traits[traitKey] || 0,
        input,
        0
      );
    });

    return influence;
  }

  async createCustomPersonality(
    decisions: Array<{
      context: DecisionContext;
      options: string[];
      chosen: string;
      outcome: "success" | "failure";
    }>,
    userPreferences: Partial<Record<PersonalityTrait, number>>
  ): Promise<PersonalityProfile> {
    // Analyze user's decision patterns to create a custom personality
    const traits: Record<PersonalityTrait, number> = {} as any;

    // Calculate traits based on decision history
    Object.keys(userPreferences).forEach(trait => {
      const traitKey = trait as PersonalityTrait;
      traits[traitKey] = userPreferences[traitKey] || 0;
    });

    // Analyze decision patterns
    const patterns = this.analyzeDecisionPatterns(decisions);

    const customPersonality: PersonalityProfile = {
      id: `custom_${Date.now()}`,
      name: "Your Fantasy Style",
      description: "AI clone of your fantasy decision-making patterns",
      source: "custom",
      traits,
      decisionPatterns: patterns,
      successMetrics: {
        winRate: this.calculateWinRate(decisions),
        accuracy: this.calculateAccuracy(decisions),
        consistency: this.calculateConsistency(decisions),
        innovativeness: this.calculateInnovativeness(decisions),
      },
      catchphrases: [
        "This is how I roll",
        "Trust the process",
        "My gut says...",
      ],
      communicationStyle: this.determineCommStyle(decisions),
    };

    this.personalities.set(customPersonality.id, customPersonality);
    return customPersonality;
  }

  private analyzeDecisionPatterns(
    decisions: Array<{
      context: DecisionContext;
      options: string[];
      chosen: string;
      outcome: "success" | "failure";
    }>
  ): PersonalityProfile['decisionPatterns'] {
    // Group decisions by context and analyze patterns
    const patterns: PersonalityProfile['decisionPatterns'] = [];

    const contextGroups = decisions.reduce((groups, decision) => {
      if (!groups[decision.context]) {
        groups[decision.context] = [];
      }
      groups[decision.context].push(decision);
      return groups;
    }, {} as Record<DecisionContext, typeof decisions>);

    Object.entries(contextGroups).forEach(([context, contextDecisions]) => {
      const successfulDecisions = contextDecisions.filter(d => d.outcome === "success");
      
      patterns.push({
        context: context as DecisionContext,
        factors: [
          { factor: "historical_success", weight: 0.4 },
          { factor: "personal_preference", weight: 0.6 },
        ],
        examples: successfulDecisions.slice(0, 3).map(d => `Chose ${d.chosen} successfully`),
      });
    });

    return patterns;
  }

  private calculateWinRate(decisions: any[]): number {
    const successes = decisions.filter(d => d.outcome === "success").length;
    return decisions.length > 0 ? successes / decisions.length : 0.5;
  }

  private calculateAccuracy(decisions: any[]): number {
    // Mock calculation - would be more sophisticated in practice
    return 0.6 + Math.random() * 0.2;
  }

  private calculateConsistency(decisions: any[]): number {
    // Mock calculation based on decision variance
    return 0.5 + Math.random() * 0.3;
  }

  private calculateInnovativeness(decisions: any[]): number {
    // Mock calculation based on contrarian decisions
    return Math.random() * 0.6;
  }

  private determineCommStyle(decisions: any[]): PersonalityProfile['communicationStyle'] {
    // Mock determination - would analyze user communication patterns
    const styles: PersonalityProfile['communicationStyle'][] = [
      "analytical", "casual", "aggressive", "cautious", "humorous"
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  getPersonality(id: string): PersonalityProfile | undefined {
    return this.personalities.get(id);
  }

  getAllPersonalities(): PersonalityProfile[] {
    return Array.from(this.personalities.values());
  }

  async comparePersonalities(
    personalityIds: string[],
    scenario: { context: DecisionContext; input: Record<string, any> }
  ): Promise<Array<{
    personality: PersonalityProfile;
    decision: ClonedDecision;
  }>> {
    const comparisons = [];

    for (const id of personalityIds) {
      const personality = this.personalities.get(id);
      if (personality) {
        const decision = await this.cloneDecision(id, scenario.context, scenario.input);
        comparisons.push({ personality, decision });
      }
    }

    return comparisons;
  }
}