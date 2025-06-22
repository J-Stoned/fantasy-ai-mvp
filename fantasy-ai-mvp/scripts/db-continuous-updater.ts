#!/usr/bin/env tsx

/**
 * 🔄 DATABASE CONTINUOUS UPDATER - Store Everything in DB!
 * 
 * This script runs continuously and stores all collected data in the database
 * instead of creating JSON files.
 */

import { PrismaClient } from '@prisma/client';
import { dataCollectionService } from '../src/lib/data-collection-service';

const prisma = new PrismaClient();

interface DataSource {
  name: string;
  url: string;
  type: 'api' | 'news' | 'official';
  sport?: string;
}

class DatabaseContinuousUpdater {
  private isRunning = false;
  private updateCount = 0;
  private stats = {
    totalRuns: 0,
    recordsCollected: 0,
    recordsProcessed: 0,
    errors: 0
  };

  // All the free data sources
  private dataSources: DataSource[] = [
    // API Sources
    { name: 'ESPN API', url: 'https://site.api.espn.com/apis/site/v2/sports', type: 'api' },
    { name: 'Yahoo Fantasy API', url: 'https://fantasysports.yahooapis.com/fantasy/v2', type: 'api' },
    
    // News Sources
    { name: 'ESPN', url: 'https://www.espn.com', type: 'news', sport: 'multi' },
    { name: 'CBS Sports', url: 'https://www.cbssports.com', type: 'news', sport: 'multi' },
    { name: 'Fox Sports', url: 'https://www.foxsports.com', type: 'news', sport: 'multi' },
    { name: 'NBC Sports', url: 'https://www.nbcsports.com', type: 'news', sport: 'multi' },
    { name: 'The Athletic', url: 'https://theathletic.com', type: 'news', sport: 'multi' },
    { name: 'Bleacher Report', url: 'https://bleacherreport.com', type: 'news', sport: 'multi' },
    { name: 'Yahoo Sports', url: 'https://sports.yahoo.com', type: 'news', sport: 'multi' },
    { name: 'Sports Illustrated', url: 'https://www.si.com', type: 'news', sport: 'multi' },
    { name: 'Barstool Sports', url: 'https://www.barstoolsports.com', type: 'news', sport: 'multi' },
    { name: 'Sky Sports', url: 'https://www.skysports.com', type: 'news', sport: 'multi' },
    { name: 'BBC Sport', url: 'https://www.bbc.com/sport', type: 'news', sport: 'multi' },
    { name: 'TSN', url: 'https://www.tsn.ca', type: 'news', sport: 'multi' },
    { name: 'Sportsnet', url: 'https://www.sportsnet.ca', type: 'news', sport: 'multi' },
    
    // Official Team Sources (examples)
    { name: '49ERS Official', url: 'https://www.49ers.com', type: 'official', sport: 'nfl' },
    { name: 'BILLS Official', url: 'https://www.buffalobills.com', type: 'official', sport: 'nfl' },
    { name: 'LAKERS Official', url: 'https://www.lakers.com', type: 'official', sport: 'nba' },
    { name: 'CELTICS Official', url: 'https://www.celtics.com', type: 'official', sport: 'nba' },
    { name: 'YANKEES Official', url: 'https://www.yankees.com', type: 'official', sport: 'mlb' },
    { name: 'DODGERS Official', url: 'https://www.dodgers.com', type: 'official', sport: 'mlb' },
  ];

  async start() {
    console.log('🔄🚀 DATABASE CONTINUOUS UPDATER STARTING! 🚀🔄');
    console.log('💾 All data will be stored in database');
    console.log('⏱️  Update Interval: 25 seconds');
    console.log(`📊 Monitoring ${this.dataSources.length} data sources\n`);
    
    this.isRunning = true;
    
    // Start the continuous update loop
    this.runUpdateLoop();
    
    // Status monitoring
    setInterval(() => this.logStatus(), 60000); // Every minute
    
    // Cleanup old data every hour
    setInterval(() => this.cleanupOldData(), 3600000); // Every hour
  }

  private async runUpdateLoop() {
    while (this.isRunning) {
      try {
        await this.performUpdate();
        this.updateCount++;
        
        // Wait 25 seconds before next update
        await this.sleep(25000);
        
      } catch (error) {
        console.error(`❌ Update cycle ${this.updateCount} failed:`, error.message);
        this.stats.errors++;
        
        // Wait 30 seconds on error
        await this.sleep(30000);
      }
    }
  }

  private async performUpdate() {
    console.log(`\n🔄 Update Cycle #${this.updateCount + 1} - ${new Date().toLocaleTimeString()}`);
    
    const startTime = Date.now();
    
    // Start a new collection run
    const runId = await dataCollectionService.startCollectionRun(
      'Multi-Source Collector',
      'continuous'
    );
    
    let totalRecords = 0;
    let successCount = 0;
    
    // Collect data from sources (simulate for now)
    for (const source of this.dataSources) {
      try {
        const recordCount = await this.collectFromSource(source);
        totalRecords += recordCount;
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to collect from ${source.name}`);
      }
    }
    
    // End the collection run
    await dataCollectionService.endCollectionRun(totalRecords);
    
    // Process some unprocessed data
    await this.processCollectedData();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Update completed in ${duration}ms`);
    console.log(`  📊 Collected: ${totalRecords} records from ${successCount}/${this.dataSources.length} sources`);
    
    this.stats.totalRuns++;
    this.stats.recordsCollected += totalRecords;
  }

  private async collectFromSource(source: DataSource): Promise<number> {
    // Simulate data collection (in real implementation, would use MCP servers)
    const mockData = this.generateMockData(source);
    const recordCount = mockData.records || 0;
    
    // Save raw data to database
    await dataCollectionService.saveRawData(
      source.name,
      source.type,
      source.url,
      mockData,
      recordCount
    );
    
    return recordCount;
  }

  private generateMockData(source: DataSource): any {
    const recordCount = Math.floor(Math.random() * 50) + 10; // 10-60 records
    
    if (source.type === 'news') {
      return {
        source: source.name,
        url: source.url,
        timestamp: new Date().toISOString(),
        records: recordCount,
        articles: Array(recordCount).fill(null).map((_, i) => ({
          title: `Breaking: ${source.sport?.toUpperCase()} News Update ${i + 1}`,
          url: `${source.url}/article-${Date.now()}-${i}`,
          publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          summary: `Latest updates from ${source.name}...`
        }))
      };
    } else if (source.type === 'api') {
      return {
        source: source.name,
        url: source.url,
        timestamp: new Date().toISOString(),
        records: recordCount,
        data: `API data collected: ${recordCount} records`
      };
    } else {
      return {
        source: source.name,
        url: source.url,
        timestamp: new Date().toISOString(),
        records: recordCount,
        data: `Official team data: ${recordCount} updates`
      };
    }
  }

  private async processCollectedData() {
    console.log('  🔄 Processing collected data...');
    
    // Get unprocessed data
    const unprocessedData = await dataCollectionService.getUnprocessedData(10);
    
    let processedCount = 0;
    
    for (const rawData of unprocessedData) {
      try {
        const data = JSON.parse(rawData.rawData);
        
        // Process based on data type
        if (rawData.dataType === 'news' && data.articles) {
          // Process news articles
          for (const article of data.articles.slice(0, 5)) { // Process max 5 per cycle
            await dataCollectionService.saveNewsArticle({
              source: rawData.source,
              title: article.title,
              content: article.content || 'Content pending...',
              url: article.url,
              publishedAt: new Date(article.publishedAt),
              summary: article.summary,
              sport: data.sport,
            });
          }
        }
        
        // Mark as processed
        await dataCollectionService.markAsProcessed(rawData.id);
        processedCount++;
        
        // Log the processing
        await dataCollectionService.logProcessing(
          rawData.id,
          rawData.dataType === 'news' ? 'NEWS_ARTICLES' : 'RAW_DATA',
          data.records || 0
        );
        
      } catch (error) {
        console.error('  ⚠️ Failed to process data:', error.message);
      }
    }
    
    if (processedCount > 0) {
      console.log(`  ✅ Processed ${processedCount} data batches`);
      this.stats.recordsProcessed += processedCount;
    }
  }

  private async cleanupOldData() {
    console.log('\n🧹 Running cleanup job...');
    
    try {
      const deletedCount = await dataCollectionService.cleanupOldData(7); // Keep 7 days
      console.log(`  ✅ Cleaned up ${deletedCount} old records`);
    } catch (error) {
      console.error('  ❌ Cleanup failed:', error.message);
    }
  }

  private async logStatus() {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        (SELECT COUNT(*) FROM DataCollectionRun) as totalRuns,
        (SELECT COUNT(*) FROM RawDataCache) as totalRawData,
        (SELECT COUNT(*) FROM RawDataCache WHERE isProcessed = false) as unprocessedData,
        (SELECT COUNT(*) FROM NewsArticle) as totalNews,
        (SELECT COUNT(*) FROM GameData) as totalGames
    `;
    
    console.log('\n📊 DATABASE UPDATER STATUS:');
    console.log(`  🔄 Update Cycles: ${this.stats.totalRuns}`);
    console.log(`  📦 Records Collected: ${this.stats.recordsCollected}`);
    console.log(`  ✅ Records Processed: ${this.stats.recordsProcessed}`);
    console.log(`  ❌ Errors: ${this.stats.errors}`);
    console.log('\n  💾 DATABASE STATS:');
    console.log(`  📋 Collection Runs: ${stats[0]?.totalRuns || 0}`);
    console.log(`  🗄️ Raw Data Cache: ${stats[0]?.totalRawData || 0}`);
    console.log(`  ⏳ Unprocessed: ${stats[0]?.unprocessedData || 0}`);
    console.log(`  📰 News Articles: ${stats[0]?.totalNews || 0}`);
    console.log(`  🏈 Game Data: ${stats[0]?.totalGames || 0}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping database updater...');
    this.isRunning = false;
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received shutdown signal...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received termination signal...');
  process.exit(0);
});

// Start the updater
const updater = new DatabaseContinuousUpdater();
updater.start().catch(console.error);

console.log('🎯 Database Continuous Updater initialized!');
console.log('💡 Press Ctrl+C to stop');
console.log('📊 All data will be stored in the database!');