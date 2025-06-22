import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CollectionSource {
  name: string;
  url: string;
  type: 'api' | 'news' | 'official';
  method: 'fetch' | 'firecrawl' | 'puppeteer';
}

export class DataCollectionService {
  private collectionRunId: string | null = null;

  async startCollectionRun(source: string, dataType: string): Promise<string> {
    const run = await prisma.dataCollectionRun.create({
      data: {
        source,
        dataType,
        status: 'RUNNING',
      },
    });
    
    this.collectionRunId = run.id;
    return run.id;
  }

  async saveRawData(
    source: string,
    dataType: string,
    url: string,
    data: any,
    recordCount: number
  ): Promise<void> {
    if (!this.collectionRunId) {
      throw new Error('No active collection run. Call startCollectionRun first.');
    }

    await prisma.rawDataCache.create({
      data: {
        collectionRunId: this.collectionRunId,
        source,
        dataType,
        url,
        rawData: JSON.stringify(data),
        recordCount,
        isProcessed: false,
      },
    });
  }

  async endCollectionRun(recordsCount: number, error?: string): Promise<void> {
    if (!this.collectionRunId) {
      throw new Error('No active collection run.');
    }

    await prisma.dataCollectionRun.update({
      where: { id: this.collectionRunId },
      data: {
        endTime: new Date(),
        recordsCount,
        status: error ? 'FAILED' : 'COMPLETED',
        error,
      },
    });

    this.collectionRunId = null;
  }

  async getUnprocessedData(limit: number = 100) {
    return prisma.rawDataCache.findMany({
      where: { isProcessed: false },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { collectionRun: true },
    });
  }

  async markAsProcessed(rawDataId: string): Promise<void> {
    await prisma.rawDataCache.update({
      where: { id: rawDataId },
      data: {
        isProcessed: true,
        processedAt: new Date(),
      },
    });
  }

  async logProcessing(
    rawDataId: string,
    processType: string,
    recordsProcessed: number,
    recordsFailed: number = 0,
    error?: string
  ) {
    return prisma.processingLog.create({
      data: {
        rawDataId,
        processType,
        recordsProcessed,
        recordsFailed,
        status: error ? 'FAILED' : 'COMPLETED',
        error,
        endTime: new Date(),
      },
    });
  }

  async cleanupOldData(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.rawDataCache.deleteMany({
      where: {
        isProcessed: true,
        processedAt: { lt: cutoffDate },
      },
    });

    return deleted.count;
  }

  async saveNewsArticle(article: {
    source: string;
    title: string;
    content: string;
    url: string;
    publishedAt: Date;
    author?: string;
    summary?: string;
    sport?: string;
    teams?: string[];
    players?: string[];
    category?: string;
    imageUrl?: string;
  }) {
    return prisma.newsArticle.upsert({
      where: { url: article.url },
      update: {
        title: article.title,
        content: article.content,
        summary: article.summary,
        publishedAt: article.publishedAt,
        sport: article.sport,
        teams: article.teams ? JSON.stringify(article.teams) : null,
        players: article.players ? JSON.stringify(article.players) : null,
        category: article.category,
        imageUrl: article.imageUrl,
        updatedAt: new Date(),
      },
      create: {
        ...article,
        teams: article.teams ? JSON.stringify(article.teams) : null,
        players: article.players ? JSON.stringify(article.players) : null,
      },
    });
  }

  async saveGameData(game: {
    externalId: string;
    sport: string;
    homeTeam: string;
    awayTeam: string;
    gameTime: Date;
    venue?: string;
    weather?: any;
    homeScore?: number;
    awayScore?: number;
    status: string;
    quarter?: number;
    timeLeft?: string;
    lastPlay?: string;
    scoringPlays?: any[];
    statistics?: any;
  }) {
    return prisma.gameData.upsert({
      where: { externalId: game.externalId },
      update: {
        ...game,
        weather: game.weather ? JSON.stringify(game.weather) : null,
        scoringPlays: game.scoringPlays ? JSON.stringify(game.scoringPlays) : null,
        statistics: game.statistics ? JSON.stringify(game.statistics) : null,
        updatedAt: new Date(),
      },
      create: {
        ...game,
        weather: game.weather ? JSON.stringify(game.weather) : null,
        scoringPlays: game.scoringPlays ? JSON.stringify(game.scoringPlays) : null,
        statistics: game.statistics ? JSON.stringify(game.statistics) : null,
      },
    });
  }

  async updatePlayerStats(
    playerId: string,
    stats: any,
    projections?: any
  ) {
    return prisma.player.update({
      where: { id: playerId },
      data: {
        stats: JSON.stringify(stats),
        projections: projections ? JSON.stringify(projections) : undefined,
        updatedAt: new Date(),
      },
    });
  }
}

export const dataCollectionService = new DataCollectionService();