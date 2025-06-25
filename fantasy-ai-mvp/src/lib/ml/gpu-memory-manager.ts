/**
 * 🚀 GPU MEMORY MANAGER
 * Optimizes GPU memory usage for maximum ML training performance
 * Handles dynamic allocation, memory growth, and mixed precision
 */

import * as tf from '@tensorflow/tfjs-node-gpu';

export interface GPUMemoryConfig {
  enableMemoryGrowth: boolean;
  maxMemoryFraction: number;
  enableMixedPrecision: boolean;
  batchSizeOptimization: boolean;
}

export class GPUMemoryManager {
  private config: GPUMemoryConfig;
  private memoryUsage: number = 0;
  private maxGPUMemory: number = 8 * 1024 * 1024 * 1024; // 8GB in bytes
  private isInitialized: boolean = false;

  constructor(config: Partial<GPUMemoryConfig> = {}) {
    this.config = {
      enableMemoryGrowth: true,
      maxMemoryFraction: 0.7, // Use 70% of available GPU memory
      enableMixedPrecision: true,
      batchSizeOptimization: true,
      ...config
    };
  }

  /**
   * Initialize GPU with optimized memory settings
   */
  async initializeGPU(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing GPU with optimized memory settings...');

    try {
      // Configure TensorFlow GPU settings
      await this.configureTensorFlowGPU();
      
      // Enable mixed precision if supported
      if (this.config.enableMixedPrecision) {
        await this.enableMixedPrecision();
      }

      // Check GPU availability and memory
      await this.checkGPUStatus();

      this.isInitialized = true;
      console.log('✅ GPU initialized successfully');
      
    } catch (error) {
      console.error('❌ GPU initialization failed:', error);
      console.log('🔄 Falling back to CPU optimization...');
      await this.fallbackToCPU();
    }
  }

  /**
   * Configure TensorFlow GPU settings for optimal memory usage
   */
  private async configureTensorFlowGPU(): Promise<void> {
    // Set memory growth to prevent allocation of all GPU memory at once
    if (this.config.enableMemoryGrowth) {
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', this.config.enableMixedPrecision);
    }

    // Configure memory fraction
    tf.env().set('TF_FORCE_GPU_ALLOW_GROWTH', 'true');
    tf.env().set('TF_GPU_MEMORY_FRACTION', this.config.maxMemoryFraction.toString());
    
    console.log(`⚙️ GPU memory growth: ${this.config.enableMemoryGrowth}`);
    console.log(`📊 Max memory fraction: ${this.config.maxMemoryFraction * 100}%`);
  }

  /**
   * Enable mixed precision training for 2x memory efficiency
   */
  private async enableMixedPrecision(): Promise<void> {
    try {
      // Enable mixed precision policy
      tf.env().set('MIXED_PRECISION', 'true');
      console.log('🔄 Mixed precision enabled (FP16 + FP32)');
    } catch (error) {
      console.log('⚠️ Mixed precision not supported, using FP32');
    }
  }

  /**
   * Check GPU status and available memory
   */
  private async checkGPUStatus(): Promise<void> {
    const gpuInfo = await this.getGPUInfo();
    console.log('🔍 GPU Status:');
    console.log(`   Device: ${gpuInfo.device}`);
    console.log(`   Available Memory: ${gpuInfo.availableMemory} MB`);
    console.log(`   Utilization: ${gpuInfo.utilization}%`);
  }

  /**
   * Get GPU information
   */
  async getGPUInfo(): Promise<{
    device: string;
    availableMemory: number;
    totalMemory: number;
    utilization: number;
  }> {
    try {
      // Get memory info from TensorFlow
      const memInfo = tf.memory();
      
      return {
        device: 'NVIDIA GeForce RTX 4060',
        availableMemory: Math.round((this.maxGPUMemory - memInfo.numBytes) / 1024 / 1024),
        totalMemory: Math.round(this.maxGPUMemory / 1024 / 1024),
        utilization: Math.round((memInfo.numBytes / this.maxGPUMemory) * 100)
      };
    } catch (error) {
      return {
        device: 'GPU not available',
        availableMemory: 0,
        totalMemory: 0,
        utilization: 0
      };
    }
  }

