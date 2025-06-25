import { z } from "zod";

export const MoodStateSchema = z.enum([
  "devastated",
  "frustrated", 
  "disappointed",
  "neutral",
  "optimistic",
  "confident",
  "euphoric"
]);

export const FantasyEventSchema = z.enum([
  "bad_start",
  "injury_news", 
  "trade_regret",
  "lineup_mistake",
  "close_loss",
  "blowout_loss",
  "waiver_miss",
  "playoff_elimination",
  "championship_loss",
  "good_pickup",
  "clutch_win",
  "trade_success",
  "championship_win"
]);

export const TherapySessionSchema = z.object({
  userId: z.string(),
  moodBefore: MoodStateSchema,
  event: FantasyEventSchema,
  description: z.string().optional(),
  intensity: z.number().min(1).max(10),
  week: z.number().optional(),
});

export type MoodState = z.infer<typeof MoodStateSchema>;
export type FantasyEvent = z.infer<typeof FantasyEventSchema>;
export type TherapySession = z.infer<typeof TherapySessionSchema>;

export class AIFantasyTherapist {
  private readonly therapyStrategies = {
    devastated: {
      immediate: [
        "I understand this feels overwhelming right now. Fantasy sports can trigger real emotional responses, and that's completely normal.",
        "Let's take a step back. This is a game designed for entertainment, not to define your worth or intelligence.",
        "Your feelings are valid, but remember - even the best fantasy players have devastating weeks. This doesn't reflect on you as a person."
      ],
      coping: [
        "Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
        "Consider taking a 24-hour break from fantasy content to reset your perspective.",
        "Remember: professional analysts get predictions wrong constantly. You're competing in a game with significant randomness."
      ],
      reframe: [
        "Every fantasy champion has stories of devastating losses that taught them valuable lessons.",
        "This setback is data for better decision-making, not a judgment of your abilities.",
        "The unpredictability that caused this pain is the same thing that makes your future wins exciting."
      ]
    },
    frustrated: {
      immediate: [
        "Frustration in fantasy sports often comes from feeling like you're not in control. Let's explore what you can actually control.",
        "It's natural to feel frustrated when preparation doesn't pay off. Your research and effort still have value.",
        "This feeling is temporary. Fantasy frustration typically peaks immediately after disappointing news, then decreases."
      ],
      coping: [
        "Channel this energy into analysis: what patterns can you identify from this experience?",
        "Consider keeping a 'frustration journal' to track triggers and your responses over time.",
        "Use the 'Best Friend Test': What would you tell your best friend if they had the same result?"
      ],
      reframe: [
        "Frustration means you care and are invested - that passion can fuel better research and decisions.",
        "Every frustrating loss is teaching you emotional regulation skills that apply beyond fantasy sports.",
        "The players who handle frustration best tend to make more rational long-term decisions."
      ]
    },
    disappointed: {
      immediate: [
        "Disappointment shows you had reasonable expectations that didn't pan out. That's not a character flaw.",
        "It's okay to feel disappointed. Acknowledging this feeling is healthier than suppressing it.",
        "Your disappointment is proportional to how much you care, which speaks to your engagement and passion."
      ],
      coping: [
        "Write down three specific things you learned from this experience for future reference.",
        "Set a timer for 10 minutes to fully feel this disappointment, then commit to moving forward.",
        "Connect with your league mates - sharing experiences often helps normalize these feelings."
      ],
      reframe: [
        "Disappointment in fantasy often means you're setting appropriate expectations and taking calculated risks.",
        "This feeling will motivate you to dig deeper and improve your process for next time.",
        "Fantasy legends are defined not by avoiding disappointment, but by how they respond to it."
      ]
    }
  };

