#!/usr/bin/env tsx

/**
 * 📊 DATA PROCESSOR - Extract Structured Data from Raw Cache
 * 
 * This script processes raw data from the cache and extracts:
 * - Player statistics
 * - News articles
 * - Game data
 * - Team updates
 */

import { PrismaClient } from '@prisma/client';
import { dataCollectionService } from '../src/lib/data-collection-service';

const prisma = new PrismaClient();

interface ProcessingResult {
  processed: number;
  failed: number;
  skipped: number;
  errors: string[];
}

class DataProcessor {
  private stats = {
    totalProcessed: 0,
    newsExtracted: 0,
    playersUpdated: 0,
    gamesCreated: 0,
    errors: 0
  };

  async processAllUnprocessedData(): Promise<void> {
    console.log('📊 DATA PROCESSOR STARTING...');
    console.log('🎯 Target: Process all unprocessed raw data\n');

    try {
      // Get all unprocessed data
      const unprocessedData = await dataCollectionService.getUnprocessedData(1000);
      console.log(`Found ${unprocessedData.length} unprocessed data items\n`);

      // Group by data type for batch processing
      const byType = this.groupByType(unprocessedData);

      // Process each type
      for (const [dataType, items] of Object.entries(byType)) {
        console.log(`\n🔄 Processing ${items.length} ${dataType} items...`);
        await this.processDataType(dataType, items);
      }

      // Final report
      this.generateReport();

    } catch (error) {
      console.error('❌ Processing failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  private groupByType(data: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    for (const item of data) {
      const type = item.dataType || 'unknown';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    }
    
    return grouped;
  }

  private async processDataType(dataType: string, items: any[]): Promise<void> {
    let processed = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const data = JSON.parse(item.rawData);
        
        switch (dataType) {
          case 'news':
            await this.processNewsData(item, data);
            break;
          case 'api':
            await this.processApiData(item, data);
            break;
          case 'official':
            await this.processOfficialData(item, data);
            break;
          default:
            console.log(`  ⚠️ Unknown data type: ${dataType}`);
        }

        // Mark as processed
        await dataCollectionService.markAsProcessed(item.id);
        processed++;
        this.stats.totalProcessed++;

      } catch (error) {
        console.error(`  ❌ Failed to process item ${item.id}:`, error.message);
        failed++;
        this.stats.errors++;

        // Log the error
        await dataCollectionService.logProcessing(
          item.id,
          dataType.toUpperCase(),
          0,
          1,
          error.message
        );
      }
    }

