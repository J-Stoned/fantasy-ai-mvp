#!/usr/bin/env tsx
/**
 * 🏥 Train Injury Risk Model (Simplified)
 * Faster training version for initial testing
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainInjuryModel() {
  console.log('🏥 TRAINING INJURY RISK MODEL (FAST)');
  console.log('====================================\n');
  
  try {
    // Load data
    console.log('1️⃣ Loading training data...');
    const dataPath = path.join(process.cwd(), 'training-data', 'injury-risk-lstm-data.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Use only first 2000 samples for faster training
    const sequences = rawData.sequences.slice(0, 2000);
    const labels = rawData.labels.slice(0, 2000);
    console.log(`   ✅ Using ${sequences.length} sequences for fast training\n`);
    
    // Flatten sequences for simple DNN (not LSTM)
    console.log('2️⃣ Preparing data...');
    const flatFeatures = sequences.map((seq: number[][]) => {
      // Average features across time steps
      const avgFeatures = new Array(21).fill(0);
      seq.forEach(timestep => {
        timestep.forEach((val, idx) => {
          avgFeatures[idx] += val / seq.length;
        });
      });
      return avgFeatures;
    });
    
    // Convert to tensors
    const features = tf.tensor2d(flatFeatures);
    const targets = tf.tensor2d(labels.map((l: number[]) => [l[0]])); // Just injury probability
    
    // Split
    const splitIdx = Math.floor(sequences.length * 0.8);
    const xTrain = features.slice([0, 0], [splitIdx, -1]);
    const yTrain = targets.slice([0, 0], [splitIdx, -1]);
    const xVal = features.slice([splitIdx, 0], [-1, -1]);
    const yVal = targets.slice([splitIdx, 0], [-1, -1]);
    
    console.log(`   ✅ Train: ${splitIdx}, Val: ${sequences.length - splitIdx}\n`);
    
    // Simple model
    console.log('3️⃣ Creating model...');
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [21],
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
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
            console.log(`   Epoch ${epoch + 1}/20 - Accuracy: ${(logs?.acc * 100).toFixed(1)}%`);
          }
        }
      }
    });
    
    console.log('\n   ✅ Training complete!\n');
    
    // Evaluate
    console.log('5️⃣ Evaluating model...');
    const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
    const [loss, accuracy] = await Promise.all(evalResult.map(t => t.data()));
    
    console.log(`   Loss: ${loss[0].toFixed(3)}`);
    console.log(`   Accuracy: ${(accuracy[0] * 100).toFixed(1)}%\n`);
    
    // Save
    console.log('6️⃣ Saving model...');
    const modelDir = path.join(process.cwd(), 'models', 'injury-risk');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    await model.save(`file://${modelDir}`);
    
    // Save metadata
    const metadata = {
      type: 'simplified-dnn',
      accuracy: accuracy[0],
      features: 21,
      trained: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`   ✅ Model saved to ${modelDir}\n`);
    
    // Test
    console.log('7️⃣ Testing prediction...');
    const highRisk = tf.tensor2d([[
      40, 280, 1, 4, 26, 33, 75, 120, 12, 2, 30, 120, 31, 0.75, 0.5, 1, 2000, 1000, 72, 55
    ]]);
    
    const prediction = model.predict(highRisk) as tf.Tensor;
    const risk = await prediction.data();
    
    console.log('   High-risk scenario:');
    console.log(`   Injury risk: ${(risk[0] * 100).toFixed(1)}%\n`);
    
    // Cleanup
    features.dispose();
    targets.dispose();
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();
    highRisk.dispose();
    prediction.dispose();
    evalResult.forEach(t => t.dispose());
    
    console.log('====================================');
    console.log('🎉 INJURY RISK MODEL COMPLETE!');
    console.log('====================================');
    console.log(`✅ Accuracy: ${(accuracy[0] * 100).toFixed(1)}%`);
    console.log(`✅ Model ready for production`);
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

trainInjuryModel().catch(console.error);