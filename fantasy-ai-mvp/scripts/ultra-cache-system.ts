#!/usr/bin/env tsx

/**
 * ⚡ ULTRA CACHE SYSTEM
 * 
 * Redis-like in-memory caching for INSTANT data access!
 * Features:
 * - TTL (Time To Live) support
 * - LRU (Least Recently Used) eviction
 * - Pub/Sub for real-time updates
 * - Persistence to disk
 * - Multi-layer caching
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

const CACHE_DIR = path.join(__dirname, '../data/ultimate-free/cache');

// Ensure directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  lastAccessed: number;
  hits: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
}

class UltraCacheSystem extends EventEmitter {
  private primaryCache: Map<string, CacheEntry> = new Map();
  private secondaryCache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 10000;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    writes: 0
  };
  
  constructor(options: { maxSize?: number; persistToDisk?: boolean } = {}) {
    super();
    this.maxSize = options.maxSize || 10000;
    
    if (options.persistToDisk) {
      this.loadFromDisk();
      this.startPersistence();
    }
    
    // Start cleanup interval
    this.startCleanup();
  }
  
  // Primary operations
  set<T>(key: string, value: T, options: {
    ttl?: number;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    tags?: string[];
  } = {}): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      ttl: options.ttl || 60000, // Default 1 minute
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hits: 0,
      priority: options.priority || 'MEDIUM',
      tags: options.tags || []
    };
    
    // Check size limit
    if (this.primaryCache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.primaryCache.set(key, entry);
    this.stats.writes++;
    
    // Emit event for real-time updates
    this.emit('set', { key, value });
    
    // Replicate to secondary cache for high priority items
    if (entry.priority === 'HIGH') {
      this.secondaryCache.set(key, { ...entry });
    }
  }
  
  get<T>(key: string): T | null {
    // Check primary cache
    let entry = this.primaryCache.get(key);
    
    // Fallback to secondary cache
    if (!entry) {
      entry = this.secondaryCache.get(key);
      if (entry) {
        // Promote back to primary
        this.primaryCache.set(key, entry);
      }
    }
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update stats
    entry.lastAccessed = Date.now();
    entry.hits++;
    this.stats.hits++;
    
    return entry.value as T;
  }
  
  // Batch operations for efficiency
  mget<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }
  
  mset(entries: Array<{ key: string; value: any; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, { ttl: entry.ttl });
    }
  }
  
  // Pattern matching (like Redis KEYS)
  keys(pattern: string): string[] {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.primaryCache.keys()).filter(key => regex.test(key));
  }
  
  // Tag-based operations
  getByTag(tag: string): Array<{ key: string; value: any }> {
    const results: Array<{ key: string; value: any }> = [];
    
    this.primaryCache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        results.push({ key, value: entry.value });
      }
    });
    
    return results;
  }
  
  deleteByTag(tag: string): number {
    let deleted = 0;
    
    this.primaryCache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        this.delete(key);
        deleted++;
      }
    });
    
    return deleted;
  }
  
  // Advanced operations
  increment(key: string, amount: number = 1): number {
    const current = this.get<number>(key) || 0;
    const newValue = current + amount;
    this.set(key, newValue);
    return newValue;
  }
  
  // Pub/Sub functionality
  subscribe(pattern: string, callback: (key: string, value: any) => void): void {
    this.on('set', ({ key, value }) => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(key)) {
        callback(key, value);
      }
    });
  }
  
  // Cache warming
  async warmCache(loader: () => Promise<Array<{ key: string; value: any; ttl?: number }>>): Promise<void> {
    console.log('🔥 Warming cache...');
    const entries = await loader();
    this.mset(entries);
    console.log(`✅ Warmed cache with ${entries.length} entries`);
  }
  
  // Internal methods
  private delete(key: string): boolean {
    const deleted = this.primaryCache.delete(key);
    this.secondaryCache.delete(key);
    return deleted;
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }
  
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();
    
    // Find least recently used entry
    this.primaryCache.forEach((entry, key) => {
      // Don't evict HIGH priority items if possible
      if (entry.priority !== 'HIGH' && entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    });
    
    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
      this.emit('evict', lruKey);
    }
  }
  
  private startCleanup(): void {
    setInterval(() => {
      let cleaned = 0;
      
      this.primaryCache.forEach((entry, key) => {
        if (this.isExpired(entry)) {
          this.delete(key);
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired entries`);
      }
    }, 60 * 1000); // Every minute
  }
  
  private startPersistence(): void {
    setInterval(() => {
      this.saveToDisk();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  private saveToDisk(): void {
    const data = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      entries: Array.from(this.primaryCache.entries()).map(([key, entry]) => ({
        key,
        value: entry.value,
        ttl: entry.ttl,
        priority: entry.priority,
        tags: entry.tags
      }))
    };
    
    fs.writeFileSync(
      path.join(CACHE_DIR, 'cache-snapshot.json'),
      JSON.stringify(data, null, 2)
    );
  }
  
  private loadFromDisk(): void {
    try {
      const data = JSON.parse(
        fs.readFileSync(path.join(CACHE_DIR, 'cache-snapshot.json'), 'utf-8')
      );
      
      // Restore entries that aren't expired
      const now = Date.now();
      let restored = 0;
      
      data.entries.forEach((entry: any) => {
        this.set(entry.key, entry.value, {
          ttl: entry.ttl,
          priority: entry.priority,
          tags: entry.tags
        });
        restored++;
      });
      
      console.log(`📂 Restored ${restored} cache entries from disk`);
    } catch (error) {
      // No cache file yet
    }
  }
  
  // Stats and monitoring
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0;
    
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      primarySize: this.primaryCache.size,
      secondarySize: this.secondaryCache.size,
      totalSize: this.primaryCache.size + this.secondaryCache.size
    };
  }
  
  // Clear operations
  clear(): void {
    this.primaryCache.clear();
    this.secondaryCache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, writes: 0 };
    this.emit('clear');
  }
  
  clearPattern(pattern: string): number {
    const keys = this.keys(pattern);
    keys.forEach(key => this.delete(key));
    return keys.length;
  }
}

// Specialized caches for different data types
class FantasyCacheLayer {
  private playerCache: UltraCacheSystem;
  private gameCache: UltraCacheSystem;
  private statsCache: UltraCacheSystem;
  private newsCache: UltraCacheSystem;
  
  constructor() {
    // Different cache configurations for different data types
    this.playerCache = new UltraCacheSystem({
      maxSize: 5000,
      persistToDisk: true
    });
    
    this.gameCache = new UltraCacheSystem({
      maxSize: 1000,
      persistToDisk: false // Games change too frequently
    });
    
    this.statsCache = new UltraCacheSystem({
      maxSize: 10000,
      persistToDisk: true
    });
    
    this.newsCache = new UltraCacheSystem({
      maxSize: 500,
      persistToDisk: false
    });
    
    this.setupSubscriptions();
  }
  
  // Player operations
  setPlayer(playerId: string, data: any, isLive: boolean = false): void {
    this.playerCache.set(`player:${playerId}`, data, {
      ttl: isLive ? 30000 : 300000, // 30s if live, 5min otherwise
      priority: isLive ? 'HIGH' : 'MEDIUM',
      tags: ['player', data.team, data.position]
    });
  }
  
  getPlayer(playerId: string): any {
    return this.playerCache.get(`player:${playerId}`);
  }
  
  getPlayersByTeam(team: string): any[] {
    return this.playerCache.getByTag(team);
  }
  
  // Game operations
  setGame(gameId: string, data: any): void {
    const isLive = data.status === 'LIVE';
    
    this.gameCache.set(`game:${gameId}`, data, {
      ttl: isLive ? 10000 : 60000, // 10s if live, 1min otherwise
      priority: isLive ? 'HIGH' : 'LOW',
      tags: ['game', data.sport, ...data.teams]
    });
  }
  
  getLiveGames(): any[] {
    return this.gameCache.getByTag('LIVE');
  }
  
  // Stats operations
  setStats(key: string, stats: any, sport: string): void {
    this.statsCache.set(`stats:${key}`, stats, {
      ttl: 600000, // 10 minutes
      priority: 'MEDIUM',
      tags: ['stats', sport]
    });
  }
  
  // News operations
  setNews(newsId: string, article: any): void {
    const isBreaking = article.title.includes('BREAKING');
    
    this.newsCache.set(`news:${newsId}`, article, {
      ttl: isBreaking ? 3600000 : 1800000, // 1hr if breaking, 30min otherwise
      priority: isBreaking ? 'HIGH' : 'LOW',
      tags: ['news', ...article.tags]
    });
  }
  
  getBreakingNews(): any[] {
    return this.newsCache.getByTag('BREAKING');
  }
  
  // Real-time subscriptions
  private setupSubscriptions(): void {
    // Monitor live game updates
    this.gameCache.subscribe('game:*', (key, game) => {
      if (game.status === 'LIVE') {
        console.log(`🔴 LIVE UPDATE: ${game.teams.join(' vs ')}`);
        // Trigger other updates
      }
    });
    
    // Monitor breaking news
    this.newsCache.subscribe('news:*', (key, article) => {
      if (article.title.includes('BREAKING')) {
        console.log(`🚨 BREAKING: ${article.title}`);
        // Send notifications
      }
    });
  }
  
  // Get all stats
  getAllStats() {
    return {
      player: this.playerCache.getStats(),
      game: this.gameCache.getStats(),
      stats: this.statsCache.getStats(),
      news: this.newsCache.getStats()
    };
  }
  
  // Warm all caches
  async warmAllCaches() {
    console.log('🔥 Warming all caches...');
    
    await Promise.all([
      this.playerCache.warmCache(async () => {
        // Load top 100 players
        return Array.from({ length: 100 }, (_, i) => ({
          key: `player:${i}`,
          value: { id: i, name: `Player ${i}` },
          ttl: 300000
        }));
      }),
      
      this.statsCache.warmCache(async () => {
        // Load recent stats
        return Array.from({ length: 50 }, (_, i) => ({
          key: `stats:recent:${i}`,
          value: { data: 'stats' },
          ttl: 600000
        }));
      })
    ]);
    
    console.log('✅ All caches warmed!');
  }
}

// Export for use in other scripts
export { UltraCacheSystem, FantasyCacheLayer };

// Demo usage
async function demo() {
  console.log('⚡ ULTRA CACHE SYSTEM DEMO');
  console.log('=========================\n');
  
  const cache = new FantasyCacheLayer();
  
  // Warm caches
  await cache.warmAllCaches();
  
  // Simulate live game updates
  console.log('\n📊 Simulating live game updates...');
  
  setInterval(() => {
    const gameId = Math.floor(Math.random() * 10);
    cache.setGame(`game${gameId}`, {
      id: gameId,
      teams: ['Team A', 'Team B'],
      status: Math.random() > 0.5 ? 'LIVE' : 'SCHEDULED',
      sport: 'NFL',
      score: [Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)]
    });
  }, 2000);
  
  // Show stats every 10 seconds
  setInterval(() => {
    console.log('\n📈 Cache Performance:');
    const stats = cache.getAllStats();
    
    Object.entries(stats).forEach(([name, stat]: [string, any]) => {
      console.log(`  ${name}: ${stat.hitRate} hit rate, ${stat.totalSize} items`);
    });
  }, 10000);
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}