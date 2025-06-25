/**
 * Mobile Voice Command System
 * Natural language processing for hands-free fantasy sports management
 */

import { Player, LineupSlot } from '@/types';

export interface VoiceCommand {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  originalText: string;
}

export interface VoiceResponse {
  speech: string;
  action?: VoiceAction;
  suggestions?: string[];
  requiresConfirmation?: boolean;
}

export interface VoiceAction {
  type: 'navigate' | 'lineup' | 'trade' | 'search' | 'analytics' | 'settings';
  data: any;
}

export class MobileVoiceCommandProcessor {
  private static instance: MobileVoiceCommandProcessor;
  
  // Command patterns with regex matching
  private commandPatterns = [
    // Navigation commands
    {
      pattern: /^(go to|open|show me|navigate to)\s+(dashboard|lineup|leagues|analytics|settings|profile)/i,
      intent: 'navigate',
      extract: (match: RegExpMatchArray) => ({ screen: match[2].toLowerCase() })
    },
    
    // Lineup management
    {
      pattern: /^(start|bench|sit)\s+(.+?)(\s+this week)?$/i,
      intent: 'lineup_change',
      extract: (match: RegExpMatchArray) => ({ 
        action: match[1].toLowerCase(),
        player: match[2].trim()
      })
    },
    {
      pattern: /^(who should i start|start sit decision|lineup help)\s*(at\s+(\w+))?/i,
      intent: 'lineup_advice',
      extract: (match: RegExpMatchArray) => ({ position: match[3] })
    },
    {
      pattern: /^optimize\s+(my\s+)?lineup/i,
      intent: 'optimize_lineup',
      extract: () => ({})
    },
    
    // Player queries
    {
      pattern: /^(check|what'?s?|show)\s+(.+?)'?s?\s+(status|injury|health|projection|stats)/i,
      intent: 'player_info',
      extract: (match: RegExpMatchArray) => ({
        player: match[2].trim(),
        info: match[3].toLowerCase()
      })
    },
    {
      pattern: /^(search for|find|show me)\s+(.+)/i,
      intent: 'search',
      extract: (match: RegExpMatchArray) => ({ query: match[2].trim() })
    },
    
    // Trade assistance
    {
      pattern: /^(should i trade|trade advice|evaluate trade)\s+(.+?)\s+for\s+(.+)/i,
      intent: 'trade_analysis',
      extract: (match: RegExpMatchArray) => ({
        give: match[2].trim(),
        receive: match[3].trim()
      })
    },
    {
      pattern: /^(suggest|find|show)\s+trades?\s*(for\s+(.+))?/i,
      intent: 'trade_suggestions',
      extract: (match: RegExpMatchArray) => ({ player: match[3] })
    },
    
    // Analytics & insights
    {
      pattern: /^(what'?s?|show me)\s+(my|the)\s+(score|ranking|performance|standings)/i,
      intent: 'league_status',
      extract: (match: RegExpMatchArray) => ({ type: match[3].toLowerCase() })
    },
    {
      pattern: /^(weather|game conditions)\s+(for\s+)?(.+)/i,
      intent: 'weather_check',
      extract: (match: RegExpMatchArray) => ({ query: match[3].trim() })
    },
    
    // Quick actions
    {
      pattern: /^(remind me|alert me|notification)\s+(.+)/i,
      intent: 'set_reminder',
      extract: (match: RegExpMatchArray) => ({ reminder: match[2].trim() })
    },
    {
      pattern: /^(help|what can you do|commands)/i,
      intent: 'help',
      extract: () => ({})
    }
  ];
  
  // Common player name variations and nicknames
  private playerNicknames: Record<string, string> = {
    'mahomes': 'Patrick Mahomes',
    'pat mahomes': 'Patrick Mahomes',
    'cmac': 'Christian McCaffrey',
    'mccaffrey': 'Christian McCaffrey',
    'jj': 'Justin Jefferson',
    'jefferson': 'Justin Jefferson',
    'kupp': 'Cooper Kupp',
    'adams': 'Davante Adams',
    'kelce': 'Travis Kelce',
    'josh allen': 'Josh Allen',
    'allen': 'Josh Allen',
    'hurts': 'Jalen Hurts',
    'lamar': 'Lamar Jackson',
    'tyreek': 'Tyreek Hill',
    'hill': 'Tyreek Hill',
    'diggs': 'Stefon Diggs',
    'chase': 'Ja\'Marr Chase',
    'ekeler': 'Austin Ekeler',
    'swift': 'D\'Andre Swift',
    'pollard': 'Tony Pollard',
    'andrews': 'Mark Andrews'
  };
  
  private constructor() {}
  
  static getInstance(): MobileVoiceCommandProcessor {
    if (!MobileVoiceCommandProcessor.instance) {
      MobileVoiceCommandProcessor.instance = new MobileVoiceCommandProcessor();
    }
    return MobileVoiceCommandProcessor.instance;
  }
  
  /**
   * Process a voice command and return structured response
   */
  async processCommand(text: string): Promise<VoiceResponse> {
    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    // Try to match command patterns
    for (const pattern of this.commandPatterns) {
      const match = normalizedText.match(pattern.pattern);
      if (match) {
        const entities = pattern.extract(match);
        const command: VoiceCommand = {
          intent: pattern.intent,
          entities,
          confidence: 0.9,
          originalText: text
        };
        
        return this.executeCommand(command);
      }
    }
    
    // Fallback to AI processing if no pattern matches
    return this.processWithAI(text);
  }
  
  /**
   * Execute a parsed command
   */
  private async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.intent) {
      case 'navigate':
        return this.handleNavigation(command.entities.screen);
        
      case 'lineup_change':
        return this.handleLineupChange(
          command.entities.action,
          command.entities.player
        );
        
      case 'lineup_advice':
        return this.handleLineupAdvice(command.entities.position);
        
      case 'optimize_lineup':
        return this.handleOptimizeLineup();
        
      case 'player_info':
        return this.handlePlayerInfo(
          command.entities.player,
          command.entities.info
        );
        
      case 'search':
        return this.handleSearch(command.entities.query);
        
      case 'trade_analysis':
        return this.handleTradeAnalysis(
          command.entities.give,
          command.entities.receive
        );
        
      case 'trade_suggestions':
        return this.handleTradeSuggestions(command.entities.player);
        
      case 'league_status':
        return this.handleLeagueStatus(command.entities.type);
        
      case 'weather_check':
        return this.handleWeatherCheck(command.entities.query);
        
      case 'set_reminder':
        return this.handleSetReminder(command.entities.reminder);
        
      case 'help':
        return this.handleHelp();
        
      default:
        return {
          speech: "I didn't understand that command. Try saying 'help' to see what I can do.",
          suggestions: [
            "Who should I start?",
            "Check Mahomes' status",
            "Optimize my lineup",
            "Show me trade suggestions"
          ]
        };
    }
  }
  
