import { EventEmitter } from "events";
import { knowledgeGraphService } from "../knowledge-graph-service";
import { sequentialThinkingService } from "../sequential-thinking-service";
import { mcpDataCollectionService } from "../mcp-data-collection-service";

/**
 * Unified MCP Manager - Enterprise Grade
 * Coordinates all 23 MCP servers for maximum efficiency and capability
 */

export interface MCPServerConfig {
  id: string;
  name: string;
  category: "core" | "ui_ux" | "testing" | "data" | "cloud" | "ai" | "development";
  type: "filesystem" | "github" | "memory" | "postgresql" | "magicui" | "playwright" | "puppeteer" | "sqlite" | "vercel" | "chart" | "firecrawl" | "knowledge_graph" | "sequential_thinking" | "figma" | "azure" | "desktop" | "kubernetes" | "nx" | "context7" | "mcp_installer" | "elevenlabs";
  endpoint: string;
  status: "healthy" | "warning" | "critical" | "maintenance" | "offline";
  capabilities: string[];
  version: string;
  lastPing: Date;
  metrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    uptime: number;
  };
  configuration: Record<string, any>;
}

export interface MCPWorkflow {
  id: string;
  name: string;
  description: string;
  servers: string[]; // MCP server IDs involved
  steps: MCPWorkflowStep[];
  status: "pending" | "running" | "completed" | "failed" | "paused";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: any;
  error?: string;
}

export interface MCPWorkflowStep {
  id: string;
  serverId: string;
  action: string;
  parameters: Record<string, any>;
  dependencies: string[]; // Previous step IDs
  timeout: number;
  retries: number;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface MCPCapabilityRequest {
  operation: string;
  category?: string;
  servers?: string[];
  priority: "low" | "medium" | "high" | "critical";
  parameters: Record<string, any>;
  timeout?: number;
  retries?: number;
}

export interface MCPSystemMetrics {
  totalServers: number;
  healthyServers: number;
  totalRequests: number;
  averageResponseTime: number;
  totalUptime: number;
  systemLoad: number;
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface MCPDataPipeline {
  id: string;
  name: string;
  description: string;
  sourceServers: string[];
  transformationSteps: Array<{
    serverId: string;
    operation: string;
    parameters: Record<string, any>;
  }>;
  destinationServers: string[];
  schedule: string; // Cron expression
  status: "active" | "paused" | "failed";
  lastRun?: Date;
  nextRun?: Date;
  metrics: {
    totalRuns: number;
    successfulRuns: number;
    averageProcessingTime: number;
    dataProcessed: number;
  };
}

export class UnifiedMCPManager extends EventEmitter {
  private servers: Map<string, MCPServerConfig> = new Map();
  private activeWorkflows: Map<string, MCPWorkflow> = new Map();
  private completedWorkflows: Map<string, MCPWorkflow> = new Map();
  private dataPipelines: Map<string, MCPDataPipeline> = new Map();
  private systemMetrics: MCPSystemMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    super();
    this.systemMetrics = this.initializeSystemMetrics();
    this.initializeServers();
    this.startHealthChecks();
    this.startMetricsCollection();
  }

