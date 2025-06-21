import { EventEmitter } from "events";
import { unifiedMCPManager } from "./unified-mcp-manager";
import { mcpDataPipelineService } from "./mcp-data-pipeline";
import { mcpDeploymentAutomationService } from "./mcp-deployment-automation";
import { mcpTestingSuiteService } from "./mcp-testing-suite";

/**
 * MCP Enterprise Monitoring Service
 * Comprehensive monitoring and alerting for all MCP servers and services
 */

export interface MonitoringAlert {
  id: string;
  type: "error" | "warning" | "info" | "critical";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  source: "server" | "pipeline" | "deployment" | "test" | "system";
  sourceId: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  assignee?: string;
  metadata: Record<string, any>;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  type: "url" | "command" | "api_call";
  target: string;
  parameters?: Record<string, any>;
}

export interface MonitoringMetric {
  id: string;
  name: string;
  category: "performance" | "availability" | "error_rate" | "throughput" | "latency";
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  tags: Record<string, string>;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface HealthCheck {
  id: string;
  name: string;
  type: "http" | "tcp" | "command" | "script";
  target: string;
  interval: number;
  timeout: number;
  retries: number;
  enabled: boolean;
  lastCheck?: Date;
  lastStatus?: "healthy" | "unhealthy" | "unknown";
  lastError?: string;
  successCount: number;
  failureCount: number;
  uptime: number;
}

export interface SystemStatus {
  overall: "healthy" | "degraded" | "outage";
  components: ComponentStatus[];
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  incidents: {
    active: number;
    resolved24h: number;
  };
  lastUpdated: Date;
}

export interface ComponentStatus {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  uptime: number;
  responseTime: number;
  lastIncident?: Date;
  dependencies: string[];
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: {
    columns: number;
    rows: number;
  };
  refreshInterval: number;
  filters: Record<string, any>;
  permissions: {
    viewers: string[];
    editors: string[];
  };
}

export interface DashboardWidget {
  id: string;
  type: "metric" | "chart" | "table" | "status" | "logs" | "alerts";
  title: string;
  position: { x: number; y: number; width: number; height: number };
  configuration: Record<string, any>;
  dataSource: {
    type: "metric" | "log" | "alert" | "status";
    query: string;
    timeRange: string;
  };
}

export class MCPEnterpriseMonitoringService extends EventEmitter {
  private alerts: Map<string, MonitoringAlert> = new Map();
  private metrics: Map<string, MonitoringMetric[]> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private dashboards: Map<string, MonitoringDashboard> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertRules: Map<string, AlertRule> = new Map();
  private isMonitoring = false;

  constructor() {
    super();
    this.initializeHealthChecks();
    this.initializeAlertRules();
    this.initializeDefaultDashboards();
    this.startMonitoring();
  }

  /**
   * Initialize health checks for all MCP servers
   */
  private initializeHealthChecks() {
    const serverIds = [
      "filesystem", "github", "memory", "postgresql", "sequential_thinking",
      "magicui_design", "magicui_components", "figma_dev", "chart_visualization",
      "playwright_official", "playwright_automation", "puppeteer", "desktop_commander", "kubernetes",
      "sqlite", "knowledge_graph", "context7", "vercel", "azure", "nx_monorepo",
      "firecrawl", "mcp_installer", "elevenlabs"
    ];

    for (const serverId of serverIds) {
      this.createHealthCheck({
        id: `health_${serverId}`,
        name: `${serverId} Health Check`,
        type: "command",
        target: `mcp_server_ping_${serverId}`,
        interval: 30000, // 30 seconds
        timeout: 5000,
        retries: 3,
        enabled: true,
        successCount: 0,
        failureCount: 0,
        uptime: 1.0
      });
    }

    // Application-level health checks
    this.createHealthCheck({
      id: "health_webapp",
      name: "Web Application Health",
      type: "http",
      target: "https://fantasy-ai.com/api/health",
      interval: 60000, // 1 minute
      timeout: 10000,
      retries: 2,
      enabled: true,
      successCount: 0,
      failureCount: 0,
      uptime: 1.0
    });

    this.createHealthCheck({
      id: "health_database",
      name: "Database Connectivity",
      type: "command",
      target: "database_ping",
      interval: 120000, // 2 minutes
      timeout: 15000,
      retries: 3,
      enabled: true,
      successCount: 0,
      failureCount: 0,
      uptime: 1.0
    });

    console.log("✅ Initialized health checks for all components");
  }

