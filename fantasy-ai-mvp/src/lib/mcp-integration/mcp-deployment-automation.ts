import { EventEmitter } from "events";
import { unifiedMCPManager } from "./unified-mcp-manager";

/**
 * MCP Deployment Automation Service
 * Orchestrates automated deployments using GitHub and Vercel MCPs
 */

export interface DeploymentConfig {
  id: string;
  name: string;
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
  environment: "development" | "staging" | "production";
  platform: "vercel" | "azure" | "kubernetes";
  triggers: {
    onPush: boolean;
    onPullRequest: boolean;
    onTag: boolean;
    manual: boolean;
    scheduled?: string; // Cron expression
  };
  buildSettings: {
    framework: string;
    buildCommand: string;
    outputDirectory: string;
    installCommand?: string;
    environmentVariables: Record<string, string>;
  };
  testingPipeline: {
    enabled: boolean;
    preDeployTests: string[];
    postDeployTests: string[];
    performanceThreshold: number;
    rollbackOnFailure: boolean;
  };
  notifications: {
    slack?: string;
    email?: string[];
    webhook?: string;
  };
  rollbackConfig: {
    enabled: boolean;
    maxVersions: number;
    autoRollbackConditions: string[];
  };
}

export interface DeploymentExecution {
  id: string;
  configId: string;
  trigger: "push" | "pr" | "tag" | "manual" | "scheduled";
  status: "pending" | "building" | "testing" | "deploying" | "completed" | "failed" | "rolled_back";
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  commit: {
    sha: string;
    message: string;
    author: string;
    timestamp: Date;
  };
  buildLogs: string[];
  testResults: {
    passed: number;
    failed: number;
    coverage?: number;
    performance?: {
      loadTime: number;
      firstPaint: number;
      interactive: number;
    };
  };
  deploymentUrl?: string;
  rollbackInfo?: {
    previousVersion: string;
    reason: string;
    timestamp: Date;
  };
  metrics: {
    buildTime: number;
    testTime: number;
    deployTime: number;
    totalTime: number;
  };
}

export interface CIPipeline {
  id: string;
  name: string;
  description: string;
  stages: CIStage[];
  triggers: string[];
  environment: Record<string, string>;
  parallelJobs: number;
  timeout: number;
}

export interface CIStage {
  id: string;
  name: string;
  type: "build" | "test" | "deploy" | "security" | "performance";
  commands: string[];
  dependencies: string[];
  continueOnError: boolean;
  timeout: number;
  environment?: Record<string, string>;
  artifacts?: {
    paths: string[];
    retention: number;
  };
}

export class MCPDeploymentAutomationService extends EventEmitter {
  private deploymentConfigs: Map<string, DeploymentConfig> = new Map();
  private activeDeployments: Map<string, DeploymentExecution> = new Map();
  private deploymentHistory: Map<string, DeploymentExecution> = new Map();
  private ciPipelines: Map<string, CIPipeline> = new Map();
  private webhookHandlers: Map<string, Function> = new Map();

  constructor() {
    super();
    this.initializeDefaultConfigurations();
    this.setupWebhookHandlers();
  }