  /**
   * Initialize all 23 MCP servers
   */
  private initializeServers() {
    console.log("🚀 Initializing 23 MCP servers...");

    // Core Development Servers
    this.registerServer({
      id: "filesystem",
      name: "Filesystem Server",
      category: "core",
      type: "filesystem",
      endpoint: "@modelcontextprotocol/server-filesystem",
      status: "healthy",
      capabilities: ["read_file", "write_file", "list_directory", "create_directory", "delete_file", "copy_file", "move_file"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { rootPath: "/", maxFileSize: 10485760 }
    });

    this.registerServer({
      id: "github",
      name: "GitHub Server",
      category: "core",
      type: "github",
      endpoint: "@modelcontextprotocol/server-github",
      status: "healthy",
      capabilities: ["repository_operations", "issue_management", "pr_management", "branch_operations", "workflow_management"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { apiToken: "configured", webhooks: true }
    });

    this.registerServer({
      id: "memory",
      name: "Memory Server",
      category: "ai",
      type: "memory",
      endpoint: "@modelcontextprotocol/server-memory",
      status: "healthy",
      capabilities: ["store_memory", "retrieve_memory", "search_memory", "delete_memory", "memory_graph"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { maxMemorySize: 1073741824, persistToDisk: true }
    });

    this.registerServer({
      id: "postgresql",
      name: "PostgreSQL Server",
      category: "data",
      type: "postgresql",
      endpoint: "@modelcontextprotocol/server-postgres",
      status: "healthy",
      capabilities: ["execute_query", "schema_management", "transaction_control", "backup_restore", "performance_monitoring"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { connectionPool: 20, queryTimeout: 30000 }
    });

    this.registerServer({
      id: "sequential_thinking",
      name: "Sequential Thinking Server",
      category: "ai",
      type: "sequential_thinking",
      endpoint: "@modelcontextprotocol/server-sequential-thinking",
      status: "healthy",
      capabilities: ["reasoning_chains", "problem_decomposition", "decision_frameworks", "alternative_evaluation"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { maxReasoningDepth: 10, timeoutPerStep: 5000 }
    });

    // UI/UX & Design Servers
    this.registerServer({
      id: "magicui_design",
      name: "MagicUI Design Server",
      category: "ui_ux",
      type: "magicui",
      endpoint: "@magicuidesign/mcp",
      status: "healthy",
      capabilities: ["generate_components", "component_variants", "animation_presets", "theme_generation"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { theme: "fantasy_sports", animationLevel: "enhanced" }
    });

    this.registerServer({
      id: "magicui_components",
      name: "MagicUI Components Server",
      category: "ui_ux",
      type: "magicui",
      endpoint: "magicui-mcp",
      status: "healthy",
      capabilities: ["component_library", "custom_components", "component_composition", "responsive_design"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { componentCache: true, preloadComponents: true }
    });

    this.registerServer({
      id: "figma_dev",
      name: "Figma Dev Server",
      category: "ui_ux",
      type: "figma",
      endpoint: "figma-developer-mcp",
      status: "healthy",
      capabilities: ["design_token_extraction", "component_generation", "asset_export", "design_sync"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { figmaToken: "configured", autoSync: true }
    });

    this.registerServer({
      id: "chart_visualization",
      name: "Chart Visualization Server",
      category: "ui_ux",
      type: "chart",
      endpoint: "@antv/mcp-server-chart",
      status: "healthy",
      capabilities: ["chart_generation", "data_visualization", "interactive_charts", "export_formats"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { chartEngine: "antv", interactivity: true }
    });

    // Testing & Automation Servers
    this.registerServer({
      id: "playwright_official",
      name: "Playwright Official Server",
      category: "testing",
      type: "playwright",
      endpoint: "@playwright/mcp",
      status: "healthy",
      capabilities: ["cross_browser_testing", "e2e_automation", "visual_regression", "performance_testing"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { browsers: ["chromium", "firefox", "webkit"], headless: true }
    });

    this.registerServer({
      id: "playwright_automation",
      name: "Playwright Automation Server",
      category: "testing",
      type: "playwright",
      endpoint: "@executeautomation/playwright-mcp-server",
      status: "healthy",
      capabilities: ["advanced_automation", "custom_patterns", "performance_monitoring", "specialized_testing"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { parallelTests: 4, retryCount: 2 }
    });

    this.registerServer({
      id: "puppeteer",
      name: "Puppeteer Server",
      category: "testing",
      type: "puppeteer",
      endpoint: "@kirkdeam/puppeteer-mcp-server",
      status: "healthy",
      capabilities: ["chrome_automation", "web_scraping", "pdf_generation", "screenshot_capture"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { chromeArgs: ["--no-sandbox"], timeout: 30000 }
    });

    this.registerServer({
      id: "desktop_commander",
      name: "Desktop Commander Server",
      category: "testing",
      type: "desktop",
      endpoint: "@wonderwhy-er/desktop-commander",
      status: "healthy",
      capabilities: ["desktop_automation", "system_monitoring", "process_management", "file_operations"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { systemAccess: true, monitoring: true }
    });

    this.registerServer({
      id: "kubernetes",
      name: "Kubernetes Server",
      category: "cloud",
      type: "kubernetes",
      endpoint: "mcp-server-kubernetes",
      status: "healthy",
      capabilities: ["cluster_management", "deployment_automation", "resource_scaling", "monitoring"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { cluster: "fantasy-ai-cluster", namespace: "production" }
    });

    // Data & Storage Servers
    this.registerServer({
      id: "sqlite",
      name: "SQLite Server",
      category: "data",
      type: "sqlite",
      endpoint: "sqlite-mcp-server",
      status: "healthy",
      capabilities: ["local_database", "query_execution", "schema_design", "data_import_export"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { dbPath: "./data/fantasy.db", journalMode: "WAL" }
    });

    this.registerServer({
      id: "knowledge_graph",
      name: "Knowledge Graph Server",
      category: "ai",
      type: "knowledge_graph",
      endpoint: "knowledgegraph-mcp",
      status: "healthy",
      capabilities: ["entity_relationships", "semantic_search", "graph_analysis", "pattern_detection"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { maxNodes: 100000, maxRelationships: 500000 }
    });

    this.registerServer({
      id: "context7",
      name: "Context7 Server",
      category: "ai",
      type: "context7",
      endpoint: "@upstash/context7-mcp",
      status: "healthy",
      capabilities: ["document_storage", "context_search", "semantic_analysis", "content_summarization"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { vectorDimensions: 1536, indexing: "semantic" }
    });

    // Cloud & Deployment Servers
    this.registerServer({
      id: "vercel",
      name: "Vercel Server",
      category: "cloud",
      type: "vercel",
      endpoint: "@vercel/mcp-adapter",
      status: "healthy",
      capabilities: ["deployment_automation", "environment_management", "performance_monitoring", "domain_configuration"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { team: "fantasy-ai", autoDeployment: true }
    });

    this.registerServer({
      id: "azure",
      name: "Azure Server",
      category: "cloud",
      type: "azure",
      endpoint: "@azure/mcp",
      status: "healthy",
      capabilities: ["resource_management", "cloud_deployment", "database_management", "security_configuration"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { subscription: "fantasy-ai-prod", region: "eastus" }
    });

    this.registerServer({
      id: "nx_monorepo",
      name: "Nx Monorepo Server",
      category: "development",
      type: "nx",
      endpoint: "nx-mcp",
      status: "healthy",
      capabilities: ["monorepo_management", "build_optimization", "code_sharing", "dependency_analysis"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { workspace: "fantasy-ai-workspace", cache: true }
    });

    // Development Tools
    this.registerServer({
      id: "firecrawl",
      name: "Firecrawl Server",
      category: "data",
      type: "firecrawl",
      endpoint: "firecrawl-mcp",
      status: "healthy",
      capabilities: ["web_crawling", "content_extraction", "api_discovery", "data_monitoring"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { concurrency: 10, respectRobots: true }
    });

    this.registerServer({
      id: "mcp_installer",
      name: "MCP Installer Server",
      category: "development",
      type: "mcp_installer",
      endpoint: "@anaisbetts/mcp-installer",
      status: "healthy",
      capabilities: ["server_discovery", "installation_management", "dependency_resolution", "version_management"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { autoUpdate: true, registry: "official" }
    });

    // Voice AI Server
    this.registerServer({
      id: "elevenlabs",
      name: "ElevenLabs Voice Server",
      category: "ai",
      type: "elevenlabs",
      endpoint: "elevenlabs-mcp",
      status: "healthy",
      capabilities: ["text_to_speech", "voice_cloning", "audio_processing", "transcription", "voice_agents"],
      version: "1.0.0",
      lastPing: new Date(),
      metrics: this.generateMockMetrics(),
      configuration: { apiKey: "configured", voiceLibrary: "premium" }
    });

    this.isInitialized = true;
    console.log(`✅ Initialized ${this.servers.size} MCP servers successfully`);
    this.emit("serversInitialized", { count: this.servers.size });
  }

  /**
   * Register a new MCP server
   */
  private registerServer(config: MCPServerConfig) {
    this.servers.set(config.id, config);
    this.emit("serverRegistered", config);
  }

  /**
   * Execute capability across appropriate MCP servers
   */
  async executeCapability(request: MCPCapabilityRequest): Promise<any> {
    console.log(`🔧 Executing capability: ${request.operation}`);
    
    // Find appropriate servers
    const candidateServers = this.findServersForCapability(request);
    
    if (candidateServers.length === 0) {
      throw new Error(`No servers found with capability: ${request.operation}`);
    }

    // Execute on best server or multiple servers based on request
    const results = [];
    const servers = request.servers ? 
      candidateServers.filter(s => request.servers!.includes(s.id)) : 
      [candidateServers[0]]; // Use best match

    for (const server of servers) {
      try {
        const result = await this.executeOnServer(server.id, request.operation, request.parameters);
        results.push({ serverId: server.id, result });
      } catch (error) {
        results.push({ serverId: server.id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results.length === 1 ? results[0] : results;
  }

  /**
   * Create and execute complex workflows
   */
  async executeWorkflow(workflow: Omit<MCPWorkflow, "id" | "status" | "createdAt">): Promise<MCPWorkflow> {
    const workflowInstance: MCPWorkflow = {
      ...workflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: new Date()
    };

    this.activeWorkflows.set(workflowInstance.id, workflowInstance);
    
    console.log(`🔄 Starting workflow: ${workflowInstance.name}`);
    
    try {
      workflowInstance.status = "running";
      workflowInstance.startedAt = new Date();
      
      const results = await this.executeWorkflowSteps(workflowInstance);
      
      workflowInstance.status = "completed";
      workflowInstance.completedAt = new Date();
      workflowInstance.results = results;
      
      this.completedWorkflows.set(workflowInstance.id, workflowInstance);
      this.activeWorkflows.delete(workflowInstance.id);
      
      this.emit("workflowCompleted", workflowInstance);
      
    } catch (error) {
      workflowInstance.status = "failed";
      workflowInstance.error = error instanceof Error ? error.message : String(error);
      
      this.emit("workflowFailed", workflowInstance);
    }

    return workflowInstance;
  }

  /**
   * Create and manage data pipelines
   */
  async createDataPipeline(pipeline: Omit<MCPDataPipeline, "id" | "status" | "metrics">): Promise<MCPDataPipeline> {
    const pipelineInstance: MCPDataPipeline = {
      ...pipeline,
      id: `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "active",
      metrics: {
        totalRuns: 0,
        successfulRuns: 0,
        averageProcessingTime: 0,
        dataProcessed: 0
      }
    };

    this.dataPipelines.set(pipelineInstance.id, pipelineInstance);
    
    console.log(`📊 Created data pipeline: ${pipelineInstance.name}`);
    this.emit("pipelineCreated", pipelineInstance);
    
    return pipelineInstance;
  }

  /**
   * Execute data pipeline
   */
  async runDataPipeline(pipelineId: string): Promise<any> {
    const pipeline = this.dataPipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    console.log(`▶️ Running data pipeline: ${pipeline.name}`);
    const startTime = Date.now();
    
    try {
      // Collect data from source servers
      const sourceData = await this.collectFromSources(pipeline.sourceServers);
      
      // Apply transformations
      let transformedData = sourceData;
      for (const transformation of pipeline.transformationSteps) {
        transformedData = await this.executeOnServer(
          transformation.serverId,
          transformation.operation,
          { ...transformation.parameters, data: transformedData }
        );
      }
      
      // Store in destination servers
      await this.storeInDestinations(pipeline.destinationServers, transformedData);
      
      const processingTime = Date.now() - startTime;
      
      // Update metrics
      pipeline.metrics.totalRuns++;
      pipeline.metrics.successfulRuns++;
      pipeline.metrics.averageProcessingTime = 
        (pipeline.metrics.averageProcessingTime * (pipeline.metrics.totalRuns - 1) + processingTime) / pipeline.metrics.totalRuns;
      pipeline.metrics.dataProcessed += JSON.stringify(transformedData).length;
      pipeline.lastRun = new Date();
      
      this.emit("pipelineRunCompleted", { pipelineId, data: transformedData, processingTime });
      
      return transformedData;
      
    } catch (error) {
      pipeline.metrics.totalRuns++;
      this.emit("pipelineRunFailed", { pipelineId, error });
      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    servers: MCPServerConfig[];
    metrics: MCPSystemMetrics;
    workflows: { active: number; completed: number };
    pipelines: { active: number; total: number };
  } {
    return {
      servers: Array.from(this.servers.values()),
      metrics: this.systemMetrics,
      workflows: {
        active: this.activeWorkflows.size,
        completed: this.completedWorkflows.size
      },
      pipelines: {
        active: Array.from(this.dataPipelines.values()).filter(p => p.status === "active").length,
        total: this.dataPipelines.size
      }
    };
  }

  /**
   * Get server by ID
   */
  getServer(serverId: string): MCPServerConfig | null {
    return this.servers.get(serverId) || null;
  }

  /**
   * Get servers by category
   */
  getServersByCategory(category: MCPServerConfig["category"]): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(server => server.category === category);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): MCPWorkflow | null {
    return this.activeWorkflows.get(workflowId) || this.completedWorkflows.get(workflowId) || null;
  }

  /**
   * Private helper methods
   */
  private findServersForCapability(request: MCPCapabilityRequest): MCPServerConfig[] {
    const candidates = Array.from(this.servers.values())
      .filter(server => 
        server.status === "healthy" && 
        server.capabilities.some(cap => cap.includes(request.operation) || request.operation.includes(cap))
      )
      .sort((a, b) => {
        // Sort by success rate and response time
        const scoreA = a.metrics.successRate / a.metrics.averageResponseTime;
        const scoreB = b.metrics.successRate / b.metrics.averageResponseTime;
        return scoreB - scoreA;
      });

    if (request.category) {
      return candidates.filter(server => server.category === request.category);
    }

    return candidates;
  }

  private async executeOnServer(serverId: string, operation: string, parameters: Record<string, any>): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    console.log(`🔧 Executing ${operation} on ${server.name}`);
    
    // Simulate MCP server call - in production, this would make actual MCP calls
    const startTime = Date.now();
    
    try {
      // Route to appropriate service based on server type
      let result;
      switch (server.type) {
        case "knowledge_graph":
          result = await this.executeKnowledgeGraphOperation(operation, parameters);
          break;
        case "sequential_thinking":
          result = await this.executeSequentialThinkingOperation(operation, parameters);
          break;
        case "firecrawl":
        case "puppeteer":
          result = await this.executeDataCollectionOperation(operation, parameters, server.type);
          break;
        default:
          result = await this.executeGenericOperation(server, operation, parameters);
      }
      
      const responseTime = Date.now() - startTime;
      
      // Update server metrics
      server.metrics.requestsPerSecond++;
      server.metrics.averageResponseTime = 
        (server.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
      server.metrics.successRate = Math.min(1, server.metrics.successRate + 0.01);
      server.lastPing = new Date();
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update error metrics
      server.metrics.errorRate = Math.min(1, server.metrics.errorRate + 0.05);
      server.metrics.successRate = Math.max(0, server.metrics.successRate - 0.05);
      
      throw error;
    }
  }

  private async executeKnowledgeGraphOperation(operation: string, parameters: any): Promise<any> {
    switch (operation) {
      case "get_insights":
        return await knowledgeGraphService.getInsights(parameters);
      case "add_player":
        return await knowledgeGraphService.addPlayer(parameters);
      case "create_relationship":
        return await knowledgeGraphService.createRelationship(parameters);
      default:
        return { success: true, operation, parameters };
    }
  }

  private async executeSequentialThinkingOperation(operation: string, parameters: any): Promise<any> {
    switch (operation) {
      case "think":
        return await sequentialThinkingService.think(parameters);
      case "get_thinking_chain":
        return sequentialThinkingService.getThinkingChain(parameters.chainId);
      default:
        return { success: true, operation, parameters };
    }
  }

  private async executeDataCollectionOperation(operation: string, parameters: any, serverType: string): Promise<any> {
    if (operation === "start_collection") {
      await mcpDataCollectionService.start();
      return { success: true, message: "Data collection started" };
    }
    
    return { success: true, operation, serverType, parameters };
  }

  private async executeGenericOperation(server: MCPServerConfig, operation: string, parameters: any): Promise<any> {
    // Simulate operation based on server capabilities
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
    
    return {
      success: true,
      serverId: server.id,
      serverName: server.name,
      operation,
      parameters,
      timestamp: new Date(),
      simulatedResult: `Executed ${operation} on ${server.name}`
    };
  }

  private async executeWorkflowSteps(workflow: MCPWorkflow): Promise<any[]> {
    const results = [];
    const completedSteps = new Set<string>();

    // Execute steps in dependency order
    while (completedSteps.size < workflow.steps.length) {
      const readySteps = workflow.steps.filter(step => 
        step.status === "pending" && 
        step.dependencies.every(dep => completedSteps.has(dep))
      );

      if (readySteps.length === 0) {
        throw new Error("Workflow has circular dependencies or unreachable steps");
      }

      // Execute ready steps in parallel
      const stepPromises = readySteps.map(async (step) => {
        step.status = "running";
        step.startedAt = new Date();

        try {
          const result = await this.executeOnServer(step.serverId, step.action, step.parameters);
          step.status = "completed";
          step.completedAt = new Date();
          step.result = result;
          completedSteps.add(step.id);
          return { stepId: step.id, result };
        } catch (error) {
          step.status = "failed";
          step.error = error instanceof Error ? error.message : String(error);
          throw error;
        }
      });

      const stepResults = await Promise.all(stepPromises);
      results.push(...stepResults);
    }

    return results;
  }

  private async collectFromSources(sourceServers: string[]): Promise<any> {
    const sourceData = {};
    
    for (const serverId of sourceServers) {
      try {
        const data = await this.executeOnServer(serverId, "collect_data", {});
        (sourceData as any)[serverId] = data;
      } catch (error) {
        console.warn(`Failed to collect from ${serverId}:`, error);
      }
    }
    
    return sourceData;
  }

  private async storeInDestinations(destinationServers: string[], data: any): Promise<void> {
    for (const serverId of destinationServers) {
      try {
        await this.executeOnServer(serverId, "store_data", { data });
      } catch (error) {
        console.warn(`Failed to store in ${serverId}:`, error);
      }
    }
  }

  private generateMockMetrics(): MCPServerConfig["metrics"] {
    return {
      requestsPerSecond: Math.random() * 1000 + 100,
      averageResponseTime: Math.random() * 500 + 50,
      successRate: 0.95 + Math.random() * 0.05,
      errorRate: Math.random() * 0.05,
      uptime: 0.99 + Math.random() * 0.01
    };
  }

  private initializeSystemMetrics(): MCPSystemMetrics {
    return {
      totalServers: 0,
      healthyServers: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      totalUptime: 0,
      systemLoad: 0,
      memoryUsage: 0,
      networkLatency: 0,
      errorRate: 0,
      lastUpdated: new Date()
    };
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  private startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, 10000); // Every 10 seconds
  }

  private performHealthChecks() {
    console.log("🔍 Performing health checks...");
    
    for (const [serverId, server] of this.servers) {
      // Simulate health check
      const healthCheck = Math.random();
      
      if (healthCheck > 0.95) {
        server.status = "critical";
      } else if (healthCheck > 0.9) {
        server.status = "warning";
      } else {
        server.status = "healthy";
      }
      
      server.lastPing = new Date();
    }
    
    this.emit("healthCheckCompleted", { timestamp: new Date() });
  }

  private updateSystemMetrics() {
    const servers = Array.from(this.servers.values());
    
    this.systemMetrics = {
      totalServers: servers.length,
      healthyServers: servers.filter(s => s.status === "healthy").length,
      totalRequests: servers.reduce((sum, s) => sum + s.metrics.requestsPerSecond, 0),
      averageResponseTime: servers.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / servers.length,
      totalUptime: servers.reduce((sum, s) => sum + s.metrics.uptime, 0) / servers.length,
      systemLoad: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      networkLatency: Math.random() * 50 + 10,
      errorRate: servers.reduce((sum, s) => sum + s.metrics.errorRate, 0) / servers.length,
      lastUpdated: new Date()
    };
    
    this.emit("metricsUpdated", this.systemMetrics);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.removeAllListeners();
    console.log("🧹 MCP Manager resources cleaned up");
  }
}

// Export singleton instance
export const unifiedMCPManager = new UnifiedMCPManager();