  /**
   * Initialize alert rules
   */
  private initializeAlertRules() {
    const alertRules = [
      {
        id: "server_down",
        name: "MCP Server Down",
        condition: "server.status != 'healthy'",
        severity: "critical",
        cooldown: 300000, // 5 minutes
        actions: ["notify_slack", "notify_email", "auto_restart"]
      },
      {
        id: "high_error_rate",
        name: "High Error Rate",
        condition: "error_rate > 5%",
        severity: "high",
        cooldown: 600000, // 10 minutes
        actions: ["notify_slack", "escalate"]
      },
      {
        id: "slow_response_time",
        name: "Slow Response Time",
        condition: "response_time > 5000ms",
        severity: "medium",
        cooldown: 900000, // 15 minutes
        actions: ["notify_slack"]
      },
      {
        id: "deployment_failed",
        name: "Deployment Failed",
        condition: "deployment.status == 'failed'",
        severity: "high",
        actions: ["notify_slack", "notify_email", "auto_rollback"]
      },
      {
        id: "test_failure",
        name: "Test Suite Failed",
        condition: "test.success_rate < 90%",
        severity: "medium",
        actions: ["notify_slack", "create_ticket"]
      }
    ];

    for (const rule of alertRules) {
      this.alertRules.set(rule.id, rule as any);
    }

    console.log("✅ Initialized alert rules");
  }