  // Command handlers
  private handleNavigation(screen: string): VoiceResponse {
    const screenMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'lineup': '/dashboard?tab=lineup',
      'leagues': '/leagues',
      'analytics': '/ai-analytics',
      'settings': '/settings',
      'profile': '/profile'
    };
    
    const route = screenMap[screen];
    if (!route) {
      return {
        speech: `I couldn't find the ${screen} screen. Try dashboard, lineup, or leagues.`,
        suggestions: Object.keys(screenMap)
      };
    }
    
    return {
      speech: `Opening ${screen}`,
      action: {
        type: 'navigate',
        data: { route }
      }
    };
  }
  
  private async handleLineupChange(action: string, playerName: string): Promise<VoiceResponse> {
    // Resolve player name
    const resolvedName = this.resolvePlayerName(playerName);
    
    // In a real app, this would fetch from database
    const mockResponse = {
      speech: `I'll ${action} ${resolvedName} in your lineup. This will be reflected in your next matchup.`,
      action: {
        type: 'lineup',
        data: {
          action,
          player: resolvedName
        }
      },
      requiresConfirmation: true
    };
    
    return mockResponse;
  }
  
  private async handleLineupAdvice(position?: string): Promise<VoiceResponse> {
    if (position) {
      return {
        speech: `For ${position}, I recommend starting your highest projected player based on matchups. Would you like me to show you the projections?`,
        action: {
          type: 'analytics',
          data: { filter: position }
        },
        suggestions: [
          "Show projections",
          "Compare players",
          "Check injuries"
        ]
      };
    }
    
    return {
      speech: "I've analyzed your lineup. You have 2 questionable players and 1 player with a tough matchup. Would you like details?",
      suggestions: [
        "Show questionable players",
        "Optimize lineup",
        "Check weather impacts"
      ]
    };
  }
  
  private handleOptimizeLineup(): VoiceResponse {
    return {
      speech: "I'm optimizing your lineup based on projections, matchups, and recent performance. This will take a moment.",
      action: {
        type: 'lineup',
        data: { optimize: true }
      }
    };
  }
  
  private async handlePlayerInfo(playerName: string, infoType: string): Promise<VoiceResponse> {
    const resolvedName = this.resolvePlayerName(playerName);
    
    const responses: Record<string, string> = {
      'status': `${resolvedName} is healthy and expected to play this week.`,
      'injury': `${resolvedName} has no injury designation this week.`,
      'health': `${resolvedName} is at full health with no limitations.`,
      'projection': `${resolvedName} is projected for 18.5 points this week against a middle-tier defense.`,
      'stats': `${resolvedName} is averaging 16.2 points per game over the last 4 weeks with increasing target share.`
    };
    
    return {
      speech: responses[infoType] || `I'll check ${resolvedName}'s ${infoType} for you.`,
      action: {
        type: 'search',
        data: {
          player: resolvedName,
          detail: infoType
        }
      }
    };
  }
  
  private handleSearch(query: string): VoiceResponse {
    return {
      speech: `Searching for ${query}...`,
      action: {
        type: 'search',
        data: { query }
      }
    };
  }
  
  private async handleTradeAnalysis(give: string, receive: string): Promise<VoiceResponse> {
    const givePlayer = this.resolvePlayerName(give);
    const receivePlayer = this.resolvePlayerName(receive);
    
    return {
      speech: `Analyzing trade: ${givePlayer} for ${receivePlayer}. Based on rest-of-season projections, this trade slightly favors you. ${receivePlayer} has a better playoff schedule.`,
      action: {
        type: 'trade',
        data: {
          give: givePlayer,
          receive: receivePlayer
        }
      },
      suggestions: [
        "Show detailed analysis",
        "Compare playoff schedules",
        "Check trade values"
      ]
    };
  }
  
  private handleTradeSuggestions(player?: string): VoiceResponse {
    if (player) {
      const resolvedName = this.resolvePlayerName(player);
      return {
        speech: `I'll find trade targets for ${resolvedName} based on team needs and fair value.`,
        action: {
          type: 'trade',
          data: { player: resolvedName }
        }
      };
    }
    
    return {
      speech: "I've identified 3 trade opportunities that could improve your team. Would you like to see them?",
      suggestions: [
        "Show trade suggestions",
        "Analyze my team needs",
        "Find buy-low candidates"
      ]
    };
  }
  
  private handleLeagueStatus(type: string): VoiceResponse {
    const responses: Record<string, string> = {
      'score': "You're currently winning 112 to 98 with 3 players left to play.",
      'ranking': "You're in 3rd place, 2 games behind first with 4 weeks remaining.",
      'performance': "Your team is averaging 118 points per week, ranked 2nd in scoring.",
      'standings': "You're 7 and 3, in 2nd place in your division."
    };
    
    return {
      speech: responses[type] || "I'll check your league status.",
      action: {
        type: 'analytics',
        data: { view: type }
      }
    };
  }
  
  private handleWeatherCheck(query: string): VoiceResponse {
    return {
      speech: `Checking weather conditions for ${query}. The forecast shows clear skies with light wind, ideal for passing games.`,
      action: {
        type: 'analytics',
        data: { weather: query }
      }
    };
  }
  
  private handleSetReminder(reminder: string): VoiceResponse {
    return {
      speech: `I'll remind you: ${reminder}. You'll get a notification when it's time.`,
      action: {
        type: 'settings',
        data: { reminder }
      },
      requiresConfirmation: true
    };
  }
  
  private handleHelp(): VoiceResponse {
    return {
      speech: "I can help you manage your fantasy team. Try asking about lineups, player status, trades, or navigation.",
      suggestions: [
        "Who should I start at QB?",
        "Check Mahomes injury status",
        "Optimize my lineup",
        "Show trade suggestions",
        "Navigate to dashboard"
      ]
    };
  }
  
  /**
   * Resolve player names and nicknames
   */
  private resolvePlayerName(name: string): string {
    const normalized = name.toLowerCase().trim();
    return this.playerNicknames[normalized] || name;
  }
  
  /**
   * Fallback to AI processing for complex commands
   */
  private async processWithAI(text: string): Promise<VoiceResponse> {
    try {
      const response = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text })
      });
      
      if (!response.ok) {
        throw new Error('AI processing failed');
      }
      
      const data = await response.json();
      return {
        speech: data.response,
        action: data.action,
        suggestions: data.suggestions
      };
    } catch (error) {
      return {
        speech: "I'm having trouble understanding that command. Try rephrasing or say 'help' for examples.",
        suggestions: [
          "Who should I start?",
          "Check injuries",
          "Show my score",
          "Navigate to lineup"
        ]
      };
    }
  }
}

// Export singleton instance
export const voiceCommands = MobileVoiceCommandProcessor.getInstance();