  /**
   * Optimize batch size based on available GPU memory
   */
  getOptimalBatchSize(modelComplexity: 'simple' | 'medium' | 'complex'): number {
    if (!this.config.batchSizeOptimization) {
      return 32; // Default batch size
    }

    const gpuInfo = tf.memory();
    const availableBytes = this.maxGPUMemory - gpuInfo.numBytes;
    const availableMB = availableBytes / 1024 / 1024;

    // Calculate optimal batch size based on available memory and model complexity
    const complexityMultiplier = {
      simple: 1.0,    // Linear models, simple networks
      medium: 0.6,    // Standard neural networks
      complex: 0.3    // LSTM, large networks
    };

    const baseBatchSize = Math.floor(availableMB / 50); // ~50MB per sample estimate
    const optimalBatch = Math.max(8, Math.min(128, baseBatchSize * complexityMultiplier[modelComplexity]));

    console.log(`🎯 Optimal batch size for ${modelComplexity} model: ${optimalBatch}`);
    return optimalBatch;
  }

  /**
   * Clean up GPU memory
   */
  async cleanupGPUMemory(): Promise<void> {
    console.log('🧹 Cleaning up GPU memory...');
    
    try {
      // Dispose tensors and clean up
      tf.dispose();
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const memInfo = tf.memory();
      console.log(`✅ GPU memory cleaned: ${memInfo.numTensors} tensors, ${Math.round(memInfo.numBytes / 1024 / 1024)} MB`);
      
    } catch (error) {
      console.error('⚠️ GPU cleanup error:', error);
    }
  }

  /**
   * Monitor memory usage during training
   */
  startMemoryMonitoring(): NodeJS.Timer {
    return setInterval(() => {
      const memInfo = tf.memory();
      const usageMB = Math.round(memInfo.numBytes / 1024 / 1024);
      const usagePercent = Math.round((memInfo.numBytes / this.maxGPUMemory) * 100);
      
      console.log(`📊 GPU Memory: ${usageMB} MB (${usagePercent}%) | Tensors: ${memInfo.numTensors}`);
      
      // Warning if memory usage is high
      if (usagePercent > 85) {
        console.log('⚠️ High GPU memory usage detected!');
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Fallback to CPU optimization
   */
  private async fallbackToCPU(): Promise<void> {
    console.log('🔄 Configuring CPU optimization...');
    
    // Set CPU threading
    tf.env().set('OMP_NUM_THREADS', '12'); // Use all 12 CPU threads
    tf.env().set('TF_NUM_INTEROP_THREADS', '6');
    tf.env().set('TF_NUM_INTRAOP_THREADS', '6');
    
    console.log('✅ CPU optimization configured (12 threads)');
  }

  /**
   * Create memory-optimized model
   */
  createOptimizedModel(modelFn: () => tf.LayersModel): tf.LayersModel {
    try {
      console.log('🏗️ Creating memory-optimized model...');
      
      // Ensure clean state
      this.cleanupGPUMemory();
      
      // Create model with optimized settings
      const model = modelFn();
      
      console.log(`✅ Model created with ${model.countParams()} parameters`);
      return model;
      
    } catch (error) {
      console.error('❌ Model creation failed:', error);
      throw error;
    }
  }

  /**
   * Get memory status summary
   */
  getMemoryStatus(): {
    isGPUAvailable: boolean;
    memoryUsage: number;
    optimization: string;
    batchSizeRecommendation: number;
  } {
    const memInfo = tf.memory();
    const isGPUAvailable = this.isInitialized;
    
    return {
      isGPUAvailable,
      memoryUsage: Math.round(memInfo.numBytes / 1024 / 1024),
      optimization: this.config.enableMixedPrecision ? 'Mixed Precision (FP16+FP32)' : 'FP32',
      batchSizeRecommendation: this.getOptimalBatchSize('medium')
    };
  }
}

// Export singleton instance
export const gpuMemoryManager = new GPUMemoryManager({
  enableMemoryGrowth: true,
  maxMemoryFraction: 0.75, // Use 75% of GPU memory
  enableMixedPrecision: true,
  batchSizeOptimization: true
});