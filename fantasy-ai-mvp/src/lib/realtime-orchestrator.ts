/**
 * 🚀 REAL-TIME ORCHESTRATOR
 * 
 * The MASTER COMMANDER of all real-time data systems!
 * This orchestrates and coordinates ALL real-time components for MAXIMUM PERFORMANCE!
 */

import { EventEmitter } from "events";
import { realtimeDataManager } from "./realtime-data-manager";
import { webSocketManager } from "./websocket-manager";
import { realtimeSportsPipeline } from "./realtime-sports-pipeline";
import { liveDataManager } from "./live-data-manager";
import { aiService } from "./ai-service";
import { valueBalancingCalculator } from "./value-balancing-calculator";
import { prisma } from "./prisma";

export interface SystemStatus {
  isRunning: boolean;
  components: {
    realtimeDataManager: boolean;
    webSocketManager: boolean;
    sportsPipeline: boolean;
    liveDataManager: boolean;
  };
  performance: {
    averageLatency: number;
    dataPointsPerSecond: number;
    errorRate: number;
    uptime: number;
  };
  connections: {
    activeUsers: number;
    dataProviders: number;
    totalConnections: number;
  };
}

export interface RealTimeAlert {
  id: string;
  type: "injury" | "touchdown" | "milestone" | "market_move" | "breaking_news";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  affectedUsers: string[];
}

export interface PerformanceMetrics {
  component: string;
  latency: number;
  throughput: number;
  errorCount: number;
  successRate: number;
  lastUpdate: Date;
}

export class RealTimeOrchestrator extends EventEmitter {
  private isRunning = false;
  private startTime: Date = new Date();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private alertQueue: RealTimeAlert[] = [];
  private systemMetrics: SystemStatus;
  
  // Performance tracking
  private dataPointsProcessed = 0;
  private totalLatency = 0;
  private errorCount = 0;
  
  constructor() {
    super();
    
    this.systemMetrics = {
      isRunning: false,
      components: {
        realtimeDataManager: false,
        webSocketManager: false,
        sportsPipeline: false,
        liveDataManager: false
      },
      performance: {
        averageLatency: 0,
        dataPointsPerSecond: 0,
        errorRate: 0,
        uptime: 0
      },
      connections: {
        activeUsers: 0,
        dataProviders: 0,
        totalConnections: 0
      }
    };
  }

  /**
   * 🚀 START THE REAL-TIME EMPIRE!
   * Launch all components in perfect coordination
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Real-time orchestrator already running!");
      return;
    }

    console.log("🔥 LAUNCHING REAL-TIME EMPIRE! 🔥");
    console.log("===============================");
    
    this.isRunning = true;
    this.startTime = new Date();
    this.systemMetrics.isRunning = true;

    try {
      // Phase 1: Initialize core data managers
      console.log("📡 Phase 1: Initializing data managers...");
      await this.startDataManagers();

      // Phase 2: Start WebSocket infrastructure  
      console.log("🌐 Phase 2: Starting WebSocket infrastructure...");
      await this.startWebSocketInfrastructure();

      // Phase 3: Launch sports data pipeline
      console.log("🏈 Phase 3: Launching sports pipeline...");
      await this.startSportsPipeline();

      // Phase 4: Setup cross-component communication
      console.log("🔗 Phase 4: Setting up inter-component communication...");
      this.setupComponentCommunication();

      // Phase 5: Start monitoring and analytics
      console.log("📊 Phase 5: Starting monitoring systems...");
      this.startMonitoring();

      console.log("🎉 REAL-TIME EMPIRE FULLY OPERATIONAL! 🎉");
      console.log("==========================================");
      
      this.emit("systemStarted", this.getSystemStatus());
      
    } catch (error) {
      console.error("❌ Failed to start real-time orchestrator:", error);
      await this.stop();
      throw error;
    }
  }

  /**
   * 🛑 SHUTDOWN THE EMPIRE
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log("🛑 Shutting down real-time empire...");
    this.isRunning = false;
    this.systemMetrics.isRunning = false;

    try {
      // Gracefully shutdown all components
      await Promise.allSettled([
        realtimeSportsPipeline.stop(),
        liveDataManager.stop(),
        webSocketManager.shutdown(),
        realtimeDataManager.shutdown()
      ]);

      console.log("✅ Real-time empire shutdown complete");
      this.emit("systemStopped");
      
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }
  }

  /**
   * Phase 1: Start all data managers
   */
  private async startDataManagers(): Promise<void> {
    // Start live data manager
    await liveDataManager.start();
    this.systemMetrics.components.liveDataManager = true;
    console.log("✅ Live Data Manager started");

    // Initialize realtime data manager (starts automatically)
    this.systemMetrics.components.realtimeDataManager = true;
    console.log("✅ Realtime Data Manager initialized");
  }

