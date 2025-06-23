import { VoiceCommand } from '../types';

interface VoiceCommandResult {
  action?: {
    type: string;
    params?: any;
  };
  response: string;
}

const VOICE_COMMANDS: VoiceCommand[] = [
  // Lineup commands
  {
    command: 'show my lineup',
    aliases: ['show lineup', 'my lineup', 'view lineup'],
    action: 'navigate.lineup',
    examples: ['Show my lineup', 'View my lineup for this week'],
  },
  {
    command: 'optimize lineup',
    aliases: ['optimize my lineup', 'auto set lineup', 'best lineup'],
    action: 'lineup.optimize',
    examples: ['Optimize my lineup', 'Set my best lineup'],
  },
  {
    command: 'bench player',
    aliases: ['sit player', 'remove player'],
    action: 'lineup.bench',
    examples: ['Bench Patrick Mahomes', 'Sit Cooper Kupp'],
  },
  {
    command: 'start player',
    aliases: ['play player', 'add player to lineup'],
    action: 'lineup.start',
    examples: ['Start Justin Jefferson', 'Play Travis Kelce'],
  },
  
  // Score commands
  {
    command: 'check scores',
    aliases: ['show scores', 'current scores', 'live scores'],
    action: 'navigate.scores',
    examples: ['Check scores', 'Show me the current scores'],
  },
  {
    command: 'my score',
    aliases: ['my matchup', 'how am i doing', 'am i winning'],
    action: 'scores.myMatchup',
    examples: ['What\'s my score?', 'Am I winning?'],
  },
  
  // Player commands
  {
    command: 'player stats',
    aliases: ['show player', 'player info', 'tell me about'],
    action: 'player.stats',
    examples: ['Show me Josh Allen stats', 'Tell me about Tyreek Hill'],
  },
  {
    command: 'player news',
    aliases: ['player updates', 'what\'s new with'],
    action: 'player.news',
    examples: ['Any news on CMC?', 'Player updates for Davante Adams'],
  },
  {
    command: 'add to watchlist',
    aliases: ['watch player', 'track player'],
    action: 'player.watch',
    examples: ['Add Breece Hall to watchlist', 'Watch CeeDee Lamb'],
  },
  
  // Trade commands
  {
    command: 'trade analyzer',
    aliases: ['analyze trade', 'should i trade', 'trade advice'],
    action: 'trade.analyze',
    examples: ['Should I trade Stefon Diggs for AJ Brown?'],
  },
  {
    command: 'propose trade',
    aliases: ['make trade', 'send trade'],
    action: 'trade.propose',
    examples: ['Propose trade: my Jefferson for their Kupp'],
  },
  
  // Waiver commands
  {
    command: 'waiver wire',
    aliases: ['free agents', 'available players', 'who should i add'],
    action: 'navigate.waivers',
    examples: ['Show waiver wire', 'Who should I add?'],
  },
  {
    command: 'add player',
    aliases: ['claim player', 'pick up player'],
    action: 'waiver.add',
    examples: ['Add Kenneth Walker', 'Pick up Bills defense'],
  },
  
  // League commands
  {
    command: 'league standings',
    aliases: ['standings', 'league rank', 'where am i'],
    action: 'league.standings',
    examples: ['Show standings', 'Where am I in the league?'],
  },
  {
    command: 'switch league',
    aliases: ['change league', 'other league'],
    action: 'league.switch',
    examples: ['Switch to my dynasty league', 'Change to work league'],
  },
  
  // General commands
  {
    command: 'help',
    aliases: ['what can you do', 'commands', 'options'],
    action: 'help',
    examples: ['Help', 'What can you do?'],
  },
  {
    command: 'cancel',
    aliases: ['stop', 'nevermind', 'close'],
    action: 'cancel',
    examples: ['Cancel', 'Nevermind'],
  },
];

export async function processVoiceCommand(transcript: string): Promise<VoiceCommandResult> {
  const normalizedTranscript = transcript.toLowerCase().trim();
  
  // Find matching command
  const matchedCommand = findMatchingCommand(normalizedTranscript);
  
  if (!matchedCommand) {
    return {
      response: "I didn't understand that command. Try saying 'help' to see what I can do.",
    };
  }
  
  // Process the command
  return await executeCommand(matchedCommand, normalizedTranscript);
}

