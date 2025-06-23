#!/usr/bin/env tsx

/**
 * 📊 REAL STATS SCRAPER
 * Demonstrates how to get real player stats without API keys
 * Uses public data endpoints and smart scraping
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '../data/ultimate-free/stats');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Public endpoints that provide real stats (no scraping needed!)
const PUBLIC_STATS_ENDPOINTS = {
  // ESPN public data endpoints
  ESPN_LEADERS: {
    NFL: {
      passing: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/leaders?category=passing',
      rushing: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/leaders?category=rushing',
      receiving: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/leaders?category=receiving'
    },
    NBA: {
      scoring: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?category=scoring',
      assists: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?category=assists',
      rebounds: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?category=rebounds'
    }
  },
  
  // ESPN player search (get player IDs)
  PLAYER_SEARCH: {
    url: 'https://site.web.api.espn.com/apis/common/v3/search',
    params: '?query={PLAYER_NAME}&limit=5&mode=prefix&lang=en&region=us&site=espn&type=player'
  },
  
  // ESPN athlete info (once you have player ID)
  ATHLETE_INFO: {
    NFL: 'https://site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{PLAYER_ID}',
    NBA: 'https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{PLAYER_ID}'
  }
};

// Top players to track (we'll search for their IDs)
const TOP_PLAYERS = {
  NFL: {
    QB: ['Patrick Mahomes', 'Josh Allen', 'Jalen Hurts', 'Lamar Jackson', 'Dak Prescott'],
    RB: ['Christian McCaffrey', 'Austin Ekeler', 'Derrick Henry', 'Nick Chubb', 'Saquon Barkley'],
    WR: ['Tyreek Hill', 'Justin Jefferson', 'Ja\'Marr Chase', 'Stefon Diggs', 'Davante Adams']
  },
  NBA: {
    PG: ['Luka Doncic', 'Stephen Curry', 'Ja Morant', 'Damian Lillard', 'Trae Young'],
    SG: ['Devin Booker', 'Donovan Mitchell', 'Anthony Edwards', 'Jaylen Brown', 'Bradley Beal'],
    SF: ['LeBron James', 'Kevin Durant', 'Jayson Tatum', 'Jimmy Butler', 'Kawhi Leonard']
  }
};

class RealStatsCollector {
  private collectedStats: any[] = [];
  private playerIds: Map<string, string> = new Map();
  
  async collectAllStats() {
    console.log('📊 REAL STATS COLLECTOR ACTIVATED!');
    console.log('==================================');
    console.log('Collecting real player statistics...\n');
    
    const startTime = Date.now();
    
    // Collect league leaders
    await this.collectLeagueLeaders();
    
    // Search for top players
    await this.searchTopPlayers();
    
    // Get detailed player info
    await this.collectPlayerDetails();
    
    // Update database with real stats
    await this.updateDatabaseStats();
    
    // Save collected data
    await this.saveCollectedData();
    
    console.log('\n✅ REAL STATS COLLECTION COMPLETE!');
    console.log('==================================');
    console.log(`📊 Total stats collected: ${this.collectedStats.length}`);
    console.log(`👥 Players found: ${this.playerIds.size}`);
    console.log(`⏱️ Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  }
  
  async collectLeagueLeaders() {
    console.log('🏆 Collecting League Leaders...\n');
    
    for (const [league, categories] of Object.entries(PUBLIC_STATS_ENDPOINTS.ESPN_LEADERS)) {
      console.log(`${league} Leaders:`);
      
      for (const [category, url] of Object.entries(categories)) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            
            if (data.leaders) {
              console.log(`  ✅ ${category}: ${data.leaders.length} leaders`);
              
              // Process leader data
              const leaders = data.leaders.map((leader: any) => ({
                name: leader.athlete?.displayName,
                team: leader.athlete?.team?.abbreviation,
                position: leader.athlete?.position?.abbreviation,
                category,
                value: leader.value,
                displayValue: leader.displayValue,
                rank: leader.rank
              }));
              
              this.collectedStats.push({
                type: 'leaders',
                league,
                category,
                data: leaders,
                timestamp: new Date().toISOString()
              });
              
              // Store player IDs
              data.leaders.forEach((leader: any) => {
                if (leader.athlete?.id && leader.athlete?.displayName) {
                  this.playerIds.set(leader.athlete.displayName, leader.athlete.id);
                }
              });
            }
          }
        } catch (error) {
          console.error(`  ❌ Failed to get ${category} leaders`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log();
    }
  }
  
  async searchTopPlayers() {
    console.log('🔍 Searching for Top Players...\n');
    
    for (const [league, positions] of Object.entries(TOP_PLAYERS)) {
      for (const [position, players] of Object.entries(positions)) {
        for (const playerName of players.slice(0, 3)) { // Limit for demo
          try {
            const searchUrl = PUBLIC_STATS_ENDPOINTS.PLAYER_SEARCH.url + 
                            PUBLIC_STATS_ENDPOINTS.PLAYER_SEARCH.params.replace('{PLAYER_NAME}', encodeURIComponent(playerName));
            
            const response = await fetch(searchUrl);
            if (response.ok) {
              const data = await response.json();
              
              if (data.items && data.items.length > 0) {
                const player = data.items[0]; // First result
                console.log(`  ✅ Found: ${playerName} (ID: ${player.id})`);
                this.playerIds.set(playerName, player.id);
              }
            }
          } catch (error) {
            console.error(`  ❌ Could not find ${playerName}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    console.log();
  }
  
  async collectPlayerDetails() {
    console.log('📋 Collecting Player Details...\n');
    
    let detailsCollected = 0;
    
    for (const [playerName, playerId] of Array.from(this.playerIds.entries()).slice(0, 10)) {
      try {
        // Try NFL endpoint first
        let url = PUBLIC_STATS_ENDPOINTS.ATHLETE_INFO.NFL.replace('{PLAYER_ID}', playerId);
        let response = await fetch(url);
        
        if (!response.ok) {
          // Try NBA endpoint
          url = PUBLIC_STATS_ENDPOINTS.ATHLETE_INFO.NBA.replace('{PLAYER_ID}', playerId);
          response = await fetch(url);
        }
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.athlete) {
            console.log(`  ✅ ${playerName}: ${data.athlete.position?.displayName || 'N/A'} - ${data.athlete.team?.displayName || 'N/A'}`);
            
            this.collectedStats.push({
              type: 'player_details',
              playerId,
              playerName,
              data: {
                fullName: data.athlete.fullName,
                position: data.athlete.position?.displayName,
                team: data.athlete.team?.displayName,
                jersey: data.athlete.jersey,
                height: data.athlete.displayHeight,
                weight: data.athlete.displayWeight,
                age: data.athlete.age,
                experience: data.athlete.experience?.years,
                college: data.athlete.college?.name,
                status: data.athlete.status?.type?.name,
                injuryStatus: data.athlete.injuries?.[0]?.status
              },
              timestamp: new Date().toISOString()
            });
            
            detailsCollected++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Failed to get details for ${playerName}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Collected details for ${detailsCollected} players`);
  }
  
  async updateDatabaseStats() {
    console.log('\n💾 Updating Database with Real Stats...');
    
    let updated = 0;
    
    // Update players with real stats
    for (const stat of this.collectedStats) {
      if (stat.type === 'player_details' && stat.data.fullName) {
        try {
          // Find player by name
          const player = await prisma.player.findFirst({
            where: {
              name: {
                contains: stat.playerName.split(' ')[1] // Last name
              }
            }
          });
          
          if (player) {
            await prisma.player.update({
              where: { id: player.id },
              data: {
                name: stat.data.fullName, // Update to real full name
                position: stat.data.position || player.position,
                team: stat.data.team ? stat.data.team.substring(0, 3).toUpperCase() : player.team,
                injuryStatus: stat.data.injuryStatus === 'Active' ? 'HEALTHY' : stat.data.injuryStatus || 'HEALTHY',
                stats: JSON.stringify({
                  ...JSON.parse(player.stats || '{}'),
                  realData: true,
                  espnId: stat.playerId,
                  jersey: stat.data.jersey,
                  height: stat.data.height,
                  weight: stat.data.weight,
                  age: stat.data.age,
                  experience: stat.data.experience,
                  college: stat.data.college,
                  lastUpdated: new Date().toISOString()
                })
              }
            });
            
            updated++;
          }
        } catch (error) {
          // Continue on error
        }
      }
    }
    
    console.log(`  ✅ Updated ${updated} players with real stats`);
  }
  
  async saveCollectedData() {
    const timestamp = Date.now();
    
    // Save all collected stats
    const dataPath = path.join(DATA_DIR, `Real_Stats_${timestamp}.json`);
    fs.writeFileSync(dataPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalStats: this.collectedStats.length,
      playersFound: this.playerIds.size,
      stats: this.collectedStats
    }, null, 2));
    
    // Save player ID mapping
    const mappingPath = path.join(DATA_DIR, `Player_ID_Mapping_${timestamp}.json`);
    fs.writeFileSync(mappingPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalPlayers: this.playerIds.size,
      mapping: Object.fromEntries(this.playerIds)
    }, null, 2));
    
    console.log(`\n💾 Data saved to: ${DATA_DIR}`);
  }
}

// Main execution
async function main() {
  const collector = new RealStatsCollector();
  
  // Run collection
  await collector.collectAllStats();
  
  // Show what we can do next
  console.log('\n🚀 WHAT\'S NEXT:');
  console.log('==============');
  console.log('1. Run this regularly to keep stats updated');
  console.log('2. Add more stat categories (defense, special teams)');
  console.log('3. Track historical performance');
  console.log('4. Calculate fantasy points based on real stats');
  console.log('5. Create player comparison tools');
  
  await prisma.$disconnect();
}

// Execute
if (require.main === module) {
  main().catch(console.error);
}

export { RealStatsCollector };