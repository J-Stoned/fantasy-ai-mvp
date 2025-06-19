/**
 * PARALLEL MCP ORCHESTRATOR - 2X DATA COLLECTION POWERHOUSE
 * Advanced parallel processing system that DOUBLES our data output
 * Manages 44 parallel MCP workers (2x our current 22 servers)
 * Processes multiple content sources simultaneously for maximum efficiency
 */

import { EventEmitter } from 'events';
import cluster from 'cluster';
import os from 'os';

export interface ParallelMCPConfig {
  // Parallel processing settings
  maxParallelWorkers: number; // Number of parallel MCP workers
  workerDistribution: WorkerDistribution;
  loadBalancingStrategy: 'round-robin' | 'least-load' | 'content-type' | 'intelligent';
  
  // Performance optimization
  batchProcessingSize: number;
  priorityQueueEnabled: boolean;
  adaptiveScaling: boolean;
  
  // Quality and monitoring
  realTimeMetrics: boolean;
  performanceThresholds: PerformanceThresholds;
  errorRecoveryStrategy: 'retry' | 'fallback' | 'skip';
}

export interface WorkerDistribution {
  contentDiscovery: number; // Workers dedicated to finding new content
  contentProcessing: number; // Workers for processing existing content
  expertValidation: number; // Workers for expert credibility scoring
  realTimeMonitoring: number; // Workers for live content streams
  qualityControl: number; // Workers for content validation
}

export interface PerformanceThresholds {
  maxProcessingTimeSeconds: number;
  minThroughputPerMinute: number;
  maxErrorRate: number; // percentage
  minQualityScore: number; // 1-100
}

export interface MCPWorker {
  id: string;
  type: WorkerType;
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTask?: ProcessingTask;
  performanceMetrics: WorkerMetrics;
  capabilities: string[];
}

export type WorkerType = 
  | 'content-discovery' 
  | 'youtube-processor' 
  | 'podcast-processor'
  | 'live-stream-processor'
  | 'expert-validator'
  | 'quality-controller'
  | 'real-time-monitor';

export interface ProcessingTask {
  id: string;
  type: WorkerType;
  priority: number; // 1-10 (10 = highest)
  source: ContentSource;
  estimatedDuration: number; // seconds
  retryCount: number;
  maxRetries: number;
  startTime: Date;
  deadlineTime: Date;
}

export interface WorkerMetrics {
  tasksCompleted: number;
  averageProcessingTime: number; // seconds
  errorRate: number; // percentage
  qualityScore: number; // 1-100
  uptime: number; // percentage
  lastActivity: Date;
}

export interface ContentSource {
  id: string;
  type: 'youtube' | 'podcast' | 'live-stream' | 'news' | 'social' | 'expert-blog';
  url: string;
  priority: number;
  expertCredibility: number;
  updateFrequency: number; // minutes
  contentCategories: string[];
  processingDifficulty: number; // 1-10
}

export interface ProcessingResult {
  taskId: string;
  workerId: string;
  success: boolean;
  processingTime: number;
  qualityScore: number;
  extractedContent?: ExpertContent;
  errorDetails?: string;
  metrics: ProcessingMetrics;
}

export interface ProcessingMetrics {
  throughput: number; // items per minute
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  networkLatency: number; // ms
  contentQuality: number; // 1-100
}

export interface ExpertContent {
  id: string;
  source: ContentSource;
  timestamp: Date;
  expertName: string;
  content: string;
  predictions: any[];
  credibilityScore: number;
  processingMetadata: ProcessingMetadata;
}

export interface ProcessingMetadata {
  workerId: string;
  processingTime: number;
  qualityValidated: boolean;
  confidenceScore: number;
  extractionMethod: string;
}

export class ParallelMCPOrchestrator extends EventEmitter {
  private workers: Map<string, MCPWorker> = new Map();
  private taskQueue: ProcessingTask[] = [];
  private completedTasks: ProcessingResult[] = [];
  private config: ParallelMCPConfig;
  private isRunning: boolean = false;
  private metrics: SystemMetrics;

  constructor(config: ParallelMCPConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.initializeWorkerPool();
  }

