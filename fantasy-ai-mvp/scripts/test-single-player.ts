#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSinglePlayer() {
  try {
    const league = await prisma.league.findFirst();
    if (!league) {
      console.log('No league found');
      return;
    }
    
    console.log('League:', league.id, league.name);
    
    // Try to add a single player
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const player = await prisma.player.create({
      data: {
        id: playerId,
        externalId: `test-player-${Date.now()}`,
        name: 'Test Player',
        position: 'QB',
        team: 'Test Team',
        leagueId: league.id,
        stats: '{}',
        projections: '{}'
      }
    });
    
    console.log('Successfully created player:', player.name);
    
    const count = await prisma.player.count();
    console.log('Total players:', count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSinglePlayer();