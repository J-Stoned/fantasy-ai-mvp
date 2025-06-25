#!/usr/bin/env tsx
/**
 * 🧪 TEST ML API ENDPOINTS
 * Verifies all 6 ML models are working through the API
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

class MLEndpointTester {
  async testAll() {
    console.log('🧪 TESTING ML API ENDPOINTS');
    console.log('=========================\n');

    const tests = [
      {
        name: '1️⃣ Player Performance Prediction',
        endpoint: '/ml/player-performance',
        payload: {
          playerId: 'player_123',
          gameweek: 10,
          opponent: 'Lakers',
          isHome: true
        }
      },
      {
        name: '2️⃣ Injury Risk Assessment',
        endpoint: '/ml/injury-risk',
        payload: {
          playerId: 'player_456',
          recentGames: 5,
          minutesPlayed: [32, 35, 38, 36, 40]
        }
      },
      {
        name: '3️⃣ Lineup Optimization',
        endpoint: '/ml/lineup-optimizer',
        payload: {
          budget: 50000,
          positions: ['PG', 'SG', 'SF', 'PF', 'C'],
          excludedPlayers: []
        }
      },
      {
        name: '4️⃣ Trade Analysis',
        endpoint: '/ml/trade-analyzer',
        payload: {
          givePlayers: ['player_123'],
          getPlayers: ['player_789'],
          leagueId: 'league_001'
        }
      },
      {
        name: '5️⃣ Draft Recommendations',
        endpoint: '/ml/draft-assistant',
        payload: {
          draftPosition: 5,
          round: 3,
          takenPlayers: ['player_001', 'player_002'],
          leagueSize: 10
        }
      },
      {
        name: '6️⃣ Game Outcome Prediction',
        endpoint: '/ml/game-outcome',
        payload: {
          homeTeam: 'Warriors',
          awayTeam: 'Lakers',
          date: new Date().toISOString()
        }
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}...`);
        
        const response = await fetch(`${API_BASE}${test.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload)
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ PASSED - Response:`, JSON.stringify(data, null, 2));
          passed++;
        } else {
          console.log(`❌ FAILED - Status: ${response.status}, Error:`, data);
          failed++;
        }
      } catch (error) {
        console.log(`❌ FAILED - Error:`, error.message);
        failed++;
      }
      console.log('');
    }

    // Summary
    console.log('📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);
    console.log(`📈 Success Rate: ${(passed / tests.length * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 ALL ML ENDPOINTS WORKING PERFECTLY!');
    } else {
      console.log('\n⚠️  Some endpoints need attention');
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      console.log('⚠️  Server not responding. Starting dev server...');
      console.log('Please run: npm run dev');
      console.log('Then run this script again in another terminal');
      return false;
    }
    return true;
  } catch (error) {
    console.log('❌ Server is not running!');
    console.log('Please run: npm run dev');
    console.log('Then run this script again in another terminal');
    return false;
  }
}

// Main
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  const tester = new MLEndpointTester();
  await tester.testAll();
}

main().catch(console.error);