import { Queue, Worker, Job, QueueScheduler } from 'bullmq';
import { redisClient } from '@/lib/redis/redis-client';
import { getWebSocketServer } from '@/lib/websocket/websocket-server';
import { prisma } from '@/lib/prisma';

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0')
};

// Create queues
export const scoreUpdateQueue = new Queue('score-updates', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const achievementQueue = new Queue('achievements', { connection });
export const leaderboardQueue = new Queue('leaderboards', { connection });
export const mlTrainingQueue = new Queue('ml-training', { connection });
export const dataCollectionQueue = new Queue('data-collection', { connection });

// Create schedulers for delayed jobs
new QueueScheduler('score-updates', { connection });
new QueueScheduler('notifications', { connection });
new QueueScheduler('ml-training', { connection });
new QueueScheduler('data-collection', { connection });

// Score Update Worker
const scoreUpdateWorker = new Worker(
  'score-updates',
  async (job: Job) => {
    const { leagueId, week } = job.data;
    
    try {
      // Fetch latest scores from external APIs
      const scores = await fetchLatestScores(leagueId, week);
      
      // Update database
      await prisma.league.update({
        where: { id: leagueId },
        data: {
          lastScoreUpdate: new Date(),
          currentWeek: week
        }
      });
      
      // Send real-time update
      const ws = getWebSocketServer();
      ws.sendScoreUpdate(leagueId, scores);
      
      return { success: true, scores };
    } catch (error) {
      console.error('Score update failed:', error);
      throw error;
    }
  },
  { connection }
);

// Notification Worker
const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    const { userId, notification } = job.data;
    
    try {
      // Store notification in database
      const dbNotification = await prisma.notification.create({
        data: {
          userId,
          notificationType: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {}
        }
      });
      
      // Send real-time notification
      const ws = getWebSocketServer();
      ws.sendNotification(userId, {
        id: dbNotification.id,
        ...notification,
        createdAt: dbNotification.createdAt
      });
      
      // Send push notification if enabled
      if (notification.push) {
        await sendPushNotification(userId, notification);
      }
      
      return { success: true, notificationId: dbNotification.id };
    } catch (error) {
      console.error('Notification failed:', error);
      throw error;
    }
  },
  { connection }
);

// Achievement Check Worker
const achievementWorker = new Worker(
  'achievements',
  async (job: Job) => {
    const { userId, event } = job.data;
    
    try {
      // Import achievement system
      const { achievementSystem } = await import('@/lib/gamification/achievements');
      
      // Check achievements
      const unlockedAchievements = await achievementSystem.checkAchievements(userId, event);
      
      // Send notifications for unlocked achievements
      for (const achievement of unlockedAchievements) {
        await notificationQueue.add('achievement-notification', {
          userId,
          notification: {
            type: 'achievement_unlocked',
            title: 'Achievement Unlocked!',
            message: `You've unlocked "${achievement.name}"!`,
            data: { achievementId: achievement.id },
            push: true
          }
        });
        
        // Broadcast to friends
        const ws = getWebSocketServer();
        ws.broadcastAchievement(userId, achievement);
      }
      
      return { success: true, unlocked: unlockedAchievements.length };
    } catch (error) {
      console.error('Achievement check failed:', error);
      throw error;
    }
  },
  { connection }
);

// Leaderboard Update Worker
const leaderboardWorker = new Worker(
  'leaderboards',
  async (job: Job) => {
    const { leaderboardId, timeframe } = job.data;
    
    try {
      // Calculate new rankings
      const entries = await prisma.leaderboardEntry.findMany({
        where: { leaderboardId },
        orderBy: { score: 'desc' }
      });
      
      // Update ranks
      for (let i = 0; i < entries.length; i++) {
        const rank = i + 1;
        const entry = entries[i];
        
        // Calculate trend
        const trend = entry.rank > 0 ? entry.rank - rank : 0;
        
        await prisma.leaderboardEntry.update({
          where: { id: entry.id },
          data: { 
            rank,
            trend,
            lastUpdated: new Date()
          }
        });
      }
      
      // Update leaderboard metadata
      await prisma.leaderboard.update({
        where: { id: leaderboardId },
        data: {
          lastUpdated: new Date(),
          metadata: {
            totalParticipants: entries.length,
            averageScore: entries.reduce((sum, e) => sum + e.score, 0) / entries.length,
            topScore: entries[0]?.score || 0
          }
        }
      });
      
      return { success: true, updated: entries.length };
    } catch (error) {
      console.error('Leaderboard update failed:', error);
      throw error;
    }
  },
  { connection }
);

// ML Training Worker
const mlTrainingWorker = new Worker(
  'ml-training',
  async (job: Job) => {
    const { modelType, trainingData } = job.data;
    
    try {
      // Import ML orchestrator
      const { mlOrchestrator } = await import('@/lib/ml/ml-orchestrator');
      
      // Train model
      const result = await mlOrchestrator.trainModel(modelType, trainingData);
      
      // Store model metadata
      await prisma.mLModelMetadata.create({
        data: {
          modelType,
          version: result.version,
          accuracy: result.accuracy,
          parameters: result.parameters,
          metrics: result.metrics,
          trainedAt: new Date(),
          isActive: false
        }
      });
      
      return { success: true, modelType, accuracy: result.accuracy };
    } catch (error) {
      console.error('ML training failed:', error);
      throw error;
    }
  },
  { connection }
);