  /**
   * Phase 2: Start WebSocket infrastructure
   */
  private async startWebSocketInfrastructure(): Promise<void> {
    // WebSocket manager will be initialized when HTTP server starts
    // For now, mark as ready
    this.systemMetrics.components.webSocketManager = true;
    console.log("✅ WebSocket infrastructure ready");
  }

  /**
   * Phase 3: Start sports data pipeline
   */
  private async startSportsPipeline(): Promise<void> {
    await realtimeSportsPipeline.start();
    this.systemMetrics.components.sportsPipeline = true;
    console.log("✅ Sports data pipeline started");
  }

  /**
   * Phase 4: Setup inter-component communication
   */
  private setupComponentCommunication(): void {
    // Connect live data manager to sports pipeline
    liveDataManager.on("playerUpdate", (data) => {
      this.handlePlayerUpdate(data);
    });

    liveDataManager.on("gameEvent", (data) => {
      this.handleGameEvent(data);
    });

    liveDataManager.on("injuryUpdate", (data) => {
      this.handleInjuryUpdate(data);
    });

    liveDataManager.on("marketUpdate", (data) => {
      this.handleMarketUpdate(data);
    });

    // Connect realtime data manager events
    realtimeDataManager.subscribe("player_update", (data) => {
      this.processRealtimePlayerUpdate(data);
    });

    realtimeDataManager.subscribe("injury_alert", (data) => {
      this.processInjuryAlert(data);
    });

    realtimeDataManager.subscribe("high_impact_event", (data) => {
      this.processHighImpactEvent(data);
    });

    // Connect sports pipeline events
    realtimeSportsPipeline.on("gameEvent", (event) => {
      this.processSportsEvent(event);
    });

    console.log("✅ Inter-component communication established");
  }

  /**
   * Phase 5: Start monitoring and performance tracking
   */
  private startMonitoring(): void {
    // Update system metrics every 5 seconds
    setInterval(() => {
      this.updateSystemMetrics();
      this.processAlertQueue();
      this.optimizePerformance();
    }, 5000);

    // Detailed performance analysis every minute
    setInterval(() => {
      this.analyzeSystemPerformance();
    }, 60000);

    console.log("✅ Monitoring systems active");
  }

