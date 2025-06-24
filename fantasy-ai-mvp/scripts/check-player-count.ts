#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCount() {
  try {
    const count = await prisma.player.count();
    console.log(`\n🏆 TOTAL PLAYERS: ${count.toLocaleString()}`);
    console.log(count >= 5000 ? '✅ 5,000+ PLAYER MILESTONE ACHIEVED!' : `📈 Progress: ${Math.floor((count/5000)*100)}%`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCount();