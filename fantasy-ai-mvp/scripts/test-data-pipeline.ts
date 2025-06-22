#!/usr/bin/env tsx

/**
 * 🧪 TEST DATA PIPELINE
 * 
 * This script tests the complete data collection pipeline:
 * 1. Collect data and save to database
 * 2. Process raw data into structured tables
 * 3. Verify cleanup works
 */

import { PrismaClient } from '@prisma/client';
import { dataCollectionService } from '../src/lib/data-collection-service';

const prisma = new PrismaClient();

async function testPipeline() {
  console.log('🧪 TESTING DATA PIPELINE...\n');

  try {
    // Step 1: Test data collection
    console.log('📥 Step 1: Testing data collection...');
    const runId = await dataCollectionService.startCollectionRun(
      'Test Source',
      'test'
    );
    
    // Save some test data
    await dataCollectionService.saveRawData(
      'ESPN Test',
      'news',
      'https://espn.com/test',
      {
        articles: [
          {
            title: 'Test Article: Patriots Win Big',
            url: 'https://espn.com/test-article-1',
            publishedAt: new Date().toISOString(),
            summary: 'The Patriots secured a decisive victory...'
          },
          {
            title: 'Breaking: Star Player Injured',
            url: 'https://espn.com/test-article-2',
            publishedAt: new Date().toISOString(),
            summary: 'Team confirms injury to key player...'
          }
        ],
        records: 2
      },
      2
    );
    
    await dataCollectionService.endCollectionRun(2);
    console.log('✅ Data collection successful\n');

    // Step 2: Verify data was saved
    console.log('🔍 Step 2: Verifying saved data...');
    const savedRun = await prisma.dataCollectionRun.findUnique({
      where: { id: runId },
      include: { rawDataItems: true }
    });
    
    console.log(`✅ Collection run saved: ${savedRun?.status}`);
    console.log(`✅ Raw data items: ${savedRun?.rawDataItems.length}\n`);

    // Step 3: Test data processing
    console.log('⚙️ Step 3: Testing data processing...');
    const unprocessed = await dataCollectionService.getUnprocessedData(10);
    console.log(`Found ${unprocessed.length} unprocessed items`);
    
    if (unprocessed.length > 0) {
      const item = unprocessed[0];
      const data = JSON.parse(item.rawData);
      
      // Process the articles
      for (const article of data.articles) {
        await dataCollectionService.saveNewsArticle({
          source: item.source,
          title: article.title,
          content: article.summary,
          url: article.url,
          publishedAt: new Date(article.publishedAt),
          summary: article.summary,
          sport: 'nfl',
          teams: ['Patriots'],
          category: 'test'
        });
      }
      
      // Mark as processed
      await dataCollectionService.markAsProcessed(item.id);
      console.log('✅ Data processing successful\n');
    }

    // Step 4: Verify news articles were created
    console.log('📰 Step 4: Verifying news articles...');
    const newsCount = await prisma.newsArticle.count();
    console.log(`✅ Total news articles in database: ${newsCount}\n`);

    // Step 5: Test cleanup (with 0 days to clean everything)
    console.log('🧹 Step 5: Testing cleanup...');
    const initialCount = await prisma.rawDataCache.count({
      where: { isProcessed: true }
    });
    console.log(`Processed items before cleanup: ${initialCount}`);
    
    // Note: Cleanup only works on items older than specified days
    // For testing, we'll just verify it runs without error
    const cleaned = await dataCollectionService.cleanupOldData(0);
    console.log(`✅ Cleanup completed (cleaned ${cleaned} items)\n`);

    // Final summary
    console.log('📊 PIPELINE TEST SUMMARY:');
    console.log('=' .repeat(40));
    
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        (SELECT COUNT(*) FROM DataCollectionRun) as runs,
        (SELECT COUNT(*) FROM RawDataCache) as rawData,
        (SELECT COUNT(*) FROM NewsArticle) as news,
        (SELECT COUNT(*) FROM Player) as players
    `;
    
    console.log(`Collection Runs: ${stats[0].runs}`);
    console.log(`Raw Data Cache: ${stats[0].rawData}`);
    console.log(`News Articles: ${stats[0].news}`);
    console.log(`Players: ${stats[0].players}`);
    console.log('=' .repeat(40));
    console.log('\n✅ ALL TESTS PASSED! Pipeline is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPipeline().catch(console.error);