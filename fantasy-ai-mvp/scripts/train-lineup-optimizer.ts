#!/usr/bin/env tsx
/**
 * 🎯 Train Lineup Optimizer Model
 * Uses reinforcement learning to optimize fantasy lineups
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { lineupOptimizer } from '../src/lib/ml/models/lineup-optimizer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainLineupOptimizer() {
  console.log('🎯 TRAINING LINEUP OPTIMIZER MODEL');
  console.log('==================================\n');
  
  try {
    // Initialize model
    console.log('1️⃣ Initializing model...');
    await lineupOptimizer.initialize();
    console.log('   ✅ Model initialized\n');
    
    // Load players for training
    console.log('2️⃣ Loading player data...');
    const players = await prisma.player.findMany({
      where: {
        position: { in: ['QB', 'RB', 'WR', 'TE', 'K', 'DST'] }
      },
      take: 300
    });
    
    // Convert to player options with simulated data
    const playerPool = players.map(p => ({
      id: p.id,
      name: p.name,
      position: mapPosition(p.position),
      team: p.team,
      salary: 4000 + Math.random() * 6000, // $4k-$10k range
      projectedPoints: 5 + Math.random() * 25, // 5-30 points
      ownership: Math.random() * 0.4 // 0-40% ownership
    }));
    
    console.log(`   ✅ Loaded ${playerPool.length} players\n`);
    
    // Generate training data
    console.log('3️⃣ Generating training lineups...');
    const trainingData: { features: number[]; target: number }[] = [];
    
    // Generate random lineups and score them
    for (let i = 0; i < 5000; i++) {
      const lineup = generateRandomLineup(playerPool);
      if (lineup) {
        const features = lineupToFeatures(lineup);
        const score = scoreLineup(lineup);
        trainingData.push({ features, target: score });
      }
    }
    
    console.log(`   ✅ Generated ${trainingData.length} training samples\n`);
    
    // Prepare tensors
    console.log('4️⃣ Training model...');
    const features = trainingData.map(d => d.features);
    const targets = trainingData.map(d => d.target);
    
    const xTensor = tf.tensor2d(features);
    const yTensor = tf.tensor2d(targets.map(t => [t]));
    
    // Split data
    const splitIdx = Math.floor(features.length * 0.8);
    const xTrain = xTensor.slice([0, 0], [splitIdx, -1]);
    const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
    const xVal = xTensor.slice([splitIdx, 0], [-1, -1]);
    const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
    
    // Get model reference
    const model = (lineupOptimizer as any).model;
    
    // Train
    await model.fit(xTrain, yTrain, {
      epochs: 20,
      batchSize: 32,
      validationData: [xVal, yVal],
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          if ((epoch + 1) % 5 === 0) {
            console.log(`   Epoch ${epoch + 1}/20 - Loss: ${logs.loss.toFixed(3)}`);
          }
        }
      }
    });
    
    console.log('\n   ✅ Training complete!\n');
    
    // Evaluate
    console.log('5️⃣ Evaluating model...');
    const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor;
    const loss = await evalResult.data();
    console.log(`   Loss: ${loss[0].toFixed(3)}\n`);
    
    // Save model
    console.log('6️⃣ Saving model...');
    await lineupOptimizer.saveModel();
    console.log('   ✅ Model saved\n');
    
    // Test optimization
    console.log('7️⃣ Testing lineup optimization...');
    const constraints = {
      salaryCap: 50000,
      positions: {
        'QB': 1,
        'RB': 2,
        'WR': 3,
        'TE': 1,
        'FLEX': 1,
        'DST': 1
      },
      maxFromTeam: 4
    };
    
    const result = await lineupOptimizer.optimizeLineup(playerPool, constraints);
    
    console.log('\n📋 Optimal Lineup:');
    console.log('Position | Player              | Team | Salary | Points');
    console.log('---------|---------------------|------|--------|-------');
    
    result.lineup.forEach(p => {
      const pos = p.position.padEnd(8);
      const name = p.name.substring(0, 19).padEnd(19);
      const team = p.team.substring(0, 4).padEnd(4);
      const salary = `$${p.salary.toFixed(0)}`.padStart(6);
      const points = p.projectedPoints.toFixed(1).padStart(6);
      console.log(`${pos} | ${name} | ${team} | ${salary} | ${points}`);
    });
    
    console.log('\n📊 Lineup Summary:');
    console.log(`   Total Salary: $${result.salary.toFixed(0)} / $${constraints.salaryCap}`);
    console.log(`   Projected Points: ${result.projectedPoints.toFixed(1)}`);
    console.log(`   Confidence: ${result.confidence.toFixed(1)}%`);
    
    // Cleanup
    xTensor.dispose();
    yTensor.dispose();
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();
    evalResult.dispose();
    
    console.log('\n==================================');
    console.log('🎉 LINEUP OPTIMIZER COMPLETE!');
    console.log('==================================');
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
function mapPosition(pos: string): string {
  const flexPositions = ['RB', 'WR', 'TE'];
  if (flexPositions.includes(pos) && Math.random() < 0.1) {
    return 'FLEX';
  }
  return pos;
}

function generateRandomLineup(playerPool: any[]): any[] | null {
  const lineup: any[] = [];
  const used = new Set<string>();
  const positions = {
    'QB': 1,
    'RB': 2,
    'WR': 3,
    'TE': 1,
    'FLEX': 1,
    'DST': 1
  };
  
  let remainingSalary = 50000;
  
  for (const [pos, count] of Object.entries(positions)) {
    const eligible = playerPool.filter(p =>
      (p.position === pos || (pos === 'FLEX' && ['RB', 'WR', 'TE'].includes(p.position))) &&
      !used.has(p.id) &&
      p.salary <= remainingSalary
    );
    
    if (eligible.length < count) return null;
    
    for (let i = 0; i < count; i++) {
      const player = eligible[Math.floor(Math.random() * eligible.length)];
      lineup.push(player);
      used.add(player.id);
      remainingSalary -= player.salary;
      eligible.splice(eligible.indexOf(player), 1);
    }
  }
  
  return lineup;
}

function lineupToFeatures(lineup: any[]): number[] {
  const features: number[] = [];
  const maxPlayers = 9;
  
  // Ensure consistent order
  const sorted = [...lineup].sort((a, b) => {
    const posOrder: Record<string, number> = {
      'QB': 0, 'RB': 1, 'WR': 2, 'TE': 3, 'FLEX': 4, 'K': 5, 'DST': 6
    };
    return (posOrder[a.position] || 99) - (posOrder[b.position] || 99);
  });
  
  // Pad lineup
  while (sorted.length < maxPlayers) {
    sorted.push({
      projectedPoints: 0,
      salary: 0,
      position: 'NONE',
      team: 'NONE',
      ownership: 0
    });
  }
  
  // Extract features
  sorted.forEach((player, idx) => {
    features.push(
      player.projectedPoints / 50,
      player.salary / 10000,
      positionToNumber(player.position) / 10,
      Math.abs(hashString(player.team) % 32) / 32,
      player.ownership || 0.2,
      idx / maxPlayers,
      calculateStackBonus(sorted, idx),
      calculateDiversity(sorted, idx),
      Math.random() * 0.1,
      1
    );
  });
  
  return features;
}

function scoreLineup(lineup: any[]): number {
  let score = 0;
  
  // Base score from projected points
  score += lineup.reduce((sum, p) => sum + p.projectedPoints, 0);
  
  // Bonus for good salary usage (90-98% of cap)
  const totalSalary = lineup.reduce((sum, p) => sum + p.salary, 0);
  const salaryRatio = totalSalary / 50000;
  if (salaryRatio >= 0.9 && salaryRatio <= 0.98) {
    score += 10;
  }
  
  // Stack bonuses
  const teams = lineup.reduce((acc, p) => {
    acc[p.team] = (acc[p.team] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // QB stack bonus
  const qb = lineup.find(p => p.position === 'QB');
  if (qb) {
    const teammates = lineup.filter(p => 
      p.team === qb.team && ['WR', 'TE'].includes(p.position)
    );
    score += teammates.length * 5;
  }
  
  // Diversity penalty for too many from same team
  Object.values(teams).forEach(count => {
    if (count > 4) score -= (count - 4) * 10;
  });
  
  // Normalize to 0-100 range
  return Math.min(100, score / 2);
}

function positionToNumber(pos: string): number {
  const positions: Record<string, number> = {
    'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DST': 6,
    'FLEX': 7, 'NONE': 0
  };
  return positions[pos] || 0;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function calculateStackBonus(lineup: any[], idx: number): number {
  const player = lineup[idx];
  let bonus = 0;
  
  if (player.position === 'WR' || player.position === 'TE') {
    const qb = lineup.find(p => p.position === 'QB' && p.team === player.team);
    if (qb) bonus += 0.3;
  }
  
  return bonus;
}

function calculateDiversity(lineup: any[], idx: number): number {
  const player = lineup[idx];
  const sameTeam = lineup.filter(p => p.team === player.team).length;
  return 1 - (sameTeam / lineup.length);
}

// Run training
trainLineupOptimizer().catch(console.error);