  /**
   * Initialize default monitoring dashboards
   */
  private initializeDefaultDashboards() {
    // System Overview Dashboard
    this.createDashboard({
      id: "system_overview",
      name: "System Overview",
      description: "High-level overview of all MCP servers and services",
      widgets: [
        {
          id: "system_status",
          type: "status",
          title: "System Status",
          position: { x: 0, y: 0, width: 6, height: 3 },
          configuration: { showComponents: true },
          dataSource: { type: "status", query: "overall", timeRange: "now" }
        },
        {
          id: "active_alerts",
          type: "alerts",
          title: "Active Alerts",
          position: { x: 6, y: 0, width: 6, height: 3 },
          configuration: { maxItems: 10 },
          dataSource: { type: "alert", query: "status:active", timeRange: "24h" }
        },
        {
          id: "server_metrics",
          type: "chart",
          title: "Server Performance",
          position: { x: 0, y: 3, width: 12, height: 4 },
          configuration: { chartType: "line", metrics: ["response_time", "error_rate"] },
          dataSource: { type: "metric", query: "category:performance", timeRange: "1h" }
        },
        {
          id: "throughput_chart",
          type: "chart",
          title: "Request Throughput",
          position: { x: 0, y: 7, width: 6, height: 3 },
          configuration: { chartType: "area" },
          dataSource: { type: "metric", query: "category:throughput", timeRange: "1h" }
        },
        {
          id: "uptime_table",
          type: "table",
          title: "Server Uptime",
          position: { x: 6, y: 7, width: 6, height: 3 },
          configuration: { sortBy: "uptime", order: "desc" },
          dataSource: { type: "status", query: "components", timeRange: "7d" }
        }
      ],
      layout: { columns: 12, rows: 10 },
      refreshInterval: 30000,
      filters: {},
      permissions: {
        viewers: ["all"],
        editors: ["admin", "devops"]
      }
    });

    // Performance Dashboard
    this.createDashboard({
      id: "performance",
      name: "Performance Metrics",
      description: "Detailed performance metrics for all MCP servers",
      widgets: [
        {
          id: "response_time_trend",
          type: "chart",
          title: "Response Time Trend",
          position: { x: 0, y: 0, width: 12, height: 4 },
          configuration: { chartType: "line", aggregation: "avg" },
          dataSource: { type: "metric", query: "name:response_time", timeRange: "24h" }
        },
        {
          id: "error_rate_by_server",
          type: "chart",
          title: "Error Rate by Server",
          position: { x: 0, y: 4, width: 6, height: 3 },
          configuration: { chartType: "bar" },
          dataSource: { type: "metric", query: "name:error_rate", timeRange: "1h" }
        },
        {
          id: "throughput_by_server",
          type: "chart",
          title: "Throughput by Server",
          position: { x: 6, y: 4, width: 6, height: 3 },
          configuration: { chartType: "bar" },
          dataSource: { type: "metric", query: "name:requests_per_second", timeRange: "1h" }
        },
        {
          id: "performance_percentiles",
          type: "chart",
          title: "Response Time Percentiles",
          position: { x: 0, y: 7, width: 12, height: 3 },
          configuration: { chartType: "line", percentiles: [50, 90, 95, 99] },
          dataSource: { type: "metric", query: "name:response_time_percentile", timeRange: "1h" }
        }
      ],
      layout: { columns: 12, rows: 10 },
      refreshInterval: 15000,
      filters: {},
      permissions: {
        viewers: ["all"],
        editors: ["admin", "devops"]
      }
    });

    // DevOps Dashboard
    this.createDashboard({
      id: "devops",
      name: "DevOps Operations",
      description: "Deployment, testing, and pipeline monitoring",
      widgets: [
        {
          id: "deployment_status",
          type: "table",
          title: "Recent Deployments",
          position: { x: 0, y: 0, width: 6, height: 4 },
          configuration: { maxItems: 10 },
          dataSource: { type: "status", query: "deployments", timeRange: "7d" }
        },
        {
          id: "test_results",
          type: "chart",
          title: "Test Success Rate",
          position: { x: 6, y: 0, width: 6, height: 4 },
          configuration: { chartType: "line" },
          dataSource: { type: "metric", query: "name:test_success_rate", timeRange: "7d" }
        },
        {
          id: "pipeline_status",
          type: "table",
          title: "Data Pipeline Status",
          position: { x: 0, y: 4, width: 12, height: 3 },
          configuration: { showStatus: true },
          dataSource: { type: "status", query: "pipelines", timeRange: "24h" }
        },
        {
          id: "deployment_frequency",
          type: "chart",
          title: "Deployment Frequency",
          position: { x: 0, y: 7, width: 6, height: 3 },
          configuration: { chartType: "column" },
          dataSource: { type: "metric", query: "name:deployments_per_day", timeRange: "30d" }
        },
        {
          id: "mttr_metric",
          type: "metric",
          title: "Mean Time to Recovery",
          position: { x: 6, y: 7, width: 6, height: 3 },
          configuration: { unit: "minutes" },
          dataSource: { type: "metric", query: "name:mttr", timeRange: "30d" }
        }
      ],
      layout: { columns: 12, rows: 10 },
      refreshInterval: 60000,
      filters: {},
      permissions: {
        viewers: ["devops", "admin"],
        editors: ["admin"]
      }
    });

    console.log("✅ Initialized default dashboards");
  }

