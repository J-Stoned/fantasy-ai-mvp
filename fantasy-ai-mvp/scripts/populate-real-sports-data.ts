#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function populateRealSportsData() {
  console.log('🏈 POPULATING REAL SPORTS DATA FROM COLLECTED FILES...');
  
  try {
    // Read the collected sports data
    const dataDir = path.join(process.cwd(), 'data', 'raw');
    
    // Load ESPN NFL players
    const espnNflPath = path.join(dataDir, 'espn/nfl-players-1750512477903.json');
    if (fs.existsSync(espnNflPath)) {
      const espnNflFile = JSON.parse(fs.readFileSync(espnNflPath, 'utf8'));
      const espnNflData = espnNflFile.data || espnNflFile;
      console.log('📊 Loading ESPN NFL players...');
      
      for (const player of (Array.isArray(espnNflData) ? espnNflData.slice(0, 100) : [])) { // Limit to prevent overwhelming
        await prisma.player.upsert({
          where: { id: `espn_nfl_${player.id || player.name?.replace(/\s+/g, '_')}` },
          update: {},
          create: {
            id: `espn_nfl_${player.id || player.name?.replace(/\s+/g, '_')}`,
            externalId: `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: player.name || 'Unknown Player',
            position: player.position || 'FLEX',
            team: player.team || 'FA',
            leagueId: 'demo_league_1',
            stats: JSON.stringify(player.stats || {}),
            projections: JSON.stringify(player.projections || {}),
          }
        });
      }
      console.log(`✅ Loaded ${Math.min(100, Array.isArray(espnNflData) ? espnNflData.length : 0)} ESPN NFL players`);
    }
    
    // Load ESPN NBA players  
    const espnNbaPath = path.join(dataDir, 'espn/nba-players-1750512479908.json');
    if (fs.existsSync(espnNbaPath)) {
      const espnNbaFile = JSON.parse(fs.readFileSync(espnNbaPath, 'utf8'));
      const espnNbaData = espnNbaFile.data || espnNbaFile;
      console.log('🏀 Loading ESPN NBA players...');
      
      for (const player of (Array.isArray(espnNbaData) ? espnNbaData.slice(0, 50) : [])) {
        await prisma.player.upsert({
          where: { id: `espn_nba_${player.id || player.name?.replace(/\s+/g, '_')}` },
          update: {},
          create: {
            id: `espn_nba_${player.id || player.name?.replace(/\s+/g, '_')}`,
            externalId: `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: player.name || 'Unknown Player',
            position: player.position || 'UTIL',
            team: player.team || 'FA',
            leagueId: 'demo_league_1',
            stats: JSON.stringify(player.stats || {}),
            projections: JSON.stringify(player.projections || {}),
          }
        });
      }
      console.log(`✅ Loaded ${Math.min(50, Array.isArray(espnNbaData) ? espnNbaData.length : 0)} ESPN NBA players`);
    }

    // Load ESPN MLB players
    const espnMlbPath = path.join(dataDir, 'espn/mlb-players-1750512481914.json');
    if (fs.existsSync(espnMlbPath)) {
      const espnMlbFile = JSON.parse(fs.readFileSync(espnMlbPath, 'utf8'));
      const espnMlbData = espnMlbFile.data || espnMlbFile;
      console.log('⚾ Loading ESPN MLB players...');
      
      for (const player of (Array.isArray(espnMlbData) ? espnMlbData.slice(0, 50) : [])) {
        await prisma.player.upsert({
          where: { id: `espn_mlb_${player.id || player.name?.replace(/\s+/g, '_')}` },
          update: {},
          create: {
            id: `espn_mlb_${player.id || player.name?.replace(/\s+/g, '_')}`,
            externalId: `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: player.name || 'Unknown Player',
            position: player.position || 'UTIL',
            team: player.team || 'FA',
            leagueId: 'demo_league_1',
            stats: JSON.stringify(player.stats || {}),
            projections: JSON.stringify(player.projections || {}),
          }
        });
      }
      console.log(`✅ Loaded ${Math.min(50, Array.isArray(espnMlbData) ? espnMlbData.length : 0)} ESPN MLB players`);
    }

    // Load Puppeteer NFL players
    const puppeteerNflPath = path.join(dataDir, 'puppeteer/nfl-players-1750512645299.json');
    if (fs.existsSync(puppeteerNflPath)) {
      const puppeteerNflFile = JSON.parse(fs.readFileSync(puppeteerNflPath, 'utf8'));
      const puppeteerNflData = puppeteerNflFile.data || puppeteerNflFile;
      console.log('🎪 Loading Puppeteer NFL players...');
      
      for (const player of (Array.isArray(puppeteerNflData) ? puppeteerNflData.slice(0, 75) : [])) {
        await prisma.player.upsert({
          where: { id: `puppeteer_nfl_${player.id || player.name?.replace(/\s+/g, '_')}` },
          update: {},
          create: {
            id: `puppeteer_nfl_${player.id || player.name?.replace(/\s+/g, '_')}`,
            externalId: `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: player.name || 'Unknown Player', 
            position: player.position || 'FLEX',
            team: player.team || 'FA',
            leagueId: 'demo_league_1',
            stats: JSON.stringify(player.stats || {}),
            projections: JSON.stringify(player.projections || {}),
          }
        });
      }
      console.log(`✅ Loaded ${Math.min(75, Array.isArray(puppeteerNflData) ? puppeteerNflData.length : 0)} Puppeteer NFL players`);
    }

    // Load Puppeteer NBA players
    const puppeteerNbaPath = path.join(dataDir, 'puppeteer/nba-players-1750512654377.json');
    if (fs.existsSync(puppeteerNbaPath)) {
      const puppeteerNbaFile = JSON.parse(fs.readFileSync(puppeteerNbaPath, 'utf8'));
      const puppeteerNbaData = puppeteerNbaFile.data || puppeteerNbaFile;
      console.log('🏀 Loading Puppeteer NBA players...');
      
      for (const player of (Array.isArray(puppeteerNbaData) ? puppeteerNbaData.slice(0, 50) : [])) {
        await prisma.player.upsert({
          where: { id: `puppeteer_nba_${player.id || player.name?.replace(/\s+/g, '_')}` },
          update: {},
          create: {
            id: `puppeteer_nba_${player.id || player.name?.replace(/\s+/g, '_')}`,
            externalId: `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: player.name || 'Unknown Player',
            position: player.position || 'UTIL', 
            team: player.team || 'FA',
            leagueId: 'demo_league_1',
            stats: JSON.stringify(player.stats || {}),
            projections: JSON.stringify(player.projections || {}),
          }
        });
      }
      console.log(`✅ Loaded ${Math.min(50, Array.isArray(puppeteerNbaData) ? puppeteerNbaData.length : 0)} Puppeteer NBA players`);
    }

    // Load Global NHL players
    const globalNhlPath = path.join(dataDir, 'global/canada-nhl-players-1750512666409.json');
    if (fs.existsSync(globalNhlPath)) {
      const globalNhlFile = JSON.parse(fs.readFileSync(globalNhlPath, 'utf8'));
      const globalNhlData = globalNhlFile.data || globalNhlFile;
      console.log('🏒 Loading Global NHL players...');
      
      for (const player of (Array.isArray(globalNhlData) ? globalNhlData.slice(0, 40) : [])) {
        await prisma.player.upsert({
          where: { id: `global_nhl_${player.id || player.name?.replace(/\s+/g, '_')}` },
          update: {},
          create: {
            id: `global_nhl_${player.id || player.name?.replace(/\s+/g, '_')}`,
            externalId: `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: player.name || 'Unknown Player',
            position: player.position || 'SKATER',
            team: player.team || 'FA',
            leagueId: 'demo_league_1',
            stats: JSON.stringify(player.stats || {}),
            projections: JSON.stringify(player.projections || {}),
          }
        });
      }
      console.log(`✅ Loaded ${Math.min(40, Array.isArray(globalNhlData) ? globalNhlData.length : 0)} Global NHL players`);
    }

    // Load Global Soccer players
    const globalSoccerPath = path.join(dataDir, 'global/uk-soccer-players-1750512663903.json');
    if (fs.existsSync(globalSoccerPath)) {
      const globalSoccerFile = JSON.parse(fs.readFileSync(globalSoccerPath, 'utf8'));
      const globalSoccerData = globalSoccerFile.data || globalSoccerFile;
      console.log('⚽ Loading Global Soccer players...');
      
      for (const player of (Array.isArray(globalSoccerData) ? globalSoccerData.slice(0, 60) : [])) {
        await prisma.player.upsert({
          where: { id: `global_soccer_${player.id || player.name?.replace(/\s+/g, '_')}` },
          update: {},
          create: {
            id: `global_soccer_${player.id || player.name?.replace(/\s+/g, '_')}`,
            externalId: `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: player.name || 'Unknown Player',
            position: player.position || 'MID',
            team: player.team || 'FA',
            leagueId: 'demo_league_1',
            stats: JSON.stringify(player.stats || {}),
            projections: JSON.stringify(player.projections || {}),
          }
        });
      }
      console.log(`✅ Loaded ${Math.min(60, Array.isArray(globalSoccerData) ? globalSoccerData.length : 0)} Global Soccer players`);
    }

    // Get actual player count
    const playerCount = await prisma.player.count();
    console.log(`\n🎉 SUCCESS! DATABASE POPULATED WITH REAL SPORTS DATA`);
    console.log(`📊 Total Players in Database: ${playerCount}`);
    console.log(`🔴 LIVE DATA STATUS: ACTIVE`);
    
    return playerCount;

  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  populateRealSportsData()
    .then((count) => {
      console.log(`\n✅ Database population complete! ${count} players loaded.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database population failed:', error);
      process.exit(1);
    });
}

export { populateRealSportsData };