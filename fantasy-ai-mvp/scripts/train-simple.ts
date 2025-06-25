#!/usr/bin/env tsx
/**
 * 🧠 Simple Model Training Script
 * Train player performance model with minimal output
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

// Suppress TensorFlow warnings
process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainModel() {
  console.log('🧠 TRAINING PLAYER PERFORMANCE MODEL');
  console.log('=====================================\n');
  
  try {
    // Load data
    console.log('1️⃣ Loading training data...');
    const dataPath = path.join(process.cwd(), 'training-data', 'ml-features-2023.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`   ✅ Loaded ${rawData.length} samples\n`);
    
    // Prepare tensors
    console.log('2️⃣ Preparing data...');
    const features = rawData.map((d: any) => d.features);
    const targets = rawData.map((d: any) => d.target);
    
    const featureTensor = tf.tensor2d(features);
    const targetTensor = tf.tensor2d(targets.map((t: number) => [t]));
    
    // Normalize
    const featureMean = featureTensor.mean(0);
    const featureStd = featureTensor.sub(featureMean).square().mean(0).sqrt().add(1e-7);
    const normalizedFeatures = featureTensor.sub(featureMean).div(featureStd);
    
    // Split data
    const splitIdx = Math.floor(features.length * 0.8);
    const xTrain = normalizedFeatures.slice([0, 0], [splitIdx, -1]);
    const yTrain = targetTensor.slice([0, 0], [splitIdx, -1]);
    const xVal = normalizedFeatures.slice([splitIdx, 0], [-1, -1]);
    const yVal = targetTensor.slice([splitIdx, 0], [-1, -1]);
    
    console.log(`   ✅ Train: ${splitIdx}, Val: ${features.length - splitIdx}\n`);
    
    // Create simple model
    console.log('3️⃣ Creating model...');
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [25], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    console.log(`   ✅ Model created with ${model.countParams()} parameters\n`);
    
    // Train
    console.log('4️⃣ Training model (this will take 2-3 minutes)...');
    
    const history = await model.fit(xTrain, yTrain, {
      epochs: 30,
      batchSize: 32,
      validationData: [xVal, yVal],
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if ((epoch + 1) % 10 === 0) {
            console.log(`   Epoch ${epoch + 1}/30 - Loss: ${logs?.loss?.toFixed(3)}, Val Loss: ${logs?.val_loss?.toFixed(3)}`);
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
    console.log(`   MAE: ${mae[0].toFixed(2)} fantasy points\n`);
    
    // Save model
    console.log('6️⃣ Saving model...');
    const modelDir = path.join(process.cwd(), 'models', 'player-performance');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    await model.save(`file://${modelDir}`);
    
    // Save normalization parameters
    const normParams = {
      mean: await featureMean.array(),
      std: await featureStd.array()
    };
    fs.writeFileSync(
      path.join(modelDir, 'normalization.json'),
      JSON.stringify(normParams, null, 2)
    );
    
    console.log(`   ✅ Model saved to ${modelDir}\n`);
    
    // Test prediction
    console.log('7️⃣ Testing with sample QB stats...');
    const sampleQB = [[10, 1, 15, 1, 300, 3, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 8, 0.58, 1, 0, 9]];
    const sampleTensor = tf.tensor2d(sampleQB);
    const normalizedSample = sampleTensor.sub(featureMean).div(featureStd);
    const prediction = model.predict(normalizedSample) as tf.Tensor;
    const predValue = await prediction.data();
    
    console.log('   QB with 300 yards, 3 TDs');
    console.log(`   Predicted: ${predValue[0].toFixed(1)} fantasy points\n`);
    
    // Cleanup
    featureTensor.dispose();
    targetTensor.dispose();
    normalizedFeatures.dispose();
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();
    featureMean.dispose();
    featureStd.dispose();
    sampleTensor.dispose();
    normalizedSample.dispose();
    prediction.dispose();
    evalResult.forEach(t => t.dispose());
    
    console.log('=====================================');
    console.log('🎉 MODEL TRAINING COMPLETE!');
    console.log('=====================================');
    console.log(`✅ Model saved and ready for predictions`);
    console.log(`✅ Average error: ${mae[0].toFixed(2)} fantasy points`);
    console.log(`✅ Next: Test the model with npm run ml:test`);
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

// Run
trainModel().catch(console.error);