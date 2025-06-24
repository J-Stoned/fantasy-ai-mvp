#!/usr/bin/env tsx

/**
 * 🎙️ Test ElevenLabs Text-to-Speech API
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

async function testTextToSpeech() {
  console.log('🎙️ Testing ElevenLabs Text-to-Speech...\n');

  if (!ELEVENLABS_API_KEY) {
    console.error('❌ No ElevenLabs API key found!');
    return;
  }

  const text = "Welcome to Fantasy AI! Patrick Mahomes just threw another touchdown pass. Your lineup is looking strong today!";
  
  // Default voice ID (Rachel)
  const voiceId = '21m00Tcm4TlvDq8ikWAM';
  
  try {
    console.log('🎤 Converting text to speech...');
    console.log(`📝 Text: "${text}"`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('✅ Text-to-Speech API is working!');
      
      // Save audio file
      const buffer = await response.buffer();
      const outputPath = path.join(__dirname, 'fantasy-ai-voice-test.mp3');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`🎵 Audio saved to: ${outputPath}`);
      console.log(`📏 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
      console.log('\n🎉 ElevenLabs Voice AI is ready for Fantasy.AI!');
      
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Error:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to test TTS:', error.message);
    return false;
  }
}

// Test available voices
async function testVoicesList() {
  console.log('\n📋 Checking available voices...\n');
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.voices?.length || 0} available voices`);
      
      if (data.voices && data.voices.length > 0) {
        console.log('\n🎤 Sample voices:');
        data.voices.slice(0, 5).forEach((voice: any) => {
          console.log(`   - ${voice.name}: ${voice.description || 'No description'}`);
        });
      }
    } else {
      console.log('⚠️  Cannot list voices (limited permissions)');
    }
  } catch (error) {
    console.log('⚠️  Voice listing not available');
  }
}

// Run tests
async function main() {
  console.log('🎙️ ELEVENLABS VOICE AI TEST FOR FANTASY.AI');
  console.log('==========================================\n');
  
  // Test TTS first (most important)
  const ttsWorking = await testTextToSpeech();
  
  // Try to list voices
  await testVoicesList();
  
  if (ttsWorking) {
    console.log('\n✅ SUCCESS! Voice AI is ready for:');
    console.log('   - "Hey Fantasy" voice commands');
    console.log('   - Player announcements');
    console.log('   - Injury alerts');
    console.log('   - Lineup recommendations');
    console.log('   - Trash talk generator! 😄');
  }
}

main().catch(console.error);