#!/usr/bin/env tsx

/**
 * 🔍💥 CHECK REAL DATA STATUS - SEE WHAT'S ACTUALLY IN SUPABASE! 💥🔍
 */

import { PrismaClient } from '@prisma/client';
import * as chalk from 'chalk';

const prisma = new PrismaClient();

async function checkRealDataStatus() {
  console.log(chalk.green.bold('\n🔍💥 CHECKING REAL DATA STATUS IN SUPABASE! 💥🔍'));
  console.log(chalk.green('================================================\n'));

  try {
    // Check total counts
    const [
      playerCount,
      leagueCount,
      gameCount,
      newsCount,
      predictionCount,
      collectionRunCount
    ] = await Promise.all([
      prisma.player.count(),
      prisma.league.count(),
      prisma.gameData.count(),
      prisma.newsArticle.count(),
      prisma.prediction.count(),
      prisma.dataCollectionRun.count()
    ]);

    console.log(chalk.cyan.bold('📊 DATABASE TOTALS:'));
    console.log(chalk.white(`   🏈 Players: ${chalk.yellow.bold(playerCount.toLocaleString())}`));
    console.log(chalk.white(`   🏆 Leagues: ${chalk.yellow.bold(leagueCount.toLocaleString())}`));
    console.log(chalk.white(`   🎮 Games: ${chalk.yellow.bold(gameCount.toLocaleString())}`));
    console.log(chalk.white(`   📰 News Articles: ${chalk.yellow.bold(newsCount.toLocaleString())}`));
    console.log(chalk.white(`   🔮 Predictions: ${chalk.yellow.bold(predictionCount.toLocaleString())}`));
    console.log(chalk.white(`   📡 Collection Runs: ${chalk.yellow.bold(collectionRunCount.toLocaleString())}`));

    // Check players by sport
    const playersBySport = await prisma.player.groupBy({
      by: ['sport'],
      _count: {
        id: true
      }
    });

    console.log(chalk.cyan.bold('\n🏆 PLAYERS BY SPORT:'));
    playersBySport.forEach(sport => {
      console.log(chalk.white(`   ${sport.sport || 'Unknown'}: ${chalk.yellow.bold(sport._count.id.toLocaleString())}`));
    });

    // Check recent games
    const recentGames = await prisma.gameData.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    if (recentGames.length > 0) {
      console.log(chalk.cyan.bold('\n🎮 RECENT GAMES:'));
      recentGames.forEach(game => {
        console.log(chalk.white(`   ${game.homeTeam} vs ${game.awayTeam} - ${game.status}`));
      });
    }

    // Check recent news
    const recentNews = await prisma.newsArticle.findMany({
      take: 5,
      orderBy: { publishedAt: 'desc' }
    });

    if (recentNews.length > 0) {
      console.log(chalk.cyan.bold('\n📰 RECENT NEWS:'));
      recentNews.forEach(article => {
        console.log(chalk.white(`   ${article.title.substring(0, 60)}...`));
      });
    }

    // Check collection runs
    const recentRuns = await prisma.dataCollectionRun.findMany({
      take: 5,
      orderBy: { startTime: 'desc' }
    });

    if (recentRuns.length > 0) {
      console.log(chalk.cyan.bold('\n📡 RECENT DATA COLLECTION:'));
      recentRuns.forEach(run => {
        console.log(chalk.white(`   ${run.source} - ${run.recordsCount} records - ${run.status}`));
      });
    }

    // Sample top players
    const topPlayers = await prisma.player.findMany({
      take: 10,
      where: {
        rating: { gte: 90 }
      },
      orderBy: { rating: 'desc' }
    });

    console.log(chalk.cyan.bold('\n⭐ TOP RATED PLAYERS:'));
    topPlayers.forEach(player => {
      console.log(chalk.white(`   ${player.name} (${player.position}) - ${player.team} - Rating: ${chalk.yellow.bold(player.rating)}`));
    });

    // Check if ML is running
    const mlLearningState = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "MLLearningRun" WHERE "createdAt" > NOW() - INTERVAL '1 hour'
    ` as any[];

    console.log(chalk.cyan.bold('\n🧠 ML STATUS:'));
    console.log(chalk.white(`   Recent ML runs (last hour): ${chalk.yellow.bold(mlLearningState[0]?.count || 0)}`));

    // Success summary
    console.log(chalk.green.bold('\n✅ DATA STATUS SUMMARY:'));
    console.log(chalk.green(`   Total Data Points: ${chalk.yellow.bold((playerCount + gameCount + newsCount + predictionCount).toLocaleString())}`));
    console.log(chalk.green(`   Database Health: ${playerCount > 1000 ? chalk.green.bold('EXCELLENT! 🚀') : chalk.red.bold('NEEDS MORE DATA')}`));
    console.log(chalk.green(`   Ready for Production: ${playerCount > 3000 ? chalk.green.bold('YES! SHIP IT! 🎯') : chalk.yellow.bold('ALMOST THERE!')}`));

  } catch (error) {
    console.error(chalk.red('❌ Error checking data status:'), error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
checkRealDataStatus()
  .then(() => {
    console.log(chalk.green.bold('\n🏁 DATA STATUS CHECK COMPLETE! 🏁\n'));
  })
  .catch(console.error);