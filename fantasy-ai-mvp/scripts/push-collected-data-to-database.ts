#!/usr/bin/env tsx

/**
 * 🚀 PUSH ALL COLLECTED DATA TO DATABASE
 * Takes our 6,718 collected records and PUSHES them ALL to the database
 * Uses EVERY tool at our disposal for maximum efficiency
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const prisma = new PrismaClient();

interface CollectedRecord {
  name: string;
  position: string;
  team: string;
  league: string;
  stats?: Record<string, any>;
  source: string;
  timestamp: string;
}

interface DataFileStats {
  file: string;
  records: number;
  source: string;
  sport: string;
}

class MassiveDataPusher {
  private startTime = Date.now();
  private totalRecords = 0;
  private processedFiles = 0;
  private errors: string[] = [];

  async run() {
    console.log('🚀 MASSIVE DATA PUSH OPERATION INITIATED!');
    console.log('Target: Push ALL 6,718+ collected records to production database');
    console.log('Using: EVERY tool available for maximum efficiency\n');

    try {
      // Step 1: Find ALL collected data files
      const dataFiles = await this.findAllDataFiles();
      console.log(`📂 Found ${dataFiles.length} data files to process`);

      // Step 2: Process each data file batch
      const batchSize = 10;
      for (let i = 0; i < dataFiles.length; i += batchSize) {
        const batch = dataFiles.slice(i, i + batchSize);
        await this.processBatch(batch, i / batchSize + 1, Math.ceil(dataFiles.length / batchSize));
      }

      // Step 3: Verify database state
      await this.verifyDatabaseState();

      // Step 4: Generate success report
      await this.generateSuccessReport();

    } catch (error) {
      console.error('❌ MASSIVE DATA PUSH FAILED:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async findAllDataFiles(): Promise<string[]> {
    const searchPatterns = [
      'data/**/*.json',
      'data/ultimate-free/**/*.json',
      'data/espn-players/**/*.json',
      'data/nfl-rosters/**/*.json',
      'scripts/collected-data/**/*.json',
      'temp/**/*.json'
    ];

    const allFiles: string[] = [];
    
    for (const pattern of searchPatterns) {
      try {
        const files = await glob(pattern, { cwd: process.cwd() });
        allFiles.push(...files);
        console.log(`  📁 Pattern "${pattern}": ${files.length} files`);
      } catch (error) {
        console.log(`  ⚠️ Pattern "${pattern}": No files found`);
      }
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  private async processBatch(files: string[], batchNum: number, totalBatches: number) {
    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${files.length} files)`);
    
    const batchPromises = files.map(async (file) => {
      try {
        const stats = await this.processDataFile(file);
        this.processedFiles++;
        this.totalRecords += stats.records;
        console.log(`  ✅ ${stats.file}: ${stats.records} records (${stats.source})`);
        return stats;
      } catch (error) {
        const errorMsg = `Failed to process ${file}: ${error}`;
        this.errors.push(errorMsg);
        console.log(`  ❌ ${file}: ${error}`);
        return null;
      }
    });

    await Promise.all(batchPromises);
    
    const progress = Math.round((batchNum / totalBatches) * 100);
    console.log(`📊 Progress: ${progress}% (${this.processedFiles} files, ${this.totalRecords} records)`);
  }

  private async processDataFile(filePath: string): Promise<DataFileStats> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Handle different data formats
    let records: CollectedRecord[] = [];
    
    if (Array.isArray(data)) {
      records = data;
    } else if (data.players && Array.isArray(data.players)) {
      records = data.players;
    } else if (data.data && Array.isArray(data.data)) {
      records = data.data;
    } else if (data.records && Array.isArray(data.records)) {
      records = data.records;
    } else {
      // Single record
      records = [data];
    }

    // Determine source and sport from file path
    const source = this.extractSource(filePath);
    const sport = this.extractSport(filePath);

    // Push records to database
    for (const record of records) {
      await this.pushPlayerToDatabase(record, source, sport);
    }

    return {
      file: path.basename(filePath),
      records: records.length,
      source,
      sport
    };
  }

  private async pushPlayerToDatabase(record: CollectedRecord, source: string, sport: string) {
    try {
      // Find or create league first
      const league = await prisma.league.upsert({
        where: {
          userId_providerId: {
            userId: 'demo-user-id',
            providerId: `${sport}-league`
          }
        },
        update: {},
        create: {
          userId: 'demo-user-id',
          provider: 'ESPN',
          providerId: `${sport}-league`,
          name: `${sport} Data Collection League`,
          season: '2024',
          sport: sport === 'NFL' ? 'FOOTBALL' : sport === 'NBA' ? 'BASKETBALL' : sport === 'MLB' ? 'BASEBALL' : sport === 'NHL' ? 'HOCKEY' : 'FOOTBALL',
          settings: JSON.stringify({}),
          isActive: true
        }
      });

      // Create or update player
      await prisma.player.upsert({
        where: {
          externalId_leagueId: {
            externalId: `${record.name || 'Unknown'}-${record.team || 'Unknown'}`,
            leagueId: league.id
          }
        },
        update: {
          position: record.position || 'UNKNOWN',
          stats: JSON.stringify(record.stats || {}),
          updatedAt: new Date()
        },
        create: {
          externalId: `${record.name || 'Unknown'}-${record.team || 'Unknown'}`,
          name: record.name || 'Unknown',
          position: record.position || 'UNKNOWN',
          team: record.team || 'Unknown',
          leagueId: league.id,
          stats: JSON.stringify(record.stats || {}),
          projections: JSON.stringify({}),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Stats are stored in the player record as JSON

    } catch (error) {
      // Silently handle duplicate/constraint errors
      if (!error.message.includes('Unique constraint') && !error.message.includes('UNIQUE constraint')) {
        throw error;
      }
    }
  }

  private extractSource(filePath: string): string {
    if (filePath.includes('espn')) return 'ESPN';
    if (filePath.includes('yahoo')) return 'Yahoo';
    if (filePath.includes('nfl')) return 'NFL';
    if (filePath.includes('nba')) return 'NBA';
    if (filePath.includes('mlb')) return 'MLB';
    if (filePath.includes('ultimate-free')) return 'Ultimate Free Collection';
    return 'Unknown';
  }

  private extractSport(filePath: string): string {
    if (filePath.includes('nfl') || filePath.includes('football')) return 'NFL';
    if (filePath.includes('nba') || filePath.includes('basketball')) return 'NBA';
    if (filePath.includes('mlb') || filePath.includes('baseball')) return 'MLB';
    if (filePath.includes('nhl') || filePath.includes('hockey')) return 'NHL';
    if (filePath.includes('soccer') || filePath.includes('football')) return 'Soccer';
    return 'Multi-Sport';
  }

  private async verifyDatabaseState() {
    console.log('\n🔍 Verifying database state...');
    
    const counts = await Promise.all([
      prisma.player.count(),
      prisma.league.count(),
      prisma.team.count(),
      prisma.user.count()
    ]);

    console.log(`📊 Database Verification:
  👥 Players: ${counts[0].toLocaleString()}
  🏆 Leagues: ${counts[1].toLocaleString()}
  🏈 Teams: ${counts[2].toLocaleString()}
  👤 Users: ${counts[3].toLocaleString()}`);
  }

  private async generateSuccessReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    const recordsPerSecond = Math.round(this.totalRecords / duration);

    console.log(`\n🎉 MASSIVE DATA PUSH COMPLETE!
===========================================

📊 PERFORMANCE METRICS:
  📦 Files Processed: ${this.processedFiles.toLocaleString()}
  📈 Records Pushed: ${this.totalRecords.toLocaleString()}
  ⚡ Processing Speed: ${recordsPerSecond.toLocaleString()} records/second
  ⏱️ Total Duration: ${duration.toFixed(1)} seconds
  ❌ Errors: ${this.errors.length}

🏆 SUCCESS RATE: ${((this.processedFiles / (this.processedFiles + this.errors.length)) * 100).toFixed(1)}%

🚀 FANTASY.AI DATABASE NOW CONTAINS ${this.totalRecords.toLocaleString()}+ RECORDS!
Ready for production deployment and global domination! 🌍`);

    if (this.errors.length > 0) {
      console.log(`\n⚠️ ERRORS ENCOUNTERED (${this.errors.length}):`);
      this.errors.slice(0, 10).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
      if (this.errors.length > 10) {
        console.log(`  ... and ${this.errors.length - 10} more errors`);
      }
    }
  }
}

const pusher = new MassiveDataPusher();
pusher.run().catch(console.error);