  /**
   * Handle player updates from live data manager
   */
  private async handlePlayerUpdate(data: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Track performance
      this.dataPointsProcessed++;
      
      // Process through sports pipeline
      await this.processCrossComponentPlayerUpdate(data);
      
      // Update performance metrics
      const latency = Date.now() - startTime;
      this.updateComponentMetrics("playerUpdate", latency, true);
      
    } catch (error) {
      this.errorCount++;
      this.updateComponentMetrics("playerUpdate", Date.now() - startTime, false);
      console.error("❌ Error handling player update:", error);
    }
  }

  /**
   * Handle game events with intelligent routing
   */
  private async handleGameEvent(data: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Determine event priority
      const priority = this.calculateEventPriority(data.event);
      
      // Route to appropriate systems based on priority
      if (priority === "critical") {
        await this.handleCriticalEvent(data.event);
      } else if (priority === "high") {
        await this.handleHighPriorityEvent(data.event);
      }
      
      // Broadcast to all connected users
      await this.broadcastEventToUsers(data.event);
      
      const latency = Date.now() - startTime;
      this.updateComponentMetrics("gameEvent", latency, true);
      
    } catch (error) {
      this.errorCount++;
      console.error("❌ Error handling game event:", error);
    }
  }

  /**
   * Handle injury updates with immediate notifications
   */
  private async handleInjuryUpdate(data: any): Promise<void> {
    // Create critical alert
    const alert: RealTimeAlert = {
      id: `injury_${Date.now()}`,
      type: "injury",
      priority: "critical",
      title: "🚨 INJURY ALERT",
      message: `${data.playerId} - ${data.description}`,
      data,
      timestamp: new Date(),
      affectedUsers: await this.getAffectedUsers(data.playerId)
    };

    // Add to alert queue for immediate processing
    this.alertQueue.unshift(alert); // High priority = front of queue

    // Trigger emergency lineup adjustments
    await this.triggerEmergencyResponse(data);
  }

  /**
   * Handle market updates
   */
  private async handleMarketUpdate(data: any): Promise<void> {
    // Check for significant price movements
    const priceChangePercent = Math.abs(data.data.changePercent);
    
    if (priceChangePercent > 5) { // 5% or more
      const alert: RealTimeAlert = {
        id: `market_${Date.now()}`,
        type: "market_move",
        priority: "high",
        title: "💰 MAJOR PRICE MOVEMENT",
        message: `${data.data.symbol} moved ${data.data.changePercent}%`,
        data: data.data,
        timestamp: new Date(),
        affectedUsers: await this.getUsersWithPosition(data.data.symbol)
      };

      this.alertQueue.push(alert);
    }

    // Update live wager values
    await this.updateWagerValuesFromMarket(data);
  }

  /**
   * Process alerts from realtime data manager
   */
  private async processRealtimePlayerUpdate(data: any): Promise<void> {
    // Cross-reference with live data for validation
    const liveData = liveDataManager.getCachedPlayerData(data.playerId);
    
    if (liveData) {
      // Merge data sources for highest accuracy
      const mergedData = this.mergePlayerData(data, liveData);
      
      // Broadcast enhanced update
      await this.broadcastEnhancedPlayerUpdate(mergedData);
    }
  }

  /**
   * Process injury alerts with AI analysis
   */
  private async processInjuryAlert(data: any): Promise<void> {
    // Use AI to assess impact
    const impactAnalysis = await aiService.analyzePlayer(
      data.playerName,
      data.position,
      data.team,
      data.opponent,
      { 
        injuryStatus: data.severity,
        week: this.getCurrentWeek()
      }
    );

    // Create comprehensive alert
    const alert: RealTimeAlert = {
      id: `ai_injury_${Date.now()}`,
      type: "injury", 
      priority: "critical",
      title: "🤖 AI INJURY ANALYSIS",
      message: `Impact: ${impactAnalysis.projectedPoints} pts (${impactAnalysis.confidence * 100}% confidence)`,
      data: {
        ...data,
        aiAnalysis: impactAnalysis
      },
      timestamp: new Date(),
      affectedUsers: await this.getAffectedUsers(data.playerId)
    };

    this.alertQueue.unshift(alert);
  }

  /**
   * Process high impact events
   */
  private async processHighImpactEvent(data: any): Promise<void> {
    console.log(`🔥 HIGH IMPACT EVENT DETECTED: ${data.description}`);
    
    // Immediately notify all affected users
    const affectedUsers = await this.getAffectedUsers(data.playerId);
    
    for (const userId of affectedUsers) {
      await webSocketManager.sendUserNotification(userId, {
        type: "wager_matched",
        title: "🔥 HIGH IMPACT EVENT",
        message: data.description,
        data: {
          event: data,
          actionRequired: true
        }
      });
    }

    // Trigger immediate market recalculation
    await this.recalculateAllMarkets();
  }

  /**
   * Process sports events from the pipeline
   */
  private async processSportsEvent(event: any): Promise<void> {
    console.log(`⚽ SPORTS EVENT: ${event.type} - ${event.description}`);
    
    // Process different types of sports events
    switch (event.type) {
      case 'score_update':
        await this.handleScoreUpdate(event);
        break;
      case 'injury_report':
        await this.handleInjuryReport(event);
        break;
      case 'lineup_change':
        await this.handleLineupChange(event);
        break;
      default:
        console.log(`📝 Unhandled sports event type: ${event.type}`);
    }
    
    // Update metrics
    this.dataPointsProcessed++;
    this.emit('sports_event_processed', event);
  }

  /**
   * Handle score updates
   */
  private async handleScoreUpdate(event: any): Promise<void> {
    // Notify users about score changes affecting their players
    const affectedUsers = await this.getAffectedUsers(event.playerId);
    
    for (const userId of affectedUsers) {
      await webSocketManager.sendUserNotification(userId, {
        type: "settlement_ready",
        title: "📊 Score Update",
        message: `${event.playerName}: ${event.points} points`,
        data: event
      });
    }
  }

  /**
   * Handle injury reports
   */
  private async handleInjuryReport(event: any): Promise<void> {
    // This is a high-impact event, process it accordingly
    await this.processHighImpactEvent({
      ...event,
      description: `${event.playerName} injury status: ${event.status}`
    });
  }

  /**
   * Handle lineup changes
   */
  private async handleLineupChange(event: any): Promise<void> {
    const affectedUsers = await this.getAffectedUsers(event.playerId);
    
    for (const userId of affectedUsers) {
      await webSocketManager.sendUserNotification(userId, {
        type: "settlement_ready",
        title: "📋 Lineup Change",
        message: `${event.playerName} lineup status changed`,
        data: event
      });
    }
  }

  /**
   * Update system performance metrics
   */
  private updateSystemMetrics(): void {
    const uptime = Date.now() - this.startTime.getTime();
    const dataPointsPerSecond = this.dataPointsProcessed / (uptime / 1000);
    const averageLatency = this.totalLatency / Math.max(this.dataPointsProcessed, 1);
    const errorRate = this.errorCount / Math.max(this.dataPointsProcessed, 1);

    this.systemMetrics.performance = {
      averageLatency,
      dataPointsPerSecond,
      errorRate,
      uptime
    };

    // Get connection counts
    this.systemMetrics.connections = {
      activeUsers: this.getActiveUserCount(),
      dataProviders: this.getConnectedProviderCount(),
      totalConnections: this.getTotalConnectionCount()
    };

    // Emit metrics update
    this.emit("metricsUpdate", this.systemMetrics);
  }

  /**
   * Process alert queue with intelligent prioritization
   */
  private async processAlertQueue(): Promise<void> {
    if (this.alertQueue.length === 0) return;

    // Sort by priority and timestamp
    this.alertQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    // Process up to 10 alerts per cycle
    const alertsToProcess = this.alertQueue.splice(0, 10);
    
    for (const alert of alertsToProcess) {
      await this.processAlert(alert);
    }
  }

  /**
   * Process individual alert
   */
  private async processAlert(alert: RealTimeAlert): Promise<void> {
    try {
      // Broadcast to affected users
      for (const userId of alert.affectedUsers) {
        await webSocketManager.sendUserNotification(userId, {
          type: "wager_matched",
          title: alert.title,
          message: alert.message,
          data: alert.data
        });
      }

      // Log high priority alerts
      if (alert.priority === "critical" || alert.priority === "high") {
        console.log(`🚨 ${alert.priority.toUpperCase()} ALERT: ${alert.title}`);
      }

      // Store in database for persistence
      await this.storeAlert(alert);
      
    } catch (error) {
      console.error("❌ Error processing alert:", error);
    }
  }

  /**
   * Optimize system performance based on metrics
   */
  private optimizePerformance(): void {
    const metrics = this.systemMetrics.performance;
    
    // If latency is too high, reduce update frequency
    if (metrics.averageLatency > 1000) {
      console.log("⚡ High latency detected, optimizing...");
      // Implement optimization logic
    }

    // If error rate is too high, investigate data sources
    if (metrics.errorRate > 0.05) {
      console.log("🔧 High error rate detected, analyzing...");
      // Implement error analysis logic
    }

    // If throughput is low, scale up resources
    if (metrics.dataPointsPerSecond < 10) {
      console.log("📈 Low throughput detected, scaling...");
      // Implement scaling logic
    }
  }

  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus {
    return { ...this.systemMetrics };
  }

  /**
   * Get performance metrics for specific component
   */
  getComponentMetrics(component: string): PerformanceMetrics | null {
    return this.performanceMetrics.get(component) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Record<string, PerformanceMetrics> {
    const metrics: Record<string, PerformanceMetrics> = {};
    for (const [component, metric] of this.performanceMetrics) {
      metrics[component] = metric;
    }
    return metrics;
  }

  // ==============================
  // PRIVATE HELPER METHODS
  // ==============================

  private updateComponentMetrics(component: string, latency: number, success: boolean): void {
    const existing = this.performanceMetrics.get(component);
    
    if (existing) {
      existing.latency = (existing.latency + latency) / 2; // Moving average
      existing.throughput++;
      if (!success) existing.errorCount++;
      existing.successRate = (existing.throughput - existing.errorCount) / existing.throughput;
      existing.lastUpdate = new Date();
    } else {
      this.performanceMetrics.set(component, {
        component,
        latency,
        throughput: 1,
        errorCount: success ? 0 : 1,
        successRate: success ? 1 : 0,
        lastUpdate: new Date()
      });
    }
    
    this.totalLatency += latency;
  }

  private calculateEventPriority(event: any): "low" | "medium" | "high" | "critical" {
    if (event.type === "injury") return "critical";
    if (event.type === "touchdown" && event.fantasyImpact?.[0]?.pointsChange > 6) return "high";
    if (event.fantasyImpact?.some((impact: any) => Math.abs(impact.pointsChange) > 10)) return "critical";
    return "medium";
  }

  private async getAffectedUsers(playerId: string): Promise<string[]> {
    const rosters = await prisma.roster.findMany({
      where: { playerId },
      select: { team: { select: { userId: true } } }
    });
    
    return [...new Set(rosters.map(r => r.team.userId))];
  }

  private getActiveUserCount(): number {
    // This would be implemented by WebSocket manager
    return 0; // Placeholder
  }

  private getConnectedProviderCount(): number {
    const status = liveDataManager.getProviderStatus();
    return Object.values(status).filter(p => p.isConnected).length;
  }

  private getTotalConnectionCount(): number {
    return this.getActiveUserCount() + this.getConnectedProviderCount();
  }

  private getCurrentWeek(): number {
    // Calculate current NFL week
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const diffTime = Math.abs(now.getTime() - seasonStart.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.min(Math.max(diffWeeks, 1), 18);
  }

  // Placeholder methods for additional functionality
  private async processCrossComponentPlayerUpdate(data: any): Promise<void> {
    // Implementation details...
  }

  private async handleCriticalEvent(event: any): Promise<void> {
    // Implementation details...
  }

  private async handleHighPriorityEvent(event: any): Promise<void> {
    // Implementation details...
  }

  private async broadcastEventToUsers(event: any): Promise<void> {
    // Implementation details...
  }

  private async triggerEmergencyResponse(data: any): Promise<void> {
    // Implementation details...
  }

  private async getUsersWithPosition(symbol: string): Promise<string[]> {
    // Implementation details...
    return [];
  }

  private async updateWagerValuesFromMarket(data: any): Promise<void> {
    // Implementation details...
  }

  private mergePlayerData(data1: any, data2: any): any {
    // Implementation details...
    return { ...data1, ...data2 };
  }

  private async broadcastEnhancedPlayerUpdate(data: any): Promise<void> {
    // Implementation details...
  }

  private async recalculateAllMarkets(): Promise<void> {
    // Implementation details...
  }

  private async analyzeSystemPerformance(): Promise<void> {
    // Implementation details...
  }

  private async storeAlert(alert: RealTimeAlert): Promise<void> {
    try {
      await prisma.alert.create({
        data: {
          userId: alert.affectedUsers[0] || "system",
          type: "PLAYER_UPDATE", // Map to existing enum
          title: alert.title,
          message: alert.message,
          data: alert.data,
        }
      });
    } catch (error) {
      console.error("Failed to store alert:", error);
    }
  }
}

// Singleton instance
export const realTimeOrchestrator = new RealTimeOrchestrator();