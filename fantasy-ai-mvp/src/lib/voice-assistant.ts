interface VoiceCommand {
  action: string;
  entities: {
    players?: string[];
    positions?: string[];
    numbers?: number[];
    teams?: string[];
    timeframe?: string;
  };
  confidence: number;
}

interface VoiceResponse {
  text: string;
  actions?: Array<{
    type: "lineup_change" | "wager_create" | "player_info" | "trade_suggestion";
    data: any;
  }>;
  followUp?: string[];
}

export class FantasyVoiceAssistant {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private wakeWords = ["hey fantasy", "fantasy ai", "lineup"];
  private commandPatterns = new Map<RegExp, string>([
    // Lineup commands
    [/start (.+) (this week|next week|week \d+)/i, "start_player"],
    [/bench (.+) (this week|next week|week \d+)/i, "bench_player"],
    [/drop (.+)/i, "drop_player"],
    [/add (.+)/i, "add_player"],
    [/trade (.+) for (.+)/i, "trade_players"],
    
    // Information commands
    [/how is (.+) doing/i, "player_stats"],
    [/who should I start at (.+)/i, "position_advice"],
    [/optimize my lineup/i, "optimize_lineup"],
    [/show my team/i, "show_lineup"],
    
    // Wagering commands
    [/bet (\d+) (dollars|bucks) on (.+)/i, "create_wager"],
    [/challenge (.+) to a (.+) bet/i, "challenge_user"],
    [/accept (.+) wager/i, "accept_wager"],
    [/cash out (.+)/i, "cash_out"],
    
    // Analytics commands
    [/who has the best matchup/i, "matchup_analysis"],
    [/injury report/i, "injury_report"],
    [/weather report/i, "weather_report"],
    [/waiver wire suggestions/i, "waiver_suggestions"]
  ]);

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition() {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition!.continuous = true;
      this.recognition!.interimResults = true;
      this.recognition!.lang = "en-US";

      this.recognition!.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join("");

        if (this.detectWakeWord(transcript)) {
          this.processCommand(transcript);
        }
      };

