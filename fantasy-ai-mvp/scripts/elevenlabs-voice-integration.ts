#!/usr/bin/env tsx

/**
 * 🎙️ ELEVENLABS VOICE AI INTEGRATION
 * 
 * Revolutionary voice features for Fantasy.AI:
 * - Natural text-to-speech for lineup recommendations
 * - Voice alerts for injuries and breaking news
 * - Personalized fantasy assistant voices
 * - Real-time audio notifications
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_DIR = path.join(__dirname, '../data/ultimate-free/voice');

// Ensure directory exists
if (!fs.existsSync(VOICE_DIR)) {
  fs.mkdirSync(VOICE_DIR, { recursive: true });
}

// ElevenLabs voices
const VOICES = {
  // Free tier voices
  RACHEL: '21m00Tcm4TlvDq8ikWAM', // American female
  JOSH: 'TxGEqnHWrfWFTfGW9XjX',   // American male
  ADAM: 'pNInz6obpgDQGcFmaJgB',   // Deep American male
  BELLA: 'EXAVITQu4vr4xnSDxMaL',  // Young female
  
  // Voice styles
  SPORTS_ANNOUNCER: 'Josh',
  FANTASY_ASSISTANT: 'Rachel',
  BREAKING_NEWS: 'Adam',
  CASUAL_ADVISOR: 'Bella'
};

// Voice messages for different scenarios
const VOICE_SCRIPTS = {
  LINEUP_READY: "Your optimal lineup is ready! Starting {quarterback} at QB, with {runningback1} and {runningback2} at running back. Your wide receivers are {wr1}, {wr2}, and {wr3}. Total projected points: {points}. Good luck!",
  
  INJURY_ALERT: "Breaking injury news! {player} is now listed as {status} with a {injury}. Consider updating your lineup immediately.",
  
  TRADE_ALERT: "Trade alert! You've been offered {receivingPlayer} for {givingPlayer}. Based on my analysis, this trade would {recommendation} your championship chances.",
  
  GAME_START: "Game time! {team1} versus {team2} is about to kick off. {player} is active and ready to play. Current weather: {weather}.",
  
  SCORE_UPDATE: "{player} just scored a {scoringPlay}! That's {points} fantasy points. Your team is now projected to score {totalPoints} this week.",
  
  WEEKLY_SUMMARY: "Week {week} recap: Your team scored {points} points, finishing {place} in your league. Top performer was {topPlayer} with {topPoints} points. Let's analyze what worked and plan for next week.",
  
  WAIVER_SUGGESTION: "Waiver wire alert! {player} is available and projected to be a top {position} this week. They have a great matchup against {opponent}. Priority add!",
  
  BREAKING_NEWS: "Breaking fantasy news! {headline}. This could significantly impact {affectedPlayers}. I'll monitor the situation and update you."
};

class ElevenLabsVoiceAI {
  private apiKey: string;
  private enabled: boolean;
  
  constructor() {
    this.apiKey = ELEVENLABS_API_KEY || '';
    this.enabled = !!this.apiKey && this.apiKey !== 'YOUR_ELEVENLABS_KEY_HERE';
    
    if (!this.enabled) {
      console.log('⚠️ ElevenLabs API key not configured. Voice features disabled.');
      console.log('🔑 Get your FREE key at: https://elevenlabs.io/');
    }
  }
  
  // Convert text to speech
  async textToSpeech(text: string, voiceId: string = VOICES.RACHEL): Promise<Buffer | null> {
    if (!this.enabled) return null;
    
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
      
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return audioBuffer;
      
    } catch (error) {
      console.error('❌ Text-to-speech error:', error);
      return null;
    }
  }
  
  // Generate lineup announcement
  async announceLineup(lineup: {
    quarterback: string;
    runningback1: string;
    runningback2: string;
    wr1: string;
    wr2: string;
    wr3: string;
    points: number;
  }): Promise<string | null> {
    const script = VOICE_SCRIPTS.LINEUP_READY
      .replace('{quarterback}', lineup.quarterback)
      .replace('{runningback1}', lineup.runningback1)
      .replace('{runningback2}', lineup.runningback2)
      .replace('{wr1}', lineup.wr1)
      .replace('{wr2}', lineup.wr2)
      .replace('{wr3}', lineup.wr3)
      .replace('{points}', lineup.points.toString());
    
    console.log('🎙️ Generating lineup announcement...');
    const audio = await this.textToSpeech(script, VOICES.JOSH);
    
    if (audio) {
      const filename = `lineup_${Date.now()}.mp3`;
      const filepath = path.join(VOICE_DIR, filename);
      fs.writeFileSync(filepath, audio);
      console.log(`✅ Audio saved: ${filename}`);
      return filepath;
    }
    
    return null;
  }
  
  // Injury alert with urgency
  async injuryAlert(player: string, status: string, injury: string): Promise<string | null> {
    const script = VOICE_SCRIPTS.INJURY_ALERT
      .replace('{player}', player)
      .replace('{status}', status)
      .replace('{injury}', injury);
    
    console.log('🚨 Generating injury alert...');
    const audio = await this.textToSpeech(script, VOICES.ADAM);
    
    if (audio) {
      const filename = `injury_alert_${Date.now()}.mp3`;
      const filepath = path.join(VOICE_DIR, filename);
      fs.writeFileSync(filepath, audio);
      console.log(`✅ Injury alert saved: ${filename}`);
      return filepath;
    }
    
    return null;
  }
  
  // Score update celebration
  async scoreUpdate(data: {
    player: string;
    scoringPlay: string;
    points: number;
    totalPoints: number;
  }): Promise<string | null> {
    const script = VOICE_SCRIPTS.SCORE_UPDATE
      .replace('{player}', data.player)
      .replace('{scoringPlay}', data.scoringPlay)
      .replace('{points}', data.points.toString())
      .replace('{totalPoints}', data.totalPoints.toString());
    
    console.log('🏈 Generating score update...');
    const audio = await this.textToSpeech(script, VOICES.JOSH);
    
    if (audio) {
      const filename = `score_${Date.now()}.mp3`;
      const filepath = path.join(VOICE_DIR, filename);
      fs.writeFileSync(filepath, audio);
      return filepath;
    }
    
    return null;
  }
  
  // Breaking news with authority
  async breakingNews(headline: string, affectedPlayers: string[]): Promise<string | null> {
    const script = VOICE_SCRIPTS.BREAKING_NEWS
      .replace('{headline}', headline)
      .replace('{affectedPlayers}', affectedPlayers.join(', '));
    
    console.log('📰 Generating breaking news announcement...');
    const audio = await this.textToSpeech(script, VOICES.ADAM);
    
    if (audio) {
      const filename = `breaking_news_${Date.now()}.mp3`;
      const filepath = path.join(VOICE_DIR, filename);
      fs.writeFileSync(filepath, audio);
      return filepath;
    }
    
    return null;
  }
  
  // Get available voices
  async getVoices(): Promise<any[]> {
    if (!this.enabled) return [];
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });
      
      const data = await response.json();
      return data.voices || [];
      
    } catch (error) {
      console.error('❌ Failed to fetch voices:', error);
      return [];
    }
  }
  
  // Check usage/quota
  async checkUsage(): Promise<any> {
    if (!this.enabled) return null;
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });
      
      const data = await response.json();
      return data.subscription || null;
      
    } catch (error) {
      console.error('❌ Failed to check usage:', error);
      return null;
    }
  }
}

// Demo the voice capabilities
async function demoVoiceFeatures() {
  console.log('🎙️ ELEVENLABS VOICE AI DEMO');
  console.log('============================\n');
  
  const voice = new ElevenLabsVoiceAI();
  
  // Check if configured
  if (!voice['enabled']) {
    console.log('\n📝 TO ENABLE VOICE FEATURES:');
    console.log('1. Go to https://elevenlabs.io/');
    console.log('2. Sign up for FREE account');
    console.log('3. Get your API key from Profile Settings');
    console.log('4. Add to .env.local: ELEVENLABS_API_KEY=your_key_here\n');
    return;
  }
  
  // Check available voices
  console.log('🎤 Fetching available voices...');
  const voices = await voice.getVoices();
  console.log(`✅ Found ${voices.length} voices available\n`);
  
  // Demo different voice scenarios
  console.log('🏈 DEMO SCENARIOS:\n');
  
  // 1. Lineup announcement
  await voice.announceLineup({
    quarterback: 'Patrick Mahomes',
    runningback1: 'Christian McCaffrey',
    runningback2: 'Austin Ekeler',
    wr1: 'Tyreek Hill',
    wr2: 'Justin Jefferson',
    wr3: "Ja'Marr Chase",
    points: 142.5
  });
  
  // 2. Injury alert
  await voice.injuryAlert(
    'Travis Kelce',
    'Questionable',
    'knee injury'
  );
  
  // 3. Score update
  await voice.scoreUpdate({
    player: 'Josh Allen',
    scoringPlay: 'rushing touchdown',
    points: 6,
    totalPoints: 118.3
  });
  
  // 4. Breaking news
  await voice.breakingNews(
    'Star running back traded to the Chiefs!',
    ['Derrick Henry', 'Chiefs offense']
  );
  
  // Check usage
  console.log('\n📊 Checking API usage...');
  const usage = await voice.checkUsage();
  if (usage) {
    console.log(`Characters used: ${usage.character_count} / ${usage.character_limit}`);
    console.log(`Remaining: ${usage.character_limit - usage.character_count} characters`);
  }
  
  console.log(`\n✅ Voice files saved to: ${VOICE_DIR}`);
  console.log('\n🎯 VOICE AI CAPABILITIES:');
  console.log('• Natural lineup announcements');
  console.log('• Urgent injury alerts');
  console.log('• Exciting score updates');
  console.log('• Breaking news broadcasts');
  console.log('• Multiple voice personalities');
  console.log('• Real-time audio generation');
}

// Export for use in other scripts
export { ElevenLabsVoiceAI, VOICES, VOICE_SCRIPTS };

// Run demo if executed directly
if (require.main === module) {
  demoVoiceFeatures().catch(console.error);
}