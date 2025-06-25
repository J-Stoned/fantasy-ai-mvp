import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Storage } from './storage';

interface PerformanceMetrics {
  fps: number;
  jsThreadCPU: number;
  uiThreadCPU: number;
  memoryUsage: number;
  diskUsage: number;
  batteryLevel: number;
  networkLatency: number;
  gpuUsage?: number;
}

interface FrameMetrics {
  timestamp: number;
  duration: number;
  skipped: boolean;
  uiThreadTime: number;
  jsThreadTime: number;
}

interface NativePerformanceModule {
  startMonitoring(interval: number): Promise<void>;
  stopMonitoring(): Promise<void>;
  getMetrics(): Promise<PerformanceMetrics>;
  getFrameMetrics(): Promise<FrameMetrics[]>;
  markPoint(name: string): Promise<void>;
  measure(name: string, startMark: string, endMark: string): Promise<number>;
}

class NativePerformanceMonitor {
  private static instance: NativePerformanceMonitor;
  private nativeModule: NativePerformanceModule;
  private eventEmitter: NativeEventEmitter;
  private isMonitoring: boolean = false;
  private metricsHistory: PerformanceMetrics[] = [];
  private frameHistory: FrameMetrics[] = [];
  private performanceMarks: Map<string, number> = new Map();
  private alertThresholds = {
    minFPS: 50,
    maxJSCPU: 80,
    maxUIcpu: 60,
    maxMemory: 300, // MB
    minBattery: 20,
    maxNetworkLatency: 200, // ms
  };
  
  private constructor() {
    if (!NativeModules.RNPerformanceMonitor) {
      console.warn('Native Performance Monitor not found. Using fallback.');
      this.nativeModule = this.createFallbackModule();
    } else {
      this.nativeModule = NativeModules.RNPerformanceMonitor;
    }
    
    this.eventEmitter = new NativeEventEmitter(NativeModules.RNPerformanceMonitor);
    this.setupEventListeners();
  }
  
  static getInstance(): NativePerformanceMonitor {
    if (!NativePerformanceMonitor.instance) {
      NativePerformanceMonitor.instance = new NativePerformanceMonitor();
    }
    return NativePerformanceMonitor.instance;
  }
  
  private setupEventListeners() {
    this.eventEmitter.addListener('performanceMetrics', this.handleMetrics);
    this.eventEmitter.addListener('frameDropped', this.handleFrameDrop);
    this.eventEmitter.addListener('memoryWarning', this.handleMemoryWarning);
  }
  
  private handleMetrics = (metrics: PerformanceMetrics) => {
    // Store metrics history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
    
    // Check for performance issues
    this.checkPerformanceAlerts(metrics);
    
    // Log to Sentry if critical
    if (metrics.fps < 30 || metrics.jsThreadCPU > 90) {
      Sentry.addBreadcrumb({
        message: 'Performance degradation detected',
        level: 'warning',
        data: metrics,
      });
    }
  };
  
  private handleFrameDrop = (frame: FrameMetrics) => {
    this.frameHistory.push(frame);
    if (this.frameHistory.length > 500) {
      this.frameHistory.shift();
    }
    
    // Calculate jank percentage
    const recentFrames = this.frameHistory.slice(-60);
    const droppedFrames = recentFrames.filter(f => f.skipped).length;
    const jankPercentage = (droppedFrames / recentFrames.length) * 100;
    
    if (jankPercentage > 5) {
      console.warn(`[Performance] High jank detected: ${jankPercentage.toFixed(1)}%`);
    }
  };
  
  private handleMemoryWarning = () => {
    console.warn('[Performance] Memory warning received');
    
    // Clear caches
    Storage.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Log to Sentry
    Sentry.captureMessage('Memory warning received', 'warning');
  };
  
  private checkPerformanceAlerts(metrics: PerformanceMetrics) {
    const alerts: string[] = [];
    
    if (metrics.fps < this.alertThresholds.minFPS) {
      alerts.push(`Low FPS: ${metrics.fps}`);
    }
    
    if (metrics.jsThreadCPU > this.alertThresholds.maxJSCPU) {
      alerts.push(`High JS CPU: ${metrics.jsThreadCPU}%`);
    }
    
    if (metrics.uiThreadCPU > this.alertThresholds.maxUIcpu) {
      alerts.push(`High UI CPU: ${metrics.uiThreadCPU}%`);
    }
    
    if (metrics.memoryUsage > this.alertThresholds.maxMemory) {
      alerts.push(`High memory: ${metrics.memoryUsage}MB`);
    }
    
    if (metrics.batteryLevel < this.alertThresholds.minBattery) {
      alerts.push(`Low battery: ${metrics.batteryLevel}%`);
    }
    
    if (metrics.networkLatency > this.alertThresholds.maxNetworkLatency) {
      alerts.push(`High latency: ${metrics.networkLatency}ms`);
    }
    
    if (alerts.length > 0) {
      this.onPerformanceAlert(alerts, metrics);
    }
  }
  
  private onPerformanceAlert(alerts: string[], metrics: PerformanceMetrics) {
    console.warn('[Performance] Alerts:', alerts.join(', '));
    
    // Adaptive performance mode
    if (metrics.fps < 45 || metrics.batteryLevel < 15) {
      this.enableLowPowerMode();
    }
  }
  
