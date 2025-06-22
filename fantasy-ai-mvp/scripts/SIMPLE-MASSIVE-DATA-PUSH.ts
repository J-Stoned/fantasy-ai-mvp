#!/usr/bin/env tsx

/**
 * 🚀 SIMPLE MASSIVE DATA PUSH - NO BS, JUST PUSH ALL THE DATA
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const prisma = new PrismaClient();

class SimpleMassiveDataPusher {
  private totalRecords = 0;
  private errors: string[] = [];

  async run() {
    console.log('🚀🔥 SIMPLE MASSIVE DATA PUSH - NO BS APPROACH! 🔥🚀');

    try {
      // Get existing leagues
      const leagues = await prisma.league.findMany();
      console.log(`📋 Found ${leagues.length} existing leagues`);

      if (leagues.length === 0) {
        console.log('❌ No leagues found! Run db:seed first');
        return;
      }

      const defaultLeague = leagues[0];
      console.log(`🎯 Using league: ${defaultLeague.name}`);

      // Find all data files with actual player data
      const dataFiles = await this.findRealDataFiles();
      console.log(`📂 Found ${dataFiles.length} real data files`);

      // Process all files
      for (const file of dataFiles) {
        try {
          const count = await this.processFile(file, defaultLeague.id);
          this.totalRecords += count;
          if (count > 0) {
            console.log(`✅ ${path.basename(file)}: ${count} players`);
          }
        } catch (error) {
          this.errors.push(`${file}: ${error.message}`);
        }
      }

      // Final verification
      const finalCount = await prisma.player.count();
      console.log(`\n🎉 MASSIVE DATA PUSH COMPLETE!`);
      console.log(`📊 Total Players in Database: ${finalCount}`);
      console.log(`📈 Records Added This Run: ${this.totalRecords}`);
      console.log(`❌ Errors: ${this.errors.length}`);

    } catch (error) {
      console.error('❌ PUSH FAILED:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async findRealDataFiles(): Promise<string[]> {
    const allFiles: string[] = [];
    
    // Look for files that actually contain player data
    const patterns = [
      'data/ultimate-free/**/*players*.json',
      'data/ultimate-free/**/*Official*.json',
      'data/espn-players/**/*.json',
      'data/nfl-rosters/**/*.json'
    ];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { cwd: process.cwd() });
        allFiles.push(...files);
      } catch (error) {
        // Silent fail
      }
    }

    return [...new Set(allFiles)];
  }

  private async processFile(filePath: string, leagueId: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Extract players from various formats
    let players: any[] = [];
    
    if (Array.isArray(data)) {
      players = data;
    } else if (data.players) {
      players = data.players;
    } else if (data.data) {
      players = data.data;
    } else {
      return 0;
    }

    let addedCount = 0;
    
    for (const player of players) {
      if (!player || !player.name) continue;
      
      try {
        await prisma.player.create({
          data: {
            externalId: `${player.name}-${player.team || 'UNK'}-${Date.now()}`,
            name: player.name,
            position: player.position || player.pos || 'UNKNOWN',
            team: player.team || player.teamName || 'UNK',
            leagueId: leagueId,
            stats: JSON.stringify(player),
            projections: JSON.stringify({}),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        addedCount++;
      } catch (error) {
        // Skip duplicates or constraint errors
        if (!error.message.includes('constraint') && !error.message.includes('UNIQUE')) {
          throw error;
        }
      }
    }

    return addedCount;
  }
}

const pusher = new SimpleMassiveDataPusher();
pusher.run().catch(console.error);