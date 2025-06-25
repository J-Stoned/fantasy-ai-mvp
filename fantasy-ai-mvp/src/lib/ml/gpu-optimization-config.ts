/**
 * GPU OPTIMIZATION CONFIGURATION
 * Maximum performance settings for RTX 4060
 * Unleashes full GPU potential for ML workloads
 */

export interface GPUOptimizationConfig {
  // Hardware specifications
  hardware: {
    model: string;
    cudaCores: number;
    tensorCores: number;
    rtCores: number;
    vramGB: number;
    memoryBandwidth: number; // GB/s
    architecture: string;
    computeCapability: string;
  };
  
  // Memory optimization
  memory: {
    pooling: boolean;
    pinnedMemory: boolean;
    unifiedMemory: boolean;
    cachingAllocator: boolean;
    memoryFraction: number; // 0-1
    growthEnabled: boolean;
  };
  
  // Compute optimization
  compute: {
    tensorCoreUsage: boolean;
    mixedPrecision: 'FP32' | 'FP16' | 'INT8' | 'AUTO';
    cudnnBenchmark: boolean;
    cudnnDeterministic: boolean;
    mathMode: 'DEFAULT' | 'FAST' | 'ACCURATE';
    streams: number;
  };
  
  // Model optimization
  model: {
    quantization: boolean;
    pruning: boolean;
    distillation: boolean;
    fusedOperations: boolean;
    graphOptimization: boolean;
    jitCompilation: boolean;
  };
  
  // Runtime optimization
  runtime: {
    tensorRT: boolean;
    onnxRuntime: boolean;
    dynamicBatching: boolean;
    asyncExecution: boolean;
    multiStreamExecution: boolean;
    kernelFusion: boolean;
  };
  
  // Performance settings
  performance: {
    powerLimit: number; // Watts
    temperatureLimit: number; // Celsius
    clockOffset: number; // MHz
    memoryClockOffset: number; // MHz
    fanProfile: 'auto' | 'quiet' | 'balanced' | 'aggressive';
  };
}

// RTX 4060 Optimal Configuration
export const RTX_4060_OPTIMAL_CONFIG: GPUOptimizationConfig = {
  hardware: {
    model: 'NVIDIA GeForce RTX 4060',
    cudaCores: 3072,
    tensorCores: 96,
    rtCores: 24,
    vramGB: 8,
    memoryBandwidth: 272,
    architecture: 'Ada Lovelace',
    computeCapability: '8.9'
  },
  
  memory: {
    pooling: true,
    pinnedMemory: true,
    unifiedMemory: false, // Not supported on RTX 4060
    cachingAllocator: true,
    memoryFraction: 0.9, // Use 90% of VRAM
    growthEnabled: false // Pre-allocate for performance
  },
  
  compute: {
    tensorCoreUsage: true,
    mixedPrecision: 'FP16', // Best balance for 8GB VRAM
    cudnnBenchmark: true,
    cudnnDeterministic: false, // Faster but non-deterministic
    mathMode: 'FAST',
    streams: 4 // Multiple CUDA streams
  },
  
  model: {
    quantization: true, // INT8 for inference
    pruning: true, // Remove redundant weights
    distillation: false, // Optional
    fusedOperations: true,
    graphOptimization: true,
    jitCompilation: true
  },
  
  runtime: {
    tensorRT: true, // 10x faster inference
    onnxRuntime: true, // Cross-platform support
    dynamicBatching: true,
    asyncExecution: true,
    multiStreamExecution: true,
    kernelFusion: true
  },
  
  performance: {
    powerLimit: 200, // Watts (RTX 4060 TGP)
    temperatureLimit: 83, // Celsius
    clockOffset: 100, // MHz boost
    memoryClockOffset: 500, // MHz boost
    fanProfile: 'aggressive' // Maximum cooling
  }
};