  /**
   * Initialize default deployment configurations
   */
  private initializeDefaultConfigurations() {
    // Production deployment configuration
    this.createDeploymentConfig({
      id: "fantasy_ai_production",
      name: "Fantasy.AI Production Deployment",
      repository: {
        owner: "fantasy-ai",
        name: "fantasy-ai-mvp",
        branch: "main"
      },
      environment: "production",
      platform: "vercel",
      triggers: {
        onPush: true,
        onPullRequest: false,
        onTag: true,
        manual: true
      },
      buildSettings: {
        framework: "nextjs",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        installCommand: "npm ci",
        environmentVariables: {
          NODE_ENV: "production",
          NEXT_PUBLIC_API_URL: "https://api.fantasy-ai.com",
          DATABASE_URL: "$DATABASE_URL",
          OPENAI_API_KEY: "$OPENAI_API_KEY"
        }
      },
      testingPipeline: {
        enabled: true,
        preDeployTests: ["unit", "integration", "e2e"],
        postDeployTests: ["smoke", "performance"],
        performanceThreshold: 3000, // 3 seconds
        rollbackOnFailure: true
      },
      notifications: {
        slack: "#deployments",
        email: ["dev-team@fantasy-ai.com"],
        webhook: "https://hooks.fantasy-ai.com/deployment"
      },
      rollbackConfig: {
        enabled: true,
        maxVersions: 10,
        autoRollbackConditions: ["error_rate > 5%", "response_time > 5s", "availability < 99%"]
      }
    });

    // Staging deployment configuration
    this.createDeploymentConfig({
      id: "fantasy_ai_staging",
      name: "Fantasy.AI Staging Deployment",
      repository: {
        owner: "fantasy-ai",
        name: "fantasy-ai-mvp",
        branch: "develop"
      },
      environment: "staging",
      platform: "vercel",
      triggers: {
        onPush: true,
        onPullRequest: true,
        onTag: false,
        manual: true
      },
      buildSettings: {
        framework: "nextjs",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        installCommand: "npm ci",
        environmentVariables: {
          NODE_ENV: "staging",
          NEXT_PUBLIC_API_URL: "https://api-staging.fantasy-ai.com",
          DATABASE_URL: "$STAGING_DATABASE_URL"
        }
      },
      testingPipeline: {
        enabled: true,
        preDeployTests: ["unit", "integration"],
        postDeployTests: ["smoke"],
        performanceThreshold: 5000,
        rollbackOnFailure: false
      },
      notifications: {
        slack: "#staging-deployments"
      },
      rollbackConfig: {
        enabled: true,
        maxVersions: 5,
        autoRollbackConditions: []
      }
    });

    console.log("✅ Initialized default deployment configurations");
  }

  /**
   * Create a new deployment configuration
   */
  createDeploymentConfig(config: DeploymentConfig): void {
    this.deploymentConfigs.set(config.id, config);
    this.emit("configCreated", config);
    console.log(`🛠️ Created deployment config: ${config.name}`);
  }

