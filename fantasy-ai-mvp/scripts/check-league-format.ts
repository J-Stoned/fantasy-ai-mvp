#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLeagueFormat() {
  try {
    const league = await prisma.league.findFirst();
    if (league) {
      console.log('League found:');
      console.log('- ID:', league.id);
      console.log('- Name:', league.name);
      console.log('- Provider:', league.provider);
      console.log('- Sport:', league.sport);
      console.log('\nID format:', typeof league.id, 'length:', league.id.length);
    } else {
      console.log('No leagues found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeagueFormat();