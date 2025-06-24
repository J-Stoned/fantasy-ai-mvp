#!/usr/bin/env tsx

/**
 * 🎙️ FANTASY.AI VOICE DEMO - Show off our voice capabilities!
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config({ path: path.join(__dirname, '../.env') });

const execAsync = promisify(exec);
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

// Different voice scenarios
const VOICE_SCENARIOS = {
  welcome: "Welcome to Fantasy AI, the smartest fantasy sports platform on the planet! I'm your personal AI assistant, ready to help you dominate your league.",
  
  lineup: "Good morning champion! Here's your lineup report: Patrick Mahomes is locked and loaded at QB. Christian McCaffrey is healthy and ready to feast. Your flex spot needs attention though - Tyreek Hill has a questionable tag.",
  
  touchdown: "TOUCHDOWN! Justin Jefferson just caught a 75-yard bomb! That's 17.5 fantasy points and counting! Your opponent is in shambles!",
  
  injury: "Injury alert! Your running back Nick Chubb is being evaluated for a shoulder injury. I recommend pivoting to Austin Ekeler who has a great matchup against the Chargers.",
  
  trash_talk: "Message for your opponent: Hope you enjoyed first place while it lasted. My AI-optimized lineup is about to send you to the consolation bracket. Better luck next year!",
  
  weather: "Weather update: Heavy rain expected at Lambeau Field. Consider benching your Packers receivers and starting a possession receiver instead. The run game will dominate today.",
  
  trade: "Trade alert! You've received an offer: Their Travis Kelce for your Tyreek Hill. My analysis shows this trade improves your playoff odds by 23 percent. I recommend accepting.",
  
  victory: "VICTORY! You've won by 42 points! Your lineup was absolutely perfect. I've already started analyzing next week's matchups. We're going back-to-back, baby!"
};

async function generateVoice(text: string, filename: string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (response.ok) {
      const buffer = await response.buffer();
      const outputPath = path.join(__dirname, `../voice-demos/${filename}.mp3`);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }
    return null;
  } catch (error) {
    console.error('Error generating voice:', error);
    return null;
  }
}

async function playAudio(filepath: string) {
  try {
    // Try different commands based on OS
    const commands = [
      `start "${filepath}"`, // Windows
      `open "${filepath}"`,  // macOS
      `xdg-open "${filepath}"` // Linux
    ];
    
    for (const cmd of commands) {
      try {
        await execAsync(cmd);
        return true;
      } catch {}
    }
  } catch (error) {
    console.log('(Cannot auto-play audio, but file was created successfully)');
  }
  return false;
}

async function runVoiceDemo() {
  console.log('🎙️ FANTASY.AI VOICE DEMO');
  console.log('========================\n');

  if (!ELEVENLABS_API_KEY) {
    console.error('❌ No ElevenLabs API key found!');
    return;
  }

  console.log('🎯 Select a voice demo:\n');
  
  const scenarios = Object.entries(VOICE_SCENARIOS);
  scenarios.forEach(([key, text], index) => {
    console.log(`${index + 1}. ${key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}`);
  });
  
  console.log('\n🎤 Generating all voice demos...\n');

  for (const [scenario, text] of scenarios) {
    console.log(`▶️  ${scenario.replace('_', ' ').toUpperCase()}:`);
    console.log(`   "${text.substring(0, 60)}..."`);
    
    const filepath = await generateVoice(text, scenario);
    
    if (filepath) {
      console.log(`   ✅ Saved to: voice-demos/${scenario}.mp3`);
    } else {
      console.log(`   ❌ Failed to generate`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 VOICE DEMOS COMPLETE!');
  console.log('📁 Check the voice-demos/ folder for your audio files');
  console.log('\n🚀 Fantasy.AI Voice Features Ready:');
  console.log('   - Voice notifications');
  console.log('   - Audio lineup reports');
  console.log('   - Real-time game updates');
  console.log('   - Trash talk generator');
  console.log('   - Weather alerts');
  console.log('   - Trade analysis');
}

// Run the demo
runVoiceDemo().catch(console.error);