  /**
   * Start monitoring all MCP services
   */
  private startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Start health check monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
      this.collectMetrics();
      this.evaluateAlertRules();
    }, 30000); // Every 30 seconds

    // Listen to MCP events
    this.setupEventListeners();

    console.log("▶️ Started enterprise monitoring");
    this.emit("monitoringStarted");
  }

  /**
   * Setup event listeners for MCP services
   */
  private setupEventListeners() {
    // Listen to MCP Manager events
    unifiedMCPManager.on("serverRegistered", (server) => {
      this.recordMetric({
        id: `metric_${Date.now()}`,
        name: "server_registered",
        category: "availability",
        value: 1,
        unit: "count",
        timestamp: new Date(),
        source: server.id,
        tags: { server: server.name, category: server.category }
      });
    });

    unifiedMCPManager.on("workflowCompleted", (workflow) => {
      this.recordMetric({
        id: `metric_${Date.now()}`,
        name: "workflow_completion_time",
        category: "performance",
        value: workflow.results?.duration || 0,
        unit: "ms",
        timestamp: new Date(),
        source: "workflow_engine",
        tags: { workflow: workflow.name }
      });
    });

    // Listen to deployment events
    mcpDeploymentAutomationService.on("deploymentCompleted", (deployment) => {
      this.recordMetric({
        id: `metric_${Date.now()}`,
        name: "deployment_duration",
        category: "performance",
        value: deployment.duration || 0,
        unit: "ms",
        timestamp: new Date(),
        source: "deployment_automation",
        tags: { environment: deployment.environment }
      });
    });

    mcpDeploymentAutomationService.on("deploymentFailed", (deployment) => {
      this.createAlert({
        id: `alert_${Date.now()}`,
        type: "error",
        severity: "high",
        title: "Deployment Failed",
        description: `Deployment failed: ${deployment.configId}`,
        source: "deployment",
        sourceId: deployment.configId,
        timestamp: new Date(),
        resolved: false,
        metadata: { deployment },
        actions: [
          {
            id: "view_logs",
            label: "View Logs",
            type: "url",
            target: `/dashboard/deployments/${deployment.id}/logs`
          },
          {
            id: "retry_deployment",
            label: "Retry Deployment",
            type: "api_call",
            target: "/api/deployments/retry",
            parameters: { deploymentId: deployment.id }
          }
        ]
      });
    });

    // Listen to test events
    mcpTestingSuiteService.on("testExecutionFailed", (execution) => {
      this.createAlert({
        id: `alert_${Date.now()}`,
        type: "warning",
        severity: "medium",
        title: "Test Suite Failed",
        description: `Test suite failed: ${execution.suiteId}`,
        source: "test",
        sourceId: execution.suiteId,
        timestamp: new Date(),
        resolved: false,
        metadata: { execution },
        actions: [
          {
            id: "view_results",
            label: "View Results",
            type: "url",
            target: `/dashboard/tests/${execution.id}/results`
          }
        ]
      });
    });

    // Listen to pipeline events
    mcpDataPipelineService.on("pipelineRunFailed", (pipeline) => {
      this.createAlert({
        id: `alert_${Date.now()}`,
        type: "error",
        severity: "medium",
        title: "Data Pipeline Failed",
        description: `Pipeline failed: ${pipeline.pipelineId}`,
        source: "pipeline",
        sourceId: pipeline.pipelineId,
        timestamp: new Date(),
        resolved: false,
        metadata: { pipeline },
        actions: [
          {
            id: "view_pipeline",
            label: "View Pipeline",
            type: "url",
            target: `/dashboard/pipelines/${pipeline.pipelineId}`
          },
          {
            id: "retry_pipeline",
            label: "Retry Pipeline",
            type: "api_call",
            target: "/api/pipelines/retry",
            parameters: { pipelineId: pipeline.pipelineId }
          }
        ]
      });
    });
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks() {
    console.log("🔍 Performing health checks...");

    for (const [checkId, healthCheck] of this.healthChecks) {
      if (!healthCheck.enabled) continue;

      try {
        const startTime = Date.now();
        const result = await this.executeHealthCheck(healthCheck);
        const responseTime = Date.now() - startTime;

        healthCheck.lastCheck = new Date();
        healthCheck.lastStatus = result.success ? "healthy" : "unhealthy";
        healthCheck.lastError = result.error;

        if (result.success) {
          healthCheck.successCount++;
        } else {
          healthCheck.failureCount++;
          
          // Create alert for failed health check
          this.createAlert({
            id: `alert_${Date.now()}`,
            type: "error",
            severity: "high",
            title: "Health Check Failed",
            description: `${healthCheck.name} health check failed: ${result.error}`,
            source: "system",
            sourceId: checkId,
            timestamp: new Date(),
            resolved: false,
            metadata: { healthCheck, responseTime },
            actions: [
              {
                id: "restart_service",
                label: "Restart Service",
                type: "command",
                target: `restart_${healthCheck.target}`
              }
            ]
          });
        }

        // Update uptime
        const totalChecks = healthCheck.successCount + healthCheck.failureCount;
        healthCheck.uptime = totalChecks > 0 ? healthCheck.successCount / totalChecks : 1.0;

        // Record metric
        this.recordMetric({
          id: `metric_${Date.now()}`,
          name: "health_check_response_time",
          category: "performance",
          value: responseTime,
          unit: "ms",
          timestamp: new Date(),
          source: checkId,
          tags: { check: healthCheck.name, status: healthCheck.lastStatus }
        });

      } catch (error) {
        console.error(`Health check failed: ${healthCheck.name}`, error);
      }
    }
  }

  /**
   * Execute a health check
   */
  private async executeHealthCheck(healthCheck: HealthCheck): Promise<{ success: boolean; error?: string }> {
    switch (healthCheck.type) {
      case "http":
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), healthCheck.timeout);
          
          const response = await fetch(healthCheck.target, {
            method: "GET",
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          return { success: response.ok };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }

      case "command":
        // Simulate command execution
        return { success: Math.random() > 0.05 }; // 95% success rate

      case "tcp":
        // Simulate TCP connection test
        return { success: Math.random() > 0.02 }; // 98% success rate

      default:
        return { success: false, error: `Unknown health check type: ${healthCheck.type}` };
    }
  }

  /**
   * Collect system metrics
   */
  private collectMetrics() {
    const timestamp = new Date();

    // Collect MCP server metrics
    const systemStatus = unifiedMCPManager.getSystemStatus();

    this.recordMetric({
      id: `metric_${Date.now()}`,
      name: "servers_healthy",
      category: "availability",
      value: systemStatus.metrics.healthyServers,
      unit: "count",
      timestamp,
      source: "mcp_manager",
      tags: { component: "servers" }
    });

    this.recordMetric({
      id: `metric_${Date.now()}`,
      name: "average_response_time",
      category: "performance",
      value: systemStatus.metrics.averageResponseTime,
      unit: "ms",
      timestamp,
      source: "mcp_manager",
      tags: { component: "servers" }
    });

    this.recordMetric({
      id: `metric_${Date.now()}`,
      name: "total_requests",
      category: "throughput",
      value: systemStatus.metrics.totalRequests,
      unit: "count",
      timestamp,
      source: "mcp_manager",
      tags: { component: "servers" }
    });

    // Collect deployment metrics
    const deploymentStats = mcpDeploymentAutomationService.getStatistics();

    this.recordMetric({
      id: `metric_${Date.now()}`,
      name: "deployment_success_rate",
      category: "availability",
      value: deploymentStats.successRate * 100,
      unit: "percent",
      timestamp,
      source: "deployment_automation",
      tags: { component: "deployments" }
    });

    // Collect test metrics
    const testStats = mcpTestingSuiteService.getStatistics();

    this.recordMetric({
      id: `metric_${Date.now()}`,
      name: "test_success_rate",
      category: "availability",
      value: testStats.averageSuccessRate * 100,
      unit: "percent",
      timestamp,
      source: "testing_suite",
      tags: { component: "tests" }
    });

    // Collect pipeline metrics
    const pipelineStats = mcpDataPipelineService.getStatistics();

    this.recordMetric({
      id: `metric_${Date.now()}`,
      name: "pipeline_success_rate",
      category: "availability",
      value: pipelineStats.successRate * 100,
      unit: "percent",
      timestamp,
      source: "data_pipeline",
      tags: { component: "pipelines" }
    });
  }

  /**
   * Evaluate alert rules
   */
  private evaluateAlertRules() {
    // Implementation would evaluate conditions against current metrics
    // and create alerts when thresholds are exceeded
  }

  /**
   * Create a health check
   */
  createHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.set(healthCheck.id, healthCheck);
    this.emit("healthCheckCreated", healthCheck);
  }

  /**
   * Create an alert
   */
  createAlert(alert: MonitoringAlert): void {
    this.alerts.set(alert.id, alert);
    this.emit("alertCreated", alert);
    
    console.log(`🚨 Alert created: ${alert.title} (${alert.severity})`);
    
    // Auto-execute alert actions if configured
    this.executeAlertActions(alert);
  }

  /**
   * Record a metric
   */
  recordMetric(metric: MonitoringMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metricHistory = this.metrics.get(metric.name)!;
    metricHistory.push(metric);
    
    // Keep only last 1000 metrics per type
    if (metricHistory.length > 1000) {
      metricHistory.splice(0, metricHistory.length - 1000);
    }
    
    this.emit("metricRecorded", metric);
  }

  /**
   * Create a dashboard
   */
  createDashboard(dashboard: MonitoringDashboard): void {
    this.dashboards.set(dashboard.id, dashboard);
    this.emit("dashboardCreated", dashboard);
  }

  /**
   * Execute alert actions
   */
  private async executeAlertActions(alert: MonitoringAlert) {
    for (const action of alert.actions) {
      try {
        switch (action.type) {
          case "command":
            console.log(`🔧 Executing command: ${action.target}`);
            // Execute command
            break;
          case "api_call":
            console.log(`🔗 Making API call: ${action.target}`);
            // Make API call
            break;
          case "url":
            console.log(`🔗 Action URL: ${action.target}`);
            // URL actions are handled by the UI
            break;
        }
      } catch (error) {
        console.error(`Failed to execute alert action: ${action.label}`, error);
      }
    }
  }

  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus {
    const now = new Date();
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    const criticalAlerts = activeAlerts.filter(a => a.severity === "critical");
    
    let overallStatus: SystemStatus["overall"] = "healthy";
    if (criticalAlerts.length > 0) {
      overallStatus = "outage";
    } else if (activeAlerts.length > 0) {
      overallStatus = "degraded";
    }

    const components: ComponentStatus[] = Array.from(this.healthChecks.values()).map(hc => ({
      id: hc.id,
      name: hc.name,
      status: hc.lastStatus === "healthy" ? "operational" : "outage",
      uptime: hc.uptime,
      responseTime: 0, // Would calculate from metrics
      dependencies: []
    }));

    return {
      overall: overallStatus,
      components,
      metrics: {
        uptime: components.reduce((sum, c) => sum + c.uptime, 0) / components.length,
        responseTime: 0, // Would calculate from recent metrics
        errorRate: 0, // Would calculate from recent metrics
        throughput: 0 // Would calculate from recent metrics
      },
      incidents: {
        active: activeAlerts.length,
        resolved24h: Array.from(this.alerts.values()).filter(a => 
          a.resolved && a.resolvedAt && 
          a.resolvedAt.getTime() > now.getTime() - 24 * 60 * 60 * 1000
        ).length
      },
      lastUpdated: now
    };
  }

  /**
   * Get alerts
   */
  getAlerts(filters?: { resolved?: boolean; severity?: string; source?: string }): MonitoringAlert[] {
    let alerts = Array.from(this.alerts.values());
    
    if (filters) {
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(a => a.resolved === filters.resolved);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.source) {
        alerts = alerts.filter(a => a.source === filters.source);
      }
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get metrics
   */
  getMetrics(metricName: string, timeRange?: string): MonitoringMetric[] {
    const metrics = this.metrics.get(metricName) || [];
    
    if (timeRange) {
      const now = Date.now();
      const ranges: Record<string, number> = {
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000
      };
      
      const rangeMs = ranges[timeRange];
      if (rangeMs) {
        return metrics.filter(m => m.timestamp.getTime() > now - rangeMs);
      }
    }
    
    return metrics;
  }

  /**
   * Get dashboard
   */
  getDashboard(dashboardId: string): MonitoringDashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get all dashboards
   */
  getDashboards(): MonitoringDashboard[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (resolvedBy) {
      alert.assignee = resolvedBy;
    }
    
    this.emit("alertResolved", alert);
    return true;
  }

  /**
   * Get monitoring statistics
   */
  getStatistics() {
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(a => !a.resolved);
    const healthChecks = Array.from(this.healthChecks.values());
    
    return {
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      averageResolutionTime: this.calculateAverageResolutionTime(),
      systemUptime: healthChecks.reduce((sum, hc) => sum + hc.uptime, 0) / healthChecks.length,
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
      healthyServices: healthChecks.filter(hc => hc.lastStatus === "healthy").length,
      totalServices: healthChecks.length
    };
  }

  /**
   * Calculate average alert resolution time
   */
  private calculateAverageResolutionTime(): number {
    const resolvedAlerts = Array.from(this.alerts.values()).filter(a => a.resolved && a.resolvedAt);
    
    if (resolvedAlerts.length === 0) return 0;
    
    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const resolutionTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
      return sum + resolutionTime;
    }, 0);
    
    return totalTime / resolvedAlerts.length;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log("⏹️ Stopped enterprise monitoring");
    this.emit("monitoringStopped");
  }
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: string;
  cooldown?: number;
  actions: string[];
}

// Export singleton instance
export const mcpEnterpriseMonitoringService = new MCPEnterpriseMonitoringService();