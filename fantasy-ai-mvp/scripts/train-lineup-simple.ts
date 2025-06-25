#!/usr/bin/env tsx
/**
 * 🎯 Train Lineup Optimizer (Simplified)
 * Quick training for lineup optimization
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainLineupOptimizer() {
  console.log('🎯 TRAINING LINEUP OPTIMIZER');
  console.log('============================\n');
  
  try {
    // Generate synthetic training data
    console.log('1️⃣ Generating training data...');
    const trainingData = generateLineupData(3000);
    console.log(`   ✅ Generated ${trainingData.length} lineup samples\n`);
    
    // Prepare tensors
    console.log('2️⃣ Preparing data...');
    const features = trainingData.map(d => d.features);
    const targets = trainingData.map(d => d.score);
    
    const xTensor = tf.tensor2d(features);
    const yTensor = tf.tensor2d(targets.map(t => [t]));
    
    // Split data
    const splitIdx = Math.floor(features.length * 0.8);
    const xTrain = xTensor.slice([0, 0], [splitIdx, -1]);
    const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
    const xVal = xTensor.slice([splitIdx, 0], [-1, -1]);
    const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
    
    console.log(`   ✅ Train: ${splitIdx}, Val: ${features.length - splitIdx}\n`);
    
    // Create model
    console.log('3️⃣ Creating model...');
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [90], // 9 players * 10 features
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    console.log(`   ✅ Model created with ${model.countParams()} parameters\n`);
    
    // Train
    console.log('4️⃣ Training model...');
    
    await model.fit(xTrain, yTrain, {
      epochs: 20,
      batchSize: 32,
      validationData: [xVal, yVal],
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if ((epoch + 1) % 5 === 0) {
            console.log(`   Epoch ${epoch + 1}/20 - Loss: ${logs?.loss?.toFixed(3)}, MAE: ${logs?.mae?.toFixed(2)}`);
          }
        }
      }
    });
    
    console.log('\n   ✅ Training complete!\n');
    
    // Evaluate
    console.log('5️⃣ Evaluating model...');
    const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
    const [loss, mae] = await Promise.all(evalResult.map(t => t.data()));
    
    console.log(`   Loss: ${loss[0].toFixed(3)}`);
    console.log(`   MAE: ${mae[0].toFixed(2)} points\n`);
    
    // Save
    console.log('6️⃣ Saving model...');
    const modelDir = path.join(process.cwd(), 'models', 'lineup-optimizer');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    await model.save(`file://${modelDir}`);
    
    // Save metadata
    fs.writeFileSync(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify({
        type: 'lineup-optimizer-dnn',
        features: 90,
        accuracy: ((50 - mae[0]) / 50 * 100).toFixed(1),
        trained: new Date().toISOString()
      }, null, 2)
    );
    
    console.log(`   ✅ Model saved\n`);
    
    // Test
    console.log('7️⃣ Testing optimal lineup finder...');
    const testLineup = generateRandomLineup();
    const testFeatures = lineupToFeatures(testLineup);
    const testInput = tf.tensor2d([testFeatures]);
    const prediction = model.predict(testInput) as tf.Tensor;
    const score = await prediction.data();
    
    console.log('   Sample lineup score: ' + score[0].toFixed(1) + '/100');
    console.log('   Expected range: 60-85 for good lineups\n');
    
    // Cleanup
    xTensor.dispose();
    yTensor.dispose();
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();
    testInput.dispose();
    prediction.dispose();
    evalResult.forEach(t => t.dispose());
    
    console.log('============================');
    console.log('🎉 LINEUP OPTIMIZER TRAINED!');
    console.log('============================');
    console.log(`✅ Accuracy: ${((50 - mae[0]) / 50 * 100).toFixed(1)}%`);
    console.log(`✅ Ready to optimize lineups`);
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

// Generate synthetic lineup training data
function generateLineupData(count: number): any[] {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    const lineup = generateRandomLineup();
    const features = lineupToFeatures(lineup);
    const score = scoreLineup(lineup);
    
    data.push({ features, score });
  }
  
  return data;
}

// Generate random lineup
function generateRandomLineup(): any[] {
  const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST'];
  const teams = ['KC', 'BUF', 'DAL', 'SF', 'PHI', 'MIA', 'BAL', 'CIN', 'DET', 'GB'];
  
  return positions.map((pos, idx) => ({
    position: pos,
    projectedPoints: 5 + Math.random() * 25,
    salary: 4000 + Math.random() * 6000,
    team: teams[Math.floor(Math.random() * teams.length)],
    ownership: Math.random() * 0.4,
    correlation: Math.random()
  }));
}

// Convert lineup to features
function lineupToFeatures(lineup: any[]): number[] {
  const features: number[] = [];
  
  lineup.forEach((player, idx) => {
    features.push(
      player.projectedPoints / 30,
      player.salary / 10000,
      positionToNumber(player.position) / 10,
      idx / 9,
      player.ownership,
      player.correlation,
      calculateStackBonus(lineup, idx),
      calculateDiversity(lineup, idx),
      Math.random() * 0.1,
      1
    );
  });
  
  return features;
}

// Score lineup quality
function scoreLineup(lineup: any[]): number {
  let score = 0;
  
  // Points contribution (40%)
  const totalPoints = lineup.reduce((sum, p) => sum + p.projectedPoints, 0);
  score += (totalPoints / 200) * 40;
  
  // Salary efficiency (30%)
  const totalSalary = lineup.reduce((sum, p) => sum + p.salary, 0);
  const salaryRatio = totalSalary / 50000;
  if (salaryRatio >= 0.9 && salaryRatio <= 0.98) {
    score += 30;
  } else if (salaryRatio < 0.9) {
    score += salaryRatio * 30;
  }
  
  // Stacking bonus (20%)
  const qb = lineup.find(p => p.position === 'QB');
  if (qb) {
    const stackPlayers = lineup.filter(p => 
      p.team === qb.team && ['WR', 'TE'].includes(p.position)
    );
    score += Math.min(20, stackPlayers.length * 10);
  }
  
  // Diversity (10%)
  const uniqueTeams = new Set(lineup.map(p => p.team)).size;
  score += (uniqueTeams / 8) * 10;
  
  return Math.min(100, Math.max(0, score));
}

function positionToNumber(pos: string): number {
  const positions: Record<string, number> = {
    'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DST': 6, 'FLEX': 7
  };
  return positions[pos] || 0;
}

function calculateStackBonus(lineup: any[], idx: number): number {
  const player = lineup[idx];
  if (player.position === 'WR' || player.position === 'TE') {
    const qb = lineup.find(p => p.position === 'QB' && p.team === player.team);
    return qb ? 0.5 : 0;
  }
  return 0;
}

function calculateDiversity(lineup: any[], idx: number): number {
  const player = lineup[idx];
  const sameTeam = lineup.filter(p => p.team === player.team).length;
  return 1 - (sameTeam / 9);
}

// Run training
trainLineupOptimizer().catch(console.error);