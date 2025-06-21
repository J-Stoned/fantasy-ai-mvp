import { EventEmitter } from "events";
import { unifiedMCPManager } from "./unified-mcp-manager";

/**
 * MCP Data Pipeline Service
 * Orchestrates complex data workflows using multiple MCP servers
 */

export interface DataPipelineConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: string; // Cron expression
  priority: "low" | "medium" | "high" | "critical";
  stages: DataPipelineStage[];
  errorHandling: {
    retryCount: number;
    retryDelay: number;
    failureAction: "continue" | "stop" | "rollback";
  };
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    endpoints: string[];
  };
}

export interface DataPipelineStage {
  id: string;
  name: string;
  serverId: string;
  operation: string;
  parameters: Record<string, any>;
  dependencies: string[]; // Previous stage IDs
  timeout: number;
  retries: number;
  validation: {
    required: boolean;
    schema?: any;
    customValidation?: string;
  };
  output: {
    transform?: string;
    store?: string;
    forward?: string[];
  };
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: "running" | "completed" | "failed" | "paused";
  startedAt: Date;
  completedAt?: Date;
  stages: StageExecution[];
  totalDuration?: number;
  dataProcessed: number;
  errors: string[];
  metrics: {
    stagesCompleted: number;
    stagesTotal: number;
    dataIn: number;
    dataOut: number;
    throughput: number;
  };
}

export interface StageExecution {
  stageId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  inputData?: any;
  outputData?: any;
  error?: string;
  retryCount: number;
}

export class MCPDataPipelineService extends EventEmitter {
  private pipelines: Map<string, DataPipelineConfig> = new Map();
  private executions: Map<string, PipelineExecution> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor() {
    super();
    this.initializeDefaultPipelines();
  }

