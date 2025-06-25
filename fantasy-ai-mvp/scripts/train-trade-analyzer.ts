#!/usr/bin/env tsx
/**
 * 💱 Train Trade Analyzer Ensemble
 * Three models for comprehensive trade evaluation
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { tradeAnalyzer } from '../src/lib/ml/models/trade-analyzer';

process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainTradeAnalyzer() {
  console.log('💱 TRAINING TRADE ANALYZER ENSEMBLE');
  console.log('===================================\n');
  
  try {
    // Initialize models
    console.log('1️⃣ Initializing trade analyzer...');
    await tradeAnalyzer.initialize();
    console.log('   ✅ Models initialized\n');
    
    // Generate training data
    console.log('2️⃣ Generating trade scenarios...');
    const { valueData, impactData, fairnessData } = generateTrainingData(3000);
    console.log(`   ✅ Generated ${valueData.length} trade scenarios\n`);
    
    // Get model references
    const models = (tradeAnalyzer as any);
    
    // Train Value Model
    console.log('3️⃣ Training Player Value Model...');
    await trainModel(
      models.valueModel,
      valueData,
      'Player value assessment'
    );
    
    // Train Impact Model
    console.log('4️⃣ Training Team Impact Model...');
    await trainModel(
      models.impactModel,
      impactData,
      'Team impact prediction'
    );
    
    // Train Fairness Model
    console.log('5️⃣ Training Trade Fairness Model...');
    await trainModel(
      models.fairnessModel,
      fairnessData,
      'Trade fairness evaluation'
    );
    
    // Save all models
    console.log('6️⃣ Saving ensemble models...');
    await tradeAnalyzer.saveModels();
    console.log('   ✅ All models saved\n');
    
    // Test trade analysis
    console.log('7️⃣ Testing trade analysis...');
    const sampleTrade = createSampleTrade();
    const analysis = await tradeAnalyzer.analyzeTrade(
      sampleTrade.teamAGiving,
      sampleTrade.teamBGiving
    );
    
    console.log('\n📊 Sample Trade Analysis:');
    console.log('------------------------');
    console.log('Team A gives:', sampleTrade.teamAGiving.map(p => p.name).join(', '));
    console.log('Team B gives:', sampleTrade.teamBGiving.map(p => p.name).join(', '));
    console.log('\nResults:');
    console.log(`   Fairness Score: ${analysis.fairnessScore.toFixed(1)}/100`);
    console.log(`   Team A Gain: ${analysis.teamAGain > 0 ? '+' : ''}${analysis.teamAGain.toFixed(1)} points`);
    console.log(`   Recommendation: ${analysis.recommendation}`);
    console.log(`   Confidence: ${analysis.confidenceLevel.toFixed(1)}%`);
    console.log('\nReasoning:');
    analysis.reasoning.forEach(r => console.log(`   - ${r}`));
    
    console.log('\n===================================');
    console.log('🎉 TRADE ANALYZER TRAINED!');
    console.log('===================================');
    console.log('✅ 3 models trained successfully');
    console.log('✅ Ready to analyze trades');
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

async function trainModel(
  model: tf.LayersModel,
  data: { features: number[]; target: number | number[] }[],
  description: string
) {
  // Prepare tensors
  const features = data.map(d => d.features);
  const targets = data.map(d => Array.isArray(d.target) ? d.target : [d.target]);
  
  const xTensor = tf.tensor2d(features);
  const yTensor = tf.tensor2d(targets);
  
  // Split data
  const splitIdx = Math.floor(features.length * 0.8);
  const xTrain = xTensor.slice([0, 0], [splitIdx, -1]);
  const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
  const xVal = xTensor.slice([splitIdx, 0], [-1, -1]);
  const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
  
  // Train
  console.log(`   Training ${description}...`);
  await model.fit(xTrain, yTrain, {
    epochs: 15,
    batchSize: 32,
    validationData: [xVal, yVal],
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0) {
          console.log(`     Epoch ${epoch + 1}/15 - Loss: ${logs?.loss?.toFixed(3)}`);
        }
      }
    }
  });
  
  // Evaluate
  const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
  const [loss] = await Promise.all(evalResult.map(t => t.data()));
  console.log(`   ✅ Training complete - Loss: ${loss[0].toFixed(3)}\n`);
  
  // Cleanup
  xTensor.dispose();
  yTensor.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
  evalResult.forEach(t => t.dispose());
}

function generateTrainingData(count: number) {
  const valueData = [];
  const impactData = [];
  const fairnessData = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random trade scenario
    const trade = generateRandomTrade();
    
    // Value model data (individual players)
    [...trade.teamAGiving, ...trade.teamBGiving].forEach(player => {
      valueData.push({
        features: playerToValueFeatures(player),
        target: player.tradeValue
      });
    });
    
    // Impact model data
    impactData.push({
      features: createImpactFeatures(trade.teamAGiving, trade.teamBGiving),
      target: calculateImpact(trade)
    });
    
    // Fairness model data
    fairnessData.push({
      features: createFairnessFeatures(trade),
      target: calculateFairness(trade)
    });
  }
  
  return { valueData, impactData, fairnessData };
}

function generateRandomTrade() {
  const positions = ['QB', 'RB', 'WR', 'TE'];
  const teams = ['KC', 'BUF', 'DAL', 'SF', 'PHI', 'MIA'];
  
  const createPlayer = (value: number, variance: number) => ({
    id: Math.random().toString(),
    name: `Player ${Math.floor(Math.random() * 1000)}`,
    position: positions[Math.floor(Math.random() * positions.length)],
    team: teams[Math.floor(Math.random() * teams.length)],
    currentPoints: value + (Math.random() - 0.5) * variance,
    projectedPoints: value + (Math.random() - 0.5) * variance,
    consistency: 0.5 + Math.random() * 0.5,
    upside: 0.4 + Math.random() * 0.6,
    injury: Math.random() * 0.3,
    scheduleStrength: 0.3 + Math.random() * 0.7,
    tradeValue: value
  });
  
  // Generate balanced or unbalanced trades
  const isBalanced = Math.random() > 0.3;
  const teamAValue = 20 + Math.random() * 40;
  const teamBValue = isBalanced 
    ? teamAValue + (Math.random() - 0.5) * 10
    : teamAValue + (Math.random() - 0.5) * 30;
  
  const teamACount = 1 + Math.floor(Math.random() * 3);
  const teamBCount = 1 + Math.floor(Math.random() * 3);
  
  return {
    teamAGiving: Array(teamACount).fill(0).map(() => 
      createPlayer(teamAValue / teamACount, 10)
    ),
    teamBGiving: Array(teamBCount).fill(0).map(() => 
      createPlayer(teamBValue / teamBCount, 10)
    ),
    isBalanced
  };
}

function playerToValueFeatures(player: any): number[] {
  return [
    player.currentPoints / 20,
    player.projectedPoints / 25,
    player.consistency,
    player.upside,
    1 - player.injury,
    player.scheduleStrength,
    positionValue(player.position),
    player.tradeValue / 100,
    0.5, // positional scarcity
    Math.random() * 0.3,
    Math.random() * 0.1,
    1
  ];
}

function createImpactFeatures(teamAGiving: any[], teamBGiving: any[]): number[] {
  const features = [];
  
  // Aggregate stats
  features.push(
    teamAGiving.reduce((sum, p) => sum + p.currentPoints, 0) / 100,
    teamAGiving.reduce((sum, p) => sum + p.projectedPoints, 0) / 100,
    teamAGiving.reduce((sum, p) => sum + p.consistency, 0) / teamAGiving.length,
    teamAGiving.reduce((sum, p) => sum + p.injury, 0) / teamAGiving.length,
    teamBGiving.reduce((sum, p) => sum + p.currentPoints, 0) / 100,
    teamBGiving.reduce((sum, p) => sum + p.projectedPoints, 0) / 100,
    teamBGiving.reduce((sum, p) => sum + p.consistency, 0) / teamBGiving.length,
    teamBGiving.reduce((sum, p) => sum + p.injury, 0) / teamBGiving.length
  );
  
  // Position counts
  ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
    features.push(
      teamAGiving.filter(p => p.position === pos).length,
      teamBGiving.filter(p => p.position === pos).length
    );
  });
  
  // Context
  features.push(0.5, 1, 0.1, 1);
  
  return features;
}

function createFairnessFeatures(trade: any): number[] {
  const teamAValue = trade.teamAGiving.reduce((sum, p) => sum + p.tradeValue, 0);
  const teamBValue = trade.teamBGiving.reduce((sum, p) => sum + p.tradeValue, 0);
  
  const features = [
    (teamAValue - teamBValue) / 50,
    Math.abs(teamAValue - teamBValue) / 50,
    trade.teamAGiving.length,
    trade.teamBGiving.length,
    Math.abs(trade.teamAGiving.length - trade.teamBGiving.length)
  ];
  
  // Position balance
  ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
    features.push(
      trade.teamAGiving.filter(p => p.position === pos).length,
      trade.teamBGiving.filter(p => p.position === pos).length
    );
  });
  
  // Quality metrics
  features.push(
    trade.teamAGiving.reduce((sum, p) => sum + p.consistency, 0) / trade.teamAGiving.length,
    trade.teamBGiving.reduce((sum, p) => sum + p.consistency, 0) / trade.teamBGiving.length,
    trade.teamAGiving.reduce((sum, p) => sum + p.upside, 0) / trade.teamAGiving.length,
    trade.teamBGiving.reduce((sum, p) => sum + p.upside, 0) / trade.teamBGiving.length,
    trade.teamAGiving.reduce((sum, p) => sum + p.injury, 0) / trade.teamAGiving.length,
    trade.teamBGiving.reduce((sum, p) => sum + p.injury, 0) / trade.teamBGiving.length
  );
  
  // Padding
  while (features.length < 30) features.push(0);
  
  return features.slice(0, 30);
}

function calculateImpact(trade: any): number[] {
  const teamAValue = trade.teamAGiving.reduce((sum, p) => sum + p.tradeValue, 0);
  const teamBValue = trade.teamBGiving.reduce((sum, p) => sum + p.tradeValue, 0);
  const valueDiff = teamBValue - teamAValue;
  
  return [
    valueDiff / 20, // immediate impact
    valueDiff / 15, // season impact
    valueDiff / 10  // playoff impact
  ];
}

function calculateFairness(trade: any): number {
  const teamAValue = trade.teamAGiving.reduce((sum, p) => sum + p.tradeValue, 0);
  const teamBValue = trade.teamBGiving.reduce((sum, p) => sum + p.tradeValue, 0);
  const ratio = teamAValue / (teamBValue || 1);
  
  // Convert to -1 to 1 scale
  if (ratio > 1.5) return -0.8;
  if (ratio < 0.67) return -0.8;
  if (ratio >= 0.9 && ratio <= 1.1) return 0.9;
  return 0.5 - Math.abs(1 - ratio);
}

function positionValue(pos: string): number {
  const values: Record<string, number> = {
    'QB': 0.8, 'RB': 1.0, 'WR': 0.9, 'TE': 0.7
  };
  return values[pos] || 0.5;
}

function createSampleTrade() {
  return {
    teamAGiving: [{
      id: '1',
      name: 'Saquon Barkley',
      position: 'RB',
      team: 'PHI',
      currentPoints: 18.5,
      projectedPoints: 17.2,
      consistency: 0.75,
      upside: 0.85,
      injury: 0.2,
      scheduleStrength: 0.6,
      tradeValue: 75
    }],
    teamBGiving: [
      {
        id: '2',
        name: 'Chris Olave',
        position: 'WR',
        team: 'NO',
        currentPoints: 14.2,
        projectedPoints: 13.8,
        consistency: 0.65,
        upside: 0.75,
        injury: 0.1,
        scheduleStrength: 0.7,
        tradeValue: 45
      },
      {
        id: '3',
        name: 'James Conner',
        position: 'RB',
        team: 'ARI',
        currentPoints: 11.5,
        projectedPoints: 10.8,
        consistency: 0.6,
        upside: 0.6,
        injury: 0.3,
        scheduleStrength: 0.5,
        tradeValue: 30
      }
    ]
  };
}

// Run training
trainTradeAnalyzer().catch(console.error);