function findMatchingCommand(transcript: string): VoiceCommand | null {
  // First, try exact matches
  for (const command of VOICE_COMMANDS) {
    if (transcript === command.command || command.aliases.includes(transcript)) {
      return command;
    }
  }
  
  // Then, try partial matches
  for (const command of VOICE_COMMANDS) {
    if (transcript.includes(command.command)) {
      return command;
    }
    
    for (const alias of command.aliases) {
      if (transcript.includes(alias)) {
        return command;
      }
    }
  }
  
  // Try fuzzy matching for common patterns
  if (transcript.includes('lineup') || transcript.includes('roster')) {
    return VOICE_COMMANDS.find(c => c.action === 'navigate.lineup') || null;
  }
  
  if (transcript.includes('score') || transcript.includes('winning') || transcript.includes('losing')) {
    return VOICE_COMMANDS.find(c => c.action === 'navigate.scores') || null;
  }
  
  if (transcript.includes('player') || transcript.includes('stats')) {
    return VOICE_COMMANDS.find(c => c.action === 'player.stats') || null;
  }
  
  return null;
}

async function executeCommand(command: VoiceCommand, transcript: string): Promise<VoiceCommandResult> {
  const [category, action] = command.action.split('.');
  
  switch (category) {
    case 'navigate':
      return handleNavigationCommand(action, transcript);
      
    case 'lineup':
      return handleLineupCommand(action, transcript);
      
    case 'player':
      return handlePlayerCommand(action, transcript);
      
    case 'scores':
      return handleScoresCommand(action, transcript);
      
    case 'trade':
      return handleTradeCommand(action, transcript);
      
    case 'waiver':
      return handleWaiverCommand(action, transcript);
      
    case 'league':
      return handleLeagueCommand(action, transcript);
      
    case 'help':
      return handleHelpCommand();
      
    case 'cancel':
      return { response: 'Cancelled' };
      
    default:
      return { response: 'Command not implemented yet' };
  }
}

async function handleNavigationCommand(action: string, transcript: string): Promise<VoiceCommandResult> {
  const screenMap: Record<string, string> = {
    lineup: 'Lineup',
    scores: 'Scores',
    players: 'Players',
    waivers: 'Players',
  };
  
  return {
    action: {
      type: 'navigate',
      params: { screen: screenMap[action] || 'Home' },
    },
    response: `Opening ${action}`,
  };
}

async function handleLineupCommand(action: string, transcript: string): Promise<VoiceCommandResult> {
  switch (action) {
    case 'optimize':
      return {
        action: { type: 'lineup.optimize' },
        response: 'Optimizing your lineup for maximum points',
      };
      
    case 'bench':
      const benchPlayer = extractPlayerName(transcript);
      if (benchPlayer) {
        return {
          action: {
            type: 'lineup.bench',
            params: { playerName: benchPlayer },
          },
          response: `Moving ${benchPlayer} to the bench`,
        };
      }
      return { response: 'Which player would you like to bench?' };
      
    case 'start':
      const startPlayer = extractPlayerName(transcript);
      if (startPlayer) {
        return {
          action: {
            type: 'lineup.start',
            params: { playerName: startPlayer },
          },
          response: `Adding ${startPlayer} to your starting lineup`,
        };
      }
      return { response: 'Which player would you like to start?' };
      
    default:
      return { response: 'Lineup command not recognized' };
  }
}

async function handlePlayerCommand(action: string, transcript: string): Promise<VoiceCommandResult> {
  const playerName = extractPlayerName(transcript);
  
  if (!playerName) {
    return { response: 'Which player would you like to know about?' };
  }
  
  switch (action) {
    case 'stats':
      return {
        action: {
          type: 'player.view',
          params: { playerName },
        },
        response: `Getting stats for ${playerName}`,
      };
      
    case 'news':
      return {
        action: {
          type: 'player.news',
          params: { playerName },
        },
        response: `Checking latest news for ${playerName}`,
      };
      
    case 'watch':
      return {
        action: {
          type: 'player.watchlist.add',
          params: { playerName },
        },
        response: `Adding ${playerName} to your watchlist`,
      };
      
    default:
      return { response: 'Player command not recognized' };
  }
}

async function handleScoresCommand(action: string, transcript: string): Promise<VoiceCommandResult> {
  switch (action) {
    case 'myMatchup':
      return {
        action: { type: 'scores.myMatchup' },
        response: 'Checking your current matchup',
      };
      
    default:
      return {
        action: { type: 'navigate', params: { screen: 'Scores' } },
        response: 'Opening live scores',
      };
  }
}

async function handleTradeCommand(action: string, transcript: string): Promise<VoiceCommandResult> {
  switch (action) {
    case 'analyze':
      const players = extractTradePlayers(transcript);
      if (players) {
        return {
          action: {
            type: 'trade.analyze',
            params: players,
          },
          response: `Analyzing trade: ${players.give} for ${players.receive}`,
        };
      }
      return { response: 'Please specify which players you want to trade' };
      
    case 'propose':
      return {
        action: { type: 'trade.propose' },
        response: 'Opening trade proposal screen',
      };
      
    default:
      return { response: 'Trade command not recognized' };
  }
}

async function handleWaiverCommand(action: string, transcript: string): Promise<VoiceCommandResult> {
  switch (action) {
    case 'add':
      const playerName = extractPlayerName(transcript);
      if (playerName) {
        return {
          action: {
            type: 'waiver.add',
            params: { playerName },
          },
          response: `Adding ${playerName} to your waiver claims`,
        };
      }
      return { response: 'Which player would you like to add?' };
      
    default:
      return {
        action: { type: 'navigate', params: { screen: 'Players' } },
        response: 'Opening waiver wire',
      };
  }
}

async function handleLeagueCommand(action: string, transcript: string): Promise<VoiceCommandResult> {
  switch (action) {
    case 'standings':
      return {
        action: { type: 'league.standings' },
        response: 'Here are your league standings',
      };
      
    case 'switch':
      const leagueName = extractLeagueName(transcript);
      if (leagueName) {
        return {
          action: {
            type: 'league.switch',
            params: { leagueName },
          },
          response: `Switching to ${leagueName}`,
        };
      }
      return { response: 'Which league would you like to switch to?' };
      
    default:
      return { response: 'League command not recognized' };
  }
}

function handleHelpCommand(): VoiceCommandResult {
  const examples = [
    'Show my lineup',
    'Optimize my lineup',
    'Check scores',
    'Show player stats',
    'Add player to watchlist',
    'Analyze trade',
    'Show standings',
  ];
  
  return {
    response: `I can help you with: ${examples.join(', ')}. What would you like to do?`,
  };
}

// Helper functions
function extractPlayerName(transcript: string): string | null {
  // Remove command words
  const commandWords = [
    'show', 'tell', 'about', 'stats', 'for', 'player', 'me', 'the',
    'bench', 'sit', 'start', 'play', 'add', 'to', 'watchlist', 'watch',
    'pick', 'up', 'claim', 'drop', 'news', 'on', 'updates',
  ];
  
  let cleaned = transcript.toLowerCase();
  commandWords.forEach(word => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  });
  
  cleaned = cleaned.trim();
  
  if (cleaned.length > 2) {
    // Capitalize first letter of each word
    return cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return null;
}

function extractTradePlayers(transcript: string): { give: string; receive: string } | null {
  // Look for patterns like "trade X for Y" or "my X for their Y"
  const patterns = [
    /trade\s+(.+?)\s+for\s+(.+)/i,
    /my\s+(.+?)\s+for\s+(?:their\s+)?(.+)/i,
    /give\s+(.+?)\s+(?:and\s+)?get\s+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match) {
      return {
        give: match[1].trim(),
        receive: match[2].trim(),
      };
    }
  }
  
  return null;
}

function extractLeagueName(transcript: string): string | null {
  // Look for league name patterns
  const patterns = [
    /switch to\s+(.+?)(?:\s+league)?$/i,
    /change to\s+(.+?)(?:\s+league)?$/i,
    /my\s+(.+?)\s+league/i,
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}