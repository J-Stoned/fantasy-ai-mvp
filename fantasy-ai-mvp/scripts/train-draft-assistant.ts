#!/usr/bin/env tsx
/**
 * 📝 Train Draft Assistant Model
 * LSTM-based draft recommendation system
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { draftAssistant } from '../src/lib/ml/models/draft-assistant';

process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainDraftAssistant() {
  console.log('📝 TRAINING DRAFT ASSISTANT LSTM');
  console.log('================================\n');
  
  try {
    // Initialize
    console.log('1️⃣ Initializing draft assistant...');
    await draftAssistant.initialize();
    console.log('   ✅ Models initialized\n');
    
    // Generate training data
    console.log('2️⃣ Generating draft simulations...');
    const { sequenceData, adpData } = generateDraftData(2000);
    console.log(`   ✅ Generated ${sequenceData.length} draft sequences\n`);
    
    // Get models
    const models = (draftAssistant as any);
    
    // Train sequence model
    console.log('3️⃣ Training draft sequence model...');
    await trainSequenceModel(models.model, sequenceData);
    
    // Train ADP model
    console.log('4️⃣ Training ADP prediction model...');
    await trainADPModel(models.adpModel, adpData);
    
    // Save models
    console.log('5️⃣ Saving models...');
    await draftAssistant.saveModels();
    console.log('   ✅ Models saved\n');
    
    // Test recommendations
    console.log('6️⃣ Testing draft recommendations...');
    const testScenario = createTestScenario();
    const recommendations = await draftAssistant.recommendPick(
      testScenario.context,
      testScenario.drafted,
      testScenario.available,
      testScenario.myRoster
    );
    
    console.log('\n📊 Draft Recommendations:');
    console.log('------------------------');
    console.log(`Round ${testScenario.context.round}, Pick ${testScenario.context.pick}`);
    console.log('\nTop Picks:');
    
    recommendations.slice(0, 3).forEach((rec, idx) => {
      console.log(`\n${idx + 1}. ${rec.player.name} (${rec.player.position} - ${rec.player.team})`);
      console.log(`   Score: ${rec.score.toFixed(2)}`);
      console.log(`   ADP: ${rec.player.adp}`);
      console.log(`   Confidence: ${rec.confidence.toFixed(1)}%`);
      console.log('   Reasoning:');
      rec.reasoning.forEach(r => console.log(`   - ${r}`));
    });
    
    console.log('\n================================');
    console.log('🎉 DRAFT ASSISTANT TRAINED!');
    console.log('================================');
    console.log('✅ LSTM sequence model ready');
    console.log('✅ ADP prediction model ready');
    console.log('✅ Ready for draft recommendations');
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

async function trainSequenceModel(
  model: tf.LayersModel,
  data: { sequence: number[][][]; target: number[] }[]
) {
  // Prepare data
  const sequences = data.map(d => d.sequence);
  const targets = data.map(d => d.target);
  
  const xTensor = tf.tensor3d(sequences);
  const yTensor = tf.tensor2d(targets);
  
  // Split
  const splitIdx = Math.floor(sequences.length * 0.8);
  const xTrain = xTensor.slice([0, 0, 0], [splitIdx, -1, -1]);
  const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
  const xVal = xTensor.slice([splitIdx, 0, 0], [-1, -1, -1]);
  const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
  
  // Train
  console.log('   Training LSTM on draft sequences...');
  await model.fit(xTrain, yTrain, {
    epochs: 20,
    batchSize: 32,
    validationData: [xVal, yVal],
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0) {
          console.log(`     Epoch ${epoch + 1}/20 - Loss: ${logs?.loss?.toFixed(3)}, Acc: ${(logs?.acc * 100).toFixed(1)}%`);
        }
      }
    }
  });
  
  // Evaluate
  const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
  const [loss, acc] = await Promise.all(evalResult.map(t => t.data()));
  console.log(`   ✅ Training complete - Accuracy: ${(acc[0] * 100).toFixed(1)}%\n`);
  
  // Cleanup
  xTensor.dispose();
  yTensor.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
  evalResult.forEach(t => t.dispose());
}

async function trainADPModel(
  model: tf.LayersModel,
  data: { features: number[]; adp: number }[]
) {
  // Prepare data
  const features = data.map(d => d.features);
  const adps = data.map(d => [d.adp]);
  
  const xTensor = tf.tensor2d(features);
  const yTensor = tf.tensor2d(adps);
  
  // Split
  const splitIdx = Math.floor(features.length * 0.8);
  const xTrain = xTensor.slice([0, 0], [splitIdx, -1]);
  const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
  const xVal = xTensor.slice([splitIdx, 0], [-1, -1]);
  const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
  
  // Train
  console.log('   Training ADP prediction model...');
  await model.fit(xTrain, yTrain, {
    epochs: 15,
    batchSize: 32,
    validationData: [xVal, yVal],
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0) {
          console.log(`     Epoch ${epoch + 1}/15 - MAE: ${logs?.mae?.toFixed(2)}`);
        }
      }
    }
  });
  
  // Evaluate
  const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
  const [loss, mae] = await Promise.all(evalResult.map(t => t.data()));
  console.log(`   ✅ Training complete - MAE: ${mae[0].toFixed(2)} picks\n`);
  
  // Cleanup
  xTensor.dispose();
  yTensor.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
  evalResult.forEach(t => t.dispose());
}

function generateDraftData(draftCount: number) {
  const sequenceData = [];
  const adpData = [];
  
  // Generate mock drafts
  for (let d = 0; d < draftCount; d++) {
    const draft = simulateDraft();
    
    // Create sequences from draft
    for (let i = 10; i < draft.picks.length; i++) {
      const sequence = [];
      
      // Get last 10 picks
      for (let j = i - 10; j < i; j++) {
        sequence.push(pickToFeatures(draft.picks[j], j));
      }
      
      // Target is next pick position
      const nextPick = draft.picks[i];
      const target = new Array(6).fill(0);
      target[nextPick.position - 1] = 1;
      
      sequenceData.push({ sequence, target });
    }
    
    // ADP data from all picks
    draft.picks.forEach(pick => {
      adpData.push({
        features: playerToADPFeatures(pick),
        adp: pick.adp
      });
    });
  }
  
  return { sequenceData, adpData };
}

function simulateDraft() {
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  const teams = ['KC', 'BUF', 'DAL', 'SF', 'PHI', 'MIA', 'BAL', 'CIN'];
  const picks = [];
  
  // Simulate 15 rounds, 12 teams
  for (let round = 1; round <= 15; round++) {
    for (let pick = 1; pick <= 12; pick++) {
      const overallPick = (round - 1) * 12 + pick;
      
      // Position distribution by round
      let position;
      if (round <= 3) {
        position = ['RB', 'RB', 'WR', 'WR', 'RB'][Math.floor(Math.random() * 5)];
      } else if (round <= 6) {
        position = ['RB', 'WR', 'WR', 'TE', 'QB'][Math.floor(Math.random() * 5)];
      } else if (round <= 10) {
        position = ['WR', 'RB', 'TE', 'QB', 'WR'][Math.floor(Math.random() * 5)];
      } else {
        position = positions[Math.floor(Math.random() * positions.length)];
      }
      
      picks.push({
        round,
        pick: overallPick,
        position: positionToNumber(position),
        team: teams[Math.floor(Math.random() * teams.length)],
        adp: overallPick + (Math.random() - 0.5) * 20,
        projectedPoints: 200 - overallPick + Math.random() * 50,
        tier: Math.ceil(overallPick / 24),
        consistency: 0.5 + Math.random() * 0.5,
        upside: 0.4 + Math.random() * 0.6
      });
    }
  }
  
  return { picks };
}

function pickToFeatures(pick: any, idx: number): number[] {
  return [
    pick.round / 20,
    pick.pick / 200,
    pick.position / 6,
    pick.adp / 200,
    (pick.pick - pick.adp) / 50,
    hashString(pick.team) / 32,
    // Position distribution up to this pick
    ...getPositionDistribution(idx),
    Math.random() * 0.1,
    1
  ];
}

function playerToADPFeatures(player: any): number[] {
  const features = [
    player.position / 6,
    player.projectedPoints / 300,
    player.tier / 10,
    player.consistency,
    player.upside,
    hashString(player.team) / 32,
    // Position-specific features
    player.position === 2 ? 1 : 0, // Is RB
    player.position === 3 ? 1 : 0, // Is WR
    player.position === 1 ? 1 : 0, // Is QB
    player.position === 4 ? 1 : 0, // Is TE
    // Quality indicators
    player.tier <= 3 ? 1 : 0,
    player.consistency > 0.7 ? 1 : 0,
    player.upside > 0.7 ? 1 : 0,
    Math.random() * 0.1
  ];
  
  // Pad to 20 features
  while (features.length < 20) features.push(0);
  
  return features;
}

function createTestScenario() {
  return {
    context: {
      round: 5,
      pick: 53,
      draftPosition: 5,
      totalTeams: 12,
      scoringFormat: 'PPR' as const,
      rosterRequirements: {
        QB: 1,
        RB: 2,
        WR: 3,
        TE: 1,
        FLEX: 1,
        K: 1,
        DST: 1
      }
    },
    drafted: [
      { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1, round: 1, pick: 1 },
      { id: '2', name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 3, round: 1, pick: 3 },
      { id: '3', name: 'Justin Jefferson', position: 'WR', team: 'MIN', adp: 2, round: 1, pick: 2 }
    ],
    myRoster: [
      { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1, round: 1, pick: 5, bye: 9 },
      { id: '2', name: 'Davante Adams', position: 'WR', team: 'LV', adp: 12, round: 2, pick: 20, bye: 13 },
      { id: '3', name: 'Travis Etienne', position: 'RB', team: 'JAX', adp: 25, round: 3, pick: 29, bye: 9 },
      { id: '4', name: 'DK Metcalf', position: 'WR', team: 'SEA', adp: 38, round: 4, pick: 44, bye: 5 }
    ],
    available: [
      { id: '5', name: 'Mark Andrews', position: 'TE', team: 'BAL', adp: 45, projectedPoints: 180, tier: 1, upside: 0.8, consistency: 0.75, injury: 0.2, bye: 13 },
      { id: '6', name: 'Lamar Jackson', position: 'QB', team: 'BAL', adp: 42, projectedPoints: 320, tier: 2, upside: 0.9, consistency: 0.7, injury: 0.1, bye: 13 },
      { id: '7', name: 'Tee Higgins', position: 'WR', team: 'CIN', adp: 48, projectedPoints: 165, tier: 3, upside: 0.75, consistency: 0.65, injury: 0.15, bye: 7 },
      { id: '8', name: 'Joe Mixon', position: 'RB', team: 'HOU', adp: 55, projectedPoints: 155, tier: 4, upside: 0.6, consistency: 0.7, injury: 0.25, bye: 7 },
      { id: '9', name: 'George Kittle', position: 'TE', team: 'SF', adp: 58, projectedPoints: 160, tier: 2, upside: 0.85, consistency: 0.6, injury: 0.3, bye: 9 }
    ]
  };
}

function positionToNumber(pos: string): number {
  const positions: Record<string, number> = {
    'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DST': 6
  };
  return positions[pos] || 0;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 32) + 1;
}

function getPositionDistribution(pickCount: number): number[] {
  // Simplified - in real implementation, track actual distribution
  const round = Math.ceil(pickCount / 12);
  return [
    Math.min(pickCount, 15) / 180, // QB
    Math.min(pickCount * 2, 60) / 180, // RB
    Math.min(pickCount * 2.5, 75) / 180, // WR
    Math.min(pickCount * 0.5, 15) / 180, // TE
    Math.max(0, pickCount - 120) / 180, // K
    Math.max(0, pickCount - 100) / 180  // DST
  ];
}

// Run training
trainDraftAssistant().catch(console.error);