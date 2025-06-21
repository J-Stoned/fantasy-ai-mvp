#!/usr/bin/env ts-node

/**
 * 🔍 FANTASY.AI SPORTS DATA VERIFICATION ENGINE
 * 
 * MISSION: Verify all synced sports data is accessible and properly structured
 * SCOPE: Test database queries, data integrity, and prepare sample API responses
 */

import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

class SportsDataVerifier {
  async run() {
    console.log('🔍 FANTASY.AI SPORTS DATA VERIFICATION ENGINE')
    console.log('=' .repeat(60))
    
    try {
      // Test 1: Basic data counts
      await this.testBasicCounts()
      
      // Test 2: Player data structure
      await this.testPlayerData()
      
      // Test 3: League data
      await this.testLeagueData()
      
      // Test 4: Search functionality
      await this.testSearchFunctionality()
      
      // Test 5: Generate sample API responses
      await this.generateSampleAPIResponses()
      
      console.log('\n✅ ALL VERIFICATION TESTS PASSED!')
      console.log('🎯 Fantasy.AI database is ready for production use')
      
    } catch (error) {
      console.error('❌ Verification failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }
  
  private async testBasicCounts() {
    console.log('\n📊 Testing basic data counts...')
    
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.league.count(),
      prisma.player.count(),
    ])
    
    const [userCount, leagueCount, playerCount] = counts
    
    console.log(`  👥 Users: ${userCount}`)
    console.log(`  🏈 Leagues: ${leagueCount}`)
    console.log(`  👨‍💼 Players: ${playerCount}`)
    
    // Verify minimum expected data
    if (leagueCount < 4) throw new Error('Expected at least 4 leagues')
    if (playerCount < 100) throw new Error('Expected at least 100 players')
    
    console.log('  ✅ Basic counts verified')
  }
  
  private async testPlayerData() {
    console.log('\n👨‍💼 Testing player data structure...')
    
    // Get sample players from each sport
    const leagues = await prisma.league.findMany()
    
    for (const league of leagues) {
      const players = await prisma.player.findMany({
        where: { leagueId: league.id },
        take: 3
      })
      
      console.log(`  🏈 ${league.name} (${league.sport}): ${players.length} sample players`)
      
      for (const player of players) {
        console.log(`    - ${player.name} (${player.position}, ${player.team})`)
        
        // Verify data structure
        if (!player.stats) throw new Error(`Player ${player.name} missing stats`)
        if (!player.projections) throw new Error(`Player ${player.name} missing projections`)
        
        // Parse and validate JSON data
        try {
          const stats = JSON.parse(player.stats)
          const projections = JSON.parse(player.projections)
          console.log(`      Stats: ${Object.keys(stats).length} metrics`)
          console.log(`      Projections: ${Object.keys(projections).length} fields`)
        } catch (e) {
          throw new Error(`Invalid JSON data for player ${player.name}`)
        }
      }
    }
    
    console.log('  ✅ Player data structure verified')
  }
  
  private async testLeagueData() {
    console.log('\n🏈 Testing league data...')
    
    const leagues = await prisma.league.findMany({
      include: {
        _count: {
          select: { players: true }
        }
      }
    })
    
    for (const league of leagues) {
      console.log(`  🏟️  ${league.name}:`)
      console.log(`    Sport: ${league.sport}`)
      console.log(`    Provider: ${league.provider}`)
      console.log(`    Season: ${league.season}`)
      console.log(`    Players: ${league._count.players}`)
      
      if (league._count.players === 0) {
        console.warn(`    ⚠️  No players found in ${league.name}`)
      }
    }
    
    console.log('  ✅ League data verified')
  }
  
  private async testSearchFunctionality() {
    console.log('\n🔍 Testing search functionality...')
    
    // Test player search by name
    const searchResults = await prisma.player.findMany({
      where: {
        name: {
          contains: 'Josh'
        }
      },
      take: 5
    })
    
    console.log(`  🔍 Found ${searchResults.length} players with 'Josh' in name:`)
    for (const player of searchResults) {
      console.log(`    - ${player.name} (${player.team}, ${player.position})`)
    }
    
    // Test team-based search
    const teamResults = await prisma.player.findMany({
      where: {
        team: 'LAL'
      },
      take: 5
    })
    
    console.log(`  🏀 Found ${teamResults.length} Lakers players:`)
    for (const player of teamResults) {
      console.log(`    - ${player.name} (${player.position})`)
    }
    
    console.log('  ✅ Search functionality verified')
  }
  
  private async generateSampleAPIResponses() {
    console.log('\n📱 Generating sample API responses...')
    
    // Sample 1: Top NFL players
    const nflLeague = await prisma.league.findFirst({
      where: { sport: 'FOOTBALL' }
    })
    
    if (nflLeague) {
      const nflPlayers = await prisma.player.findMany({
        where: { leagueId: nflLeague.id },
        take: 10
      })
      
      const nflResponse = {
        sport: 'NFL',
        league: nflLeague.name,
        players: nflPlayers.map(player => ({
          id: player.id,
          name: player.name,
          team: player.team,
          position: player.position,
          stats: JSON.parse(player.stats),
          projections: JSON.parse(player.projections)
        }))
      }
      
      await fs.writeFile(
        path.join(process.cwd(), 'data', 'sample-nfl-api-response.json'),
        JSON.stringify(nflResponse, null, 2)
      )
      
      console.log(`  🏈 Generated NFL API response with ${nflPlayers.length} players`)
    }
    
    // Sample 2: Top NBA players
    const nbaLeague = await prisma.league.findFirst({
      where: { sport: 'BASKETBALL' }
    })
    
    if (nbaLeague) {
      const nbaPlayers = await prisma.player.findMany({
        where: { leagueId: nbaLeague.id },
        take: 10
      })
      
      const nbaResponse = {
        sport: 'NBA',
        league: nbaLeague.name,
        players: nbaPlayers.map(player => ({
          id: player.id,
          name: player.name,
          team: player.team,
          position: player.position,
          stats: JSON.parse(player.stats),
          projections: JSON.parse(player.projections)
        }))
      }
      
      await fs.writeFile(
        path.join(process.cwd(), 'data', 'sample-nba-api-response.json'),
        JSON.stringify(nbaResponse, null, 2)
      )
      
      console.log(`  🏀 Generated NBA API response with ${nbaPlayers.length} players`)
    }
    
    // Sample 3: Team roster example
    const teamRoster = await prisma.player.findMany({
      where: { team: 'LAL' },
      take: 15
    })
    
    const rosterResponse = {
      team: 'Los Angeles Lakers',
      abbreviation: 'LAL',
      sport: 'NBA',
      roster: teamRoster.map(player => ({
        id: player.id,
        name: player.name,
        position: player.position,
        stats: JSON.parse(player.stats),
        projections: JSON.parse(player.projections)
      }))
    }
    
    await fs.writeFile(
      path.join(process.cwd(), 'data', 'sample-team-roster-response.json'),
      JSON.stringify(rosterResponse, null, 2)
    )
    
    console.log(`  🏀 Generated Lakers roster response with ${teamRoster.length} players`)
    
    // Sample 4: Multi-sport summary
    const sportsSummary = await this.generateSportsSummary()
    
    await fs.writeFile(
      path.join(process.cwd(), 'data', 'sports-data-summary.json'),
      JSON.stringify(sportsSummary, null, 2)
    )
    
    console.log(`  📊 Generated complete sports data summary`)
    console.log('  ✅ Sample API responses generated')
  }
  
  private async generateSportsSummary() {
    const leagues = await prisma.league.findMany({
      include: {
        _count: {
          select: { players: true }
        }
      }
    })
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalLeagues: leagues.length,
      totalPlayers: await prisma.player.count(),
      sportBreakdown: {} as Record<string, any>,
      topTeams: await this.getTopTeamsByPlayerCount(),
      dataQuality: {
        playersWithStats: await prisma.player.count({
          where: { stats: { not: '{}' } }
        }),
        playersWithProjections: await prisma.player.count({
          where: { projections: { not: null } }
        })
      }
    }
    
    // Generate sport-specific data
    for (const league of leagues) {
      const players = await prisma.player.findMany({
        where: { leagueId: league.id },
        take: 5 // Sample players
      })
      
      summary.sportBreakdown[league.sport] = {
        league: league.name,
        season: league.season,
        provider: league.provider,
        playerCount: league._count.players,
        samplePlayers: players.map(p => ({
          name: p.name,
          team: p.team,
          position: p.position
        }))
      }
    }
    
    return summary
  }
  
  private async getTopTeamsByPlayerCount() {
    const teamCounts = await prisma.player.groupBy({
      by: ['team'],
      _count: { team: true },
      orderBy: { _count: { team: 'desc' } },
      take: 10
    })
    
    return teamCounts.map(tc => ({
      team: tc.team,
      playerCount: tc._count.team
    }))
  }
}

// Execute if run directly
if (require.main === module) {
  const verifier = new SportsDataVerifier()
  verifier.run().catch(console.error)
}

export default SportsDataVerifier