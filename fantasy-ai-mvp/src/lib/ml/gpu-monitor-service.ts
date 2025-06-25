/**
 * GPU MONITORING SERVICE
 * Real-time GPU metrics from NVIDIA RTX 4060
 * Uses nvidia-smi for actual GPU data
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export interface GPUMetrics {
  timestamp: Date;
  gpu: {
    index: number;
    name: string;
    uuid: string;
    temperature: number;
    utilization: number;
    memoryUsed: number;
    memoryTotal: number;
    memoryUtilization: number;
    powerDraw: number;
    powerLimit: number;
    clockSpeed: number;
    memoryClockSpeed: number;
    fanSpeed: number;
    computeMode: string;
    performanceState: string;
  };
  processes: Array<{
    pid: number;
    name: string;
    memoryUsed: number;
  }>;
}

export class GPUMonitorService extends EventEmitter {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private lastMetrics: GPUMetrics | null = null;
  
  constructor() {
    super();
  }
  
  /**
   * Start monitoring GPU metrics
   */
  async startMonitoring(intervalMs: number = 1000): Promise<void> {
    if (this.isMonitoring) {
      console.log('GPU monitoring already active');
      return;
    }
    
    console.log('🎮 Starting GPU monitoring for RTX 4060...');
    this.isMonitoring = true;
    
    // Initial check
    const hasGPU = await this.checkGPUAvailability();
    if (!hasGPU) {
      console.warn('⚠️ No NVIDIA GPU detected. Using simulated data.');
      this.startSimulatedMonitoring(intervalMs);
      return;
    }
    
    // Start real monitoring
    this.pollingInterval = setInterval(async () => {
      try {
        const metrics = await this.getGPUMetrics();
        this.lastMetrics = metrics;
        this.emit('metrics', metrics);
      } catch (error) {
        console.error('Error fetching GPU metrics:', error);
        this.emit('error', error);
      }
    }, intervalMs);
    
    console.log('✅ GPU monitoring started');
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isMonitoring = false;
    console.log('GPU monitoring stopped');
  }
  
  /**
   * Check if NVIDIA GPU is available
   */
  private async checkGPUAvailability(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('nvidia-smi --list-gpus');
      return stdout.includes('GPU');
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get real GPU metrics using nvidia-smi
   */
  private async getGPUMetrics(): Promise<GPUMetrics> {
    try {
      // Query GPU metrics
      const { stdout: gpuInfo } = await execAsync(
        'nvidia-smi --query-gpu=index,name,uuid,temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw,power.limit,clocks.current.graphics,clocks.current.memory,fan.speed,compute_mode,pstate --format=csv,noheader,nounits'
      );
      
      const [
        index, name, uuid, temperature, utilization, memoryUsed, memoryTotal,
        powerDraw, powerLimit, clockSpeed, memoryClockSpeed, fanSpeed,
        computeMode, performanceState
      ] = gpuInfo.trim().split(', ');
      
      // Query running processes
      const { stdout: processInfo } = await execAsync(
        'nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv,noheader,nounits'
      );
      
      const processes = processInfo
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => {
          const [pid, name, memoryUsed] = line.split(', ');
          return {
            pid: parseInt(pid),
            name,
            memoryUsed: parseInt(memoryUsed)
          };
        });
      
      return {
        timestamp: new Date(),
        gpu: {
          index: parseInt(index),
          name,
          uuid,
          temperature: parseFloat(temperature),
          utilization: parseFloat(utilization),
          memoryUsed: parseInt(memoryUsed),
          memoryTotal: parseInt(memoryTotal),
          memoryUtilization: (parseInt(memoryUsed) / parseInt(memoryTotal)) * 100,
          powerDraw: parseFloat(powerDraw),
          powerLimit: parseFloat(powerLimit),
          clockSpeed: parseInt(clockSpeed),
          memoryClockSpeed: parseInt(memoryClockSpeed),
          fanSpeed: parseInt(fanSpeed),
          computeMode,
          performanceState
        },
        processes
      };
    } catch (error) {
      throw new Error(`Failed to get GPU metrics: ${error}`);
    }
  }
  
  /**
   * Start simulated monitoring for development
   */
  private startSimulatedMonitoring(intervalMs: number): void {
    this.pollingInterval = setInterval(() => {
      const baseUtilization = 70 + Math.sin(Date.now() / 5000) * 10;
      const metrics: GPUMetrics = {
        timestamp: new Date(),
        gpu: {
          index: 0,
          name: 'NVIDIA GeForce RTX 4060',
          uuid: 'GPU-12345678-1234-1234-1234-123456789012',
          temperature: 65 + Math.random() * 10,
          utilization: baseUtilization + Math.random() * 5,
          memoryUsed: 6000 + Math.random() * 1000,
          memoryTotal: 8192,
          memoryUtilization: (6500 / 8192) * 100,
          powerDraw: 150 + Math.random() * 30,
          powerLimit: 200,
          clockSpeed: 2400 + Math.random() * 100,
          memoryClockSpeed: 8000 + Math.random() * 500,
          fanSpeed: 40 + Math.random() * 20,
          computeMode: 'Default',
          performanceState: 'P2'
        },
        processes: [
          {
            pid: 12345,
            name: 'python',
            memoryUsed: 2048
          },
          {
            pid: 12346,
            name: 'node',
            memoryUsed: 1024
          }
        ]
      };
      
      this.lastMetrics = metrics;
      this.emit('metrics', metrics);
    }, intervalMs);
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics(): GPUMetrics | null {
    return this.lastMetrics;
  }
  
  /**
   * Get GPU optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    if (!this.lastMetrics) return [];
    
    const recommendations: string[] = [];
    const gpu = this.lastMetrics.gpu;
    
    if (gpu.temperature > 80) {
      recommendations.push('GPU temperature high - improve cooling or reduce load');
    }
    
    if (gpu.utilization < 50) {
      recommendations.push('GPU underutilized - increase batch size or parallel workers');
    }
    
    if (gpu.memoryUtilization > 90) {
      recommendations.push('GPU memory nearly full - reduce model size or batch size');
    }
    
    if (gpu.powerDraw > gpu.powerLimit * 0.95) {
      recommendations.push('Near power limit - consider undervolting for efficiency');
    }
    
    if (gpu.clockSpeed < 2300) {
      recommendations.push('GPU clock speed low - check thermal throttling');
    }
    
    return recommendations;
  }
  
  /**
   * Calculate GPU efficiency score
   */
  calculateEfficiencyScore(): number {
    if (!this.lastMetrics) return 0;
    
    const gpu = this.lastMetrics.gpu;
    
    // Factors for efficiency calculation
    const utilizationScore = Math.min(gpu.utilization / 85, 1) * 30; // Target 85%
    const temperatureScore = Math.max(0, (85 - gpu.temperature) / 20) * 20; // Lower is better
    const memoryScore = (gpu.memoryUtilization / 100) * 20; // Higher is better
    const powerScore = Math.max(0, 1 - (gpu.powerDraw / gpu.powerLimit)) * 15; // Power efficiency
    const clockScore = (gpu.clockSpeed / 2600) * 15; // Higher is better
    
    return Math.min(100, utilizationScore + temperatureScore + memoryScore + powerScore + clockScore);
  }
}

// Export singleton
export const gpuMonitor = new GPUMonitorService();