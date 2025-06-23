#!/usr/bin/env tsx

/**
 * 🔑 FREE API SETUP HELPER
 * 
 * This script helps you get and configure the FREE API keys
 * to unlock 100% of Fantasy.AI capabilities!
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function setupFreeAPIs() {
  console.log('🔑 FREE API SETUP WIZARD');
  console.log('========================\n');
  
  console.log('This wizard will help you get FREE API keys to unlock:');
  console.log('✅ Weather data for game conditions');
  console.log('✅ Betting odds and lines');
  console.log('✅ Aggregated sports news');
  console.log('✅ Voice AI for audio alerts\n');
  
  console.log('📋 STEP 1: GET YOUR FREE KEYS\n');
  
  // OpenWeather
  console.log('1️⃣ OPENWEATHER API (Weather Data)');
  console.log('   🌐 Go to: https://openweathermap.org/api');
  console.log('   📝 Sign up for FREE account');
  console.log('   🔑 Copy your API key from dashboard\n');
  
  const openWeatherKey = await question('Paste your OpenWeather API key (or press Enter to skip): ');
  
  // The Odds API
  console.log('\n2️⃣ THE ODDS API (Betting Lines)');
  console.log('   🌐 Go to: https://the-odds-api.com/');
  console.log('   📝 Click "Get API Key" - select FREE tier');
  console.log('   📧 Check email for your key\n');
  
  const oddsKey = await question('Paste your Odds API key (or press Enter to skip): ');
  
  // News API
  console.log('\n3️⃣ NEWS API (Sports News)');
  console.log('   🌐 Go to: https://newsapi.org/');
  console.log('   📝 Click "Get API Key"');
  console.log('   🔑 Instant key on dashboard\n');
  
  const newsKey = await question('Paste your News API key (or press Enter to skip): ');
  
  // ElevenLabs
  console.log('\n4️⃣ ELEVENLABS (Voice AI)');
  console.log('   🌐 Go to: https://elevenlabs.io/');
  console.log('   📝 Sign up for FREE account');
  console.log('   🔑 Get API key from Profile Settings');
  console.log('   🎙️ 10,000 characters/month FREE\n');
  
  const elevenLabsKey = await question('Paste your ElevenLabs API key (or press Enter to skip): ');
  
  // Update .env.local
  console.log('\n📝 UPDATING YOUR CONFIGURATION...\n');
  
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Add API keys section if not exists
  if (!envContent.includes('# 🌐 FREE DATA APIS')) {
    envContent += '\n\n# 🌐 FREE DATA APIS (Added by setup wizard)\n';
    
    if (openWeatherKey) {
      envContent += `OPENWEATHER_API_KEY=${openWeatherKey}\n`;
      console.log('✅ OpenWeather API key added');
    }
    
    if (oddsKey) {
      envContent += `ODDS_API_KEY=${oddsKey}\n`;
      console.log('✅ Odds API key added');
    }
    
    if (newsKey) {
      envContent += `NEWS_API_KEY=${newsKey}\n`;
      console.log('✅ News API key added');
    }
    
    fs.writeFileSync(envPath, envContent);
  }
  
  // Update ElevenLabs key if provided
  if (elevenLabsKey) {
    envContent = envContent.replace(/ELEVENLABS_API_KEY=.*/g, `ELEVENLABS_API_KEY=${elevenLabsKey}`);
    fs.writeFileSync(envPath, envContent);
    console.log('✅ ElevenLabs API key updated');
  }
  
  console.log('\n🎉 SETUP COMPLETE!\n');
  
  // Show what's unlocked
  const unlockedFeatures = [];
  if (openWeatherKey) unlockedFeatures.push('Weather conditions for games');
  if (oddsKey) unlockedFeatures.push('Live betting odds');
  if (newsKey) unlockedFeatures.push('Aggregated sports news');
  if (elevenLabsKey) unlockedFeatures.push('Voice AI announcements');
  
  if (unlockedFeatures.length > 0) {
    console.log('🔓 FEATURES UNLOCKED:');
    unlockedFeatures.forEach(f => console.log(`   ✅ ${f}`));
  }
  
  console.log('\n🚀 READY TO RUN AT MAXIMUM POWER!');
  console.log('================================\n');
  
  console.log('Run these commands:');
  console.log('1. Stop current process: Ctrl+C');
  console.log('2. Run everything: npm run maximum:all');
  console.log('3. See demo: npm run demo:maximum\n');
  
  rl.close();
}

// Test API keys
async function testAPIKeys() {
  console.log('\n🧪 TESTING API KEYS...\n');
  
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Extract keys
  const openWeatherKey = envContent.match(/OPENWEATHER_API_KEY=(.+)/)?.[1];
  const oddsKey = envContent.match(/ODDS_API_KEY=(.+)/)?.[1];
  const newsKey = envContent.match(/NEWS_API_KEY=(.+)/)?.[1];
  
  if (openWeatherKey) {
    try {
      // Test with Arrowhead Stadium coordinates (Kansas City Chiefs)
      const lat = 39.0489;
      const lon = -94.4839;
      const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=imperial`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenWeather API: Working!');
        console.log(`   Current temp at Arrowhead Stadium: ${data.current?.temp}°F`);
      } else {
        console.log('❌ OpenWeather API: Invalid key or needs subscription');
        // Try fallback to 2.5 API
        const fallback = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Kansas City&appid=${openWeatherKey}`);
        if (fallback.ok) {
          console.log('✅ OpenWeather 2.5 API: Working (fallback)');
        }
      }
    } catch (error) {
      console.log('❌ OpenWeather API: Connection error');
    }
  }
  
  if (oddsKey) {
    try {
      const response = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${oddsKey}`);
      if (response.ok) {
        console.log('✅ Odds API: Working!');
      } else {
        console.log('❌ Odds API: Invalid key');
      }
    } catch (error) {
      console.log('❌ Odds API: Connection error');
    }
  }
  
  if (newsKey) {
    try {
      const response = await fetch(`https://newsapi.org/v2/everything?q=NFL&apiKey=${newsKey}`);
      if (response.ok) {
        console.log('✅ News API: Working!');
      } else {
        console.log('❌ News API: Invalid key');
      }
    } catch (error) {
      console.log('❌ News API: Connection error');
    }
  }
}

// Main execution
async function main() {
  await setupFreeAPIs();
  
  const shouldTest = await question('Test API keys now? (y/n): ');
  if (shouldTest.toLowerCase() === 'y') {
    await testAPIKeys();
  }
  
  process.exit(0);
}

main().catch(console.error);