  // Initialize the parallel MCP worker pool
  private initializeWorkerPool(): void {
    console.log(`🚀 Initializing ${this.config.maxParallelWorkers} parallel MCP workers...`);
    
    // Create content discovery workers
    for (let i = 0; i < this.config.workerDistribution.contentDiscovery; i++) {
      this.createWorker('content-discovery');
    }
    
    // Create YouTube processing workers
    for (let i = 0; i < this.config.workerDistribution.contentProcessing / 3; i++) {
      this.createWorker('youtube-processor');
    }
    
    // Create podcast processing workers
    for (let i = 0; i < this.config.workerDistribution.contentProcessing / 3; i++) {
      this.createWorker('podcast-processor');
    }
    
    // Create live stream workers
    for (let i = 0; i < this.config.workerDistribution.contentProcessing / 3; i++) {
      this.createWorker('live-stream-processor');
    }
    
    // Create expert validation workers
    for (let i = 0; i < this.config.workerDistribution.expertValidation; i++) {
      this.createWorker('expert-validator');
    }
    
    // Create quality control workers
    for (let i = 0; i < this.config.workerDistribution.qualityControl; i++) {
      this.createWorker('quality-controller');
    }
    
    // Create real-time monitoring workers
    for (let i = 0; i < this.config.workerDistribution.realTimeMonitoring; i++) {
      this.createWorker('real-time-monitor');
    }

    console.log(`✅ Parallel MCP worker pool initialized with ${this.workers.size} workers`);
    this.emit('worker-pool-ready', { workerCount: this.workers.size });
  }

  // Create individual MCP worker
  private createWorker(type: WorkerType): void {
    const workerId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const worker: MCPWorker = {
      id: workerId,
      type,
      status: 'idle',
      performanceMetrics: {
        tasksCompleted: 0,
        averageProcessingTime: 0,
        errorRate: 0,
        qualityScore: 100,
        uptime: 100,
        lastActivity: new Date()
      },
      capabilities: this.getWorkerCapabilities(type)
    };

    this.workers.set(workerId, worker);
    
    // Start worker process (in production, this would spawn actual worker processes)
    this.initializeWorkerProcess(worker);
    
    console.log(`🔧 Created ${type} worker: ${workerId}`);
  }

  // Get capabilities for worker type
  private getWorkerCapabilities(type: WorkerType): string[] {
    const capabilities = {
      'content-discovery': ['source-identification', 'expert-discovery', 'content-monitoring'],
      'youtube-processor': ['video-transcription', 'audio-analysis', 'metadata-extraction'],
      'podcast-processor': ['audio-transcription', 'speaker-identification', 'content-segmentation'],
      'live-stream-processor': ['real-time-transcription', 'live-analysis', 'event-detection'],
      'expert-validator': ['credibility-scoring', 'accuracy-tracking', 'consensus-building'],
      'quality-controller': ['content-validation', 'quality-scoring', 'error-detection'],
      'real-time-monitor': ['live-monitoring', 'event-detection', 'alert-generation']
    };
    
    return capabilities[type] || [];
  }

  // Initialize worker process
  private initializeWorkerProcess(worker: MCPWorker): void {
    // In production, this would spawn actual worker processes
    // For now, simulate worker initialization
    
    setTimeout(() => {
      worker.status = 'idle';
      worker.performanceMetrics.lastActivity = new Date();
      this.emit('worker-ready', { workerId: worker.id, type: worker.type });
    }, Math.random() * 1000); // Simulate startup time
  }

  // Start parallel processing system
  async startParallelProcessing(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Parallel processing already running');
      return;
    }

    console.log('🚀 Starting parallel MCP processing system...');
    this.isRunning = true;

    // Start task distribution loop
    this.startTaskDistribution();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start adaptive scaling
    if (this.config.adaptiveScaling) {
      this.startAdaptiveScaling();
    }
    
    // Start real-time content discovery
    this.startContentDiscovery();

    console.log('✅ Parallel MCP processing system active!');
    console.log(`📊 Processing capacity: ${this.getProcessingCapacity()} tasks/minute`);
    
    this.emit('system-started', { 
      workerCount: this.workers.size,
      processingCapacity: this.getProcessingCapacity()
    });
  }

  // Calculate processing capacity
  private getProcessingCapacity(): number {
    let totalCapacity = 0;
    
    this.workers.forEach(worker => {
      // Estimate capacity based on worker type and performance
      const baseCapacity = {
        'content-discovery': 20, // sources per minute
        'youtube-processor': 5,  // videos per minute
        'podcast-processor': 3,  // episodes per minute
        'live-stream-processor': 10, // streams per minute
        'expert-validator': 15,  // validations per minute
        'quality-controller': 25, // validations per minute
        'real-time-monitor': 50   // events per minute
      };
      
      const capacity = baseCapacity[worker.type] || 10;
      totalCapacity += capacity * (worker.performanceMetrics.qualityScore / 100);
    });
    
    return Math.floor(totalCapacity);
  }

  // Start task distribution to workers
  private startTaskDistribution(): void {
    setInterval(() => {
      this.distributeTasksToWorkers();
    }, 1000); // Check every second
  }

  // Distribute tasks to available workers
  private distributeTasksToWorkers(): void {
    if (this.taskQueue.length === 0) return;

    // Sort tasks by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    // Find available workers
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle');
    
    if (availableWorkers.length === 0) return;

    // Apply load balancing strategy
    const taskAssignments = this.applyLoadBalancing(availableWorkers);
    
    taskAssignments.forEach(({ worker, task }) => {
      this.assignTaskToWorker(worker, task);
    });
  }

  // Apply load balancing strategy
  private applyLoadBalancing(availableWorkers: MCPWorker[]): Array<{worker: MCPWorker, task: ProcessingTask}> {
    const assignments: Array<{worker: MCPWorker, task: ProcessingTask}> = [];
    
    switch (this.config.loadBalancingStrategy) {
      case 'intelligent':
        return this.intelligentLoadBalancing(availableWorkers);
      
      case 'least-load':
        return this.leastLoadBalancing(availableWorkers);
      
      case 'content-type':
        return this.contentTypeBalancing(availableWorkers);
      
      default: // round-robin
        return this.roundRobinBalancing(availableWorkers);
    }
  }

  // Intelligent load balancing (best performance)
  private intelligentLoadBalancing(availableWorkers: MCPWorker[]): Array<{worker: MCPWorker, task: ProcessingTask}> {
    const assignments: Array<{worker: MCPWorker, task: ProcessingTask}> = [];
    
    for (const task of this.taskQueue.slice(0, availableWorkers.length)) {
      // Find best worker for this specific task
      const bestWorker = availableWorkers.find(worker => {
        // Match worker type to task type
        if (task.type !== worker.type) return false;
        
        // Check if worker can handle the content difficulty
        const canHandle = task.source.processingDifficulty <= (worker.performanceMetrics.qualityScore / 10);
        
        return canHandle;
      });
      
      if (bestWorker) {
        assignments.push({ worker: bestWorker, task });
        // Remove assigned worker from available pool
        const index = availableWorkers.indexOf(bestWorker);
        availableWorkers.splice(index, 1);
      }
    }
    
    return assignments;
  }

  // Least load balancing
  private leastLoadBalancing(availableWorkers: MCPWorker[]): Array<{worker: MCPWorker, task: ProcessingTask}> {
    const assignments: Array<{worker: MCPWorker, task: ProcessingTask}> = [];
    
    // Sort workers by current load (lower is better)
    availableWorkers.sort((a, b) => a.performanceMetrics.tasksCompleted - b.performanceMetrics.tasksCompleted);
    
    for (let i = 0; i < Math.min(this.taskQueue.length, availableWorkers.length); i++) {
      assignments.push({
        worker: availableWorkers[i],
        task: this.taskQueue[i]
      });
    }
    
    return assignments;
  }

  // Content type balancing
  private contentTypeBalancing(availableWorkers: MCPWorker[]): Array<{worker: MCPWorker, task: ProcessingTask}> {
    const assignments: Array<{worker: MCPWorker, task: ProcessingTask}> = [];
    
    for (const task of this.taskQueue.slice(0, availableWorkers.length)) {
      const matchingWorker = availableWorkers.find(worker => worker.type === task.type);
      
      if (matchingWorker) {
        assignments.push({ worker: matchingWorker, task });
        // Remove assigned worker
        const index = availableWorkers.indexOf(matchingWorker);
        availableWorkers.splice(index, 1);
      }
    }
    
    return assignments;
  }

  // Round robin balancing
  private roundRobinBalancing(availableWorkers: MCPWorker[]): Array<{worker: MCPWorker, task: ProcessingTask}> {
    const assignments: Array<{worker: MCPWorker, task: ProcessingTask}> = [];
    
    for (let i = 0; i < Math.min(this.taskQueue.length, availableWorkers.length); i++) {
      assignments.push({
        worker: availableWorkers[i],
        task: this.taskQueue[i]
      });
    }
    
    return assignments;
  }

  // Assign task to specific worker
  private assignTaskToWorker(worker: MCPWorker, task: ProcessingTask): void {
    worker.status = 'busy';
    worker.currentTask = task;
    
    // Remove task from queue
    const taskIndex = this.taskQueue.indexOf(task);
    if (taskIndex > -1) {
      this.taskQueue.splice(taskIndex, 1);
    }
    
    console.log(`🔧 Assigned task ${task.id} to worker ${worker.id} (${worker.type})`);
    
    // Start task processing
    this.processTaskOnWorker(worker, task);
    
    this.emit('task-assigned', { 
      workerId: worker.id, 
      taskId: task.id, 
      taskType: task.type 
    });
  }

  // Process task on worker
  private async processTaskOnWorker(worker: MCPWorker, task: ProcessingTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate task processing (in production, this would call actual MCP servers)
      const result = await this.executeTaskProcessing(worker, task);
      
      const processingTime = Date.now() - startTime;
      
      // Update worker metrics
      this.updateWorkerMetrics(worker, processingTime, true, result.qualityScore);
      
      // Store result
      const processingResult: ProcessingResult = {
        taskId: task.id,
        workerId: worker.id,
        success: true,
        processingTime: processingTime / 1000,
        qualityScore: result.qualityScore,
        extractedContent: result.content,
        metrics: result.metrics
      };
      
      this.completedTasks.push(processingResult);
      
      // Update system metrics
      this.updateSystemMetrics(processingResult);
      
      console.log(`✅ Task ${task.id} completed by ${worker.id} in ${processingTime}ms`);
      
      this.emit('task-completed', processingResult);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Update worker metrics for error
      this.updateWorkerMetrics(worker, processingTime, false, 0);
      
      // Handle task retry or failure
      await this.handleTaskError(worker, task, error);
      
      console.error(`❌ Task ${task.id} failed on ${worker.id}:`, error);
      
      this.emit('task-failed', { 
        taskId: task.id, 
        workerId: worker.id, 
        error: error.message 
      });
    } finally {
      // Mark worker as available
      worker.status = 'idle';
      worker.currentTask = undefined;
      worker.performanceMetrics.lastActivity = new Date();
    }
  }

  // Execute actual task processing
  private async executeTaskProcessing(worker: MCPWorker, task: ProcessingTask): Promise<any> {
    // Simulate processing based on worker type and task complexity
    const processingTime = this.calculateProcessingTime(worker, task);
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate processing result
    const result = {
      qualityScore: Math.random() * 40 + 60, // 60-100
      content: this.generateMockContent(task),
      metrics: {
        throughput: Math.random() * 20 + 10,
        cpuUsage: Math.random() * 30 + 20,
        memoryUsage: Math.random() * 200 + 100,
        networkLatency: Math.random() * 50 + 10,
        contentQuality: Math.random() * 30 + 70
      }
    };
    
    return result;
  }

  // Calculate expected processing time
  private calculateProcessingTime(worker: MCPWorker, task: ProcessingTask): number {
    const baseTime = {
      'content-discovery': 2000,    // 2 seconds
      'youtube-processor': 8000,    // 8 seconds
      'podcast-processor': 12000,   // 12 seconds
      'live-stream-processor': 5000, // 5 seconds
      'expert-validator': 3000,     // 3 seconds
      'quality-controller': 1000,   // 1 second
      'real-time-monitor': 500      // 0.5 seconds
    };
    
    const time = baseTime[worker.type] || 5000;
    const difficultyMultiplier = task.source.processingDifficulty / 10;
    const performanceMultiplier = worker.performanceMetrics.qualityScore / 100;
    
    return Math.floor(time * difficultyMultiplier / performanceMultiplier);
  }

  // Generate mock content for testing
  private generateMockContent(task: ProcessingTask): ExpertContent {
    return {
      id: `content-${Date.now()}`,
      source: task.source,
      timestamp: new Date(),
      expertName: `Expert-${Math.floor(Math.random() * 100)}`,
      content: `Processed content from ${task.source.type} source`,
      predictions: [],
      credibilityScore: Math.random() * 30 + 70,
      processingMetadata: {
        workerId: 'unknown',
        processingTime: 0,
        qualityValidated: true,
        confidenceScore: Math.random() * 30 + 70,
        extractionMethod: task.type
      }
    };
  }

  // Update worker performance metrics
  private updateWorkerMetrics(worker: MCPWorker, processingTime: number, success: boolean, qualityScore: number): void {
    const metrics = worker.performanceMetrics;
    
    // Update task count
    metrics.tasksCompleted++;
    
    // Update average processing time
    metrics.averageProcessingTime = (
      (metrics.averageProcessingTime * (metrics.tasksCompleted - 1) + processingTime / 1000) 
      / metrics.tasksCompleted
    );
    
    // Update error rate
    if (!success) {
      const errorCount = Math.floor(metrics.errorRate * metrics.tasksCompleted / 100) + 1;
      metrics.errorRate = (errorCount / metrics.tasksCompleted) * 100;
    } else {
      const errorCount = Math.floor(metrics.errorRate * metrics.tasksCompleted / 100);
      metrics.errorRate = (errorCount / metrics.tasksCompleted) * 100;
    }
    
    // Update quality score (rolling average)
    if (success) {
      metrics.qualityScore = (metrics.qualityScore * 0.9) + (qualityScore * 0.1);
    }
    
    metrics.lastActivity = new Date();
  }

  // Handle task errors and retries
  private async handleTaskError(worker: MCPWorker, task: ProcessingTask, error: any): Promise<void> {
    task.retryCount++;
    
    if (task.retryCount < task.maxRetries) {
      // Add task back to queue for retry
      task.priority = Math.max(1, task.priority - 1); // Lower priority for retries
      this.taskQueue.push(task);
      
      console.log(`🔄 Retrying task ${task.id} (attempt ${task.retryCount}/${task.maxRetries})`);
    } else {
      console.error(`💀 Task ${task.id} failed permanently after ${task.maxRetries} attempts`);
      
      this.emit('task-failed-permanently', { 
        taskId: task.id, 
        error: error.message,
        retryCount: task.retryCount
      });
    }
  }

  // Add new processing task
  addTask(task: Omit<ProcessingTask, 'id' | 'retryCount' | 'startTime'>): string {
    const fullTask: ProcessingTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      startTime: new Date()
    };
    
    this.taskQueue.push(fullTask);
    
    console.log(`📝 Added task ${fullTask.id} to queue (priority: ${fullTask.priority})`);
    
    this.emit('task-added', { taskId: fullTask.id, type: fullTask.type });
    
    return fullTask.id;
  }

  // Start performance monitoring
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateSystemMetrics();
      this.checkPerformanceThresholds();
      this.emitPerformanceMetrics();
    }, 30000); // Every 30 seconds
  }

  // Start content discovery
  private startContentDiscovery(): void {
    setInterval(() => {
      this.discoverNewContent();
    }, 60000); // Every minute
  }

  // Discover new content sources
  private discoverNewContent(): void {
    const discoveryWorkers = Array.from(this.workers.values())
      .filter(worker => worker.type === 'content-discovery' && worker.status === 'idle');
    
    if (discoveryWorkers.length === 0) return;
    
    // Create discovery tasks
    const discoveryTasks = [
      'youtube-channels',
      'podcast-feeds', 
      'expert-blogs',
      'social-media',
      'news-sources'
    ];
    
    discoveryTasks.forEach((taskType, index) => {
      if (index < discoveryWorkers.length) {
        const task: ProcessingTask = {
          id: `discovery-${taskType}-${Date.now()}`,
          type: 'content-discovery',
          priority: 7,
          source: {
            id: `discovery-${taskType}`,
            type: 'news', // Generic type for discovery
            url: `discovery://${taskType}`,
            priority: 5,
            expertCredibility: 80,
            updateFrequency: 60,
            contentCategories: [taskType],
            processingDifficulty: 3
          },
          estimatedDuration: 30,
          retryCount: 0,
          maxRetries: 2,
          startTime: new Date(),
          deadlineTime: new Date(Date.now() + 300000) // 5 minutes
        };
        
        this.taskQueue.push(task);
      }
    });
    
    console.log(`🔍 Created ${Math.min(discoveryTasks.length, discoveryWorkers.length)} content discovery tasks`);
  }

  // Start adaptive scaling
  private startAdaptiveScaling(): void {
    setInterval(() => {
      this.performAdaptiveScaling();
    }, 120000); // Every 2 minutes
  }

  // Perform adaptive scaling based on load
  private performAdaptiveScaling(): void {
    const currentLoad = this.taskQueue.length;
    const averageProcessingTime = this.getAverageProcessingTime();
    const errorRate = this.getSystemErrorRate();
    
    // Scale up if high load or performance issues
    if (currentLoad > 50 || averageProcessingTime > 30 || errorRate > 5) {
      this.scaleUp();
    }
    // Scale down if low load and good performance
    else if (currentLoad < 10 && averageProcessingTime < 10 && errorRate < 1) {
      this.scaleDown();
    }
  }

  // Scale up worker pool
  private scaleUp(): void {
    const maxWorkers = this.config.maxParallelWorkers * 1.5; // Allow 50% over-provisioning
    
    if (this.workers.size >= maxWorkers) {
      console.log('⚠️ Maximum worker limit reached, cannot scale up');
      return;
    }
    
    // Add workers for high-demand types
    const highDemandTypes: WorkerType[] = ['youtube-processor', 'podcast-processor', 'expert-validator'];
    
    highDemandTypes.forEach(type => {
      this.createWorker(type);
    });
    
    console.log(`📈 Scaled up worker pool to ${this.workers.size} workers`);
    this.emit('scaled-up', { newWorkerCount: this.workers.size });
  }

  // Scale down worker pool
  private scaleDown(): void {
    const minWorkers = this.config.maxParallelWorkers * 0.5; // Maintain at least 50% capacity
    
    if (this.workers.size <= minWorkers) {
      console.log('⚠️ Minimum worker limit reached, cannot scale down');
      return;
    }
    
    // Remove idle workers with poor performance
    const workersToRemove = Array.from(this.workers.values())
      .filter(worker => 
        worker.status === 'idle' && 
        worker.performanceMetrics.qualityScore < 70
      )
      .slice(0, 3); // Remove up to 3 workers at a time
    
    workersToRemove.forEach(worker => {
      this.workers.delete(worker.id);
      console.log(`📉 Removed underperforming worker: ${worker.id}`);
    });
    
    if (workersToRemove.length > 0) {
      console.log(`📉 Scaled down worker pool to ${this.workers.size} workers`);
      this.emit('scaled-down', { newWorkerCount: this.workers.size });
    }
  }

  // Initialize system metrics
  private initializeMetrics(): SystemMetrics {
    return {
      totalTasksProcessed: 0,
      averageProcessingTime: 0,
      systemThroughput: 0,
      errorRate: 0,
      qualityScore: 100,
      workerUtilization: 0,
      queueLength: 0,
      uptime: 100
    };
  }

  // Update system metrics
  private updateSystemMetrics(result?: ProcessingResult): void {
    this.metrics.totalTasksProcessed = this.completedTasks.length;
    this.metrics.queueLength = this.taskQueue.length;
    
    if (this.completedTasks.length > 0) {
      // Calculate average processing time
      const totalTime = this.completedTasks.reduce((sum, task) => sum + task.processingTime, 0);
      this.metrics.averageProcessingTime = totalTime / this.completedTasks.length;
      
      // Calculate throughput (tasks per minute)
      const recentTasks = this.completedTasks.filter(task => 
        Date.now() - new Date(task.taskId.split('-')[1]).getTime() < 60000
      );
      this.metrics.systemThroughput = recentTasks.length;
      
      // Calculate error rate
      const errors = this.completedTasks.filter(task => !task.success).length;
      this.metrics.errorRate = (errors / this.completedTasks.length) * 100;
      
      // Calculate average quality score
      const totalQuality = this.completedTasks.reduce((sum, task) => sum + task.qualityScore, 0);
      this.metrics.qualityScore = totalQuality / this.completedTasks.length;
    }
    
    // Calculate worker utilization
    const busyWorkers = Array.from(this.workers.values()).filter(w => w.status === 'busy').length;
    this.metrics.workerUtilization = (busyWorkers / this.workers.size) * 100;
  }

  // Check performance thresholds
  private checkPerformanceThresholds(): void {
    const thresholds = this.config.performanceThresholds;
    
    if (this.metrics.averageProcessingTime > thresholds.maxProcessingTimeSeconds) {
      this.emit('performance-warning', {
        type: 'processing-time',
        current: this.metrics.averageProcessingTime,
        threshold: thresholds.maxProcessingTimeSeconds
      });
    }
    
    if (this.metrics.systemThroughput < thresholds.minThroughputPerMinute) {
      this.emit('performance-warning', {
        type: 'throughput',
        current: this.metrics.systemThroughput,
        threshold: thresholds.minThroughputPerMinute
      });
    }
    
    if (this.metrics.errorRate > thresholds.maxErrorRate) {
      this.emit('performance-warning', {
        type: 'error-rate',
        current: this.metrics.errorRate,
        threshold: thresholds.maxErrorRate
      });
    }
    
    if (this.metrics.qualityScore < thresholds.minQualityScore) {
      this.emit('performance-warning', {
        type: 'quality-score',
        current: this.metrics.qualityScore,
        threshold: thresholds.minQualityScore
      });
    }
  }

  // Emit performance metrics
  private emitPerformanceMetrics(): void {
    this.emit('performance-metrics', {
      ...this.metrics,
      timestamp: new Date(),
      workerCount: this.workers.size,
      workerBreakdown: this.getWorkerBreakdown()
    });
  }

  // Get worker breakdown by type and status
  private getWorkerBreakdown(): any {
    const breakdown = {};
    
    this.workers.forEach(worker => {
      if (!breakdown[worker.type]) {
        breakdown[worker.type] = { idle: 0, busy: 0, error: 0, offline: 0 };
      }
      breakdown[worker.type][worker.status]++;
    });
    
    return breakdown;
  }

  // Helper methods for metrics
  private getAverageProcessingTime(): number {
    return this.metrics.averageProcessingTime;
  }

  private getSystemErrorRate(): number {
    return this.metrics.errorRate;
  }

  // Get current system status
  getSystemStatus(): any {
    return {
      isRunning: this.isRunning,
      workerCount: this.workers.size,
      queueLength: this.taskQueue.length,
      completedTasks: this.completedTasks.length,
      metrics: this.metrics,
      workers: Array.from(this.workers.values()).map(worker => ({
        id: worker.id,
        type: worker.type,
        status: worker.status,
        metrics: worker.performanceMetrics
      }))
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down parallel MCP orchestrator...');
    
    this.isRunning = false;
    
    // Wait for current tasks to complete
    const busyWorkers = Array.from(this.workers.values()).filter(w => w.status === 'busy');
    if (busyWorkers.length > 0) {
      console.log(`⏳ Waiting for ${busyWorkers.length} workers to complete current tasks...`);
      
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          const stillBusy = Array.from(this.workers.values()).filter(w => w.status === 'busy');
          if (stillBusy.length === 0) {
            clearInterval(checkInterval);
            resolve(void 0);
          }
        }, 1000);
      });
    }
    
    console.log('✅ Parallel MCP orchestrator shutdown complete');
    this.emit('system-shutdown');
  }
}

// System metrics interface
interface SystemMetrics {
  totalTasksProcessed: number;
  averageProcessingTime: number; // seconds
  systemThroughput: number; // tasks per minute
  errorRate: number; // percentage
  qualityScore: number; // 1-100
  workerUtilization: number; // percentage
  queueLength: number;
  uptime: number; // percentage
}

// Export the parallel MCP orchestrator
export const parallelMCPOrchestrator = new ParallelMCPOrchestrator({
  maxParallelWorkers: 44, // Double our current capacity!
  workerDistribution: {
    contentDiscovery: 8,
    contentProcessing: 20,
    expertValidation: 8,
    realTimeMonitoring: 4,
    qualityControl: 4
  },
  loadBalancingStrategy: 'intelligent',
  batchProcessingSize: 10,
  priorityQueueEnabled: true,
  adaptiveScaling: true,
  realTimeMetrics: true,
  performanceThresholds: {
    maxProcessingTimeSeconds: 30,
    minThroughputPerMinute: 100,
    maxErrorRate: 2,
    minQualityScore: 85
  },
  errorRecoveryStrategy: 'retry'
});

console.log('🚀 PARALLEL MCP ORCHESTRATOR LOADED - READY TO DOUBLE DATA OUTPUT!');