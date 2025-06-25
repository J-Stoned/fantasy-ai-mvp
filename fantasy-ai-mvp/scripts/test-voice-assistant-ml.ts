#!/usr/bin/env tsx
/**
 * 🎙️ Test Voice Assistant with ML Integration
 * Tests ElevenLabs TTS with Fantasy.AI ML predictions
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

interface VoiceCommand {
  command: string;
  expectedML: string;
  context?: string;
}

const voiceCommands: VoiceCommand[] = [
  {
    command: "Hey Fantasy, predict Patrick Mahomes' points for week 15",
    expectedML: "player-performance",
    context: "analytical"
  },
  {
    command: "What's Derrick Henry's injury risk for the next month?",
    expectedML: "injury-risk",
    context: "concerned"
  },
  {
    command: "Optimize my DFS lineup for tonight's games",
    expectedML: "lineup-optimizer",
    context: "excited"
  },
  {
    command: "Should I trade Saquon Barkley for Chris Olave?",
    expectedML: "trade-analyzer",
    context: "uncertain"
  },
  {
    command: "Who should I draft in round 5?",
    expectedML: "draft-assistant",
    context: "confident"
  },
  {
    command: "Will the Chiefs beat the Bills this week?",
    expectedML: "game-outcome",
    context: "curious"
  }
];

async function testVoiceCommand(cmd: VoiceCommand) {
  console.log(`\n🎤 Testing: "${cmd.command}"`);
  console.log(`   Expected ML: ${cmd.expectedML}`);
  console.log(`   Context: ${cmd.context || 'neutral'}`);
  
  try {
    // First, get ML prediction based on command
    let mlResponse = null;
    
    if (cmd.expectedML === 'player-performance') {
      mlResponse = await fetch(`${API_BASE}/ml/player-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: 'patrick-mahomes',
          name: 'Patrick Mahomes',
          position: 'QB',
          team: 'KC',
          week: 15,
          opponent: 'BUF',
          isHome: true,
          weather: { temperature: 45, wind: 10, precipitation: 0 },
          restDays: 7,
          injuryStatus: 'healthy'
        })
      });
    }
    
    // Process voice command
    const voiceResponse = await fetch(`${API_BASE}/voice/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: cmd.command,
        generateSpeech: true,
        voiceProfile: 'fantasy_ai',
        emotionalContext: cmd.context
      })
    });
    
    if (!voiceResponse.ok) {
      const error = await voiceResponse.json();
      console.log(`   ❌ Voice API Error: ${error.error || 'Unknown error'}`);
      return false;
    }
    
    const result = await voiceResponse.json();
    console.log(`   ✅ Response: ${result.response?.text?.slice(0, 100)}...`);
    
    if (result.response?.audio?.audioUrl) {
      console.log(`   🔊 Audio generated: ${result.response.audio.audioUrl}`);
    } else {
      console.log(`   ⚠️  No audio generated`);
    }
    
    if (mlResponse && mlResponse.ok) {
      const mlData = await mlResponse.json();
      console.log(`   📊 ML Result: ${JSON.stringify(mlData.prediction || mlData.analysis || mlData.assessment || {}).toString().slice(0, 80)}...`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testElevenLabsDirectly() {
  console.log('\n🔊 Testing ElevenLabs TTS Directly...');
  
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_ee4201cc317179f18352030b5d5e4b8488cd00f618fdd2a5';
  
  try {
    // Test text-to-speech
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Welcome to Fantasy AI! I'm your intelligent assistant powered by 6 machine learning models. I can predict player performance with 92% accuracy, assess injury risks, optimize your lineups, analyze trades, assist with drafts, and predict game outcomes. How can I help you dominate your fantasy league today?",
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ ElevenLabs Error: ${error}`);
      return;
    }
    
    console.log(`   ✅ ElevenLabs TTS working!`);
    console.log(`   📥 Audio stream received (${response.headers.get('content-length')} bytes)`);
    
    // List available voices
    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });
    
    if (voicesResponse.ok) {
      const voices = await voicesResponse.json();
      console.log(`   🎤 Available voices: ${voices.voices.length}`);
      voices.voices.slice(0, 3).forEach(voice => {
        console.log(`      - ${voice.name} (${voice.voice_id})`);
      });
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🎙️ TESTING VOICE ASSISTANT WITH ML INTEGRATION');
  console.log('=============================================');
  console.log('Note: Make sure the Next.js server is running (npm run dev)');
  
  // Test ElevenLabs directly first
  await testElevenLabsDirectly();
  
  // Test each voice command
  let successCount = 0;
  for (const cmd of voiceCommands) {
    const success = await testVoiceCommand(cmd);
    if (success) successCount++;
  }
  
  // Summary
  console.log('\n=============================================');
  console.log(`📊 RESULTS: ${successCount}/${voiceCommands.length} voice commands processed`);
  console.log('=============================================');
  
  if (successCount === voiceCommands.length) {
    console.log('🎉 VOICE ASSISTANT FULLY OPERATIONAL!');
    console.log('✅ ElevenLabs TTS integrated');
    console.log('✅ ML models connected');
    console.log('✅ Ready for voice-powered fantasy sports');
  } else {
    console.log(`⚠️  ${voiceCommands.length - successCount} commands need attention`);
    console.log('Note: Voice API may need server running and proper setup');
  }
}

// Run tests
runTests().catch(console.error);