// Data Collection Worker
const dataCollectionWorker = new Worker(
  'data-collection',
  async (job: Job) => {
    const { source, type } = job.data;
    
    try {
      let collectedData;
      
      switch (source) {
        case 'espn':
          collectedData = await collectESPNData(type);
          break;
        case 'yahoo':
          collectedData = await collectYahooData(type);
          break;
        case 'odds':
          collectedData = await collectOddsData(type);
          break;
        case 'social':
          collectedData = await collectSocialData(type);
          break;
        default:
          throw new Error(`Unknown data source: ${source}`);
      }
      
      // Process and store data
      await processCollectedData(source, type, collectedData);
      
      return { success: true, source, itemsCollected: collectedData.length };
    } catch (error) {
      console.error('Data collection failed:', error);
      throw error;
    }
  },
  { connection }
);

// Helper functions
async function fetchLatestScores(leagueId: string, week: number) {
  // Implement score fetching logic
  // This would call the appropriate fantasy platform API
  return {
    teams: [],
    players: [],
    week,
    lastUpdated: new Date()
  };
}

async function sendPushNotification(userId: string, notification: any) {
  // Implement push notification logic
  // This would use a service like Firebase Cloud Messaging
  console.log('Sending push notification to:', userId);
}

async function collectESPNData(type: string) {
  // Implement ESPN data collection
  return [];
}

async function collectYahooData(type: string) {
  // Implement Yahoo data collection
  return [];
}

async function collectOddsData(type: string) {
  // Implement odds data collection
  return [];
}

async function collectSocialData(type: string) {
  // Implement social media data collection
  return [];
}

async function processCollectedData(source: string, type: string, data: any[]) {
  // Process and store collected data
  console.log(`Processing ${data.length} items from ${source} (${type})`);
}

// Job scheduling helpers
export const scheduleJobs = {
  // Schedule recurring score updates
  async scheduleScoreUpdates(leagueId: string, intervalMinutes: number = 5) {
    await scoreUpdateQueue.add(
      'update-scores',
      { leagueId, week: await getCurrentWeek() },
      {
        repeat: {
          every: intervalMinutes * 60 * 1000
        }
      }
    );
  },

  // Schedule leaderboard updates
  async scheduleLeaderboardUpdates() {
    const leaderboards = await prisma.leaderboard.findMany();
    
    for (const leaderboard of leaderboards) {
      let intervalMinutes = 60; // Default hourly
      
      if (leaderboard.timeframe === 'week') {
        intervalMinutes = 15; // Every 15 minutes for weekly
      } else if (leaderboard.timeframe === 'day') {
        intervalMinutes = 5; // Every 5 minutes for daily
      }
      
      await leaderboardQueue.add(
        'update-leaderboard',
        { leaderboardId: leaderboard.id, timeframe: leaderboard.timeframe },
        {
          repeat: {
            every: intervalMinutes * 60 * 1000
          }
        }
      );
    }
  },

  // Schedule data collection
  async scheduleDataCollection() {
    const sources = ['espn', 'yahoo', 'odds', 'social'];
    const types = ['players', 'games', 'news', 'injuries'];
    
    for (const source of sources) {
      for (const type of types) {
        await dataCollectionQueue.add(
          'collect-data',
          { source, type },
          {
            repeat: {
              every: 30 * 60 * 1000 // Every 30 minutes
            }
          }
        );
      }
    }
  },

  // Schedule ML model training
  async scheduleMLTraining() {
    const modelTypes = [
      'player_performance',
      'injury_risk',
      'lineup_optimizer',
      'game_outcome',
      'trade_analyzer'
    ];
    
    for (const modelType of modelTypes) {
      await mlTrainingQueue.add(
        'train-model',
        { modelType },
        {
          repeat: {
            pattern: '0 3 * * *' // Daily at 3 AM
          }
        }
      );
    }
  }
};

async function getCurrentWeek(): Promise<number> {
  // Calculate current fantasy week
  const seasonStart = new Date('2024-09-01');
  const now = new Date();
  const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(17, weeksSinceStart + 1));
}

// Export all queues and workers
export const queues = {
  scoreUpdate: scoreUpdateQueue,
  notification: notificationQueue,
  achievement: achievementQueue,
  leaderboard: leaderboardQueue,
  mlTraining: mlTrainingQueue,
  dataCollection: dataCollectionQueue
};

export const workers = {
  scoreUpdate: scoreUpdateWorker,
  notification: notificationWorker,
  achievement: achievementWorker,
  leaderboard: leaderboardWorker,
  mlTraining: mlTrainingWorker,
  dataCollection: dataCollectionWorker
};