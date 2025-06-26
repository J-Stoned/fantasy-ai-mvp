/**
 * ML Configuration for Production
 * Optimized for Vercel serverless environment
 */

export const ML_CONFIG = {
  // Model paths (relative to public directory)
  models: {
    playerPerformance: '/models/player-performance.json',
    injuryRisk: '/models/injury-risk.json',
    lineupOptimizer: '/models/lineup-optimizer.json',
    tradeAnalyzer: '/models/trade-analyzer.json',
    draftAssistant: '/models/draft-assistant.json',
    gameOutcome: '/models/game-outcome.json',
  },
  
  // TensorFlow.js configuration
  tensorflow: {
    backend: process.env.NODE_ENV === 'production' ? 'cpu' : 'tensorflow',
    enableProdMode: true,
    flags: {
      WEBGL_PACK: false,
      CANVAS2D_WILL_READ_FREQUENTLY: true,
    }
  },
  
  // Model loading configuration
  loading: {
    maxRetries: 3,
    retryDelay: 1000,
    cacheModels: true,
    preloadModels: false, // Don't preload in serverless
  },
  
  // Performance settings
  performance: {
    batchSize: process.env.NODE_ENV === 'production' ? 1 : 32,
    maxConcurrent: 5,
    timeout: 30000, // 30 seconds
  },
  
  // Feature flags
  features: {
    enableGPU: false, // GPU not available in Vercel
    enableWebGL: false,
    enableWASM: true,
    enableProfiling: process.env.NODE_ENV !== 'production',
  }
};

// Environment-specific overrides
if (process.env.VERCEL) {
  ML_CONFIG.tensorflow.backend = 'cpu';
  ML_CONFIG.performance.batchSize = 1;
  ML_CONFIG.features.enableGPU = false;
}