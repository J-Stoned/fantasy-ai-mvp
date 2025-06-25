/**
 * Seed script for gamification data
 * Populates achievements, challenges, and initial leaderboards
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAchievements() {
  console.log('🏆 Seeding achievements...');
  
  const achievements = [
    // Performance Achievements
    {
      name: 'First Victory',
      description: 'Win your first fantasy matchup',
      icon: '🏆',
      category: 'performance',
      rarity: 'common',
      xpReward: 100,
      requirements: { type: 'win_games', value: 1 }
    },
    {
      name: 'Hot Streak',
      description: 'Win 5 games in a row',
      icon: '🔥',
      category: 'performance',
      rarity: 'rare',
      xpReward: 500,
      requirements: { type: 'win_games', value: 5, consecutive: true }
    },
    {
      name: 'Perfect Week',
      description: 'Score the highest in your league for a week',
      icon: '💯',
      category: 'performance',
      rarity: 'epic',
      xpReward: 750,
      gemReward: 10,
      requirements: { type: 'score_points', value: 1, highest: true }
    },
    {
      name: 'Champion',
      description: 'Win a fantasy championship',
      icon: '👑',
      category: 'performance',
      rarity: 'legendary',
      xpReward: 2000,
      gemReward: 50,
      requirements: { type: 'milestone', value: 1, subtype: 'championship' }
    },
    
    // Strategy Achievements
    {
      name: 'Trade Master',
      description: 'Complete 10 trades in a season',
      icon: '💼',
      category: 'strategy',
      rarity: 'rare',
      xpReward: 400,
      requirements: { type: 'make_trades', value: 10, timeframe: 'season' }
    },
    {
      name: 'Waiver Wire Wizard',
      description: 'Pick up a player who scores 20+ points that week',
      icon: '🎯',
      category: 'strategy',
      rarity: 'rare',
      xpReward: 300,
      requirements: { type: 'special_event', value: 1, subtype: 'waiver_hero' }
    },
    {
      name: 'Perfect Draft',
      description: 'Receive an A+ draft grade',
      icon: '📋',
      category: 'strategy',
      rarity: 'epic',
      xpReward: 1000,
      gemReward: 25,
      requirements: { type: 'milestone', value: 1, draftGrade: 'A+' }
    },
    {
      name: 'Lineup Optimizer',
      description: 'Set the optimal lineup 10 weeks in a row',
      icon: '⚡',
      category: 'strategy',
      rarity: 'epic',
      xpReward: 800,
      requirements: { type: 'perfect_lineup', value: 10, consecutive: true }
    },
    
    // Social Achievements
    {
      name: 'Social Butterfly',
      description: 'Send 50 messages in league chat',
      icon: '💬',
      category: 'social',
      rarity: 'common',
      xpReward: 200,
      requirements: { type: 'social_action', value: 50, action: 'message' }
    },
    {
      name: 'Trash Talker',
      description: 'Win a grudge match after trash talking',
      icon: '🗣️',
      category: 'social',
      rarity: 'rare',
      xpReward: 400,
      requirements: { type: 'special_event', value: 1, subtype: 'grudge_match' }
    },
    {
      name: 'Helpful Friend',
      description: 'Share 10 AI insights with league mates',
      icon: '🤝',
      category: 'social',
      rarity: 'common',
      xpReward: 250,
      requirements: { type: 'social_action', value: 10, action: 'share' }
    },
    
    // Collector Achievements
    {
      name: 'Player Collector',
      description: 'Roster 50 different players in a season',
      icon: '📚',
      category: 'collector',
      rarity: 'rare',
      xpReward: 500,
      requirements: { type: 'milestone', value: 50, subtype: 'unique_players' }
    },
    {
      name: 'All-Star Team',
      description: 'Have 5 players score 20+ points in one week',
      icon: '⭐',
      category: 'collector',
      rarity: 'epic',
      xpReward: 750,
      requirements: { type: 'special_event', value: 1, subtype: 'all_star_week' }
    },
    
    // Special/Secret Achievements
    {
      name: 'AI Believer',
      description: 'Follow AI advice 20 times and win',
      icon: '🤖',
      category: 'special',
      rarity: 'epic',
      xpReward: 1000,
      secret: true,
      requirements: { type: 'prediction_accuracy', value: 20, ai_followed: true }
    },
    {
      name: 'Comeback King',
      description: 'Win after being projected to lose by 20+ points',
      icon: '🔄',
      category: 'special',
      rarity: 'legendary',
      xpReward: 1500,
      gemReward: 30,
      secret: true,
      requirements: { type: 'special_event', value: 1, subtype: 'comeback' }
    },
    {
      name: 'Early Adopter',
      description: 'Be one of the first 1000 Fantasy.AI users',
      icon: '🚀',
      category: 'special',
      rarity: 'legendary',
      xpReward: 2500,
      gemReward: 100,
      secret: false,
      requirements: { type: 'milestone', value: 1, subtype: 'early_user' }
    }
  ];
  
  for (const achievement of achievements) {
    // Check if achievement already exists
    const existing = await prisma.achievement.findFirst({
      where: { name: achievement.name }
    });
    
    if (!existing) {
      await prisma.achievement.create({
        data: achievement,
      });
    }
  }
  
  console.log(`✅ Seeded ${achievements.length} achievements`);
}

async function seedChallenges() {
  console.log('🎯 Seeding weekly challenges...');
  
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7);
  
  const challenges = [
    {
      name: 'Century Club',
      description: 'Score 100+ points in a single week',
      icon: '💯',
      type: 'individual',
      category: 'scoring',
      difficulty: 'easy',
      requirements: { type: 'score', condition: 'weekly_total', value: 100 },
      rewards: { xp: 100 },
      startDate: now,
      endDate: endDate,
      isActive: true
    },
    {
      name: 'Streaming Success',
      description: 'Add a player who scores 15+ points same week',
      icon: '📈',
      type: 'individual',
      category: 'roster',
      difficulty: 'medium',
      requirements: { type: 'lineup', condition: 'waiver_hero', value: 15 },
      rewards: { xp: 250 },
      startDate: now,
      endDate: endDate,
      isActive: true
    },
    {
      name: 'Oracle',
      description: 'Correctly predict 5 game outcomes',
      icon: '🔮',
      type: 'individual',
      category: 'prediction',
      difficulty: 'medium',
      requirements: { type: 'predict', condition: 'correct_games', value: 5 },
      rewards: { xp: 250 },
      startDate: now,
      endDate: endDate,
      isActive: true
    },
    {
      name: 'AI Believer',
      description: 'Follow AI advice and win your matchup',
      icon: '🤖',
      type: 'individual',
      category: 'special',
      difficulty: 'medium',
      requirements: { type: 'win', condition: 'ai_lineup', value: 1 },
      rewards: { xp: 300 },
      startDate: now,
      endDate: endDate,
      isActive: true
    },
    {
      name: 'Triple Crown',
      description: 'Complete 3 challenges in different categories',
      icon: '👑',
      type: 'individual',
      category: 'special',
      difficulty: 'insane',
      requirements: { type: 'collect', condition: 'challenges', value: 3 },
      rewards: { xp: 2000, gems: 50, badges: ['weekly_champion'] },
      startDate: now,
      endDate: endDate,
      isActive: true
    }
  ];
  
  for (const challenge of challenges) {
    // Check if challenge already exists
    const existing = await prisma.challenge.findFirst({
      where: { name: challenge.name }
    });
    
    if (!existing) {
      await prisma.challenge.create({
        data: challenge,
      });
    }
  }
  
  console.log(`✅ Seeded ${challenges.length} challenges`);
}

async function seedLeaderboards() {
  console.log('🏅 Seeding initial leaderboards...');
  
  const leaderboardTypes = [
    { type: 'global', category: 'overall', timeframe: 'all-time' },
    { type: 'global', category: 'overall', timeframe: 'season' },
    { type: 'global', category: 'overall', timeframe: 'week' },
    { type: 'global', category: 'accuracy', timeframe: 'all-time' },
    { type: 'global', category: 'trading', timeframe: 'season' },
    { type: 'global', category: 'social', timeframe: 'all-time' },
    { type: 'global', category: 'achievements', timeframe: 'all-time' },
  ];
  
  for (const lb of leaderboardTypes) {
    const name = `${lb.category ? lb.category + ' ' : ''}${lb.type} - ${lb.timeframe}`;
    
    // Check if leaderboard already exists
    const existing = await prisma.leaderboard.findFirst({
      where: {
        type: lb.type,
        category: lb.category || null,
        timeframe: lb.timeframe
      }
    });
    
    if (!existing) {
      await prisma.leaderboard.create({
        data: {
          name,
          type: lb.type,
          category: lb.category,
          timeframe: lb.timeframe,
          metadata: {
            totalParticipants: 0,
            averageScore: 0,
            topScore: 0
          }
        }
      });
    }
  }
  
  console.log(`✅ Seeded ${leaderboardTypes.length} leaderboards`);
}

async function main() {
  console.log('🚀 Starting gamification data seed...');
  
  try {
    await seedAchievements();
    await seedChallenges();
    await seedLeaderboards();
    
    console.log('✅ Gamification seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });