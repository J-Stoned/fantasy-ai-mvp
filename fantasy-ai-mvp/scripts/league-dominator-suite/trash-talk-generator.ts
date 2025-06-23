#!/usr/bin/env tsx

/**
 * 🔥 TRASH TALK GENERATOR - LEAGUE DOMINATOR SUITE
 * 
 * AI-powered psychological warfare:
 * - Context-aware burns based on matchups
 * - Victory lap messages after wins
 * - Pre-game intimidation
 * - Comeback replies to other trash talk
 * - Voice messages with multiple personalities
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { SequentialThinkingIntegration } from '../sequential-thinking-mcp-integration';
import { ElevenLabsVoiceAI } from '../elevenlabs-voice-integration';
import { KnowledgeGraphIntegration } from '../knowledge-graph-mcp-integration';

dotenv.config();

const prisma = new PrismaClient();

interface MatchupContext {
  myTeam: string;
  opponentTeam: string;
  myRecord: string;
  opponentRecord: string;
  myScore?: number;
  opponentScore?: number;
  keyPlayers: {
    mine: string[];
    theirs: string[];
  };
  recentHistory?: string[];
}

interface TrashTalkMessage {
  type: 'PRE_GAME' | 'DURING_GAME' | 'POST_WIN' | 'POST_LOSS' | 'COMEBACK';
  message: string;
  savageLevel: number; // 1-10
  voiceDelivery?: 'cocky' | 'sarcastic' | 'dramatic' | 'casual';
  emoji?: string;
  gifUrl?: string;
}

class TrashTalkGenerator {
  private sequentialThinking = new SequentialThinkingIntegration();
  private voiceAI = new ElevenLabsVoiceAI();
  private knowledgeGraph = new KnowledgeGraphIntegration();
  
  private messageHistory: Map<string, TrashTalkMessage[]> = new Map();
  private comebackTemplates: Map<string, string[]> = new Map();
  
  async initialize() {
    console.log('🔥 TRASH TALK GENERATOR INITIALIZING...');
    console.log('=====================================\n');
    
    this.loadComebackTemplates();
    
    console.log('✅ Burn database loaded');
    console.log('✅ Savage mode calibrated');
    console.log('✅ Voice personalities ready');
    console.log('✅ GIF library connected\n');
  }
  
  private loadComebackTemplates() {
    // Load savage comebacks
    this.comebackTemplates.set('LOSING', [
      "Even my bench could beat your starters",
      "Your team has more red flags than a NASCAR race",
      "I've seen better lineups in a police station"
    ]);
    
    this.comebackTemplates.set('INJURY', [
      "Your IR list is longer than a CVS receipt",
      "Starting a player on IR? Bold strategy Cotton",
      "Half your team is practicing social distancing from the field"
    ]);
    
    this.comebackTemplates.set('GENERAL', [
      "Your fantasy skills are like your team name - questionable at best",
      "Even auto-draft would have done better",
      "You manage your team like I manage my diet - poorly and with regret"
    ]);
  }
  
  async generatePreGameTrashTalk(context: MatchupContext): Promise<TrashTalkMessage[]> {
    console.log('🎯 GENERATING PRE-GAME TRASH TALK...\n');
    console.log(`${context.myTeam} (${context.myRecord}) vs ${context.opponentTeam} (${context.opponentRecord})\n`);
    
    const messages: TrashTalkMessage[] = [];
    
    // Analyze matchup for material
    const analysis = await this.analyzeMatchupForBurns(context);
    
    // Generate based on different angles
    if (this.hasWorseRecord(context)) {
      messages.push(this.generateUnderdogTalk(context, analysis));
    } else {
      messages.push(this.generateDominantTalk(context, analysis));
    }
    
    // Player-specific burn
    if (analysis.weakestPlayer) {
      messages.push(this.generatePlayerBurn(analysis.weakestPlayer, context));
    }
    
    // Historical burn if applicable
    if (context.recentHistory && context.recentHistory.length > 0) {
      messages.push(this.generateHistoricalBurn(context));
    }
    
    return messages;
  }
  
  private async analyzeMatchupForBurns(context: MatchupContext) {
    // Simulate analysis (would use real data)
    return {
      projectedDifference: Math.random() * 40 - 20,
      weakestPlayer: context.keyPlayers.theirs[Math.floor(Math.random() * context.keyPlayers.theirs.length)],
      strengthComparison: {
        QB: Math.random() > 0.5 ? 'advantage' : 'disadvantage',
        RB: Math.random() > 0.5 ? 'advantage' : 'disadvantage',
        WR: Math.random() > 0.5 ? 'advantage' : 'disadvantage'
      },
      recentForm: {
        mine: Math.random() * 10,
        theirs: Math.random() * 10
      }
    };
  }
  
  private hasWorseRecord(context: MatchupContext): boolean {
    const myWins = parseInt(context.myRecord.split('-')[0]);
    const theirWins = parseInt(context.opponentRecord.split('-')[0]);
    return myWins < theirWins;
  }
  
  private generateUnderdogTalk(context: MatchupContext, analysis: any): TrashTalkMessage {
    const messages = [
      `Records don't matter when your lineup looks like it was picked by a toddler with a crayon`,
      `${context.opponentTeam} about to learn that past performance doesn't guarantee future results`,
      `Hope you enjoyed being above .500 because that ends today`,
      `Your ${context.opponentRecord} record is as inflated as your ego`
    ];
    
    return {
      type: 'PRE_GAME',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 7,
      voiceDelivery: 'cocky',
      emoji: '😏'
    };
  }
  
  private generateDominantTalk(context: MatchupContext, analysis: any): TrashTalkMessage {
    const messages = [
      `Another week, another victim. ${context.opponentTeam} ready to join the list?`,
      `I'd say good luck, but we both know luck can't save that roster`,
      `${context.myRecord} and counting. Your contribution to my win column is appreciated`,
      `This matchup is like bringing a knife to a gunfight, except you forgot the knife`
    ];
    
    return {
      type: 'PRE_GAME',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 8,
      voiceDelivery: 'sarcastic',
      emoji: '👑'
    };
  }
  
  private generatePlayerBurn(playerName: string, context: MatchupContext): TrashTalkMessage {
    const burns = [
      `Starting ${playerName}? I also make poor life choices sometimes`,
      `${playerName} in your lineup? That's a bold strategy for someone trying to win`,
      `I see ${playerName} is starting. Did all your good players get raptured?`,
      `${playerName}? My grandma has more fantasy points and she doesn't even play football`
    ];
    
    return {
      type: 'PRE_GAME',
      message: burns[Math.floor(Math.random() * burns.length)],
      savageLevel: 6,
      voiceDelivery: 'casual',
      emoji: '🤔'
    };
  }
  
  private generateHistoricalBurn(context: MatchupContext): TrashTalkMessage {
    const lastResult = context.recentHistory![0];
    const burns = [
      `Remember last time? History has a funny way of repeating itself`,
      `${lastResult}. Just a preview of what's coming`,
      `Our last matchup was ${lastResult}. This time I promise to be gentle... NOT`,
      `Déjà vu incoming: another beating courtesy of ${context.myTeam}`
    ];
    
    return {
      type: 'PRE_GAME',
      message: burns[Math.floor(Math.random() * burns.length)],
      savageLevel: 7,
      voiceDelivery: 'dramatic',
      emoji: '📚'
    };
  }
  
  async generateLiveGameTalk(context: MatchupContext): Promise<TrashTalkMessage> {
    console.log(`\n🏈 LIVE GAME TRASH TALK (${context.myScore} - ${context.opponentScore})\n`);
    
    const scoreDiff = (context.myScore || 0) - (context.opponentScore || 0);
    
    if (scoreDiff > 20) {
      return this.generateBlowoutTalk(context, scoreDiff);
    } else if (scoreDiff > 0) {
      return this.generateLeadingTalk(context, scoreDiff);
    } else if (scoreDiff < -20) {
      return this.generateLosingBadlyTalk(context, scoreDiff);
    } else {
      return this.generateCloseTalk(context, scoreDiff);
    }
  }
  
  private generateBlowoutTalk(context: MatchupContext, diff: number): TrashTalkMessage {
    const messages = [
      `${diff} point lead. Should I bench my players to make it fair?`,
      `This is embarrassing... for you`,
      `Google "mercy rule fantasy football" - asking for a friend`,
      `I'm winning by ${diff}. That's not a score, that's a statement`
    ];
    
    return {
      type: 'DURING_GAME',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 9,
      voiceDelivery: 'cocky',
      emoji: '💀',
      gifUrl: 'https://media.giphy.com/media/xT1XGESDlxj0GwoDRe/giphy.gif'
    };
  }
  
  private generateLeadingTalk(context: MatchupContext, diff: number): TrashTalkMessage {
    const messages = [
      `Up by ${diff} and my bench hasn't even played yet`,
      `This lead is like your playoff hopes - slipping away`,
      `${context.opponentTeam} putting up a fight... and losing`,
      `Leading by ${diff}. It's not much, but neither is your team`
    ];
    
    return {
      type: 'DURING_GAME',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 6,
      voiceDelivery: 'sarcastic',
      emoji: '😎'
    };
  }
  
  private generateLosingBadlyTalk(context: MatchupContext, diff: number): TrashTalkMessage {
    const messages = [
      `Down by ${Math.abs(diff)}? Perfect, I play better as the underdog`,
      `Your early lead is like your confidence - temporary`,
      `Enjoying the view from up there? Don't get comfortable`,
      `${Math.abs(diff)} points? That's cute. Watch this comeback`
    ];
    
    return {
      type: 'DURING_GAME',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 5,
      voiceDelivery: 'dramatic',
      emoji: '🔥'
    };
  }
  
  private generateCloseTalk(context: MatchupContext, diff: number): TrashTalkMessage {
    const messages = [
      `Neck and neck, just how I like it before I pull away`,
      `Close game. Too bad "almost winning" doesn't count`,
      `This is tighter than your grip on last place`,
      `Tied game? Not for long...`
    ];
    
    return {
      type: 'DURING_GAME',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 5,
      voiceDelivery: 'casual',
      emoji: '⚔️'
    };
  }
  
  async generatePostGameTalk(context: MatchupContext, won: boolean): Promise<TrashTalkMessage> {
    console.log(`\n${won ? '🏆' : '😤'} POST-GAME TRASH TALK\n`);
    
    if (won) {
      return this.generateVictoryLap(context);
    } else {
      return this.generateGracefulLoss(context);
    }
  }
  
  private generateVictoryLap(context: MatchupContext): TrashTalkMessage {
    const margin = (context.myScore || 0) - (context.opponentScore || 0);
    const messages = [
      `GG EZ. ${context.opponentTeam} added to the body count`,
      `Another week, another W. Thanks for the confidence boost`,
      `Beat you by ${margin}. Frame this scorecard, it's art`,
      `${context.myTeam} ${context.myScore}, ${context.opponentTeam} ${context.opponentScore}. You love to see it`,
      `That's what we call a "teaching moment"`,
      `Don't worry, losing builds character. You must have LOTS of character by now`
    ];
    
    return {
      type: 'POST_WIN',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 8,
      voiceDelivery: 'cocky',
      emoji: '🎉',
      gifUrl: 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif'
    };
  }
  
  private generateGracefulLoss(context: MatchupContext): TrashTalkMessage {
    // Even in defeat, maintain swagger
    const messages = [
      `You won the battle, but the war continues`,
      `Congrats on your Super Bowl. Too bad it's only Week ${Math.floor(Math.random() * 14) + 1}`,
      `Even the 2007 Patriots lost a game`,
      `Enjoy it while it lasts. Revenge is a dish best served in the playoffs`,
      `You peaked this week. It's all downhill from here`
    ];
    
    return {
      type: 'POST_LOSS',
      message: messages[Math.floor(Math.random() * messages.length)],
      savageLevel: 4,
      voiceDelivery: 'casual',
      emoji: '🤝'
    };
  }
  
  async generateComeback(incomingTrash: string): Promise<TrashTalkMessage> {
    console.log('\n🔄 GENERATING COMEBACK...\n');
    console.log(`Incoming: "${incomingTrash}"\n`);
    
    // Analyze the incoming trash talk
    const category = this.categorizeTrashTalk(incomingTrash);
    const comebacks = this.comebackTemplates.get(category) || this.comebackTemplates.get('GENERAL')!;
    
    // Add some dynamic comebacks
    const dynamicComebacks = [
      `"${incomingTrash}" - Is that your trash talk or your team's motto?`,
      `I've heard better trash talk from my Alexa`,
      `Did you get that from a fortune cookie? Because it's not fortunate for you`,
      `That burn was weaker than your flex position`
    ];
    
    const allComebacks = [...comebacks, ...dynamicComebacks];
    
    return {
      type: 'COMEBACK',
      message: allComebacks[Math.floor(Math.random() * allComebacks.length)],
      savageLevel: 7,
      voiceDelivery: 'sarcastic',
      emoji: '🔄'
    };
  }
  
  private categorizeTrashTalk(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('losing') || lower.includes('loss')) return 'LOSING';
    if (lower.includes('injury') || lower.includes('injured')) return 'INJURY';
    return 'GENERAL';
  }
  
  async deliverTrashTalk(message: TrashTalkMessage, sendVoice: boolean = false) {
    console.log('\n📢 DELIVERING TRASH TALK:');
    console.log('========================');
    console.log(`Type: ${message.type}`);
    console.log(`Message: "${message.message}"`);
    console.log(`Savage Level: ${'🔥'.repeat(message.savageLevel)}`);
    console.log(`Emoji: ${message.emoji}`);
    
    if (message.gifUrl) {
      console.log(`GIF: ${message.gifUrl}`);
    }
    
    // Send voice message if requested
    if (sendVoice && message.voiceDelivery) {
      console.log(`\n🎙️ Recording voice message (${message.voiceDelivery} style)...`);
      await this.voiceAI.textToSpeech(message.message, message.voiceDelivery);
      console.log('✅ Voice message sent!');
    }
    
    // Store in history
    const opponent = 'opponent'; // Would be actual opponent ID
    if (!this.messageHistory.has(opponent)) {
      this.messageHistory.set(opponent, []);
    }
    this.messageHistory.get(opponent)!.push(message);
  }
  
  async getTrashTalkHistory(opponent: string): Promise<TrashTalkMessage[]> {
    return this.messageHistory.get(opponent) || [];
  }
}

// Demo the Trash Talk Generator
async function demo() {
  console.log('🏆 LEAGUE DOMINATOR - TRASH TALK GENERATOR DEMO');
  console.log('==============================================\n');
  
  const generator = new TrashTalkGenerator();
  
  // Initialize
  await generator.initialize();
  
  // Sample matchup context
  const context: MatchupContext = {
    myTeam: 'Algorithm Assassins',
    opponentTeam: 'Manual Managers',
    myRecord: '8-2',
    opponentRecord: '5-5',
    keyPlayers: {
      mine: ['Patrick Mahomes', 'Christian McCaffrey', 'Tyreek Hill'],
      theirs: ['Dak Prescott', 'Joe Mixon', 'Mike Evans']
    },
    recentHistory: ['W 142-98', 'W 156-121']
  };
  
  // Pre-game trash talk
  console.log('=== PRE-GAME PHASE ===\n');
  const preGameTalk = await generator.generatePreGameTrashTalk(context);
  for (const message of preGameTalk) {
    await generator.deliverTrashTalk(message, false);
    console.log();
  }
  
  // Live game trash talk
  console.log('\n=== DURING GAME ===\n');
  context.myScore = 89;
  context.opponentScore = 67;
  const liveGameTalk = await generator.generateLiveGameTalk(context);
  await generator.deliverTrashTalk(liveGameTalk, false);
  
  // Post-game victory lap
  console.log('\n=== POST-GAME ===\n');
  context.myScore = 142;
  context.opponentScore = 118;
  const postGameTalk = await generator.generatePostGameTalk(context, true);
  await generator.deliverTrashTalk(postGameTalk, true);
  
  // Comeback example
  console.log('\n=== COMEBACK DEMO ===\n');
  const incomingTrash = "Your team is trash and you know it";
  const comeback = await generator.generateComeback(incomingTrash);
  await generator.deliverTrashTalk(comeback, false);
  
  console.log('\n\n📋 TRASH TALK GENERATOR FEATURES:');
  console.log('  ✅ Context-aware burns based on records & matchups');
  console.log('  ✅ Player-specific roasts');
  console.log('  ✅ Historical reference burns');
  console.log('  ✅ Live game situational trash talk');
  console.log('  ✅ Victory lap celebrations');
  console.log('  ✅ Savage comeback generator');
  console.log('  ✅ Voice messages with personality');
  console.log('  ✅ GIF integration for maximum impact');
  
  await prisma.$disconnect();
}

// Export for use in suite
export { TrashTalkGenerator };

// Run demo if called directly
if (require.main === module) {
  demo().catch(console.error);
}