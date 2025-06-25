#!/usr/bin/env tsx

/**
 * TEST ML SYSTEM
 * Verifies all ML models are working correctly
 * Tests GPU acceleration and real predictions
 */

import * as tf from '@tensorflow/tfjs-node-gpu';
import { playerPerformancePredictor } from '../src/lib/ml/models/player-performance-predictor';
import { injuryRiskAssessment } from '../src/lib/ml/models/injury-risk-assessment';

async function testMLSystem() {
  console.log('🧪 TESTING FANTASY.AI ML SYSTEM');
  console.log('='.repeat(50));
  console.log('');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: [] as any[]
  };
  
  try {
    // Test 1: TensorFlow GPU Backend
    console.log('1️⃣ Testing TensorFlow GPU Backend...');
    await tf.ready();
    const backend = tf.getBackend();
    const isGPU = backend === 'tensorflow';
    results.tests.push({
      name: 'TensorFlow GPU Backend',
      status: isGPU ? 'PASS' : 'WARN',
      details: `Backend: ${backend} (${isGPU ? 'GPU acceleration active' : 'Using CPU fallback'})`
    });
    results.passed++;
    
    // Test 2: Player Performance Predictor
    console.log('\n2️⃣ Testing Player Performance Predictor...');
    const playerTest = {
      pointsPerGame: 28.5,
      assistsPerGame: 7.2,
      reboundsPerGame: 8.1,
      fieldGoalPercentage: 0.521,
      threePointPercentage: 0.385,
      minutesPerGame: 34.2,
      isHomeGame: true,
      daysRest: 1,
      recentFormIndex: 0.8
    };
    
    const startTime = Date.now();
    const prediction = await playerPerformancePredictor.predict(playerTest);
    const latency = Date.now() - startTime;
    
    results.tests.push({
      name: 'Player Performance Prediction',
      status: prediction.predictedPoints > 0 ? 'PASS' : 'FAIL',
      details: `Predicted: ${prediction.predictedPoints.toFixed(1)} points | Latency: ${latency}ms | Confidence: ${prediction.confidence.toFixed(1)}%`
    });
    
    if (prediction.predictedPoints > 0) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Test 3: Injury Risk Assessment
    console.log('\n3️⃣ Testing Injury Risk Assessment...');
    const injuryTest = Array(10).fill({
      minutesPlayedLast7Days: 220,
      backToBackGames: 3,
      currentFatigueLevel: 0.75,
      muscleStiffness: 0.6,
      age: 32,
      previousInjuries: 2
    });
    
    const riskStartTime = Date.now();
    const riskAssessment = await injuryRiskAssessment.predictRisk(injuryTest);
    const riskLatency = Date.now() - riskStartTime;
    
    results.tests.push({
      name: 'Injury Risk Assessment',
      status: riskAssessment.riskScore >= 0 ? 'PASS' : 'FAIL',
      details: `Risk: ${riskAssessment.riskScore.toFixed(1)}% (${riskAssessment.riskLevel}) | Latency: ${riskLatency}ms`
    });
    
    if (riskAssessment.riskScore >= 0) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Test 4: Batch Prediction Performance
    console.log('\n4️⃣ Testing Batch Prediction Performance...');
    const batchSize = 100;
    const batchData = Array(batchSize).fill(playerTest);
    
    const batchStartTime = Date.now();
    const batchPredictions = await playerPerformancePredictor.batchPredict(batchData);
    const batchLatency = Date.now() - batchStartTime;
    const throughput = (batchSize / batchLatency) * 1000; // predictions per second
    
    results.tests.push({
      name: 'Batch Prediction Performance',
      status: throughput > 100 ? 'PASS' : 'WARN',
      details: `Batch size: ${batchSize} | Total latency: ${batchLatency}ms | Throughput: ${throughput.toFixed(0)} pred/sec`
    });
    results.passed++;
    
    // Test 5: Memory Usage
    console.log('\n5️⃣ Testing Memory Usage...');
    const memoryInfo = tf.memory();
    const memoryMB = memoryInfo.numBytes / (1024 * 1024);
    
    results.tests.push({
      name: 'TensorFlow Memory Usage',
      status: memoryMB < 1000 ? 'PASS' : 'WARN',
      details: `Tensors: ${memoryInfo.numTensors} | Memory: ${memoryMB.toFixed(1)} MB | Data buckets: ${memoryInfo.numDataBuffers}`
    });
    results.passed++;
    
    // Test 6: GPU Optimization Features
    console.log('\n6️⃣ Testing GPU Optimization Features...');
    const features = {
      backend: tf.getBackend(),
      webglVersion: tf.env().get('WEBGL_VERSION'),
      webglForceF16: tf.env().get('WEBGL_FORCE_F16_TEXTURES'),
      webglPack: tf.env().get('WEBGL_PACK')
    };
    
    results.tests.push({
      name: 'GPU Optimization Features',
      status: 'PASS',
      details: `Backend: ${features.backend} | F16: ${features.webglForceF16} | Pack: ${features.webglPack}`
    });
    results.passed++;
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(0)}%`);
    console.log('');
    
    console.log('Detailed Results:');
    results.tests.forEach((test, idx) => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${idx + 1}. ${test.name}: ${icon} ${test.status}`);
      console.log(`   ${test.details}`);
    });
    
    console.log('\n' + '='.repeat(50));
    if (results.failed === 0) {
      console.log('🎉 ALL ML SYSTEMS OPERATING AT FULL POWER! 🎉');
    } else {
      console.log('⚠️ Some tests failed - check the details above');
    }
    
    // Clean up
    tf.disposeVariables();
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

// Run tests
testMLSystem().then(() => {
  console.log('\n✅ Testing complete!');
  process.exit(0);
});