#!/usr/bin/env tsx

/**
 * 🔍 PRODUCTION VERIFICATION SCRIPT
 * Comprehensive test of all Fantasy.AI production systems
 */

import chalk from 'chalk';

const PRODUCTION_URL = 'https://fantasy-ai-mvp.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  endpoint: string;
  success: boolean;
  message: string;
  data?: any;
}

const tests: TestResult[] = [];

async function testEndpoint(name: string, endpoint: string, options: RequestInit = {}): Promise<TestResult> {
  try {
    const url = `${PRODUCTION_URL}${endpoint}`;
    console.log(chalk.gray(`Testing ${name}...`));
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      return {
        name,
        endpoint,
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        data
      };
    }
    
    return {
      name,
      endpoint,
      success: true,
      message: 'OK',
      data
    };
  } catch (error) {
    return {
      name,
      endpoint,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runTests() {
  console.log(chalk.bold.blue(`
🔍 FANTASY.AI PRODUCTION VERIFICATION
=====================================
URL: ${PRODUCTION_URL}
Time: ${new Date().toISOString()}
`));

  // 1. Database Connection Test
  const healthTest = await testEndpoint('Health Check', '/api/health');
  tests.push(healthTest);
  
  if (healthTest.success && healthTest.data) {
    console.log(chalk.green('✅ Database Status:'), healthTest.data.database?.connected ? 'Connected' : 'Not Connected');
    console.log(chalk.green('✅ Player Count:'), healthTest.data.database?.playerCount || 0);
  }
  
  // 2. Live Sports Data Test
  const sportsTest = await testEndpoint('Live Sports Data', '/api/sports/live-players?limit=5');
  tests.push(sportsTest);
  
  if (sportsTest.success && sportsTest.data) {
    console.log(chalk.green('✅ Data Source:'), sportsTest.data.meta?.dataSource);
    console.log(chalk.green('✅ Players Loaded:'), sportsTest.data.players?.length || 0);
  }
  
  // 3. ML Model Tests
  const mlTests = [
    { name: 'ML API Overview', endpoint: '/api/ml' },
    { name: 'Player Performance Model', endpoint: '/api/ml/player-performance' },
    { name: 'Injury Risk Model', endpoint: '/api/ml/injury-risk' },
    { name: 'Lineup Optimizer', endpoint: '/api/ml/lineup-optimizer' },
    { name: 'Trade Analyzer', endpoint: '/api/ml/trade-analyzer' },
    { name: 'Draft Assistant', endpoint: '/api/ml/draft-assistant' },
    { name: 'Game Outcome Predictor', endpoint: '/api/ml/game-outcome' }
  ];
  
  for (const mlTest of mlTests) {
    const result = await testEndpoint(mlTest.name, mlTest.endpoint);
    tests.push(result);
  }
  
  // 4. AI Features Test
  const aiTests = [
    { name: 'AI Analysis', endpoint: '/api/ai-analysis' },
    { name: 'Voice Assistant', endpoint: '/api/voice/assistant' },
  ];
  
  for (const aiTest of aiTests) {
    const result = await testEndpoint(aiTest.name, aiTest.endpoint);
    tests.push(result);
  }
  
  // 5. Real-time Features
  const realtimeTests = [
    { name: 'WebSocket Status', endpoint: '/api/socket' },
    { name: 'Live Data Pipeline', endpoint: '/api/pipeline/status' },
  ];
  
  for (const rtTest of realtimeTests) {
    const result = await testEndpoint(rtTest.name, rtTest.endpoint);
    tests.push(result);
  }
  
  // Summary
  console.log(chalk.bold.yellow('\n📊 TEST SUMMARY'));
  console.log(chalk.yellow('===============\n'));
  
  const passed = tests.filter(t => t.success).length;
  const failed = tests.filter(t => !t.success).length;
  
  tests.forEach(test => {
    const icon = test.success ? '✅' : '❌';
    const color = test.success ? chalk.green : chalk.red;
    console.log(`${icon} ${color(test.name.padEnd(30))} ${test.endpoint}`);
    if (!test.success) {
      console.log(chalk.gray(`   └─ ${test.message}`));
    }
  });
  
  console.log(chalk.bold.cyan(`\n📈 RESULTS: ${passed}/${tests.length} passed (${Math.round(passed/tests.length * 100)}%)`));
  
  if (failed > 0) {
    console.log(chalk.bold.red(`\n⚠️  ${failed} tests failed!`));
    console.log(chalk.yellow('\nPossible fixes:'));
    console.log('1. Check DATABASE_URL is set in Vercel environment variables');
    console.log('2. Trigger a redeploy with "Clear Build Cache" option');
    console.log('3. Verify all API keys are set (OpenAI, ElevenLabs, etc)');
    console.log('4. Check Vercel function logs for detailed errors');
  } else {
    console.log(chalk.bold.green('\n🎉 ALL TESTS PASSED! Fantasy.AI is running at FULL POWER! 🚀'));
  }
  
  // Check specific features
  const dbConnected = healthTest.data?.database?.connected;
  const liveData = sportsTest.data?.meta?.dataSource === 'live';
  const mlActive = tests.filter(t => t.name.includes('Model')).some(t => t.success);
  
  console.log(chalk.bold.magenta('\n🔥 FEATURE STATUS:'));
  console.log(`Database Connection: ${dbConnected ? '✅ ACTIVE' : '❌ INACTIVE'}`);
  console.log(`Live Sports Data: ${liveData ? '✅ ACTIVE' : '❌ FALLBACK MODE'}`);
  console.log(`ML Models: ${mlActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);
  console.log(`Voice AI: ${tests.find(t => t.name === 'Voice Assistant')?.success ? '✅ ACTIVE' : '❌ INACTIVE'}`);
  
  if (!dbConnected || !liveData) {
    console.log(chalk.bold.red('\n🚨 CRITICAL: Database connection issue detected!'));
    console.log(chalk.yellow('ACTION REQUIRED:'));
    console.log('1. Go to: https://vercel.com/your-project/settings/environment-variables');
    console.log('2. Ensure DATABASE_URL is set for Production environment');
    console.log('3. Click "Redeploy" → "Clear Build Cache"');
  }
}

// Run the tests
runTests().catch(console.error);