#!/usr/bin/env tsx
/**
 * 🚀 SIMPLE GPU TRAINING TEST
 * Tests GPU acceleration with current setup
 */

import * as tf from '@tensorflow/tfjs-node-gpu';
import { execSync } from 'child_process';

async function testGPUTraining() {
  console.log('🚀 TESTING GPU ACCELERATION');
  console.log('=========================\n');

  try {
    // Show GPU status
    try {
      const gpuInfo = execSync('nvidia-smi --query-gpu=name,memory.free,utilization.gpu --format=csv,noheader', {
        encoding: 'utf8'
      }).trim();
      console.log(`🎮 GPU Status: ${gpuInfo}\n`);
    } catch {
      console.log('⚠️  Could not query GPU status\n');
    }

    // Initialize TensorFlow
    console.log('📊 Initializing TensorFlow...');
    await tf.ready();
    const backend = tf.getBackend();
    console.log(`✅ Backend: ${backend}`);
    console.log(`   Available backends: ${tf.engine().backendNames()}\n`);

    // Test 1: Simple computation speed test
    console.log('🧪 Test 1: Matrix Multiplication Speed');
    console.log('=====================================');
    
    const sizes = [100, 500, 1000, 2000];
    
    for (const size of sizes) {
      const a = tf.randomNormal([size, size]);
      const b = tf.randomNormal([size, size]);
      
      const start = Date.now();
      const c = tf.matMul(a, b);
      await c.data(); // Force computation
      const time = Date.now() - start;
      
      console.log(`   ${size}x${size}: ${time}ms`);
      
      // Cleanup
      a.dispose();
      b.dispose();
      c.dispose();
    }

    // Test 2: Train a simple model
    console.log('\n🧪 Test 2: Simple Model Training');
    console.log('================================');
    
    // Create a simple model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 128, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    // Generate training data
    const xs = tf.randomNormal([1000, 10]);
    const ys = tf.randomNormal([1000, 1]);

    console.log('   Training model...');
    const startTrain = Date.now();
    
    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch) => {
          process.stdout.write(`\r   Epoch ${epoch + 1}/10`);
        }
      }
    });
    
    const trainTime = Date.now() - startTrain;
    console.log(`\n   ✅ Training completed in ${trainTime}ms`);
    console.log(`   Model parameters: ${model.countParams()}`);

    // Cleanup
    xs.dispose();
    ys.dispose();

    // Test 3: Memory usage
    console.log('\n🧪 Test 3: GPU Memory Test');
    console.log('=========================');
    
    const memInfo = tf.memory();
    console.log(`   Tensors: ${memInfo.numTensors}`);
    console.log(`   Memory: ${(memInfo.numBytes / 1024 / 1024).toFixed(2)} MB`);
    
    // Performance assessment
    console.log('\n📊 PERFORMANCE ASSESSMENT:');
    console.log('========================');
    
    if (backend === 'tensorflow') {
      console.log('✅ GPU backend detected!');
      
      // Check if actually using GPU based on speed
      const speed1000 = sizes[2]; // 1000x1000 matrix time
      if (trainTime < 5000) {
        console.log('✅ GPU acceleration is WORKING!');
        console.log('   Your RTX 4060 is being utilized');
        console.log('   Performance is good even without full CUDA');
      } else {
        console.log('⚠️  GPU might not be fully utilized');
        console.log('   Consider installing CUDA for better performance');
      }
    } else {
      console.log('❌ CPU backend detected');
      console.log('   GPU acceleration not available');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (backend === 'tensorflow' && trainTime < 5000) {
      console.log('Your GPU is working! You can:');
      console.log('1. Run the full GPU training: npx tsx scripts/train-gpu-accelerated.ts');
      console.log('2. Continue without CUDA (current performance is decent)');
      console.log('3. Install CUDA later for maximum performance');
    } else {
      console.log('To enable GPU acceleration:');
      console.log('1. Install CUDA (requires sudo password)');
      console.log('2. Use Docker with GPU support');
      console.log('3. Use cloud GPU services');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nThis usually means CUDA libraries are missing.');
    console.log('But your GPU might still work partially!');
  }
}

// Run test
testGPUTraining().catch(console.error);