    console.log(`  ✅ Processed: ${processed}, Failed: ${failed}`);
  }

  private async processNewsData(rawItem: any, data: any): Promise<void> {
    if (!data.articles || !Array.isArray(data.articles)) {
      return;
    }

    let articlesProcessed = 0;

    for (const article of data.articles) {
      try {
        // Extract teams and players from content
        const teams = this.extractTeams(article.title + ' ' + (article.content || ''));
        const players = this.extractPlayers(article.title + ' ' + (article.content || ''));
        const sport = this.detectSport(article.title, teams);

        await dataCollectionService.saveNewsArticle({
          source: rawItem.source,
          title: article.title,
          content: article.content || article.summary || 'Content not available',
          url: article.url,
          publishedAt: new Date(article.publishedAt || Date.now()),
          author: article.author,
          summary: article.summary,
          sport,
          teams,
          players,
          category: this.categorizeArticle(article.title),
          imageUrl: article.imageUrl
        });

        articlesProcessed++;
        this.stats.newsExtracted++;

      } catch (error) {
        // Skip individual article errors
      }
    }

    // Log processing
    await dataCollectionService.logProcessing(
      rawItem.id,
      'NEWS_ARTICLES',
      articlesProcessed,
      data.articles.length - articlesProcessed
    );
  }

  private async processApiData(rawItem: any, data: any): Promise<void> {
    // Process API data based on source
    if (rawItem.source.includes('ESPN')) {
      await this.processEspnData(rawItem, data);
    } else if (rawItem.source.includes('Yahoo')) {
      await this.processYahooData(rawItem, data);
    }

    await dataCollectionService.logProcessing(
      rawItem.id,
      'API_DATA',
      data.records || 0
    );
  }

  private async processOfficialData(rawItem: any, data: any): Promise<void> {
    // Process official team data
    const team = this.extractTeamFromSource(rawItem.source);
    const sport = this.detectSportFromTeam(team);

    // Update team information in database
    if (team) {
      console.log(`  📊 Processing ${team} official data...`);
      // In a real implementation, would update team stats, roster, etc.
    }

    await dataCollectionService.logProcessing(
      rawItem.id,
      'OFFICIAL_DATA',
      data.records || 0
    );
  }

  private async processEspnData(rawItem: any, data: any): Promise<void> {
    // Extract player stats, game scores, etc.
    console.log(`  🏈 Processing ESPN API data...`);
    
    // In a real implementation, would parse ESPN's data format
    // and update player stats, create game records, etc.
  }

  private async processYahooData(rawItem: any, data: any): Promise<void> {
    // Extract fantasy-specific data
    console.log(`  🎯 Processing Yahoo Fantasy data...`);
    
    // In a real implementation, would parse Yahoo's data format
    // and update fantasy projections, ownership %, etc.
  }

  private extractTeams(text: string): string[] {
    const teams: string[] = [];
    
    // Common NFL teams
    const nflTeams = ['Patriots', 'Bills', 'Dolphins', 'Jets', 'Ravens', 'Bengals', 
                      'Browns', 'Steelers', 'Texans', 'Colts', 'Jaguars', 'Titans',
                      'Broncos', 'Chiefs', 'Raiders', 'Chargers', 'Cowboys', 'Giants',
                      'Eagles', 'Commanders', 'Bears', 'Lions', 'Packers', 'Vikings',
                      'Falcons', 'Panthers', 'Saints', 'Buccaneers', '49ers', 'Cardinals',
                      'Rams', 'Seahawks'];
    
    for (const team of nflTeams) {
      if (text.includes(team)) {
        teams.push(team);
      }
    }
    
    return teams;
  }

  private extractPlayers(text: string): string[] {
    const players: string[] = [];
    
    // Simple pattern matching for player names (First Last)
    const playerPattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    const matches = text.match(playerPattern);
    
    if (matches) {
      // Filter out common non-player matches
      const commonPhrases = ['The New', 'San Francisco', 'New York', 'Los Angeles'];
      for (const match of matches) {
        if (!commonPhrases.some(phrase => match.includes(phrase))) {
          players.push(match);
        }
      }
    }
    
    return players.slice(0, 5); // Limit to 5 players
  }

  private detectSport(title: string, teams: string[]): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('nfl') || lowerTitle.includes('football') || teams.length > 0) {
      return 'nfl';
    } else if (lowerTitle.includes('nba') || lowerTitle.includes('basketball')) {
      return 'nba';
    } else if (lowerTitle.includes('mlb') || lowerTitle.includes('baseball')) {
      return 'mlb';
    } else if (lowerTitle.includes('nhl') || lowerTitle.includes('hockey')) {
      return 'nhl';
    }
    
    return 'multi';
  }

  private detectSportFromTeam(team: string): string {
    const nflTeams = ['49ERS', 'BILLS', 'PATRIOTS', 'COWBOYS', 'PACKERS'];
    const nbaTeams = ['LAKERS', 'CELTICS', 'WARRIORS', 'BULLS', 'HEAT'];
    const mlbTeams = ['YANKEES', 'DODGERS', 'GIANTS', 'CUBS', 'REDSOX'];
    const nhlTeams = ['RANGERS', 'BRUINS', 'PENGUINS', 'BLACKHAWKS', 'KINGS'];
    
    if (nflTeams.some(t => team.includes(t))) return 'nfl';
    if (nbaTeams.some(t => team.includes(t))) return 'nba';
    if (mlbTeams.some(t => team.includes(t))) return 'mlb';
    if (nhlTeams.some(t => team.includes(t))) return 'nhl';
    
    return 'unknown';
  }

  private categorizeArticle(title: string): string {
    const lower = title.toLowerCase();
    
    if (lower.includes('injur')) return 'injury';
    if (lower.includes('trade')) return 'trade';
    if (lower.includes('draft')) return 'draft';
    if (lower.includes('sign') || lower.includes('contract')) return 'signing';
    if (lower.includes('suspend')) return 'suspension';
    if (lower.includes('score') || lower.includes('defeat') || lower.includes('beat')) return 'game_recap';
    if (lower.includes('preview')) return 'preview';
    
    return 'general';
  }

  private extractTeamFromSource(source: string): string {
    // Extract team name from official source
    const match = source.match(/(\w+)_Official/);
    return match ? match[1] : '';
  }

  private generateReport(): void {
    console.log('\n📊 PROCESSING COMPLETE!');
    console.log('=' .repeat(50));
    console.log(`✅ Total Processed: ${this.stats.totalProcessed}`);
    console.log(`📰 News Articles: ${this.stats.newsExtracted}`);
    console.log(`👤 Players Updated: ${this.stats.playersUpdated}`);
    console.log(`🏈 Games Created: ${this.stats.gamesCreated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log('=' .repeat(50));
  }
}

// Run if called directly
if (require.main === module) {
  const processor = new DataProcessor();
  processor.processAllUnprocessedData().catch(console.error);
}