// Model-specific optimizations
export const MODEL_SPECIFIC_CONFIGS = {
  // Player Performance Predictor - Large DNN
  playerPerformance: {
    batchSize: 256,
    precision: 'FP16' as const,
    tensorRT: true,
    memoryOptimization: 'aggressive',
    streamCount: 2
  },
  
  // Injury Risk Assessment - LSTM
  injuryRisk: {
    batchSize: 128,
    precision: 'FP16' as const,
    tensorRT: true,
    sequenceOptimization: true,
    streamCount: 1
  },
  
  // Lineup Optimizer - RL
  lineupOptimizer: {
    batchSize: 64,
    precision: 'FP32' as const, // RL needs precision
    tensorRT: false, // Not optimal for RL
    parallelEnvironments: 8,
    streamCount: 4
  },
  
  // Trade Analyzer - Ensemble
  tradeAnalyzer: {
    batchSize: 512,
    precision: 'INT8' as const, // Fast inference
    tensorRT: true,
    ensembleParallelism: true,
    streamCount: 2
  },
  
  // Multi-Modal Fusion - Transformer
  multiModalFusion: {
    batchSize: 64,
    precision: 'FP16' as const,
    tensorRT: true,
    attentionOptimization: true,
    streamCount: 2
  }
};

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  gpu: {
    utilizationWarning: 90,
    utilizationCritical: 95,
    memoryWarning: 85,
    memoryCritical: 95,
    temperatureWarning: 80,
    temperatureCritical: 87
  },
  
  inference: {
    latencyWarning: 50, // ms
    latencyCritical: 100, // ms
    throughputMinimum: 1000, // inferences/sec
    batchQueueWarning: 100,
    batchQueueCritical: 500
  },
  
  training: {
    lossStagnationEpochs: 5,
    gradientClippingThreshold: 1.0,
    learningRateMinimum: 1e-6,
    validationPatienceEpochs: 10
  }
};

// Optimization strategies
export class GPUOptimizer {
  private config: GPUOptimizationConfig;
  
  constructor(config: GPUOptimizationConfig = RTX_4060_OPTIMAL_CONFIG) {
    this.config = config;
  }
  
  /**
   * Get optimal batch size based on model and memory
   */
  getOptimalBatchSize(modelSizeMB: number, inputSizeMB: number): number {
    const availableMemory = this.config.hardware.vramGB * 1024 * this.config.memory.memoryFraction;
    const memoryPerBatch = modelSizeMB + inputSizeMB;
    const maxBatchSize = Math.floor(availableMemory / memoryPerBatch);
    
    // Round to nearest power of 2 for optimal performance
    return Math.pow(2, Math.floor(Math.log2(maxBatchSize)));
  }
  
  /**
   * Determine best precision for model type
   */
  getBestPrecision(modelType: string, taskType: 'training' | 'inference'): string {
    if (taskType === 'inference') {
      // Use INT8 for maximum speed if accuracy allows
      if (['classifier', 'ranker'].includes(modelType)) {
        return 'INT8';
      }
      return 'FP16';
    }
    
    // Training typically needs FP16 or FP32
    if (['reinforcement', 'gan'].includes(modelType)) {
      return 'FP32'; // These need full precision
    }
    return 'FP16'; // Good balance for most models
  }
  
  /**
   * Calculate theoretical FLOPS
   */
  getTheoreticalFlops(): number {
    const baseFlopsFP32 = this.config.hardware.cudaCores * 2 * this.config.hardware.clockOffset;
    const tensorFlopsFP16 = this.config.hardware.tensorCores * 64 * this.config.hardware.clockOffset;
    
    return this.config.compute.mixedPrecision === 'FP16' 
      ? tensorFlopsFP16 
      : baseFlopsFP32;
  }
  
  /**
   * Get memory bandwidth utilization
   */
  getMemoryBandwidthUtilization(dataTransferGB: number, timeSeconds: number): number {
    const actualBandwidth = dataTransferGB / timeSeconds;
    return (actualBandwidth / this.config.hardware.memoryBandwidth) * 100;
  }
}

// Export singleton optimizer
export const gpuOptimizer = new GPUOptimizer();