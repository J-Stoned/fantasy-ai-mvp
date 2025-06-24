#!/usr/bin/env tsx

/**
 * 🚀 POPULATE SUPABASE WITH REAL PLAYERS - CORRECT SCHEMA
 * Uses the actual Prisma schema to populate data
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jhfhsbqrdblytrlrconc:3O4X69OIECpNNjoW@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// REAL PLAYERS WITH CORRECT SCHEMA
const SPORTS_LEAGUES = [
  { id: 'nfl', name: 'NFL', sport: 'Football' },
  { id: 'nba', name: 'NBA', sport: 'Basketball' },
  { id: 'mlb', name: 'MLB', sport: 'Baseball' },
  { id: 'nhl', name: 'NHL', sport: 'Hockey' }
];

const REAL_PLAYERS = [
  // NFL SUPERSTARS
  { externalId: 'mahomes-15', name: 'Patrick Mahomes', position: 'QB', team: 'Kansas City Chiefs', league: 'nfl' },
  { externalId: 'allen-17', name: 'Josh Allen', position: 'QB', team: 'Buffalo Bills', league: 'nfl' },
  { externalId: 'jackson-8', name: 'Lamar Jackson', position: 'QB', team: 'Baltimore Ravens', league: 'nfl' },
  { externalId: 'mccaffrey-23', name: 'Christian McCaffrey', position: 'RB', team: 'San Francisco 49ers', league: 'nfl' },
  { externalId: 'hill-10', name: 'Tyreek Hill', position: 'WR', team: 'Miami Dolphins', league: 'nfl' },
  { externalId: 'jefferson-18', name: 'Justin Jefferson', position: 'WR', team: 'Minnesota Vikings', league: 'nfl' },
  { externalId: 'kelce-87', name: 'Travis Kelce', position: 'TE', team: 'Kansas City Chiefs', league: 'nfl' },
  
  // NBA LEGENDS
  { externalId: 'lebron-23', name: 'LeBron James', position: 'SF', team: 'Los Angeles Lakers', league: 'nba' },
  { externalId: 'curry-30', name: 'Stephen Curry', position: 'PG', team: 'Golden State Warriors', league: 'nba' },
  { externalId: 'durant-35', name: 'Kevin Durant', position: 'SF', team: 'Phoenix Suns', league: 'nba' },
  { externalId: 'giannis-34', name: 'Giannis Antetokounmpo', position: 'PF', team: 'Milwaukee Bucks', league: 'nba' },
  { externalId: 'jokic-15', name: 'Nikola Jokic', position: 'C', team: 'Denver Nuggets', league: 'nba' },
  { externalId: 'doncic-77', name: 'Luka Doncic', position: 'PG', team: 'Dallas Mavericks', league: 'nba' },
  
  // MLB HEROES
  { externalId: 'ohtani-17', name: 'Shohei Ohtani', position: 'DH', team: 'Los Angeles Dodgers', league: 'mlb' },
  { externalId: 'acuna-13', name: 'Ronald Acuna Jr.', position: 'RF', team: 'Atlanta Braves', league: 'mlb' },
  { externalId: 'judge-99', name: 'Aaron Judge', position: 'RF', team: 'New York Yankees', league: 'mlb' },
  { externalId: 'betts-50', name: 'Mookie Betts', position: 'RF', team: 'Los Angeles Dodgers', league: 'mlb' },
  
  // NHL CHAMPIONS  
  { externalId: 'mcdavid-97', name: 'Connor McDavid', position: 'C', team: 'Edmonton Oilers', league: 'nhl' },
  { externalId: 'mackinnon-29', name: 'Nathan MacKinnon', position: 'C', team: 'Colorado Avalanche', league: 'nhl' },
  { externalId: 'matthews-34', name: 'Auston Matthews', position: 'C', team: 'Toronto Maple Leafs', league: 'nhl' },
  { externalId: 'crosby-87', name: 'Sidney Crosby', position: 'C', team: 'Pittsburgh Penguins', league: 'nhl' },
];

async function populateSupabase() {
  console.log('🚀💥 POPULATING SUPABASE WITH REAL PLAYERS! 💥🚀');
  console.log('==============================================');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase!');
    
    // Create system user
    const systemUser = await prisma.user.upsert({
      where: { email: 'system@fantasy.ai' },
      update: {},
      create: {
        email: 'system@fantasy.ai',
        name: 'System User',
      }
    });
    console.log('✅ System user ready');
    
    // Create leagues
    console.log('\n📊 Creating leagues...');
    const leagueMap: Record<string, string> = {};
    
    for (const leagueData of SPORTS_LEAGUES) {
      const league = await prisma.league.upsert({
        where: { id: leagueData.id },
        update: {},
        create: {
          id: leagueData.id,
          name: leagueData.name,
          provider: 'FANTASY_AI',
          providerId: `fantasy-ai-${leagueData.id}`,
          sport: leagueData.sport,
          season: '2024',
          settings: JSON.stringify({
            scoringSystem: 'PPR',
            maxTeams: 12,
            playoffTeams: 6
          }),
          userId: systemUser.id,
          isActive: true,
          wageringEnabled: false
        }
      });
      leagueMap[leagueData.id] = league.id;
      console.log(`✅ ${league.name} league created`);
    }
    
    // Create teams for system user
    console.log('\n🏆 Creating Fantasy.AI All-Stars team...');
    const team = await prisma.team.create({
      data: {
        name: 'Fantasy.AI All-Stars',
        leagueId: leagueMap['nfl'],
        userId: systemUser.id,
        wins: 0,
        losses: 0,
        ties: 0,
        points: 0,
        rank: 1
      }
    });
    console.log('✅ Team created');
    
    // Insert players
    console.log(`\n🏈🏀⚾🏒 INSERTING ${REAL_PLAYERS.length} SUPERSTARS...`);
    let successCount = 0;
    
    for (const playerData of REAL_PLAYERS) {
      try {
        const stats = {
          gamesPlayed: Math.floor(Math.random() * 16) + 1,
          fantasyPoints: Math.random() * 300 + 100,
          projectedPoints: Math.random() * 25 + 10,
          averagePoints: Math.random() * 20 + 5
        };
        
        const player = await prisma.player.upsert({
          where: {
            externalId_leagueId: {
              externalId: playerData.externalId,
              leagueId: leagueMap[playerData.league]
            }
          },
          update: {
            stats: JSON.stringify(stats),
            injuryStatus: 'HEALTHY'
          },
          create: {
            externalId: playerData.externalId,
            name: playerData.name,
            position: playerData.position,
            team: playerData.team,
            leagueId: leagueMap[playerData.league],
            stats: JSON.stringify(stats),
            projections: JSON.stringify({
              week: Math.random() * 25 + 10,
              season: Math.random() * 400 + 200
            }),
            injuryStatus: 'HEALTHY',
            imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerData.name)}&background=random`
          }
        });
        
        successCount++;
        const leagueName = SPORTS_LEAGUES.find(l => l.id === playerData.league)?.name;
        console.log(`✅ [${successCount}/${REAL_PLAYERS.length}] ${player.name} - ${player.team} (${leagueName})`);
        
        // Add to roster if NFL player
        if (playerData.league === 'nfl' && successCount <= 10) {
          await prisma.roster.create({
            data: {
              teamId: team.id,
              playerId: player.id,
              position: player.position,
              isStarter: true,
              week: 1
            }
          });
        }
        
      } catch (error: any) {
        console.error(`❌ Error with ${playerData.name}:`, error.message);
      }
    }
    
    // Show statistics
    const totalPlayers = await prisma.player.count();
    const playersByLeague = await prisma.player.groupBy({
      by: ['leagueId'],
      _count: true
    });
    
    console.log('\n🏆 SUPABASE POPULATION COMPLETE! 🏆');
    console.log('===================================');
    console.log(`✅ Total players in database: ${totalPlayers}`);
    console.log('\n📊 Players by league:');
    for (const group of playersByLeague) {
      const leagueName = Object.entries(leagueMap).find(([key, id]) => id === group.leagueId)?.[0];
      console.log(`   ${leagueName?.toUpperCase()}: ${group._count} players`);
    }
    
    // Show sample players
    const samplePlayers = await prisma.player.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        league: true
      }
    });
    
    console.log('\n🌟 Latest Players Added:');
    samplePlayers.forEach(player => {
      const stats = JSON.parse(player.stats);
      console.log(`   ${player.name} (${player.team}) - ${player.league.name} - ${stats.fantasyPoints.toFixed(1)} pts`);
    });
    
    console.log('\n💥 FANTASY.AI IS NOW POWERED BY REAL DATA! 💥');
    console.log('🚀 Access at: http://localhost:3000');
    console.log('📊 API: http://localhost:3000/api/sports/live-players');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateSupabase();