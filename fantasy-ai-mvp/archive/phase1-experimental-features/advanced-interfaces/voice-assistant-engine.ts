import { z } from "zod";
import { aiLineupOptimizer } from "./ai-lineup-optimizer";
import { aiNarrativeEngine } from "./ai-narrative-engine";
import { realtimeDataManager } from "./realtime-data-manager";

export const VoiceCommandSchema = z.object({
  command: z.string(),
  intent: z.enum([
    "optimize_lineup", "check_player", "get_recommendations", "trade_analysis",
    "injury_update", "weather_check", "set_lineup", "get_scores", 
    "waiver_wire", "start_sit", "news_update", "league_standings",
    "price_check", "narrative_insight", "biometric_check"
  ]),
  entities: z.record(z.string()),
  confidence: z.number().min(0).max(1),
  requiresData: z.boolean(),
});

export const VoiceResponseSchema = z.object({
  text: z.string(),
  audioUrl: z.string().optional(),
  actions: z.array(z.object({
    type: z.string(),
    data: z.record(z.any()),
  })).optional(),
  followUpQuestions: z.array(z.string()).optional(),
  visualData: z.record(z.any()).optional(),
});

export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;
export type VoiceResponse = z.infer<typeof VoiceResponseSchema>;

export class FantasyVoiceAssistant {
  private isListening = false;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private wakeWordDetected = false;
  private lastCommand = "";
  private userId = "";
  private leagueId = "";

  // Voice settings
  private readonly WAKE_WORD = "hey fantasy";
  private readonly CONFIDENCE_THRESHOLD = 0.6;
  private readonly LISTENING_TIMEOUT = 10000; // 10 seconds
  
  // Command patterns for intent recognition
  private readonly COMMAND_PATTERNS = {
    optimize_lineup: [
      /optimize.*lineup/i,
      /best.*lineup/i,
      /fix.*lineup/i,
      /improve.*lineup/i,
      /lineup.*help/i
    ],
    check_player: [
      /how.*is.*(playing|doing)/i,
      /tell.*me.*about/i,
      /stats.*for/i,
      /update.*on/i,
      /check.*(player|status)/i
    ],
    get_recommendations: [
      /recommend/i,
      /suggest/i,
      /advice/i,
      /help.*me/i,
      /what.*should.*i/i
    ],
    trade_analysis: [
      /trade/i,
      /should.*i.*trade/i,
      /trade.*value/i,
      /worth.*trading/i
    ],
    injury_update: [
      /injur/i,
      /hurt/i,
      /status.*report/i,
      /health.*update/i
    ],
    start_sit: [
      /start.*or.*sit/i,
      /bench/i,
      /play.*or.*sit/i,
      /should.*i.*start/i
    ],
    price_check: [
      /price/i,
      /stock.*price/i,
      /how.*much.*worth/i,
      /value.*of/i
    ],
    narrative_insight: [
      /narrative/i,
      /storyline/i,
      /context/i,
      /why.*should/i,
      /tell.*me.*why/i
    ]
  };