  /**
   * Initialize default data pipelines for Fantasy.AI
   */
  private initializeDefaultPipelines() {
    // Fantasy Sports Data Collection Pipeline
    this.createPipeline({
      id: "fantasy_data_collection",
      name: "Fantasy Sports Data Collection",
      description: "Comprehensive data collection from multiple fantasy sports sources",
      enabled: true,
      schedule: "0 */5 * * * *", // Every 5 minutes
      priority: "high",
      stages: [
        {
          id: "injury_scraping",
          name: "Injury Report Scraping",
          serverId: "firecrawl",
          operation: "crawl_injury_reports",
          parameters: {
            sources: ["espn.com/nfl/injuries", "nfl.com/injuries", "fantasypros.com/nfl/injury-report"],
            selectors: {
              playerName: ".player-name, .injury-player",
              injuryType: ".injury-type, .injury-status",
              severity: ".injury-severity, .status"
            }
          },
          dependencies: [],
          timeout: 30000,
          retries: 2,
          validation: { required: true },
          output: { forward: ["injury_analysis"] }
        },
        {
          id: "depth_chart_extraction",
          name: "Depth Chart Extraction",
          serverId: "puppeteer",
          operation: "extract_depth_charts",
          parameters: {
            teams: ["all"],
            positions: ["QB", "RB", "WR", "TE", "K", "DST"]
          },
          dependencies: [],
          timeout: 45000,
          retries: 3,
          validation: { required: true },
          output: { forward: ["depth_analysis"] }
        },
        {
          id: "weather_data_collection",
          name: "Weather Data Collection",
          serverId: "firecrawl",
          operation: "collect_weather_data",
          parameters: {
            stadiums: "all",
            forecastDays: 7
          },
          dependencies: [],
          timeout: 20000,
          retries: 2,
          validation: { required: false },
          output: { forward: ["weather_analysis"] }
        },
        {
          id: "injury_analysis",
          name: "AI Injury Impact Analysis",
          serverId: "sequential_thinking",
          operation: "analyze_injury_impact",
          parameters: {
            analysisDepth: "comprehensive",
            includeHistorical: true
          },
          dependencies: ["injury_scraping"],
          timeout: 60000,
          retries: 1,
          validation: { required: true },
          output: { store: "knowledge_graph" }
        },
        {
          id: "depth_analysis",
          name: "Depth Chart Analysis",
          serverId: "knowledge_graph",
          operation: "analyze_depth_changes",
          parameters: {
            compareToWeeksPrior: 2,
            identifyOpportunities: true
          },
          dependencies: ["depth_chart_extraction"],
          timeout: 30000,
          retries: 2,
          validation: { required: true },
          output: { store: "postgresql" }
        },
        {
          id: "weather_analysis",
          name: "Weather Impact Analysis",
          serverId: "sequential_thinking",
          operation: "analyze_weather_impact",
          parameters: {
            positions: ["QB", "K"],
            impactThreshold: 15
          },
          dependencies: ["weather_data_collection"],
          timeout: 25000,
          retries: 1,
          validation: { required: false },
          output: { store: "knowledge_graph" }
        },
        {
          id: "data_synthesis",
          name: "Data Synthesis & Insights",
          serverId: "knowledge_graph",
          operation: "synthesize_insights",
          parameters: {
            includeInjuries: true,
            includeDepthChanges: true,
            includeWeather: true,
            generateRecommendations: true
          },
          dependencies: ["injury_analysis", "depth_analysis", "weather_analysis"],
          timeout: 45000,
          retries: 2,
          validation: { required: true },
          output: { store: "memory" }
        }
      ],
      errorHandling: {
        retryCount: 3,
        retryDelay: 5000,
        failureAction: "continue"
      },
      notifications: {
        onSuccess: true,
        onFailure: true,
        endpoints: ["dashboard", "slack"]
      }
    });

    // Player Performance Analysis Pipeline
    this.createPipeline({
      id: "player_performance_analysis",
      name: "Advanced Player Performance Analysis",
      description: "Deep analysis of player performance using multiple AI models",
      enabled: true,
      schedule: "0 0 */6 * * *", // Every 6 hours
      priority: "medium",
      stages: [
        {
          id: "player_stats_collection",
          name: "Player Statistics Collection",
          serverId: "firecrawl",
          operation: "collect_player_stats",
          parameters: {
            sources: ["nfl.com", "pro-football-reference.com", "fantasypros.com"],
            timeframe: "season",
            includeAdvanced: true
          },
          dependencies: [],
          timeout: 60000,
          retries: 3,
          validation: { required: true },
          output: { forward: ["performance_modeling"] }
        },
        {
          id: "historical_analysis",
          name: "Historical Performance Analysis",
          serverId: "postgresql",
          operation: "query_historical_data",
          parameters: {
            lookbackYears: 3,
            includePlayoffs: true,
            similarSituations: true
          },
          dependencies: [],
          timeout: 30000,
          retries: 2,
          validation: { required: true },
          output: { forward: ["performance_modeling"] }
        },
        {
          id: "performance_modeling",
          name: "AI Performance Modeling",
          serverId: "sequential_thinking",
          operation: "model_player_performance",
          parameters: {
            modelType: "ensemble",
            features: ["stats", "matchups", "weather", "rest", "trends"],
            confidenceThreshold: 0.7
          },
          dependencies: ["player_stats_collection", "historical_analysis"],
          timeout: 120000,
          retries: 1,
          validation: { required: true },
          output: { forward: ["projection_generation"] }
        },
        {
          id: "projection_generation",
          name: "Fantasy Projection Generation",
          serverId: "knowledge_graph",
          operation: "generate_projections",
          parameters: {
            weeks: 4,
            scenarios: ["best", "worst", "most_likely"],
            adjustForInjuries: true
          },
          dependencies: ["performance_modeling"],
          timeout: 45000,
          retries: 2,
          validation: { required: true },
          output: { store: "postgresql" }
        },
        {
          id: "recommendation_engine",
          name: "Player Recommendation Engine",
          serverId: "sequential_thinking",
          operation: "generate_recommendations",
          parameters: {
            categories: ["start", "sit", "trade", "pickup", "drop"],
            personalization: true,
            riskTolerance: "adaptive"
          },
          dependencies: ["projection_generation"],
          timeout: 30000,
          retries: 1,
          validation: { required: true },
          output: { store: "memory" }
        }
      ],
      errorHandling: {
        retryCount: 2,
        retryDelay: 10000,
        failureAction: "continue"
      },
      notifications: {
        onSuccess: false,
        onFailure: true,
        endpoints: ["dashboard"]
      }
    });

    // Real-time Market Analysis Pipeline
    this.createPipeline({
      id: "market_analysis",
      name: "Real-time Fantasy Market Analysis",
      description: "Analyze fantasy market trends and identify opportunities",
      enabled: true,
      schedule: "0 */15 * * * *", // Every 15 minutes
      priority: "high",
      stages: [
        {
          id: "market_data_scraping",
          name: "Fantasy Market Data Scraping",
          serverId: "puppeteer",
          operation: "scrape_market_data",
          parameters: {
            platforms: ["yahoo", "espn", "sleeper", "draftkings", "fanduel"],
            dataTypes: ["ownership", "pricing", "projections", "news"]
          },
          dependencies: [],
          timeout: 90000,
          retries: 2,
          validation: { required: true },
          output: { forward: ["trend_analysis", "arbitrage_detection"] }
        },
        {
          id: "trend_analysis",
          name: "Market Trend Analysis",
          serverId: "knowledge_graph",
          operation: "analyze_market_trends",
          parameters: {
            timeWindow: "24h",
            trendThreshold: 10,
            includeNews: true
          },
          dependencies: ["market_data_scraping"],
          timeout: 45000,
          retries: 2,
          validation: { required: true },
          output: { store: "postgresql" }
        },
        {
          id: "arbitrage_detection",
          name: "Cross-Platform Arbitrage Detection",
          serverId: "sequential_thinking",
          operation: "detect_arbitrage_opportunities",
          parameters: {
            minValueDifference: 5,
            platforms: "all",
            confidence: 0.8
          },
          dependencies: ["market_data_scraping"],
          timeout: 30000,
          retries: 1,
          validation: { required: true },
          output: { store: "memory" }
        },
        {
          id: "opportunity_ranking",
          name: "Opportunity Ranking & Prioritization",
          serverId: "sequential_thinking",
          operation: "rank_opportunities",
          parameters: {
            factors: ["value", "confidence", "time_sensitivity", "competition"],
            userPreferences: true
          },
          dependencies: ["trend_analysis", "arbitrage_detection"],
          timeout: 20000,
          retries: 1,
          validation: { required: true },
          output: { store: "memory" }
        }
      ],
      errorHandling: {
        retryCount: 3,
        retryDelay: 3000,
        failureAction: "continue"
      },
      notifications: {
        onSuccess: false,
        onFailure: true,
        endpoints: ["dashboard", "mobile_push"]
      }
    });

    console.log("✅ Initialized default MCP data pipelines");
  }

  /**
   * Create a new data pipeline
   */
  createPipeline(config: DataPipelineConfig): void {
    this.pipelines.set(config.id, config);
    
    if (config.enabled) {
      this.schedulePipeline(config);
    }
    
    this.emit("pipelineCreated", config);
    console.log(`📊 Created pipeline: ${config.name}`);
  }

  /**
   * Execute a pipeline manually
   */
  async executePipeline(pipelineId: string, parameters?: Record<string, any>): Promise<PipelineExecution> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const execution: PipelineExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pipelineId,
      status: "running",
      startedAt: new Date(),
      stages: pipeline.stages.map(stage => ({
        stageId: stage.id,
        status: "pending",
        retryCount: 0
      })),
      dataProcessed: 0,
      errors: [],
      metrics: {
        stagesCompleted: 0,
        stagesTotal: pipeline.stages.length,
        dataIn: 0,
        dataOut: 0,
        throughput: 0
      }
    };

    this.executions.set(execution.id, execution);
    
    console.log(`▶️ Executing pipeline: ${pipeline.name}`);
    this.emit("pipelineStarted", execution);

    try {
      await this.executeStages(pipeline, execution, parameters);
      
      execution.status = "completed";
      execution.completedAt = new Date();
      execution.totalDuration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.metrics.throughput = execution.dataProcessed / (execution.totalDuration / 1000);
      
      this.emit("pipelineCompleted", execution);
      
      if (pipeline.notifications.onSuccess) {
        await this.sendNotification(pipeline, execution, "success");
      }
      
    } catch (error) {
      execution.status = "failed";
      execution.errors.push(error instanceof Error ? error.message : String(error));
      
      this.emit("pipelineFailed", execution);
      
      if (pipeline.notifications.onFailure) {
        await this.sendNotification(pipeline, execution, "failure");
      }
    }

    return execution;
  }

  /**
   * Execute pipeline stages in dependency order
   */
  private async executeStages(
    pipeline: DataPipelineConfig, 
    execution: PipelineExecution, 
    parameters?: Record<string, any>
  ): Promise<void> {
    const stageResults = new Map<string, any>();
    const completedStages = new Set<string>();

    while (completedStages.size < pipeline.stages.length) {
      // Find stages ready to execute (dependencies satisfied)
      const readyStages = pipeline.stages.filter(stage => 
        !completedStages.has(stage.id) &&
        stage.dependencies.every(dep => completedStages.has(dep))
      );

      if (readyStages.length === 0) {
        throw new Error("Pipeline has circular dependencies or unreachable stages");
      }

      // Execute ready stages in parallel
      const stagePromises = readyStages.map(async (stage) => {
        const stageExecution = execution.stages.find(s => s.stageId === stage.id)!;
        
        try {
          stageExecution.status = "running";
          stageExecution.startedAt = new Date();
          
          // Prepare stage parameters
          const stageParams = {
            ...stage.parameters,
            ...parameters,
            // Include results from dependency stages
            dependencies: stage.dependencies.reduce((acc, depId) => {
              acc[depId] = stageResults.get(depId);
              return acc;
            }, {} as Record<string, any>)
          };

          // Execute stage with retries
          const result = await this.executeStageWithRetries(stage, stageParams);
          
          stageExecution.status = "completed";
          stageExecution.completedAt = new Date();
          stageExecution.duration = stageExecution.completedAt.getTime() - stageExecution.startedAt!.getTime();
          stageExecution.outputData = result;
          
          stageResults.set(stage.id, result);
          completedStages.add(stage.id);
          execution.metrics.stagesCompleted++;
          
          // Handle stage output
          await this.handleStageOutput(stage, result);
          
          this.emit("stageCompleted", { executionId: execution.id, stage, result });
          
        } catch (error) {
          stageExecution.status = "failed";
          stageExecution.error = error instanceof Error ? error.message : String(error);
          
          if (pipeline.errorHandling.failureAction === "stop") {
            throw error;
          } else if (pipeline.errorHandling.failureAction === "continue") {
            // Mark as completed to continue pipeline
            completedStages.add(stage.id);
            execution.errors.push(`Stage ${stage.name} failed: ${stageExecution.error}`);
          }
        }
      });

      await Promise.all(stagePromises);
    }
  }

  /**
   * Execute a single stage with retry logic
   */
  private async executeStageWithRetries(stage: DataPipelineStage, parameters: any): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= stage.retries; attempt++) {
      try {
        console.log(`🔧 Executing stage: ${stage.name} (attempt ${attempt + 1})`);
        
        const result = await unifiedMCPManager.executeCapability({
          operation: stage.operation,
          servers: [stage.serverId],
          priority: "medium",
          parameters,
          timeout: stage.timeout
        });
        
        // Validate result if schema provided
        if (stage.validation.required && !result) {
          throw new Error(`Stage ${stage.name} returned no result`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < stage.retries) {
          console.warn(`⚠️ Stage ${stage.name} failed (attempt ${attempt + 1}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        }
      }
    }
    
    throw lastError || new Error(`Stage ${stage.name} failed after ${stage.retries + 1} attempts`);
  }

  /**
   * Handle stage output (storage, forwarding, etc.)
   */
  private async handleStageOutput(stage: DataPipelineStage, result: any): Promise<void> {
    if (stage.output.store) {
      try {
        await unifiedMCPManager.executeCapability({
          operation: "store_data",
          servers: [stage.output.store],
          priority: "low",
          parameters: { data: result, source: stage.id }
        });
      } catch (error) {
        console.warn(`Failed to store result from ${stage.name}:`, error);
      }
    }
    
    if (stage.output.transform) {
      // Apply transformation logic here
      console.log(`Applying transformation: ${stage.output.transform}`);
    }
  }

  /**
   * Schedule pipeline execution
   */
  private schedulePipeline(pipeline: DataPipelineConfig): void {
    // Simple interval scheduling (in production, use a proper cron scheduler)
    const intervalMs = this.parseCronToInterval(pipeline.schedule);
    
    const job = setInterval(async () => {
      try {
        await this.executePipeline(pipeline.id);
      } catch (error) {
        console.error(`Scheduled execution failed for ${pipeline.name}:`, error);
      }
    }, intervalMs);
    
    this.scheduledJobs.set(pipeline.id, job);
    console.log(`⏰ Scheduled pipeline: ${pipeline.name} (interval: ${intervalMs}ms)`);
  }

  /**
   * Send notifications
   */
  private async sendNotification(
    pipeline: DataPipelineConfig, 
    execution: PipelineExecution, 
    type: "success" | "failure"
  ): Promise<void> {
    const message = {
      pipeline: pipeline.name,
      status: type,
      duration: execution.totalDuration,
      stagesCompleted: execution.metrics.stagesCompleted,
      stagesTotal: execution.metrics.stagesTotal,
      errors: execution.errors
    };
    
    for (const endpoint of pipeline.notifications.endpoints) {
      try {
        // In production, implement actual notification sending
        console.log(`📢 Notification to ${endpoint}:`, message);
      } catch (error) {
        console.warn(`Failed to send notification to ${endpoint}:`, error);
      }
    }
  }

  /**
   * Get pipeline execution status
   */
  getExecution(executionId: string): PipelineExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get all pipelines
   */
  getPipelines(): DataPipelineConfig[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * Get pipeline by ID
   */
  getPipeline(pipelineId: string): DataPipelineConfig | null {
    return this.pipelines.get(pipelineId) || null;
  }

  /**
   * Enable/disable pipeline
   */
  togglePipeline(pipelineId: string, enabled: boolean): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;
    
    pipeline.enabled = enabled;
    
    if (enabled) {
      this.schedulePipeline(pipeline);
    } else {
      const job = this.scheduledJobs.get(pipelineId);
      if (job) {
        clearInterval(job);
        this.scheduledJobs.delete(pipelineId);
      }
    }
    
    this.emit("pipelineToggled", { pipelineId, enabled });
  }

  /**
   * Get pipeline statistics
   */
  getStatistics() {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === "completed");
    const failed = executions.filter(e => e.status === "failed");
    
    return {
      totalPipelines: this.pipelines.size,
      activePipelines: Array.from(this.pipelines.values()).filter(p => p.enabled).length,
      totalExecutions: executions.length,
      successfulExecutions: completed.length,
      failedExecutions: failed.length,
      successRate: executions.length > 0 ? completed.length / executions.length : 0,
      averageExecutionTime: completed.length > 0 ? 
        completed.reduce((sum, e) => sum + (e.totalDuration || 0), 0) / completed.length : 0,
      totalDataProcessed: executions.reduce((sum, e) => sum + e.dataProcessed, 0)
    };
  }

  /**
   * Helper method to parse cron expression to interval (simplified)
   */
  private parseCronToInterval(cronExpression: string): number {
    // Simplified cron parsing - in production, use a proper cron library
    const parts = cronExpression.split(' ');
    
    if (parts[1] === '*/5') return 5 * 60 * 1000; // Every 5 minutes
    if (parts[1] === '*/15') return 15 * 60 * 1000; // Every 15 minutes
    if (parts[2] === '*/6') return 6 * 60 * 60 * 1000; // Every 6 hours
    
    return 60 * 60 * 1000; // Default to 1 hour
  }

  /**
   * Start the pipeline service
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Schedule all enabled pipelines
    for (const pipeline of this.pipelines.values()) {
      if (pipeline.enabled) {
        this.schedulePipeline(pipeline);
      }
    }
    
    console.log("▶️ MCP Data Pipeline Service started");
    this.emit("serviceStarted");
  }

  /**
   * Stop the pipeline service
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Clear all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      clearInterval(job);
    }
    this.scheduledJobs.clear();
    
    console.log("⏹️ MCP Data Pipeline Service stopped");
    this.emit("serviceStopped");
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    console.log("🧹 MCP Data Pipeline Service destroyed");
  }
}

// Export singleton instance
export const mcpDataPipelineService = new MCPDataPipelineService();