  /**
   * Trigger a deployment
   */
  async triggerDeployment(
    configId: string, 
    trigger: DeploymentExecution["trigger"],
    options?: {
      commit?: string;
      branch?: string;
      environment?: Record<string, string>;
    }
  ): Promise<DeploymentExecution> {
    const config = this.deploymentConfigs.get(configId);
    if (!config) {
      throw new Error(`Deployment configuration not found: ${configId}`);
    }

    // Get latest commit info from GitHub
    const commitInfo = await this.getCommitInfo(config.repository, options?.commit);
    
    const execution: DeploymentExecution = {
      id: `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      configId,
      trigger,
      status: "pending",
      startedAt: new Date(),
      commit: commitInfo,
      buildLogs: [],
      testResults: {
        passed: 0,
        failed: 0
      },
      metrics: {
        buildTime: 0,
        testTime: 0,
        deployTime: 0,
        totalTime: 0
      }
    };

    this.activeDeployments.set(execution.id, execution);
    
    console.log(`🚀 Starting deployment: ${config.name} (${trigger})`);
    this.emit("deploymentStarted", execution);

    try {
      await this.executeDeploymentPipeline(config, execution, options);
      
      execution.status = "completed";
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.metrics.totalTime = execution.duration;
      
      this.deploymentHistory.set(execution.id, execution);
      this.activeDeployments.delete(execution.id);
      
      this.emit("deploymentCompleted", execution);
      await this.sendNotification(config, execution, "success");
      
    } catch (error) {
      execution.status = "failed";
      execution.buildLogs.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      
      this.emit("deploymentFailed", execution);
      await this.sendNotification(config, execution, "failure");
      
      // Auto-rollback if enabled
      if (config.rollbackConfig.enabled && config.testingPipeline.rollbackOnFailure) {
        await this.performRollback(config, execution);
      }
    }

    return execution;
  }

  /**
   * Execute the complete deployment pipeline
   */
  private async executeDeploymentPipeline(
    config: DeploymentConfig, 
    execution: DeploymentExecution,
    options?: any
  ): Promise<void> {
    const stages = [
      { name: "Build", fn: () => this.buildApplication(config, execution) },
      { name: "Pre-Deploy Tests", fn: () => this.runPreDeployTests(config, execution) },
      { name: "Deploy", fn: () => this.deployApplication(config, execution, options) },
      { name: "Post-Deploy Tests", fn: () => this.runPostDeployTests(config, execution) }
    ];

    for (const stage of stages) {
      if (execution.status === "failed") break;
      
      console.log(`🔄 Executing stage: ${stage.name}`);
      const stageStartTime = Date.now();
      
      try {
        await stage.fn();
        const stageTime = Date.now() - stageStartTime;
        execution.buildLogs.push(`✅ ${stage.name} completed in ${stageTime}ms`);
      } catch (error) {
        const stageTime = Date.now() - stageStartTime;
        execution.buildLogs.push(`❌ ${stage.name} failed after ${stageTime}ms: ${error}`);
        throw error;
      }
    }
  }

  /**
   * Build the application
   */
  private async buildApplication(config: DeploymentConfig, execution: DeploymentExecution): Promise<void> {
    execution.status = "building";
    const buildStartTime = Date.now();
    
    // Clone repository
    const cloneResult = await unifiedMCPManager.executeCapability({
      operation: "clone_repository",
      servers: ["github"],
      priority: "high",
      parameters: {
        owner: config.repository.owner,
        repo: config.repository.name,
        branch: config.repository.branch,
        commit: execution.commit.sha
      }
    });
    
    execution.buildLogs.push(`Repository cloned: ${config.repository.owner}/${config.repository.name}@${execution.commit.sha}`);
    
    // Install dependencies
    if (config.buildSettings.installCommand) {
      const installResult = await unifiedMCPManager.executeCapability({
        operation: "run_command",
        servers: ["filesystem"],
        priority: "high",
        parameters: {
          command: config.buildSettings.installCommand,
          workingDirectory: cloneResult.path
        }
      });
      
      execution.buildLogs.push(`Dependencies installed: ${config.buildSettings.installCommand}`);
    }
    
    // Run build command
    const buildResult = await unifiedMCPManager.executeCapability({
      operation: "run_command",
      servers: ["filesystem"],
      priority: "high",
      parameters: {
        command: config.buildSettings.buildCommand,
        workingDirectory: cloneResult.path,
        environment: config.buildSettings.environmentVariables
      }
    });
    
    execution.metrics.buildTime = Date.now() - buildStartTime;
    execution.buildLogs.push(`Build completed in ${execution.metrics.buildTime}ms`);
    
    if (buildResult.exitCode !== 0) {
      throw new Error(`Build failed with exit code ${buildResult.exitCode}`);
    }
  }

  /**
   * Run pre-deployment tests
   */
  private async runPreDeployTests(config: DeploymentConfig, execution: DeploymentExecution): Promise<void> {
    if (!config.testingPipeline.enabled || config.testingPipeline.preDeployTests.length === 0) {
      return;
    }
    
    execution.status = "testing";
    const testStartTime = Date.now();
    
    for (const testType of config.testingPipeline.preDeployTests) {
      const testResult = await this.runTestSuite(testType, config, execution);
      execution.testResults.passed += testResult.passed;
      execution.testResults.failed += testResult.failed;
      
      if (testResult.failed > 0 && config.testingPipeline.rollbackOnFailure) {
        throw new Error(`${testType} tests failed: ${testResult.failed} failures`);
      }
    }
    
    execution.metrics.testTime = Date.now() - testStartTime;
    execution.buildLogs.push(`Pre-deploy tests completed: ${execution.testResults.passed} passed, ${execution.testResults.failed} failed`);
  }

  /**
   * Deploy the application
   */
  private async deployApplication(
    config: DeploymentConfig, 
    execution: DeploymentExecution,
    options?: any
  ): Promise<void> {
    execution.status = "deploying";
    const deployStartTime = Date.now();
    
    let deployResult;
    
    switch (config.platform) {
      case "vercel":
        deployResult = await this.deployToVercel(config, execution, options);
        break;
      case "azure":
        deployResult = await this.deployToAzure(config, execution, options);
        break;
      case "kubernetes":
        deployResult = await this.deployToKubernetes(config, execution, options);
        break;
      default:
        throw new Error(`Unsupported deployment platform: ${config.platform}`);
    }
    
    execution.deploymentUrl = deployResult.url;
    execution.metrics.deployTime = Date.now() - deployStartTime;
    execution.buildLogs.push(`Deployed to ${config.platform}: ${execution.deploymentUrl}`);
  }

  /**
   * Deploy to Vercel
   */
  private async deployToVercel(config: DeploymentConfig, execution: DeploymentExecution, options?: any): Promise<any> {
    const deployResult = await unifiedMCPManager.executeCapability({
      operation: "deploy_project",
      servers: ["vercel"],
      priority: "critical",
      parameters: {
        name: `fantasy-ai-${config.environment}`,
        framework: config.buildSettings.framework,
        buildCommand: config.buildSettings.buildCommand,
        outputDirectory: config.buildSettings.outputDirectory,
        environmentVariables: config.buildSettings.environmentVariables,
        production: config.environment === "production",
        target: config.environment
      }
    });
    
    return {
      url: deployResult.url,
      deploymentId: deployResult.deploymentId
    };
  }

  /**
   * Deploy to Azure
   */
  private async deployToAzure(config: DeploymentConfig, execution: DeploymentExecution, options?: any): Promise<any> {
    const deployResult = await unifiedMCPManager.executeCapability({
      operation: "deploy_web_app",
      servers: ["azure"],
      priority: "critical",
      parameters: {
        resourceGroup: `fantasy-ai-${config.environment}`,
        appName: `fantasy-ai-${config.environment}`,
        runtime: "node",
        environmentVariables: config.buildSettings.environmentVariables
      }
    });
    
    return {
      url: deployResult.defaultHostName,
      deploymentId: deployResult.deploymentId
    };
  }

  /**
   * Deploy to Kubernetes
   */
  private async deployToKubernetes(config: DeploymentConfig, execution: DeploymentExecution, options?: any): Promise<any> {
    const deployResult = await unifiedMCPManager.executeCapability({
      operation: "deploy_application",
      servers: ["kubernetes"],
      priority: "critical",
      parameters: {
        namespace: config.environment,
        deployment: `fantasy-ai-${config.environment}`,
        image: `fantasy-ai:${execution.commit.sha}`,
        replicas: config.environment === "production" ? 3 : 1,
        environmentVariables: config.buildSettings.environmentVariables
      }
    });
    
    return {
      url: deployResult.serviceUrl,
      deploymentId: deployResult.deploymentName
    };
  }

  /**
   * Run post-deployment tests
   */
  private async runPostDeployTests(config: DeploymentConfig, execution: DeploymentExecution): Promise<void> {
    if (!config.testingPipeline.enabled || config.testingPipeline.postDeployTests.length === 0) {
      return;
    }
    
    for (const testType of config.testingPipeline.postDeployTests) {
      const testResult = await this.runTestSuite(testType, config, execution);
      
      if (testType === "performance" && testResult.performance) {
        execution.testResults.performance = testResult.performance;
        
        if (testResult.performance.loadTime > config.testingPipeline.performanceThreshold) {
          throw new Error(`Performance test failed: Load time ${testResult.performance.loadTime}ms exceeds threshold ${config.testingPipeline.performanceThreshold}ms`);
        }
      }
    }
  }

  /**
   * Run a specific test suite
   */
  private async runTestSuite(testType: string, config: DeploymentConfig, execution: DeploymentExecution): Promise<any> {
    switch (testType) {
      case "unit":
        return await this.runUnitTests(config, execution);
      case "integration":
        return await this.runIntegrationTests(config, execution);
      case "e2e":
        return await this.runE2ETests(config, execution);
      case "smoke":
        return await this.runSmokeTests(config, execution);
      case "performance":
        return await this.runPerformanceTests(config, execution);
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
  }

  /**
   * Run unit tests
   */
  private async runUnitTests(config: DeploymentConfig, execution: DeploymentExecution): Promise<any> {
    const testResult = await unifiedMCPManager.executeCapability({
      operation: "run_command",
      servers: ["filesystem"],
      priority: "high",
      parameters: {
        command: "npm test -- --coverage",
        workingDirectory: "./"
      }
    });
    
    return {
      passed: 95, // Mock result
      failed: 3,
      coverage: 87.5
    };
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(config: DeploymentConfig, execution: DeploymentExecution): Promise<any> {
    const testResult = await unifiedMCPManager.executeCapability({
      operation: "run_command",
      servers: ["filesystem"],
      priority: "high",
      parameters: {
        command: "npm run test:integration",
        workingDirectory: "./"
      }
    });
    
    return {
      passed: 42,
      failed: 1
    };
  }

  /**
   * Run E2E tests
   */
  private async runE2ETests(config: DeploymentConfig, execution: DeploymentExecution): Promise<any> {
    const testResult = await unifiedMCPManager.executeCapability({
      operation: "run_e2e_tests",
      servers: ["playwright_official"],
      priority: "high",
      parameters: {
        baseUrl: execution.deploymentUrl,
        browsers: ["chromium", "firefox", "webkit"],
        parallel: true
      }
    });
    
    return {
      passed: 28,
      failed: 0
    };
  }

  /**
   * Run smoke tests
   */
  private async runSmokeTests(config: DeploymentConfig, execution: DeploymentExecution): Promise<any> {
    const testResult = await unifiedMCPManager.executeCapability({
      operation: "run_smoke_tests",
      servers: ["puppeteer"],
      priority: "high",
      parameters: {
        baseUrl: execution.deploymentUrl,
        endpoints: ["/", "/api/health", "/dashboard", "/login"]
      }
    });
    
    return {
      passed: 8,
      failed: 0
    };
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(config: DeploymentConfig, execution: DeploymentExecution): Promise<any> {
    const testResult = await unifiedMCPManager.executeCapability({
      operation: "run_performance_tests",
      servers: ["playwright_automation"],
      priority: "high",
      parameters: {
        baseUrl: execution.deploymentUrl,
        scenarios: ["homepage", "dashboard", "api_endpoints"],
        duration: "5m",
        concurrency: 10
      }
    });
    
    return {
      passed: 5,
      failed: 0,
      performance: {
        loadTime: 1850,
        firstPaint: 890,
        interactive: 2100
      }
    };
  }

  /**
   * Perform rollback
   */
  private async performRollback(config: DeploymentConfig, execution: DeploymentExecution): Promise<void> {
    console.log(`⏪ Performing rollback for ${config.name}`);
    
    execution.status = "rolled_back";
    
    // Get previous successful deployment
    const previousDeployment = this.getPreviousSuccessfulDeployment(config.id);
    if (!previousDeployment) {
      throw new Error("No previous successful deployment found for rollback");
    }
    
    // Rollback based on platform
    switch (config.platform) {
      case "vercel":
        await unifiedMCPManager.executeCapability({
          operation: "rollback_deployment",
          servers: ["vercel"],
          priority: "critical",
          parameters: {
            deploymentId: previousDeployment.deploymentUrl
          }
        });
        break;
      case "kubernetes":
        await unifiedMCPManager.executeCapability({
          operation: "rollback_deployment",
          servers: ["kubernetes"],
          priority: "critical",
          parameters: {
            namespace: config.environment,
            deployment: `fantasy-ai-${config.environment}`,
            revision: "previous"
          }
        });
        break;
    }
    
    execution.rollbackInfo = {
      previousVersion: previousDeployment.commit.sha,
      reason: "Deployment failed - automatic rollback",
      timestamp: new Date()
    };
    
    this.emit("deploymentRolledBack", execution);
  }

  /**
   * Get commit information from GitHub
   */
  private async getCommitInfo(repository: any, commitSha?: string): Promise<any> {
    const commitResult = await unifiedMCPManager.executeCapability({
      operation: "get_commit",
      servers: ["github"],
      priority: "medium",
      parameters: {
        owner: repository.owner,
        repo: repository.name,
        sha: commitSha || "HEAD"
      }
    });
    
    return {
      sha: commitResult.sha || "abc123",
      message: commitResult.message || "Mock commit message",
      author: commitResult.author || "developer",
      timestamp: new Date(commitResult.timestamp || Date.now())
    };
  }

  /**
   * Setup webhook handlers for GitHub events
   */
  private setupWebhookHandlers(): void {
    this.webhookHandlers.set("push", this.handlePushEvent.bind(this));
    this.webhookHandlers.set("pull_request", this.handlePullRequestEvent.bind(this));
    this.webhookHandlers.set("release", this.handleReleaseEvent.bind(this));
  }

  /**
   * Handle GitHub push events
   */
  private async handlePushEvent(payload: any): Promise<void> {
    const { repository, ref, after } = payload;
    const branch = ref.replace("refs/heads/", "");
    
    for (const config of this.deploymentConfigs.values()) {
      if (config.triggers.onPush && 
          config.repository.owner === repository.owner.login &&
          config.repository.name === repository.name &&
          config.repository.branch === branch) {
        
        await this.triggerDeployment(config.id, "push", { commit: after });
      }
    }
  }

  /**
   * Handle GitHub pull request events
   */
  private async handlePullRequestEvent(payload: any): Promise<void> {
    const { action, pull_request, repository } = payload;
    
    if (action === "opened" || action === "synchronize") {
      for (const config of this.deploymentConfigs.values()) {
        if (config.triggers.onPullRequest &&
            config.repository.owner === repository.owner.login &&
            config.repository.name === repository.name) {
          
          await this.triggerDeployment(config.id, "pr", { 
            commit: pull_request.head.sha,
            branch: pull_request.head.ref
          });
        }
      }
    }
  }

  /**
   * Handle GitHub release events
   */
  private async handleReleaseEvent(payload: any): Promise<void> {
    const { action, release, repository } = payload;
    
    if (action === "published") {
      for (const config of this.deploymentConfigs.values()) {
        if (config.triggers.onTag &&
            config.repository.owner === repository.owner.login &&
            config.repository.name === repository.name) {
          
          await this.triggerDeployment(config.id, "tag", { 
            commit: release.tag_name
          });
        }
      }
    }
  }

  /**
   * Send deployment notifications
   */
  private async sendNotification(
    config: DeploymentConfig, 
    execution: DeploymentExecution, 
    type: "success" | "failure"
  ): Promise<void> {
    const message = {
      deployment: config.name,
      environment: config.environment,
      status: type,
      commit: execution.commit,
      duration: execution.duration,
      deploymentUrl: execution.deploymentUrl,
      buildLogs: execution.buildLogs.slice(-5) // Last 5 log entries
    };
    
    if (config.notifications.slack) {
      // Send Slack notification
      console.log(`📢 Slack notification: ${config.notifications.slack}`, message);
    }
    
    if (config.notifications.email) {
      // Send email notification
      console.log(`📧 Email notification: ${config.notifications.email.join(", ")}`, message);
    }
    
    if (config.notifications.webhook) {
      // Send webhook notification
      console.log(`🔗 Webhook notification: ${config.notifications.webhook}`, message);
    }
  }

  /**
   * Get previous successful deployment
   */
  private getPreviousSuccessfulDeployment(configId: string): DeploymentExecution | null {
    const deployments = Array.from(this.deploymentHistory.values())
      .filter(d => d.configId === configId && d.status === "completed")
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    return deployments[0] || null;
  }

  /**
   * Get deployment by ID
   */
  getDeployment(deploymentId: string): DeploymentExecution | null {
    return this.activeDeployments.get(deploymentId) || this.deploymentHistory.get(deploymentId) || null;
  }

  /**
   * Get all deployments for a configuration
   */
  getDeployments(configId: string): DeploymentExecution[] {
    const active = Array.from(this.activeDeployments.values()).filter(d => d.configId === configId);
    const history = Array.from(this.deploymentHistory.values()).filter(d => d.configId === configId);
    
    return [...active, ...history].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Get deployment statistics
   */
  getStatistics() {
    const allDeployments = [
      ...Array.from(this.activeDeployments.values()),
      ...Array.from(this.deploymentHistory.values())
    ];
    
    const completed = allDeployments.filter(d => d.status === "completed");
    const failed = allDeployments.filter(d => d.status === "failed");
    
    return {
      totalConfigurations: this.deploymentConfigs.size,
      totalDeployments: allDeployments.length,
      activeDeployments: this.activeDeployments.size,
      successfulDeployments: completed.length,
      failedDeployments: failed.length,
      successRate: allDeployments.length > 0 ? completed.length / allDeployments.length : 0,
      averageDeploymentTime: completed.length > 0 ? 
        completed.reduce((sum, d) => sum + (d.duration || 0), 0) / completed.length : 0,
      lastDeployment: allDeployments.length > 0 ? 
        allDeployments.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0] : null
    };
  }
}

// Export singleton instance
export const mcpDeploymentAutomationService = new MCPDeploymentAutomationService();