  private enableLowPowerMode() {
    // Reduce animation frame rate
    if (Platform.OS === 'ios') {
      NativeModules.RNPerformanceOptimizer?.setPreferredFramesPerSecond(30);
    }
    
    // Disable non-essential features
    Storage.set('low_power_mode', true);
    
    console.log('[Performance] Low power mode enabled');
  }
  
  private createFallbackModule(): NativePerformanceModule {
    let monitoringInterval: NodeJS.Timeout | null = null;
    const startTime = Date.now();
    
    return {
      startMonitoring: async (interval: number) => {
        if (monitoringInterval) return;
        
        monitoringInterval = setInterval(() => {
          const metrics: PerformanceMetrics = {
            fps: 60 - Math.random() * 10,
            jsThreadCPU: Math.random() * 50,
            uiThreadCPU: Math.random() * 40,
            memoryUsage: 150 + Math.random() * 100,
            diskUsage: Math.random() * 1000,
            batteryLevel: 100 - Math.random() * 30,
            networkLatency: Math.random() * 100,
          };
          
          this.handleMetrics(metrics);
        }, interval);
      },
      
      stopMonitoring: async () => {
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
          monitoringInterval = null;
        }
      },
      
      getMetrics: async () => {
        return {
          fps: 60,
          jsThreadCPU: 30,
          uiThreadCPU: 25,
          memoryUsage: 200,
          diskUsage: 500,
          batteryLevel: 85,
          networkLatency: 50,
        };
      },
      
      getFrameMetrics: async () => {
        return this.frameHistory;
      },
      
      markPoint: async (name: string) => {
        this.performanceMarks.set(name, Date.now());
      },
      
      measure: async (name: string, startMark: string, endMark: string) => {
        const start = this.performanceMarks.get(startMark);
        const end = this.performanceMarks.get(endMark);
        
        if (!start || !end) {
          throw new Error('Invalid marks');
        }
        
        return end - start;
      },
    };
  }
  
  // Public API
  async startMonitoring(interval: number = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    await this.nativeModule.startMonitoring(interval);
    
    // Start Sentry performance transaction
    const transaction = Sentry.startTransaction({
      name: 'app_session',
      op: 'navigation',
    });
    
    Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
  }
  
  async stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    await this.nativeModule.stopMonitoring();
    
    // Finish Sentry transaction
    const transaction = Sentry.getCurrentHub().getScope()?.getSpan();
    transaction?.finish();
  }
  
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    return this.nativeModule.getMetrics();
  }
  
  async getFrameMetrics(): Promise<FrameMetrics[]> {
    return this.nativeModule.getFrameMetrics();
  }
  
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }
  
  getAverageMetrics(): PerformanceMetrics {
    if (this.metricsHistory.length === 0) {
      return {
        fps: 60,
        jsThreadCPU: 0,
        uiThreadCPU: 0,
        memoryUsage: 0,
        diskUsage: 0,
        batteryLevel: 100,
        networkLatency: 0,
      };
    }
    
    const sum = this.metricsHistory.reduce((acc, metrics) => ({
      fps: acc.fps + metrics.fps,
      jsThreadCPU: acc.jsThreadCPU + metrics.jsThreadCPU,
      uiThreadCPU: acc.uiThreadCPU + metrics.uiThreadCPU,
      memoryUsage: acc.memoryUsage + metrics.memoryUsage,
      diskUsage: acc.diskUsage + metrics.diskUsage,
      batteryLevel: acc.batteryLevel + metrics.batteryLevel,
      networkLatency: acc.networkLatency + metrics.networkLatency,
    }));
    
    const count = this.metricsHistory.length;
    
    return {
      fps: sum.fps / count,
      jsThreadCPU: sum.jsThreadCPU / count,
      uiThreadCPU: sum.uiThreadCPU / count,
      memoryUsage: sum.memoryUsage / count,
      diskUsage: sum.diskUsage / count,
      batteryLevel: sum.batteryLevel / count,
      networkLatency: sum.networkLatency / count,
    };
  }
  
  async mark(name: string) {
    await this.nativeModule.markPoint(name);
    this.performanceMarks.set(name, Date.now());
  }
  
  async measure(name: string, startMark: string, endMark: string): Promise<number> {
    const duration = await this.nativeModule.measure(name, startMark, endMark);
    
    // Log to Sentry
    Sentry.addBreadcrumb({
      message: `Performance measure: ${name}`,
      level: 'info',
      data: { duration, startMark, endMark },
    });
    
    return duration;
  }
  
  getJankPercentage(): number {
    if (this.frameHistory.length === 0) return 0;
    
    const droppedFrames = this.frameHistory.filter(f => f.skipped).length;
    return (droppedFrames / this.frameHistory.length) * 100;
  }
  
  setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }
  
  clearHistory() {
    this.metricsHistory = [];
    this.frameHistory = [];
    this.performanceMarks.clear();
  }
}

export const performanceMonitor = NativePerformanceMonitor.getInstance();

// Auto-start monitoring in development
if (__DEV__) {
  performanceMonitor.startMonitoring(2000);
}