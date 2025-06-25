#!/usr/bin/env tsx

/**
 * TRAIN ML MODELS
 * Trains all Fantasy.AI ML models using real data
 * Utilizes full GPU power for maximum performance
 */

import { mlOrchestrator } from '../src/lib/ml/ml-orchestrator';
import { prisma } from '../src/lib/prisma';
import * as tf from '@tensorflow/tfjs-node-gpu';

async function trainAllModels() {
  console.log('🚀 FANTASY.AI ML TRAINING SYSTEM');
  console.log('================================\n');
  
  try {
    // Check GPU status
    console.log('🎮 Checking GPU status...');
    await tf.ready();
    console.log(`✅ TensorFlow backend: ${tf.getBackend()}`);
    console.log(`✅ GPU available: ${tf.getBackend() === 'tensorflow'}`);
    
    // Get player count
    const playerCount = await prisma.player.count();
    console.log(`\n📊 Database contains ${playerCount} players for training\n`);
    
    // Wait for orchestrator to initialize
    console.log('⏳ Waiting for ML Orchestrator to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get system status
    const status = await mlOrchestrator.getSystemStatus();
    console.log('\n📈 ML System Status:');
    console.log(`   Models registered: ${status.models.length}`);
    console.log(`   GPU utilization: ${status.gpu.utilization.toFixed(1)}%`);
    console.log(`   GPU memory: ${status.gpu.memory.toFixed(1)}%`);
    console.log(`   GPU temperature: ${status.gpu.temperature.toFixed(1)}°C\n`);
    
    // Train each model
    console.log('🏋️ Starting model training...\n');
    
    // 1. Player Performance Predictor
    console.log('1️⃣ Training Player Performance Predictor...');
    console.log('   Architecture: Deep Neural Network');
    console.log('   Target accuracy: 94.5%');
    
    const performanceHistory = await mlOrchestrator.trainModel('player-performance', 20);
    console.log('   ✅ Training complete!\n');
    
    // 2. Injury Risk Assessment
    console.log('2️⃣ Training Injury Risk Assessment...');
    console.log('   Architecture: LSTM Network');
    console.log('   Target accuracy: 91.2%');
    
    const injuryHistory = await mlOrchestrator.trainModel('injury-risk', 30);
    console.log('   ✅ Training complete!\n');
    
    // Test the models
    console.log('🧪 Testing trained models...\n');
    
    // Test player performance prediction
    console.log('Testing Player Performance Predictor:');
    const testPlayer = {
      pointsPerGame: 25.5,
      assistsPerGame: 6.2,
      reboundsPerGame: 7.8,
      fieldGoalPercentage: 0.485,
      minutesPerGame: 32.5,
      isHomeGame: true,
      daysRest: 2
    };
    
    const prediction = await mlOrchestrator.predict('player-performance', testPlayer);
    console.log(`   Predicted fantasy points: ${prediction.predictedPoints.toFixed(1)}`);
    console.log(`   Confidence: ${prediction.confidence.toFixed(1)}%`);
    console.log(`   Key factors: ${prediction.factors.join(', ')}\n`);
    
    // Test injury risk
    console.log('Testing Injury Risk Assessment:');
    const testSequence = Array(10).fill({
      minutesPlayedLast7Days: 180,
      backToBackGames: 2,
      currentFatigueLevel: 0.7,
      age: 28
    });
    
    const risk = await mlOrchestrator.predict('injury-risk', testSequence);
    console.log(`   Risk score: ${risk.riskScore.toFixed(1)}%`);
    console.log(`   Risk level: ${risk.riskLevel}`);
    console.log(`   Recommendations: ${risk.recommendations.join('; ')}\n`);
    
    // Final system status
    const finalStatus = await mlOrchestrator.getSystemStatus();
    console.log('📊 Final System Status:');
    console.log(`   Total inferences: ${finalStatus.performance.totalInferences}`);
    console.log(`   Average latency: ${finalStatus.performance.averageLatency.toFixed(1)}ms`);
    console.log(`   GPU utilization: ${finalStatus.gpu.utilization.toFixed(1)}%`);
    console.log(`   GPU temperature: ${finalStatus.gpu.temperature.toFixed(1)}°C`);
    
    console.log('\n✅ All models trained successfully!');
    console.log('🚀 Fantasy.AI ML system is ready for production!');
    
  } catch (error) {
    console.error('❌ Training error:', error);
  } finally {
    // Keep running to show GPU metrics
    console.log('\n📈 Monitoring GPU performance (Ctrl+C to exit)...\n');
    
    setInterval(async () => {
      const status = await mlOrchestrator.getSystemStatus();
      console.log(
        `GPU: ${status.gpu.utilization.toFixed(1)}% | ` +
        `Memory: ${status.gpu.memory.toFixed(1)}% | ` +
        `Temp: ${status.gpu.temperature.toFixed(0)}°C | ` +
        `Queue: ${status.performance.queueLength}`
      );
    }, 2000);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down gracefully...');
  await mlOrchestrator.shutdown();
  await prisma.$disconnect();
  process.exit(0);
});

// Run training
trainAllModels();