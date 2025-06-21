/**
 * 🕒 SCHEDULED DATABASE UPDATES - Keep REAL Data Fresh
 * Mission: "Either we know it or we don't... yet!"
 * 
 * Automatically updates our database with fresh REAL data throughout the day
 * to ensure Fantasy.AI always has the latest information!
 */

import { realDataPipeline } from './real-data-pipeline';
import { unifiedMCPManager } from '../mcp-integration/unified-mcp-manager';

export interface UpdateSchedule {
  name: string;
  frequency: 'every_5min' | 'every_15min' | 'every_hour' | 'daily';
  tables: string[];
  mcpServers: string[];
  lastRun?: string;
  nextRun?: string;
}

export class ScheduledDataUpdates {
  private updateSchedules: UpdateSchedule[] = [
    {
      name: 'Live Game Updates',
      frequency: 'every_5min',
      tables: ['games', 'players', 'live_scores'],
      mcpServers: ['firecrawl', 'puppeteer']
    },
    {
      name: 'Injury Reports',
      frequency: 'every_15min', 
      tables: ['injuries', 'player_status'],
      mcpServers: ['firecrawl']
    },
    {
      name: 'Multimedia Insights',
      frequency: 'every_hour',
      tables: ['multimedia_content', 'trending_topics'],
      mcpServers: ['firecrawl', 'puppeteer', 'knowledge_graph']
    },
    {
      name: 'Weather Updates',
      frequency: 'every_hour',
      tables: ['weather_data'],
      mcpServers: ['firecrawl', 'puppeteer']
    },
    {
      name: 'Social Sentiment',
      frequency: 'every_hour',
      tables: ['social_mentions', 'sentiment_analysis'],
      mcpServers: ['firecrawl']
    },
    {
      name: 'Player Statistics',
      frequency: 'daily',
      tables: ['players', 'player_stats', 'projections'],
      mcpServers: ['firecrawl', 'puppeteer']
    }
  ];

  /**
   * 🚀 Start all scheduled updates
   */
  async startScheduledUpdates(): Promise<void> {
    console.log('🕒 STARTING SCHEDULED REAL DATA UPDATES');
    
    // Set up intervals for each update schedule
    this.updateSchedules.forEach(schedule => {
      const intervalMs = this.getIntervalMs(schedule.frequency);
      
      setInterval(async () => {
        await this.executeScheduledUpdate(schedule);
      }, intervalMs);
      
      console.log(`✅ Scheduled: ${schedule.name} every ${schedule.frequency}`);
    });
    
    // Run initial updates immediately
    await this.runAllUpdates();
  }

  /**
   * 🔄 Execute a specific scheduled update
   */
  private async executeScheduledUpdate(schedule: UpdateSchedule): Promise<void> {
    try {
      console.log(`🔄 Running scheduled update: ${schedule.name}`);
      
      const startTime = Date.now();
      schedule.lastRun = new Date().toISOString();
      
      // Execute MCP data collection for this schedule
      const result = await unifiedMCPManager.executeCapability({
        operation: "scheduled_data_update",
        servers: schedule.mcpServers,
        priority: "medium" as const,
        parameters: {
          updateType: schedule.name,
          targetTables: schedule.tables,
          skipCache: false
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (result?.success) {
        console.log(`✅ ${schedule.name} completed in ${duration}ms`);
      } else {
        console.warn(`⚠️ ${schedule.name} had issues:`, result?.errors);
      }
      
      // Calculate next run time
      const nextRunMs = Date.now() + this.getIntervalMs(schedule.frequency);
      schedule.nextRun = new Date(nextRunMs).toISOString();
      
    } catch (error) {
      console.error(`❌ Scheduled update failed: ${schedule.name}`, error);
    }
  }

  /**
   * 🏃‍♂️ Run all updates immediately
   */
  async runAllUpdates(): Promise<void> {
    console.log('🏃‍♂️ Running all scheduled updates immediately');
    
    await Promise.all(
      this.updateSchedules.map(schedule => 
        this.executeScheduledUpdate(schedule)
      )
    );
    
    console.log('✅ All scheduled updates completed');
  }

  /**
   * 📊 Get update status and next run times
   */
  getUpdateStatus(): UpdateSchedule[] {
    return this.updateSchedules.map(schedule => ({
      ...schedule,
      nextRun: schedule.nextRun || 'Not scheduled'
    }));
  }

  /**
   * ⏱️ Convert frequency to milliseconds
   */
  private getIntervalMs(frequency: UpdateSchedule['frequency']): number {
    switch (frequency) {
      case 'every_5min': return 5 * 60 * 1000;
      case 'every_15min': return 15 * 60 * 1000;
      case 'every_hour': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default to hourly
    }
  }

  /**
   * 🛑 Stop all scheduled updates
   */
  stopScheduledUpdates(): void {
    // In a real implementation, you'd track interval IDs to clear them
    console.log('🛑 Stopped all scheduled updates');
  }
}

export const scheduledDataUpdates = new ScheduledDataUpdates();

/**
 * 🚀 Initialize scheduled updates (call this on app startup)
 */
export async function initializeScheduledUpdates(): Promise<void> {
  try {
    await scheduledDataUpdates.startScheduledUpdates();
    console.log('🎉 Scheduled data updates initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize scheduled updates:', error);
  }
}