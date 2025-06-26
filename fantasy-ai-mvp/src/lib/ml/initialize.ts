/**
 * ML Model Initialization for Production
 * Handles serverless cold starts efficiently
 */

import * as tf from '@tensorflow/tfjs';
import { ML_CONFIG } from './ml-config';

let initialized = false;

export async function initializeML() {
  if (initialized) return;
  
  try {
    console.log('🤖 Initializing ML models for production...');
    
    // Set backend
    await tf.setBackend(ML_CONFIG.tensorflow.backend);
    
    // Enable prod mode
    if (ML_CONFIG.tensorflow.enableProdMode) {
      tf.enableProdMode();
    }
    
    // Configure flags
    Object.entries(ML_CONFIG.tensorflow.flags).forEach(([flag, value]) => {
      tf.env().setFlags({ [flag]: value });
    });
    
    // Warm up TensorFlow
    const warmup = tf.ones([1, 1]);
    warmup.dispose();
    
    initialized = true;
    console.log('✅ ML models initialized successfully');
    console.log(`Backend: ${tf.getBackend()}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    
  } catch (error) {
    console.error('❌ Failed to initialize ML models:', error);
    // Don't throw - allow API to work without ML
    initialized = false;
  }
}

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  initializeML().catch(console.error);
}