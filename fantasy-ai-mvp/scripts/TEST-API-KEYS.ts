#!/usr/bin/env tsx

/**
 * 🔑 TEST ALL API KEYS - Make sure everything works!
 */

import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const APIS = {
  openWeather: {
    name: 'OpenWeather',
    key: process.env.OPENWEATHER_API_KEY,
    testUrl: (key: string) => `https://api.openweathermap.org/data/2.5/weather?q=Kansas%20City&appid=${key}`,
    required: true
  },
  odds: {
    name: 'The Odds API',
    key: process.env.ODDS_API_KEY,
    testUrl: (key: string) => `https://api.the-odds-api.com/v4/sports?apiKey=${key}`,
    required: true
  },
  news: {
    name: 'NewsAPI',
    key: process.env.NEWS_API_KEY,
    testUrl: (key: string) => `https://newsapi.org/v2/top-headlines?country=us&category=sports&apiKey=${key}`,
    required: true
  },
  elevenLabs: {
    name: 'ElevenLabs',
    key: process.env.ELEVENLABS_API_KEY,
    testUrl: (key: string) => `https://api.elevenlabs.io/v1/voices`,
    headers: { 'xi-api-key': '' }, // Key goes in header
    required: true
  },
  openAI: {
    name: 'OpenAI',
    key: process.env.OPENAI_API_KEY,
    testUrl: (key: string) => `https://api.openai.com/v1/models`,
    headers: { 'Authorization': '' }, // Bearer token
    required: false
  },
  stripe: {
    name: 'Stripe',
    key: process.env.STRIPE_SECRET_KEY,
    testUrl: (key: string) => `https://api.stripe.com/v1/products?limit=1`,
    headers: { 'Authorization': '' }, // Basic auth
    required: false
  }
};

async function testAPIKey(api: any) {
  console.log(`\n🔍 Testing ${api.name}...`);
  
  if (!api.key) {
    console.log(`❌ ${api.name}: No API key found in .env`);
    return false;
  }

  try {
    const headers: any = { 'User-Agent': 'Fantasy.AI/1.0' };
    
    // Special header handling
    if (api.name === 'ElevenLabs') {
      headers['xi-api-key'] = api.key;
    } else if (api.name === 'OpenAI') {
      headers['Authorization'] = `Bearer ${api.key}`;
    } else if (api.name === 'Stripe') {
      headers['Authorization'] = `Bearer ${api.key}`;
    }

    const response = await fetch(
      api.name === 'ElevenLabs' || api.name === 'OpenAI' || api.name === 'Stripe' 
        ? api.testUrl('') 
        : api.testUrl(api.key),
      { headers }
    );

    if (response.ok) {
      console.log(`✅ ${api.name}: API key is VALID!`);
      
      // Show sample data
      const data = await response.json();
      if (api.name === 'OpenWeather') {
        console.log(`   Weather in Kansas City: ${data.weather?.[0]?.description || 'N/A'}`);
      } else if (api.name === 'The Odds API') {
        console.log(`   Available sports: ${data.length || 0}`);
      } else if (api.name === 'NewsAPI') {
        console.log(`   Total articles: ${data.totalResults || 0}`);
      } else if (api.name === 'ElevenLabs') {
        console.log(`   Available voices: ${data.voices?.length || 0}`);
      }
      
      return true;
    } else {
      console.log(`❌ ${api.name}: Invalid API key (${response.status} ${response.statusText})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${api.name}: Error testing API - ${error.message}`);
    return false;
  }
}

async function testAllAPIs() {
  console.log('🔑 TESTING ALL API KEYS');
  console.log('======================');

  let requiredValid = 0;
  let optionalValid = 0;
  let requiredTotal = 0;
  let optionalTotal = 0;

  for (const api of Object.values(APIS)) {
    const isValid = await testAPIKey(api);
    
    if (api.required) {
      requiredTotal++;
      if (isValid) requiredValid++;
    } else {
      optionalTotal++;
      if (isValid) optionalValid++;
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('===========');
  console.log(`Required APIs: ${requiredValid}/${requiredTotal} valid`);
  console.log(`Optional APIs: ${optionalValid}/${optionalTotal} valid`);

  if (requiredValid === requiredTotal) {
    console.log('\n✅ ALL REQUIRED APIs ARE WORKING!');
    console.log('🚀 Ready to start data collection!');
    console.log('\nRun: npx tsx scripts/REAL-API-DATA-COLLECTOR.ts --continuous');
  } else {
    console.log('\n⚠️  Some required APIs are missing!');
    console.log('Please add the missing API keys to your .env file');
    
    console.log('\n📝 MISSING KEYS:');
    for (const api of Object.values(APIS)) {
      if (api.required && !api.key) {
        console.log(`   - ${api.name.toUpperCase().replace(' ', '_')}_API_KEY`);
      }
    }
  }
}

// Run the tests
testAllAPIs().catch(console.error);