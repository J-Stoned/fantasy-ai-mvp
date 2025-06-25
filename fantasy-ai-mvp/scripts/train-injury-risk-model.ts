#!/usr/bin/env tsx
/**
 * 🏥 Train Injury Risk Assessment LSTM Model
 * Uses sequence data to predict injury probability
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

// Suppress TF warnings
process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainInjuryModel() {
  console.log('🏥 TRAINING INJURY RISK LSTM MODEL');
  console.log('==================================\n');
  
  try {
    // Load data
    console.log('1️⃣ Loading training data...');
    const dataPath = path.join(process.cwd(), 'training-data', 'injury-risk-lstm-data.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`   ✅ Loaded ${rawData.sequences.length} sequences\n`);
    
    // Prepare tensors
    console.log('2️⃣ Preparing LSTM sequences...');
    
    // Convert to tensors
    const sequences = tf.tensor3d(rawData.sequences);
    const labels = tf.tensor2d(rawData.labels);
    
    // Split data
    const splitIdx = Math.floor(rawData.sequences.length * 0.8);
    const xTrain = sequences.slice([0, 0, 0], [splitIdx, -1, -1]);
    const yTrain = labels.slice([0, 0], [splitIdx, -1]);
    const xVal = sequences.slice([splitIdx, 0, 0], [-1, -1, -1]);
    const yVal = labels.slice([splitIdx, 0], [-1, -1]);
    
    console.log(`   ✅ Train: ${splitIdx}, Val: ${rawData.sequences.length - splitIdx}\n`);
    
    // Create LSTM model
    console.log('3️⃣ Building LSTM architecture...');
    const model = tf.sequential({
      layers: [
        // LSTM layers
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [10, 21], // 10 timesteps, 21 features
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal',
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        tf.layers.lstm({
          units: 64,
          returnSequences: false,
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal',
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        // Dense layers
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        // Output layer (2 outputs: injury probability, severity)
        tf.layers.dense({
          units: 2,
          activation: 'sigmoid'
        })
      ]
    });
    
    // Custom loss function for imbalanced data
    const focalLoss = (yTrue: tf.Tensor, yPred: tf.Tensor) => {
      const gamma = 2.0;
      const alpha = 0.25;
      
      // Binary cross entropy
      const bce = tf.losses.sigmoidCrossEntropy(yTrue, yPred);
      
      // Focal loss modification
      const pt = tf.where(
        tf.equal(yTrue, 1),
        yPred,
        tf.sub(1, yPred)
      );
      
      const focal = tf.mul(
        tf.pow(tf.sub(1, pt), gamma),
        bce
      );
      
      return tf.mean(focal);
    };
    
    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    console.log(`   ✅ LSTM model created with ${model.countParams()} parameters\n`);
    
    // Train
    console.log('4️⃣ Training LSTM (this will take 3-5 minutes)...');
    
    const history = await model.fit(xTrain, yTrain, {
      epochs: 30,
      batchSize: 64,
      validationData: [xVal, yVal],
      verbose: 0,
      classWeight: { 0: 1, 1: 25 }, // Handle class imbalance
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if ((epoch + 1) % 10 === 0) {
            const acc = (logs?.acc || 0) * 100;
            const valAcc = (logs?.val_acc || 0) * 100;
            console.log(`   Epoch ${epoch + 1}/30 - Accuracy: ${acc.toFixed(1)}%, Val Accuracy: ${valAcc.toFixed(1)}%`);
          }
        }
      }
    });
    
    console.log('\n   ✅ Training complete!\n');
    
    // Evaluate
    console.log('5️⃣ Evaluating model...');
    const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
    const [loss, accuracy, precision, recall] = await Promise.all(evalResult.map(t => t.data()));
    
    console.log(`   Loss: ${loss[0].toFixed(3)}`);
    console.log(`   Accuracy: ${(accuracy[0] * 100).toFixed(1)}%`);
    console.log(`   Precision: ${(precision[0] * 100).toFixed(1)}%`);
    console.log(`   Recall: ${(recall[0] * 100).toFixed(1)}%\n`);
    
    // Calculate F1 score
    const f1 = 2 * (precision[0] * recall[0]) / (precision[0] + recall[0]);
    console.log(`   F1 Score: ${(f1 * 100).toFixed(1)}%\n`);
    
    // Save model
    console.log('6️⃣ Saving model...');
    const modelDir = path.join(process.cwd(), 'models', 'injury-risk');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    await model.save(`file://${modelDir}`);
    console.log(`   ✅ Model saved to ${modelDir}\n`);
    
    // Test prediction
    console.log('7️⃣ Testing with sample player...');
    
    // High-risk scenario: heavy minutes, back-to-back, older player
    const riskySequence = [];
    for (let i = 0; i < 10; i++) {
      riskySequence.push([
        40, 300, 1, 5, 25, 32, 80, 150, 15, 2, 20, 150, 32, 0.8, 0.6, 1, 2500, 1500, 75, 60
      ]);
    }
    
    const testInput = tf.tensor3d([riskySequence]);
    const prediction = model.predict(testInput) as tf.Tensor;
    const [injuryProb, severity] = await prediction.data();
    
    console.log('   High-risk player (heavy minutes, back-to-backs):');
    console.log(`   Injury probability: ${(injuryProb * 100).toFixed(1)}%`);
    console.log(`   Severity if injured: ${(severity * 100).toFixed(1)}%\n`);
    
    // Cleanup
    sequences.dispose();
    labels.dispose();
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();
    testInput.dispose();
    prediction.dispose();
    evalResult.forEach(t => t.dispose());
    
    console.log('==================================');
    console.log('🎉 INJURY RISK MODEL COMPLETE!');
    console.log('==================================');
    console.log(`✅ Model saved and ready for predictions`);
    console.log(`✅ Accuracy: ${(accuracy[0] * 100).toFixed(1)}%`);
    console.log(`✅ Can detect ${(recall[0] * 100).toFixed(1)}% of injuries`);
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

// Run
trainInjuryModel().catch(console.error);