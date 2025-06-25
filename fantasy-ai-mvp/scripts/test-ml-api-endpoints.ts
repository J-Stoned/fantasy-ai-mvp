#!/usr/bin/env tsx
/**
 * 🧪 Test ML API Endpoints
 * Verify all 6 ML model endpoints are working
 */

const BASE_URL = 'http://localhost:3000/api/ml';

async function testEndpoint(
  name: string,
  path: string,
  payload: any
): Promise<boolean> {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    
    // Test GET (documentation)
    const getResponse = await fetch(`${BASE_URL}${path}`);
    const docs = await getResponse.json();
    console.log(`   📚 Documentation: ${docs.description}`);
    
    // Test POST (prediction)
    const postResponse = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!postResponse.ok) {
      const error = await postResponse.json();
      console.log(`   ❌ Failed: ${error.error}`);
      return false;
    }
    
    const result = await postResponse.json();
    console.log(`   ✅ Success:`, JSON.stringify(result).slice(0, 100) + '...');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 TESTING ML API ENDPOINTS');
  console.log('==========================');
  
  const tests = [
    {
      name: 'Player Performance',
      path: '/player-performance',
      payload: {
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
      }
    },
    {
      name: 'Injury Risk',
      path: '/injury-risk',
      payload: {
        playerId: 'derrick-henry',
        weeksAhead: 4
      }
    },
    {
      name: 'Lineup Optimizer',
      path: '/lineup-optimizer',
      payload: {
        players: [
          { id: '1', name: 'Josh Allen', position: 'QB', salary: 8500, projectedPoints: 25 },
          { id: '2', name: 'Christian McCaffrey', position: 'RB', salary: 9500, projectedPoints: 22 },
          { id: '3', name: 'Tyreek Hill', position: 'WR', salary: 8800, projectedPoints: 20 },
          { id: '4', name: 'Justin Jefferson', position: 'WR', salary: 8600, projectedPoints: 19 },
          { id: '5', name: 'Travis Kelce', position: 'TE', salary: 7200, projectedPoints: 16 },
          { id: '6', name: 'Austin Ekeler', position: 'RB', salary: 7000, projectedPoints: 15 },
          { id: '7', name: 'Stefon Diggs', position: 'WR', salary: 7500, projectedPoints: 17 },
          { id: '8', name: 'Buffalo Bills', position: 'DST', salary: 3500, projectedPoints: 8 }
        ],
        constraints: {
          salaryCap: 50000,
          positions: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1 }
        }
      }
    },
    {
      name: 'Trade Analyzer',
      path: '/trade-analyzer',
      payload: {
        teamAGiving: [{
          id: '1',
          name: 'Saquon Barkley',
          position: 'RB',
          team: 'PHI',
          currentPoints: 18.5,
          projectedPoints: 17.2
        }],
        teamBGiving: [{
          id: '2',
          name: 'Chris Olave',
          position: 'WR',
          team: 'NO',
          currentPoints: 14.2,
          projectedPoints: 13.8
        }]
      }
    },
    {
      name: 'Draft Assistant',
      path: '/draft-assistant',
      payload: {
        context: {
          round: 5,
          pick: 53,
          draftPosition: 5,
          totalTeams: 12,
          scoringFormat: 'PPR',
          rosterRequirements: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 }
        },
        draftedPlayers: [
          { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1, round: 1, pick: 1 }
        ],
        myRoster: [
          { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1, round: 1, pick: 5, bye: 9 }
        ],
        availablePlayers: [
          { id: '5', name: 'Mark Andrews', position: 'TE', team: 'BAL', adp: 45, projectedPoints: 180, tier: 1 },
          { id: '6', name: 'Lamar Jackson', position: 'QB', team: 'BAL', adp: 42, projectedPoints: 320, tier: 2 }
        ]
      }
    },
    {
      name: 'Game Outcome',
      path: '/game-outcome',
      payload: {
        context: {
          homeTeam: {
            teamId: '1',
            name: 'Kansas City Chiefs',
            abbreviation: 'KC',
            offensiveRating: 28.5,
            defensiveRating: 21.2,
            pace: 65.3,
            homeRecord: '7-1',
            awayRecord: '4-3',
            lastGameResult: 'W',
            restDays: 7,
            injuries: 1,
            form: 0.85
          },
          awayTeam: {
            teamId: '2',
            name: 'Buffalo Bills',
            abbreviation: 'BUF',
            offensiveRating: 27.8,
            defensiveRating: 19.5,
            pace: 68.1,
            homeRecord: '6-2',
            awayRecord: '5-2',
            lastGameResult: 'W',
            restDays: 4,
            injuries: 2,
            form: 0.75
          },
          weekNumber: 11,
          season: 2024
        }
      }
    }
  ];
  
  let successCount = 0;
  
  // Test main endpoint
  console.log('\n📋 Testing main ML endpoint...');
  const mainResponse = await fetch(BASE_URL);
  const mainData = await mainResponse.json();
  console.log(`   ✅ ${mainData.title} - ${mainData.endpoints.length} endpoints available`);
  
  // Test each endpoint
  for (const test of tests) {
    const success = await testEndpoint(test.name, test.path, test.payload);
    if (success) successCount++;
  }
  
  // Summary
  console.log('\n==========================');
  console.log(`📊 RESULTS: ${successCount}/${tests.length} endpoints working`);
  console.log('==========================');
  
  if (successCount === tests.length) {
    console.log('🎉 ALL ML API ENDPOINTS OPERATIONAL!');
    console.log('✅ Ready for frontend integration');
  } else {
    console.log(`⚠️  ${tests.length - successCount} endpoints need attention`);
    console.log('Note: Endpoints may fail if server is not running or models not initialized');
  }
}

// Run tests
console.log('Note: Make sure the Next.js server is running (npm run dev)');
runTests().catch(console.error);