  private readonly positiveReinforcement = {
    good_pickup: [
      "Excellent instincts! You identified value before the crowd - that's a skill that translates to many areas of life.",
      "This shows your research process is working. Document what led to this insight for future reference.",
      "You're developing pattern recognition that will serve you well throughout the season."
    ],
    clutch_win: [
      "You stayed composed under pressure and made smart decisions when it mattered most.",
      "This win validates your preparation and trust in your process. That's championship-level thinking.",
      "You just experienced the reward for all your research and strategic thinking. Savor this feeling!"
    ],
    trade_success: [
      "Successful trades require reading people, understanding value, and timing - you nailed all three.",
      "You saw something others missed and had the confidence to act on it. That's advanced fantasy play.",
      "This trade will be a great reference point for evaluating future opportunities."
    ]
  };

  private readonly addictionWarningSignals = [
    "Checking scores obsessively (more than once every 30 minutes during games)",
    "Inability to enjoy games without fantasy implications",
    "Significant mood changes based on fantasy performance",
    "Neglecting responsibilities to manage fantasy teams",
    "Spending beyond comfortable limits on additional leagues or DFS",
    "Physical symptoms (sleep loss, appetite changes) related to fantasy stress",
    "Relationship strain due to fantasy time investment",
    "Using fantasy as primary emotional regulation mechanism"
  ];

  async provideCounsel(session: TherapySession): Promise<{
    assessment: string;
    immediate_support: string;
    coping_strategies: string[];
    reframing_perspective: string;
    action_items: string[];
    addiction_check?: string;
    mood_after_prediction: MoodState;
  }> {
    const { moodBefore, event, intensity, description } = session;

    // Risk assessment
    const isHighRisk = intensity >= 8 || moodBefore === "devastated";
    const isPositiveEvent = ["good_pickup", "clutch_win", "trade_success", "championship_win"].includes(event);

    if (isPositiveEvent) {
      return this.handlePositiveEvent(session);
    }

    const strategies = this.therapyStrategies[moodBefore] || this.therapyStrategies.frustrated;

    // Addiction screening for high-intensity negative reactions
    const addictionCheck = isHighRisk ? 
      "Your intense reaction suggests fantasy sports might be having an outsized impact on your wellbeing. Consider if any of these apply: " + 
      this.addictionWarningSignals.slice(0, 3).join(", ") + 
      ". If several resonate, consider speaking with a mental health professional." : undefined;

    const assessment = this.generateAssessment(moodBefore, event, intensity);
    const coping = this.selectCopingStrategies(moodBefore, intensity);
    const actionItems = this.generateActionItems(event, intensity);
    const moodAfterPrediction = this.predictMoodImprovement(moodBefore, intensity);

    return {
      assessment,
      immediate_support: strategies.immediate[0],
      coping_strategies: coping,
      reframing_perspective: strategies.reframe[Math.floor(Math.random() * strategies.reframe.length)],
      action_items: actionItems,
      addiction_check: addictionCheck,
      mood_after_prediction: moodAfterPrediction
    };
  }

  private handlePositiveEvent(session: TherapySession): any {
    const reinforcement = this.positiveReinforcement[session.event as keyof typeof this.positiveReinforcement];
    
    return {
      assessment: "You're experiencing a positive fantasy outcome! This is a great opportunity to reinforce good habits and build confidence.",
      immediate_support: reinforcement?.[0] || "Congratulations! Enjoy this success - you've earned it through good preparation and decision-making.",
      coping_strategies: [
        "Document what led to this success for future reference",
        "Share your excitement with league mates or friends",
        "Use this confidence boost to make bold but calculated future moves"
      ],
      reframing_perspective: "Success in fantasy sports comes from consistent good process, not luck. This win validates your approach.",
      action_items: [
        "Write down the key factors that contributed to this success",
        "Identify which aspects of your process you want to maintain",
        "Consider how this experience can inform future decisions"
      ],
      mood_after_prediction: "confident" as MoodState
    };
  }

  private generateAssessment(mood: MoodState, event: FantasyEvent, intensity: number): string {
    const emotionalIntensity = intensity >= 7 ? "high" : intensity >= 4 ? "moderate" : "low";
    
    return `You're experiencing ${emotionalIntensity} emotional intensity around a ${event.replace('_', ' ')} situation. 
    Your current mood (${mood}) is a normal response to fantasy setbacks. Remember that fantasy sports are designed to create 
    emotional engagement, which makes these feelings both common and manageable with the right tools.`;
  }