  constructor(userId: string, leagueId: string) {
    this.userId = userId;
    this.leagueId = leagueId;
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      console.log("🎤 Voice recognition started");
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleSpeechResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'no-speech') {
        this.stopListening();
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart recognition if we're supposed to be listening
        this.recognition?.start();
      }
    };
  }

  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.warn("Speech synthesis not supported in this browser");
    }
  }

  startListening(): void {
    if (!this.recognition) {
      throw new Error("Speech recognition not available");
    }

    this.isListening = true;
    this.wakeWordDetected = false;
    this.recognition.start();
    console.log("👂 Listening for 'Hey Fantasy'...");
  }

  stopListening(): void {
    this.isListening = false;
    this.wakeWordDetected = false;
    this.recognition?.stop();
    console.log("🔇 Stopped listening");
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    const fullTranscript = (finalTranscript + interimTranscript).toLowerCase().trim();
    
    // Check for wake word
    if (!this.wakeWordDetected && fullTranscript.includes(this.WAKE_WORD)) {
      this.wakeWordDetected = true;
      this.playWakeSound();
      console.log("🚀 Wake word detected! Listening for command...");
      
      // Start listening timeout
      setTimeout(() => {
        if (this.wakeWordDetected && !this.lastCommand) {
          this.wakeWordDetected = false;
          this.speak("I didn't catch that. Try saying 'Hey Fantasy' again.");
        }
      }, this.LISTENING_TIMEOUT);
      
      return;
    }

    // Process command if wake word was detected
    if (this.wakeWordDetected && finalTranscript) {
      this.wakeWordDetected = false;
      this.lastCommand = finalTranscript;
      this.processVoiceCommand(finalTranscript);
    }
  }

  private async processVoiceCommand(transcript: string): Promise<void> {
    try {
      console.log("🎯 Processing command:", transcript);
      
      // Parse the command
      const command = await this.parseCommand(transcript);
      
      if (command.confidence < this.CONFIDENCE_THRESHOLD) {
        this.speak("I'm not sure I understood that. Can you try rephrasing?");
        return;
      }

      // Execute the command
      const response = await this.executeCommand(command);
      
      // Respond to user
      this.speak(response.text);
      
      // Execute any actions
      if (response.actions) {
        this.executeActions(response.actions);
      }
      
      // Offer follow-up questions
      if (response.followUpQuestions && response.followUpQuestions.length > 0) {
        setTimeout(() => {
          const followUp = response.followUpQuestions![0];
          this.speak(followUp);
        }, 2000);
      }

    } catch (error) {
      console.error("Error processing voice command:", error);
      this.speak("Sorry, I encountered an error processing that command.");
    }
  }

  private async parseCommand(transcript: string): Promise<VoiceCommand> {
    const normalizedText = transcript.toLowerCase().trim();
    
    // Extract entities (player names, positions, etc.)
    const entities = this.extractEntities(normalizedText);
    
    // Determine intent
    const intent = this.determineIntent(normalizedText);
    
    // Calculate confidence based on pattern matching
    const confidence = this.calculateConfidence(normalizedText, intent);
    
    return {
      command: transcript,
      intent,
      entities,
      confidence,
      requiresData: this.requiresExternalData(intent)
    };
  }

  private extractEntities(text: string): Record<string, string> {
    const entities: Record<string, string> = {};
    
    // Extract player names (this would be more sophisticated in practice)
    const playerPatterns = [
      /(?:christian\s+)?mccaffrey/i,
      /(?:tyreek\s+)?hill/i,
      /(?:travis\s+)?kelce/i,
      /(?:josh\s+)?allen/i,
      /(?:justin\s+)?jefferson/i,
      /(?:cooper\s+)?kupp/i,
      /(?:davante\s+)?adams/i,
    ];

    for (const pattern of playerPatterns) {
      const match = text.match(pattern);
      if (match) {
        entities.player = match[0];
        break;
      }
    }

    // Extract positions
    const positionMatch = text.match(/\b(quarterback|qb|running\s*back|rb|wide\s*receiver|wr|tight\s*end|te|kicker|k|defense|dst)\b/i);
    if (positionMatch) {
      entities.position = positionMatch[1];
    }

    // Extract numbers
    const numberMatch = text.match(/\b(\d+)\b/);
    if (numberMatch) {
      entities.number = numberMatch[1];
    }

    // Extract time references
    const timeMatch = text.match(/\b(today|tomorrow|this\s+week|next\s+week|sunday|monday)\b/i);
    if (timeMatch) {
      entities.timeframe = timeMatch[1];
    }

    return entities;
  }

  private determineIntent(text: string): VoiceCommand['intent'] {
    for (const [intent, patterns] of Object.entries(this.COMMAND_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return intent as VoiceCommand['intent'];
        }
      }
    }
    
    // Default to recommendations if no specific intent found
    return 'get_recommendations';
  }

  private calculateConfidence(text: string, intent: VoiceCommand['intent']): number {
    const patterns = this.COMMAND_PATTERNS[intent] || [];
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        // Higher confidence for more specific patterns
        const patternStr = pattern.toString();
        if (patternStr.includes('.*')) {
          return 0.85; // Specific patterns
        } else {
          return 0.95; // Exact matches
        }
      }
    }
    
    return 0.5; // Default confidence
  }

  private requiresExternalData(intent: VoiceCommand['intent']): boolean {
    const dataRequiredIntents = [
      'check_player', 'injury_update', 'weather_check', 
      'get_scores', 'league_standings', 'price_check'
    ];
    return dataRequiredIntents.includes(intent);
  }

  private async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.intent) {
      case 'optimize_lineup':
        return this.handleOptimizeLineup(command);
      
      case 'check_player':
        return this.handleCheckPlayer(command);
      
      case 'get_recommendations':
        return this.handleGetRecommendations(command);
      
      case 'trade_analysis':
        return this.handleTradeAnalysis(command);
      
      case 'injury_update':
        return this.handleInjuryUpdate(command);
      
      case 'start_sit':
        return this.handleStartSit(command);
      
      case 'price_check':
        return this.handlePriceCheck(command);
      
      case 'narrative_insight':
        return this.handleNarrativeInsight(command);
      
      default:
        return {
          text: "I can help you optimize lineups, check player stats, get recommendations, and more. What would you like to do?",
          followUpQuestions: [
            "Would you like me to optimize your lineup?",
            "Should I check on a specific player?",
            "Do you need trade advice?"
          ]
        };
    }
  }

  private async handleOptimizeLineup(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const currentWeek = this.getCurrentWeek();
      const result = await aiLineupOptimizer.generateOptimalLineups(
        this.userId,
        this.leagueId,
        currentWeek,
        { requiredPositions: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 } },
        1
      );

      const lineup = result.lineups[0];
      const topPlayers = lineup.lineup.slice(0, 3).map(p => p.name);
      
      let response = `I've optimized your lineup! Your top plays are ${topPlayers.join(', ')}. `;
      response += `The projected score is ${lineup.projectedPoints.toFixed(1)} points with ${lineup.risk} risk.`;
      
      if (lineup.narrativeInsights.length > 0) {
        response += ` Key insight: ${lineup.narrativeInsights[0].insight}`;
      }

      return {
        text: response,
        actions: [{
          type: 'show_lineup',
          data: { lineup: lineup.lineup }
        }],
        followUpQuestions: [
          "Would you like to see alternative lineup options?",
          "Should I explain why I recommended these players?"
        ]
      };
    } catch (error) {
      return {
        text: "I encountered an issue optimizing your lineup. Let me try a different approach."
      };
    }
  }

  private async handleCheckPlayer(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.player;
    
    if (!playerName) {
      return {
        text: "Which player would you like me to check on?",
        followUpQuestions: ["Try saying a player's name like 'Christian McCaffrey' or 'Travis Kelce'"]
      };
    }

    try {
      // This would fetch real player data
      const playerData = await this.getPlayerData(playerName);
      
      let response = `${playerName} has ${playerData.currentPoints} fantasy points this week. `;
      response += `He was projected for ${playerData.projectedPoints} points. `;
      
      if (playerData.injuryStatus !== 'healthy') {
        response += `Injury status: ${playerData.injuryStatus}. `;
      }
      
      if (playerData.priceChange > 0) {
        response += `His stock price is up ${playerData.priceChange.toFixed(1)} percent.`;
      } else if (playerData.priceChange < 0) {
        response += `His stock price is down ${Math.abs(playerData.priceChange).toFixed(1)} percent.`;
      }

      return {
        text: response,
        visualData: { playerStats: playerData },
        followUpQuestions: [
          "Would you like to see his upcoming matchups?",
          "Should I check if he's a good trade target?"
        ]
      };
    } catch (error) {
      return {
        text: `I couldn't find current information for ${playerName}. Try checking a different player.`
      };
    }
  }

  private async handleGetRecommendations(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const currentWeek = this.getCurrentWeek();
      const result = await aiLineupOptimizer.generateOptimalLineups(
        this.userId,
        this.leagueId,
        currentWeek,
        { requiredPositions: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 } },
        1
      );

      const recommendations = result.recommendations.slice(0, 3);
      let response = "Here are my top recommendations: ";
      response += recommendations.join('. ');

      return {
        text: response,
        followUpQuestions: [
          "Would you like specific player recommendations?",
          "Should I optimize your entire lineup?"
        ]
      };
    } catch (error) {
      return {
        text: "I can recommend optimizing your lineup, checking the waiver wire, or analyzing potential trades. What interests you most?"
      };
    }
  }

  private async handleTradeAnalysis(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.player;
    
    if (!playerName) {
      return {
        text: "Which player are you thinking about trading?",
        followUpQuestions: ["Tell me the player's name you want to trade or acquire"]
      };
    }

    // Simulate trade analysis
    const tradeValue = Math.random() > 0.5 ? "good" : "hold";
    const response = tradeValue === "good" 
      ? `Trading ${playerName} could be a good move. His value is currently high and you might get better return.`
      : `I'd recommend holding onto ${playerName}. His upcoming schedule looks favorable and his value might increase.`;

    return {
      text: response,
      followUpQuestions: [
        "Would you like me to suggest potential trade targets?",
        "Should I check his upcoming schedule?"
      ]
    };
  }

  private async handleInjuryUpdate(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.player;
    
    try {
      // Get latest injury information
      const injuryData = await this.getInjuryUpdates(playerName);
      
      if (injuryData.length === 0) {
        return {
          text: "No significant injury updates at the moment. All your key players appear healthy."
        };
      }

      const response = `Injury update: ${injuryData[0].message}`;
      
      return {
        text: response,
        actions: [{
          type: 'show_injury_report',
          data: { injuries: injuryData }
        }],
        followUpQuestions: [
          "Would you like backup recommendations for injured players?",
          "Should I check the waiver wire for replacements?"
        ]
      };
    } catch (error) {
      return {
        text: "I'll keep monitoring for injury updates and let you know if anything important comes up."
      };
    }
  }

  private async handleStartSit(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.player;
    
    if (!playerName) {
      return {
        text: "Which player are you unsure about starting?",
        followUpQuestions: ["Tell me the player you're considering benching or starting"]
      };
    }

    // Simulate start/sit analysis
    const recommendation = Math.random() > 0.5 ? "start" : "sit";
    const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
    
    const response = `I recommend you ${recommendation} ${playerName} this week with ${(confidence * 100).toFixed(0)}% confidence. `;
    
    if (recommendation === "start") {
      response + "The matchup looks favorable and his recent form is strong.";
    } else {
      response + "The matchup is tough and there might be better options available.";
    }

    return {
      text: response,
      followUpQuestions: [
        "Would you like alternative options for this position?",
        "Should I explain the reasoning behind this recommendation?"
      ]
    };
  }

  private async handlePriceCheck(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.player;
    
    if (!playerName) {
      return {
        text: "Which player's stock price would you like me to check?",
        followUpQuestions: ["Try asking about a specific player's current market value"]
      };
    }

    try {
      const priceData = await this.getPlayerStockPrice(playerName);
      
      let response = `${playerName}'s current stock price is $${priceData.currentPrice}. `;
      
      if (priceData.priceChange > 0) {
        response += `That's up ${priceData.priceChangePercent.toFixed(1)}% today.`;
      } else if (priceData.priceChange < 0) {
        response += `That's down ${Math.abs(priceData.priceChangePercent).toFixed(1)}% today.`;
      } else {
        response += "The price is unchanged from yesterday.";
      }

      return {
        text: response,
        visualData: { stockData: priceData },
        followUpQuestions: [
          "Would you like to see his price history?",
          "Should I recommend whether to buy or sell?"
        ]
      };
    } catch (error) {
      return {
        text: `I couldn't find current pricing for ${playerName}. The market might be updating.`
      };
    }
  }

  private async handleNarrativeInsight(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.player;
    
    try {
      if (playerName) {
        // Get narrative insights for specific player
        const insights = await this.getPlayerNarrative(playerName);
        return {
          text: insights.insight,
          followUpQuestions: [
            "Would you like to see how this affects his projection?",
            "Should I check other players with interesting storylines?"
          ]
        };
      } else {
        // General narrative insights
        const weeklyNarratives = await this.getWeeklyNarratives();
        return {
          text: weeklyNarratives[0]?.insight || "Several interesting storylines are developing this week.",
          followUpQuestions: [
            "Would you like to hear about specific revenge games?",
            "Should I tell you about players facing their former teams?"
          ]
        };
      }
    } catch (error) {
      return {
        text: "There are several compelling storylines this week that could impact fantasy performance. Would you like me to highlight the most important ones?"
      };
    }
  }

  // Speech synthesis
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): void {
    if (!this.synthesis) {
      console.warn("Speech synthesis not available");
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume || 0.8;
    
    // Use a natural-sounding voice if available
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Alex')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      console.log("🔊 Finished speaking");
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
    };

    this.synthesis.speak(utterance);
  }

  private playWakeSound(): void {
    // Play a subtle chime sound when wake word is detected
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log("📢 Wake word detected!"); // Fallback to console
    }
  }

  private executeActions(actions: Array<{ type: string; data: Record<string, any> }>): void {
    for (const action of actions) {
      switch (action.type) {
        case 'show_lineup':
          this.showLineupUI(action.data.lineup);
          break;
        case 'show_injury_report':
          this.showInjuryReportUI(action.data.injuries);
          break;
        case 'navigate_to':
          window.location.href = action.data.url;
          break;
        default:
          console.log(`Executing action: ${action.type}`, action.data);
      }
    }
  }

  private showLineupUI(lineup: any[]): void {
    // This would integrate with your UI framework to show the lineup
    console.log("Showing optimized lineup:", lineup);
    
    // Dispatch custom event for UI to listen to
    window.dispatchEvent(new CustomEvent('voice-action', {
      detail: { type: 'show_lineup', data: lineup }
    }));
  }

  private showInjuryReportUI(injuries: any[]): void {
    // This would show injury report in UI
    console.log("Showing injury report:", injuries);
    
    window.dispatchEvent(new CustomEvent('voice-action', {
      detail: { type: 'show_injuries', data: injuries }
    }));
  }

  // Mock data methods (would integrate with real APIs)
  private async getPlayerData(playerName: string): Promise<any> {
    // Simulate API call
    return {
      name: playerName,
      currentPoints: 18.6,
      projectedPoints: 22.1,
      injuryStatus: 'healthy',
      priceChange: 5.2
    };
  }

  private async getInjuryUpdates(playerName?: string): Promise<any[]> {
    // Simulate injury data
    return [
      {
        playerName: "Example Player",
        message: "Listed as questionable with ankle injury",
        severity: "minor",
        timestamp: new Date()
      }
    ];
  }

  private async getPlayerStockPrice(playerName: string): Promise<any> {
    return {
      currentPrice: 1250,
      priceChange: 75,
      priceChangePercent: 6.4,
      volume: 1500
    };
  }

  private async getPlayerNarrative(playerName: string): Promise<any> {
    return {
      insight: `${playerName} is facing his former team this week, which historically leads to increased motivation and performance.`,
      confidence: 0.8,
      fantasyImpact: 3.2
    };
  }

  private async getWeeklyNarratives(): Promise<any[]> {
    return [
      {
        insight: "Several players are facing their former teams this week, creating compelling revenge game narratives.",
        players: ["Player A", "Player B"]
      }
    ];
  }

  private getCurrentWeek(): number {
    // Calculate current NFL week
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 5); // Approximate season start
    const weeksDiff = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(18, weeksDiff + 1));
  }

  // Public API
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getLastCommand(): string {
    return this.lastCommand;
  }

  // Utility method for testing
  async simulateVoiceCommand(transcript: string): Promise<VoiceResponse> {
    const command = await this.parseCommand(transcript);
    return this.executeCommand(command);
  }
}

// Global instance (would be initialized with user context)
export let fantasyVoiceAssistant: FantasyVoiceAssistant | null = null;

export function initializeVoiceAssistant(userId: string, leagueId: string): FantasyVoiceAssistant {
  fantasyVoiceAssistant = new FantasyVoiceAssistant(userId, leagueId);
  return fantasyVoiceAssistant;
}