      this.recognition!.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };
    }
  }

  /**
   * Initialize speech synthesis
   */
  private initializeSpeechSynthesis() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Start listening for voice commands
   */
  startListening(): boolean {
    if (!this.recognition) {
      console.error("Speech recognition not supported");
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      console.log("🎤 Voice assistant listening...");
      return true;
    } catch (error) {
      console.error("Failed to start listening:", error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log("🔇 Voice assistant stopped listening");
    }
  }

  /**
   * Detect wake words
   */
  private detectWakeWord(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase();
    return this.wakeWords.some(wakeWord => 
      lowerTranscript.includes(wakeWord)
    );
  }

  /**
   * Process voice command
   */
  private async processCommand(transcript: string) {
    const command = await this.parseCommand(transcript);
    
    if (!command) {
      this.speak("I didn't understand that command. Try saying 'Hey Fantasy, help' for available commands.");
      return;
    }

    const response = await this.executeCommand(command);
    this.speak(response.text);
    
    // Execute any follow-up actions
    if (response.actions) {
      for (const action of response.actions) {
        await this.executeAction(action);
      }
    }
  }

  /**
   * Parse natural language into structured command
   */
  private async parseCommand(transcript: string): Promise<VoiceCommand | null> {
    const cleanTranscript = transcript.toLowerCase()
      .replace(/hey fantasy,?/gi, "")
      .trim();

    for (const [pattern, action] of this.commandPatterns) {
      const match = cleanTranscript.match(pattern);
      if (match) {
        return {
          action,
          entities: this.extractEntities(match, action),
          confidence: 0.9
        };
      }
    }

    // Try AI-powered command parsing for complex queries
    return await this.aiParseCommand(cleanTranscript);
  }

  /**
   * Extract entities from regex matches
   */
  private extractEntities(match: RegExpMatchArray, action: string): VoiceCommand["entities"] {
    const entities: VoiceCommand["entities"] = {};

    switch (action) {
      case "start_player":
      case "bench_player":
        entities.players = [match[1]];
        entities.timeframe = match[2];
        break;
      
      case "trade_players":
        entities.players = [match[1], match[2]];
        break;
      
      case "create_wager":
        entities.numbers = [parseInt(match[1])];
        entities.players = [match[3]];
        break;
      
      case "position_advice":
        entities.positions = [match[1]];
        break;
    }

    return entities;
  }

  /**
   * AI-powered command parsing for complex queries
   */
  private async aiParseCommand(transcript: string): Promise<VoiceCommand | null> {
    try {
      // Import AI service dynamically to avoid circular deps
      const { aiService } = await import("./ai-service");
      
      const aiResponse = await aiService.generateVoiceResponse(
        transcript,
        {
          // Could include user context here
          userTeam: [], // Would be populated with actual user data
          availablePlayers: [],
          recentNews: []
        }
      );

      // Parse AI response into command structure
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        const action = aiResponse.actions[0];
        
        return {
          action: action.type,
          entities: this.extractEntitiesFromAI(action.data, transcript),
          confidence: 0.8
        };
      }

      // Try pattern matching as fallback
      const aiIntents = [
        {
          pattern: /should I (start|play) (.+)/i,
          action: "start_recommendation"
        },
        {
          pattern: /what.*think.*about (.+)/i,
          action: "player_analysis"
        },
        {
          pattern: /lineup.*this week/i,
          action: "weekly_lineup"
        }
      ];

      for (const intent of aiIntents) {
        const match = transcript.match(intent.pattern);
        if (match) {
          return {
            action: intent.action,
            entities: { players: match[2] ? [match[2]] : [] },
            confidence: 0.7
          };
        }
      }

    } catch (error) {
      console.error("AI command parsing failed:", error);
      // Fall back to pattern matching
    }

    return null;
  }

  /**
   * Execute parsed command
   */
  private async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.action) {
      case "start_player":
        return await this.handleStartPlayer(command);
      
      case "bench_player":
        return await this.handleBenchPlayer(command);
      
      case "optimize_lineup":
        return await this.handleOptimizeLineup(command);
      
      case "player_stats":
        return await this.handlePlayerStats(command);
      
      case "create_wager":
        return await this.handleCreateWager(command);
      
      case "show_lineup":
        return await this.handleShowLineup(command);
      
      case "matchup_analysis":
        return await this.handleMatchupAnalysis(command);
      
      default:
        return {
          text: "I'm not sure how to help with that. Try asking about your lineup, player stats, or creating wagers.",
          followUp: [
            "Say 'optimize my lineup' for AI suggestions",
            "Say 'show my team' to see your current lineup",
            "Say 'bet 50 dollars on McCaffrey over 100 yards' to create a wager"
          ]
        };
    }
  }

  /**
   * Handle start player command
   */
  private async handleStartPlayer(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.players?.[0];
    
    if (!playerName) {
      return { text: "I didn't catch the player name. Can you repeat that?" };
    }

    // Fuzzy match player name
    const player = await this.findPlayer(playerName);
    
    if (!player) {
      return { 
        text: `I couldn't find ${playerName} in your lineup. Can you spell the name or try their last name?` 
      };
    }

    return {
      text: `Starting ${player.name} for ${command.entities.timeframe || "this week"}. Good choice! He's projected for ${player.projectedPoints} points.`,
      actions: [
        {
          type: "lineup_change",
          data: {
            playerId: player.id,
            action: "start",
            timeframe: command.entities.timeframe
          }
        }
      ]
    };
  }

  /**
   * Handle bench player command
   */
  private async handleBenchPlayer(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.players?.[0];
    const player = await this.findPlayer(playerName!);

    if (!player) {
      return { text: `I couldn't find ${playerName} in your lineup.` };
    }

    return {
      text: `Benching ${player.name}. I'll suggest a replacement from your available players.`,
      actions: [
        {
          type: "lineup_change",
          data: {
            playerId: player.id,
            action: "bench",
            timeframe: command.entities.timeframe
          }
        }
      ]
    };
  }

  /**
   * Handle optimize lineup command
   */
  private async handleOptimizeLineup(command: VoiceCommand): Promise<VoiceResponse> {
    // Simulate AI optimization (would integrate with real AI optimizer)
    const optimizations = [
      "Start Justin Jefferson over Tyler Lockett - better matchup",
      "Consider benching your kicker for a defense with higher upside",
      "Your RB2 has a tough matchup - check the waiver wire"
    ];

    return {
      text: `I've analyzed your lineup. Here are my top 3 recommendations: ${optimizations.join(". ")}. Should I make these changes?`,
      actions: [
        {
          type: "lineup_change",
          data: {
            optimizations,
            requiresConfirmation: true
          }
        }
      ],
      followUp: [
        "Say 'yes' to apply all changes",
        "Say 'just the first one' for partial changes",
        "Say 'explain the first change' for more details"
      ]
    };
  }

  /**
   * Handle player stats command
   */
  private async handlePlayerStats(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.players?.[0];
    const player = await this.findPlayer(playerName!);

    if (!player) {
      return { text: `I couldn't find stats for ${playerName}.` };
    }

    // Simulate real stats lookup
    const stats = {
      lastGame: "18.4 points",
      season: "14.7 PPG average",
      projection: "16.2 points this week"
    };

    return {
      text: `${player.name} scored ${stats.lastGame} last game, averaging ${stats.season} this season. He's projected for ${stats.projection}. The matchup looks favorable!`,
      actions: [
        {
          type: "player_info",
          data: { player, stats }
        }
      ]
    };
  }

  /**
   * Handle create wager command
   */
  private async handleCreateWager(command: VoiceCommand): Promise<VoiceResponse> {
    const amount = command.entities.numbers?.[0];
    const playerName = command.entities.players?.[0];

    if (!amount || !playerName) {
      return { text: "I need both an amount and a player for the wager. Try again." };
    }

    return {
      text: `Creating a $${amount} wager on ${playerName}. I'll open the bet slip for you to confirm the details.`,
      actions: [
        {
          type: "wager_create",
          data: {
            amount,
            player: playerName,
            type: "performance_bet"
          }
        }
      ]
    };
  }

  /**
   * Handle show lineup command
   */
  private async handleShowLineup(command: VoiceCommand): Promise<VoiceResponse> {
    // Simulate lineup fetch
    const lineup = [
      "Quarterback: Josh Allen",
      "Running Back: Christian McCaffrey", 
      "Running Back: Alvin Kamara",
      "Wide Receiver: Justin Jefferson",
      "Wide Receiver: Davante Adams",
      "Tight End: Travis Kelce",
      "Flex: Amon-Ra St. Brown",
      "Defense: San Francisco",
      "Kicker: Justin Tucker"
    ];

    return {
      text: `Your current lineup: ${lineup.join(", ")}. Total projected points: 142.8. You're looking strong this week!`,
      followUp: [
        "Say 'optimize my lineup' for AI suggestions",
        "Say 'injury report' to check for updates",
        "Say 'create a wager' to bet on your performance"
      ]
    };
  }

  /**
   * Handle matchup analysis command
   */
  private async handleMatchupAnalysis(command: VoiceCommand): Promise<VoiceResponse> {
    // Simulate AI matchup analysis
    const analysis = {
      bestMatchup: "Justin Jefferson vs weak secondary",
      concerns: "McCaffrey facing stacked boxes",
      sleeper: "Amon-Ra St. Brown in potential shootout"
    };

    return {
      text: `Your best matchup is ${analysis.bestMatchup}. Watch out for ${analysis.concerns}. Sleeper pick: ${analysis.sleeper}. Weather looks clear for all outdoor games.`,
      actions: [
        {
          type: "player_info",
          data: { analysis }
        }
      ]
    };
  }

  /**
   * Execute action based on voice command
   */
  private async executeAction(action: any) {
    switch (action.type) {
      case "lineup_change":
        // Trigger lineup change in UI
        console.log("Executing lineup change:", action.data);
        break;
      
      case "wager_create":
        // Open wager creation modal
        console.log("Creating wager:", action.data);
        break;
      
      case "player_info":
        // Show player information panel
        console.log("Showing player info:", action.data);
        break;
    }
  }

  /**
   * Text-to-speech
   */
  speak(text: string, options: { rate?: number; pitch?: number; voice?: string } = {}) {
    if (!this.synthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.1;
    utterance.pitch = options.pitch || 1.0;
    
    // Use a natural-sounding voice if available
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes("Google") || 
      voice.name.includes("Microsoft") ||
      voice.name.includes("Natural")
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synthesis.speak(utterance);
  }

  /**
   * Find player by fuzzy name matching
   */
  private async findPlayer(name: string): Promise<any> {
    // Simulate player database lookup with fuzzy matching
    const players = [
      { id: "1", name: "Christian McCaffrey", projectedPoints: 18.4 },
      { id: "2", name: "Justin Jefferson", projectedPoints: 16.2 },
      { id: "3", name: "Josh Allen", projectedPoints: 22.1 },
      { id: "4", name: "Travis Kelce", projectedPoints: 12.8 }
    ];

    return players.find(player => 
      player.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(player.name.toLowerCase())
    );
  }

  /**
   * Get available voice commands
   */
  getAvailableCommands(): string[] {
    return [
      "Hey Fantasy, start [player name] this week",
      "Hey Fantasy, bench [player name]", 
      "Hey Fantasy, optimize my lineup",
      "Hey Fantasy, show my team",
      "Hey Fantasy, how is [player name] doing",
      "Hey Fantasy, who should I start at quarterback",
      "Hey Fantasy, bet [amount] dollars on [player name]",
      "Hey Fantasy, injury report",
      "Hey Fantasy, who has the best matchup",
      "Hey Fantasy, waiver wire suggestions"
    ];
  }

  /**
   * Enable/disable continuous listening
   */
  toggleContinuousMode(enabled: boolean) {
    if (this.recognition) {
      this.recognition.continuous = enabled;
    }
  }

  /**
   * Extract entities from AI-generated action data
   */
  private extractEntitiesFromAI(actionData: any, transcript: string): VoiceCommand["entities"] {
    const entities: VoiceCommand["entities"] = {};

    // Extract player names from action data
    if (actionData.playerId || actionData.player) {
      entities.players = [actionData.player || actionData.playerId];
    }

    // Extract position information
    if (actionData.position) {
      entities.positions = [actionData.position];
    }

    // Extract numbers (amounts, weeks, etc.)
    if (actionData.amount) {
      entities.numbers = [actionData.amount];
    }

    // Extract timeframe from action data or transcript
    if (actionData.timeframe) {
      entities.timeframe = actionData.timeframe;
    } else {
      // Try to extract from transcript
      const timeMatches = transcript.match(/this week|next week|week \d+/i);
      if (timeMatches) {
        entities.timeframe = timeMatches[0];
      }
    }

    // Extract team information
    if (actionData.team) {
      entities.teams = [actionData.team];
    }

    return entities;
  }
}

export const fantasyVoiceAssistant = new FantasyVoiceAssistant();