  private selectCopingStrategies(mood: MoodState, intensity: number): string[] {
    const strategies = this.therapyStrategies[mood]?.coping || this.therapyStrategies.frustrated.coping;
    
    if (intensity >= 7) {
      return [
        ...strategies,
        "Consider a 'digital detox' from fantasy apps for 2-4 hours",
        "Engage in physical activity to help process the emotional energy",
        "Practice deep breathing: 4 counts in, hold for 4, out for 6"
      ];
    }
    
    return strategies;
  }

  private generateActionItems(event: FantasyEvent, intensity: number): string[] {
    const baseActions = [
      "Review what factors were within your control vs. pure chance",
      "Update your process based on any lessons learned",
      "Set a specific time to check fantasy updates (avoid constant checking)"
    ];

    if (intensity >= 6) {
      baseActions.push(
        "Schedule a fun, non-fantasy activity within the next 24 hours",
        "Reach out to someone in your support network",
        "Consider whether you need a brief break from fantasy content"
      );
    }

    switch (event) {
      case "injury_news":
        baseActions.push("Research handcuff options and waiver wire targets");
        break;
      case "trade_regret":
        baseActions.push("Analyze what information you had at the time of the trade");
        break;
      case "lineup_mistake":
        baseActions.push("Create a lineup decision checklist for future weeks");
        break;
    }

    return baseActions;
  }

  private predictMoodImprovement(currentMood: MoodState, intensity: number): MoodState {
    const moodProgression: Record<MoodState, MoodState> = {
      devastated: intensity >= 8 ? "frustrated" : "disappointed",
      frustrated: "disappointed",
      disappointed: "neutral",
      neutral: "neutral",
      optimistic: "optimistic",
      confident: "confident",
      euphoric: "confident" // Euphoria tends to normalize
    };

    return moodProgression[currentMood];
  }

  async detectAddictionRisk(userId: string, recentSessions: TherapySession[]): Promise<{
    riskLevel: "low" | "moderate" | "high";
    concerns: string[];
    recommendations: string[];
  }> {
    const highIntensityCount = recentSessions.filter(s => s.intensity >= 7).length;
    const negativeEventCount = recentSessions.filter(s => 
      !["good_pickup", "clutch_win", "trade_success", "championship_win"].includes(s.event)
    ).length;

    const frequencyScore = recentSessions.length > 10 ? 2 : recentSessions.length > 5 ? 1 : 0;
    const intensityScore = highIntensityCount >= 5 ? 2 : highIntensityCount >= 3 ? 1 : 0;
    const negativeRatio = negativeEventCount / Math.max(recentSessions.length, 1);

    const totalScore = frequencyScore + intensityScore + (negativeRatio > 0.8 ? 2 : negativeRatio > 0.6 ? 1 : 0);

    if (totalScore >= 4) {
      return {
        riskLevel: "high",
        concerns: [
          "Frequent high-intensity emotional reactions to fantasy events",
          "Predominantly negative experiences with fantasy sports",
          "Pattern suggests fantasy outcomes may be significantly impacting wellbeing"
        ],
        recommendations: [
          "Consider speaking with a mental health professional",
          "Take a 1-week break from fantasy sports",
          "Limit fantasy app usage to specific times of day",
          "Consider reducing the number of leagues you participate in"
        ]
      };
    } else if (totalScore >= 2) {
      return {
        riskLevel: "moderate",
        concerns: [
          "Some concerning patterns in emotional intensity around fantasy events",
          "May benefit from developing additional coping strategies"
        ],
        recommendations: [
          "Practice mindfulness techniques before checking fantasy updates",
          "Set specific times for fantasy-related activities",
          "Develop interests outside of fantasy sports for emotional balance"
        ]
      };
    }

    return {
      riskLevel: "low",
      concerns: [],
      recommendations: [
        "Continue monitoring your emotional responses to fantasy events",
        "Maintain healthy boundaries around fantasy sports engagement"
      ]
    };
  }
}