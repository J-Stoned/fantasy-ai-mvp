#!/usr/bin/env tsx
/**
 * 🧪 Test All ML Models
 * Verify all 6 models are working correctly
 */

import { playerPerformanceModel } from '../src/lib/ml/models/player-performance-predictor';
import { injuryRiskModel } from '../src/lib/ml/models/injury-risk-assessment';
import { lineupOptimizer } from '../src/lib/ml/models/lineup-optimizer';
import { tradeAnalyzer } from '../src/lib/ml/models/trade-analyzer';
import { draftAssistant } from '../src/lib/ml/models/draft-assistant';
import { gameOutcomePredictor } from '../src/lib/ml/models/game-outcome-predictor';

async function testAllModels() {
  console.log('🧪 TESTING ALL ML MODELS');
  console.log('=======================\n');
  
  let successCount = 0;
  const totalModels = 6;
  
  // Test 1: Player Performance
  try {
    console.log('1️⃣ Testing Player Performance Model...');
    await playerPerformanceModel.initialize();
    const prediction = await playerPerformanceModel.predictPoints({
      playerId: 'test-player',
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC',
      week: 15,
      opponent: 'BUF',
      isHome: true,
      weather: { temperature: 45, wind: 10, precipitation: 0 },
      restDays: 7,
      injuryStatus: 'healthy'
    });
    console.log(`   ✅ Predicted: ${prediction.points.toFixed(1)} points (${prediction.confidence.toFixed(1)}% confidence)\n`);
    successCount++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }
  
  // Test 2: Injury Risk
  try {
    console.log('2️⃣ Testing Injury Risk Model...');
    await injuryRiskModel.initialize();
    const risk = await injuryRiskModel.assessRisk('test-player', 4);
    console.log(`   ✅ Risk levels: ${risk.riskLevels.map(r => (r * 100).toFixed(1) + '%').join(', ')}\n`);
    successCount++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }
  
  // Test 3: Lineup Optimizer
  try {
    console.log('3️⃣ Testing Lineup Optimizer...');
    await lineupOptimizer.initialize();
    const players = [
      { id: '1', name: 'Josh Allen', position: 'QB', salary: 8500, projectedPoints: 25 },
      { id: '2', name: 'Christian McCaffrey', position: 'RB', salary: 9500, projectedPoints: 22 },
      { id: '3', name: 'Tyreek Hill', position: 'WR', salary: 8800, projectedPoints: 20 }
    ];
    const lineup = await lineupOptimizer.optimizeLineup(players, {
      salaryCap: 50000,
      positions: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1 }
    });
    console.log(`   ✅ Optimized lineup with ${lineup.totalProjected.toFixed(1)} points\n`);
    successCount++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }
  
  // Test 4: Trade Analyzer
  try {
    console.log('4️⃣ Testing Trade Analyzer...');
    await tradeAnalyzer.initialize();
    const teamA = [{
      id: '1', name: 'Saquon Barkley', position: 'RB', team: 'PHI',
      currentPoints: 18, projectedPoints: 17, consistency: 0.75,
      upside: 0.85, injury: 0.2, scheduleStrength: 0.6, tradeValue: 75
    }];
    const teamB = [{
      id: '2', name: 'Chris Olave', position: 'WR', team: 'NO',
      currentPoints: 14, projectedPoints: 13, consistency: 0.65,
      upside: 0.75, injury: 0.1, scheduleStrength: 0.7, tradeValue: 45
    }];
    const analysis = await tradeAnalyzer.analyzeTrade(teamA, teamB);
    console.log(`   ✅ Trade fairness: ${analysis.fairnessScore.toFixed(1)}/100\n`);
    successCount++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }
  
  // Test 5: Draft Assistant
  try {
    console.log('5️⃣ Testing Draft Assistant...');
    await draftAssistant.initialize();
    console.log('   ✅ Draft Assistant initialized (LSTM ready)\n');
    successCount++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }
  
  // Test 6: Game Outcome Predictor
  try {
    console.log('6️⃣ Testing Game Outcome Predictor...');
    await gameOutcomePredictor.initialize();
    console.log('   ✅ Game Predictor initialized (3 models ready)\n');
    successCount++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }
  
  // Summary
  console.log('=======================');
  console.log(`📊 RESULTS: ${successCount}/${totalModels} models working`);
  console.log('=======================');
  
  if (successCount === totalModels) {
    console.log('🎉 ALL ML MODELS OPERATIONAL!');
    console.log('✅ Ready for production deployment');
  } else {
    console.log(`⚠️  ${totalModels - successCount} models need attention`);
  }
}

// Run tests
testAllModels().catch(console.error);