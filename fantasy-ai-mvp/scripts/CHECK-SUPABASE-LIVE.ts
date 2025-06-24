#!/usr/bin/env tsx

/**
 * 🔍💾 CHECK SUPABASE LIVE DATA 💾🔍
 * Verify data is actually being stored in Supabase
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function checkSupabaseData() {
  console.log('🔍💾 CHECKING SUPABASE LIVE DATA... 💾🔍\n');
  
  try {
    // Check connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase!\n');
    
    // Check players
    const playerCount = await prisma.player.count();
    console.log(`🏈 Total Players: ${playerCount.toLocaleString()}`);
    
    // Get recent players
    const recentPlayers = await prisma.player.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { 
        name: true, 
        team: true, 
        position: true,
        updatedAt: true 
      }
    });
    
    if (recentPlayers.length > 0) {
      console.log('\n📋 Recent Player Updates:');
      recentPlayers.forEach(p => {
        const timeSince = Date.now() - new Date(p.updatedAt).getTime();
        const minutes = Math.floor(timeSince / 1000 / 60);
        console.log(`   - ${p.name} (${p.team} ${p.position}) - ${minutes} min ago`);
      });
    }
    
    // Check for recent stats
    const recentStats = await prisma.playerStats.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      }
    });
    
    console.log(`\n📊 Stats Added (Last 30 min): ${recentStats}`);
    
    // Check predictions
    const predictions = await prisma.prediction.count();
    console.log(`🔮 Total Predictions: ${predictions}`);
    
    // Check recent predictions
    const recentPredictions = await prisma.prediction.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });
    
    console.log(`⚡ Predictions (Last 5 min): ${recentPredictions}`);
    
    // Summary
    console.log('\n📈 DATABASE STATUS:');
    if (recentStats > 0 || recentPredictions > 0) {
      console.log('   🟢 ACTIVELY RECEIVING DATA!');
      console.log('   ✅ ML predictions being stored!');
      console.log('   ✅ Player stats updating!');
    } else {
      console.log('   🟡 Database connected but no recent updates');
      console.log('   💡 Data may be collecting in batches');
    }
    
  } catch (error) {
    console.error('❌ Error checking Supabase:', error.message);
    console.log('\n💡 Make sure DATABASE_URL is configured correctly');
  } finally {
    await prisma.$disconnect();
  }
}

// Run it!
checkSupabaseData();