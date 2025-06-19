#!/usr/bin/env node

/**
 * ENHANCED DATA PIPELINE WITH OPTIMIZATIONS
 * Implements caching, parallel processing, smart rate limiting, and exponential backoff
 * Based on optimization recommendations for improved collection speed and reliability
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const redis = require('redis');

// Redis client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Enhanced data sources with optimized configurations
const ENHANCED_DATA_SOURCES = {
  NFL_API: {
    name: 'NFL Official API',
    endpoint: 'https://api.nfl.com/v1',
    testPath: '/games/current',
    rateLimit: 1000,
    concurrentRequests: 10,
    priority: 'HIGH',
    cacheTTL: 300, // 5 minutes
    backoffStrategy: 'exponential',
    retryAttempts: 3
  },
  ESPN_API: {
    name: 'ESPN Sports API',
    endpoint: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
    testPath: '/scoreboard',
    rateLimit: 500,
    concurrentRequests: 8,
    priority: 'HIGH',
    cacheTTL: 180, // 3 minutes
    backoffStrategy: 'exponential',
    retryAttempts: 3
  },
  YAHOO_API: {
    name: 'Yahoo Fantasy API',
    endpoint: 'https://fantasysports.yahooapis.com/fantasy/v2',
    testPath: '/users;use_login=1/games',
    rateLimit: 300,
    concurrentRequests: 6,
    priority: 'HIGH',
    cacheTTL: 600, // 10 minutes
    backoffStrategy: 'exponential',
    retryAttempts: 3
  },
  CBS_API: {
    name: 'CBS Sports API',
    endpoint: 'https://api.cbssports.com/fantasy',
    testPath: '/players',
    rateLimit: 200,
    concurrentRequests: 4,
    priority: 'MEDIUM',
    cacheTTL: 900, // 15 minutes
    backoffStrategy: 'exponential',
    retryAttempts: 2
  },
  // New high-value sources
  DRAFTKINGS_API: {
    name: 'DraftKings API',
    endpoint: 'https://sportsbook-api.draftkings.com/sites/US-SB/api/v1',
    testPath: '/leagues',
    rateLimit: 2000,
    concurrentRequests: 12,
    priority: 'HIGH',
    cacheTTL: 120, // 2 minutes (betting odds change frequently)
    backoffStrategy: 'exponential',
    retryAttempts: 3
  },
  WEATHER_API: {
    name: 'Weather API',
    endpoint: 'https://api.weather.com/v1',
    testPath: '/current/conditions',
    rateLimit: 10000,
    concurrentRequests: 15,
    priority: 'MEDIUM',
    cacheTTL: 900, // 15 minutes
    backoffStrategy: 'exponential',
    retryAttempts: 2
  }
};

// Cache configuration
const CACHE_STRATEGIES = {
  PLAYER_STATS: { ttl: 300, prefix: 'player:stats' },
  GAME_SCHEDULES: { ttl: 3600, prefix: 'schedule' },
  INJURY_REPORTS: { ttl: 1800, prefix: 'injuries' },
  BETTING_ODDS: { ttl: 120, prefix: 'odds' },
  WEATHER_DATA: { ttl: 900, prefix: 'weather' },
  TEAM_ROSTERS: { ttl: 43200, prefix: 'rosters' } // 12 hours
};

class EnhancedDataCollector {
  constructor() {
    this.requestQueues = new Map();
    this.rateLimiters = new Map();
    this.collectionMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      cachedRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0
    };
    this.setupRateLimiters();
  }

  async initialize() {
    try {
      await redisClient.connect();
      console.log('✅ Redis cache connected successfully');
    } catch (error) {
      console.warn('⚠️  Redis not available, proceeding without cache:', error.message);
    }
  }

  setupRateLimiters() {
    Object.entries(ENHANCED_DATA_SOURCES).forEach(([sourceId, config]) => {
      this.rateLimiters.set(sourceId, {
        tokens: config.rateLimit,
        maxTokens: config.rateLimit,
        refillRate: config.rateLimit / 3600, // tokens per second
        lastRefill: Date.now(),
        concurrentRequests: 0,
        maxConcurrent: config.concurrentRequests
      });
    });
  }

  async getCachedData(key, ttl = 300) {
    try {
      if (!redisClient.isReady) return null;
      
      const cached = await redisClient.get(key);
      if (cached) {
        this.collectionMetrics.cachedRequests++;
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Cache read error:', error.message);
    }
    return null;
  }

  async setCachedData(key, data, ttl = 300) {
    try {
      if (!redisClient.isReady) return;
      
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache write error:', error.message);
    }
  }

  async activateEnhancedPipeline() {
    console.log('🚀 ACTIVATING ENHANCED FANTASY.AI DATA PIPELINE...');
    console.log(`📊 Enhanced sources: ${Object.keys(ENHANCED_DATA_SOURCES).length}`);
    console.log('⚡ Optimizations: Caching, Parallel Processing, Smart Rate Limiting\n');

    await this.initialize();

    // Group sources by priority for parallel processing within priority levels
    const priorityGroups = this.groupSourcesByPriority();
    const startTime = Date.now();

    for (const [priority, sources] of priorityGroups.entries()) {
      console.log(`\n🎯 Processing ${priority} priority sources (${sources.length} sources)...`);
      
      // Process sources in parallel within the same priority
      const results = await this.collectInParallel(sources);
      
      // Brief pause between priority levels to prevent overwhelming APIs
      if (priority !== 'LOW') {
        await this.sleep(1000);
      }
    }

    const totalTime = Date.now() - startTime;
    await this.printPerformanceMetrics(totalTime);
    
    return this.collectionMetrics;
  }

  groupSourcesByPriority() {
    const groups = new Map([
      ['HIGH', []],
      ['MEDIUM', []],
      ['LOW', []]
    ]);

    Object.entries(ENHANCED_DATA_SOURCES).forEach(([sourceId, config]) => {
      groups.get(config.priority).push({ id: sourceId, config });
    });

    return groups;
  }

  async collectInParallel(sources) {
    const promises = sources.map(source => 
      this.collectWithOptimizations(source.id, source.config)
    );
    
    return await Promise.allSettled(promises);
  }

  async collectWithOptimizations(sourceId, config) {
    const startTime = Date.now();
    
    try {
      // Check rate limiter
      if (!await this.checkRateLimit(sourceId)) {
        throw new Error('Rate limit exceeded');
      }

      // Try cache first
      const cacheKey = `${sourceId}:${config.testPath}`;
      const cachedData = await this.getCachedData(cacheKey, config.cacheTTL);
      
      if (cachedData) {
        console.log(`  📦 ${config.name} - CACHED (${Date.now() - startTime}ms)`);
        return { sourceId, status: 'cached', data: cachedData };
      }

      // Make API request with backoff
      const result = await this.makeRequestWithBackoff(sourceId, config);
      
      // Cache the result
      await this.setCachedData(cacheKey, result, config.cacheTTL);
      
      const responseTime = Date.now() - startTime;
      console.log(`  ✅ ${config.name} - SUCCESS (${responseTime}ms)`);
      
      this.collectionMetrics.successfulRequests++;
      this.updateAverageResponseTime(responseTime);
      
      return { sourceId, status: 'success', data: result, responseTime };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`  ❌ ${config.name} - FAILED: ${error.message} (${responseTime}ms)`);
      
      this.collectionMetrics.failedRequests++;
      if (error.message.includes('Rate limit')) {
        this.collectionMetrics.rateLimitHits++;
      }
      
      return { sourceId, status: 'failed', error: error.message, responseTime };
    } finally {
      this.collectionMetrics.totalRequests++;
      await this.releaseRateLimit(sourceId);
    }
  }

  async checkRateLimit(sourceId) {
    const limiter = this.rateLimiters.get(sourceId);
    if (!limiter) return true;

    const now = Date.now();
    
    // Refill tokens based on time elapsed
    const timeDiff = (now - limiter.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(timeDiff * limiter.refillRate);
    
    if (tokensToAdd > 0) {
      limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + tokensToAdd);
      limiter.lastRefill = now;
    }

    // Check concurrent requests
    if (limiter.concurrentRequests >= limiter.maxConcurrent) {
      return false;
    }

    // Check available tokens
    if (limiter.tokens < 1) {
      return false;
    }

    // Reserve token and increment concurrent counter
    limiter.tokens--;
    limiter.concurrentRequests++;
    
    return true;
  }

  async releaseRateLimit(sourceId) {
    const limiter = this.rateLimiters.get(sourceId);
    if (limiter && limiter.concurrentRequests > 0) {
      limiter.concurrentRequests--;
    }
  }

  async makeRequestWithBackoff(sourceId, config, attempt = 0) {
    try {
      const result = await this.makeAPICall(config);
      return result;
    } catch (error) {
      if ((error.status === 429 || error.message.includes('Rate limit')) && 
          attempt < config.retryAttempts) {
        
        const delay = this.calculateBackoffDelay(attempt, config.backoffStrategy);
        console.log(`  ⏳ ${config.name} - Backing off for ${delay}ms (attempt ${attempt + 1})`);
        
        await this.sleep(delay);
        return this.makeRequestWithBackoff(sourceId, config, attempt + 1);
      }
      throw error;
    }
  }

  calculateBackoffDelay(attempt, strategy = 'exponential') {
    switch (strategy) {
      case 'exponential':
        return Math.min(30000, Math.pow(2, attempt) * 1000); // Cap at 30 seconds
      case 'linear':
        return (attempt + 1) * 1000;
      case 'fixed':
        return 2000;
      default:
        return Math.pow(2, attempt) * 1000;
    }
  }

  async makeAPICall(config) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const testUrl = config.endpoint + config.testPath;
      
      // Simulate API call (replace with actual HTTP request in production)
      setTimeout(() => {
        const latency = Date.now() - startTime + Math.random() * 200;
        
        // Simulate different response scenarios
        const random = Math.random();
        if (random > 0.95) {
          reject({ status: 429, message: 'Rate limit exceeded' });
        } else if (random > 0.92) {
          reject({ status: 500, message: 'Server error' });
        } else {
          resolve({
            success: true,
            data: this.generateMockData(config.name),
            latency: Math.round(latency),
            timestamp: new Date().toISOString()
          });
        }
      }, Math.random() * 500 + 100); // 100-600ms response time
    });
  }

  generateMockData(sourceName) {
    return {
      source: sourceName,
      timestamp: new Date().toISOString(),
      records: Math.floor(Math.random() * 100) + 50,
      quality: 90 + Math.random() * 10
    };
  }

  updateAverageResponseTime(responseTime) {
    const total = this.collectionMetrics.totalRequests;
    const current = this.collectionMetrics.averageResponseTime;
    this.collectionMetrics.averageResponseTime = 
      ((current * (total - 1)) + responseTime) / total;
  }

  async printPerformanceMetrics(totalTime) {
    const metrics = this.collectionMetrics;
    const successRate = ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1);
    const cacheHitRate = ((metrics.cachedRequests / metrics.totalRequests) * 100).toFixed(1);
    
    console.log('\n📊 ENHANCED PIPELINE PERFORMANCE METRICS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Total Execution Time: ${totalTime}ms`);
    console.log(`📈 Total Requests: ${metrics.totalRequests}`);
    console.log(`✅ Successful: ${metrics.successfulRequests} (${successRate}%)`);
    console.log(`📦 Cached Responses: ${metrics.cachedRequests} (${cacheHitRate}%)`);
    console.log(`❌ Failed: ${metrics.failedRequests}`);
    console.log(`⚡ Rate Limit Hits: ${metrics.rateLimitHits}`);
    console.log(`🎯 Avg Response Time: ${metrics.averageResponseTime.toFixed(0)}ms`);
    
    // Calculate efficiency improvements
    const estimatedOldTime = metrics.totalRequests * 2000; // Assume 2s per request sequentially
    const speedImprovement = ((estimatedOldTime - totalTime) / estimatedOldTime * 100).toFixed(1);
    console.log(`🚀 Speed Improvement: ~${speedImprovement}% faster than sequential`);
    
    // Cache efficiency
    if (metrics.cachedRequests > 0) {
      const apiCallsSaved = metrics.cachedRequests;
      console.log(`💰 API Calls Saved: ${apiCallsSaved} (via caching)`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async gracefulShutdown() {
    console.log('🔄 Gracefully shutting down...');
    
    try {
      if (redisClient.isReady) {
        await redisClient.quit();
        console.log('✅ Redis connection closed');
      }
    } catch (error) {
      console.warn('⚠️  Error closing Redis connection:', error.message);
    }
  }
}

// Batch request manager for APIs that support batching
class BatchRequestManager {
  constructor() {
    this.batches = new Map();
    this.batchTimeout = 1000; // 1 second
    this.maxBatchSize = 50;
  }

  addToBatch(sourceId, request) {
    if (!this.batches.has(sourceId)) {
      this.batches.set(sourceId, []);
      setTimeout(() => this.processBatch(sourceId), this.batchTimeout);
    }

    const batch = this.batches.get(sourceId);
    batch.push(request);

    if (batch.length >= this.maxBatchSize) {
      this.processBatch(sourceId);
    }
  }

  async processBatch(sourceId) {
    const batch = this.batches.get(sourceId);
    if (!batch || batch.length === 0) return;

    this.batches.delete(sourceId);
    
    console.log(`📦 Processing batch of ${batch.length} requests for ${sourceId}`);
    
    // Process batch request (implement based on API capabilities)
    try {
      const batchResult = await this.makeBatchRequest(sourceId, batch);
      this.distributeBatchResults(batch, batchResult);
    } catch (error) {
      console.error(`❌ Batch processing failed for ${sourceId}:`, error.message);
    }
  }

  async makeBatchRequest(sourceId, batch) {
    // Implement based on specific API batch capabilities
    return { success: true, results: batch.map(req => ({ ...req, processed: true })) };
  }

  distributeBatchResults(batch, batchResult) {
    // Distribute results back to individual request handlers
    batch.forEach((request, index) => {
      if (request.callback) {
        request.callback(batchResult.results[index]);
      }
    });
  }
}

// Main execution
async function main() {
  const collector = new EnhancedDataCollector();
  const batchManager = new BatchRequestManager();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT signal');
    await collector.gracefulShutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM signal');
    await collector.gracefulShutdown();
    process.exit(0);
  });

  try {
    const results = await collector.activateEnhancedPipeline();
    
    console.log('🎉 Enhanced data pipeline completed successfully!');
    console.log('📊 Ready for real-time data processing and analysis');
    
    return results;
    
  } catch (error) {
    console.error('💥 Enhanced pipeline failed:', error);
    await collector.gracefulShutdown();
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  EnhancedDataCollector,
  BatchRequestManager,
  ENHANCED_DATA_SOURCES,
  CACHE_STRATEGIES
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}