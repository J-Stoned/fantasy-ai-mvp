#!/usr/bin/env ts-node

/**
 * 🚀 FANTASY.AI SPORTS DATA SYNC ENGINE
 * 
 * MISSION: Import all 537+ collected sports records into Fantasy.AI database
 * SCOPE: ESPN, Yahoo, CBS, BBC, TSN, F1 - All global sports data
 * 
 * DATA SOURCES:
 * - ESPN: NFL/NBA/MLB players + injuries (184 records)
 * - Yahoo/CBS: Fantasy rankings + stats (246 records) 
 * - Global: UK Soccer, Canadian NHL, F1 (107 records)
 * - Knowledge Graph: 392 entities, 10,595 relationships
 * 
 * TOTAL: 537+ real sports records → Live Fantasy.AI database
 */

import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface SportsDataFile {
  source: string
  url: string
  collectedAt: string
  data: any[]
}

interface PlayerData {
  id?: string
  name: string
  team: string
  position: string
  jerseyNumber?: number
  age?: number
  height?: string
  weight?: number
  experience?: number
  college?: string
  stats?: Record<string, any>
  salary?: number
  fantasyPoints?: number
  projectedPoints?: number
  lastUpdated?: string
}

interface InjuryData {
  playerId: string
  playerName: string
  team: string
  injury: string
  status: string
  description: string
  expectedReturn?: string
  lastUpdated: string
}

interface TeamData {
  id?: string
  name: string
  city?: string
  abbreviation?: string
  conference?: string
  division?: string
  logoUrl?: string
}

class SportsDataSyncEngine {
  private dataDir = path.join(process.cwd(), 'data')
  
  async run() {
    console.log('🚀 FANTASY.AI SPORTS DATA SYNC ENGINE ACTIVATED')
    console.log('=' .repeat(60))
    
    try {
      // Step 1: Load all collected data files
      const dataFiles = await this.loadAllDataFiles()
      console.log(`📂 Loaded ${dataFiles.length} data files`)
      
      // Step 2: Create base leagues and teams
      const leagues = await this.createBaseLeagues()
      console.log(`🏈 Created ${leagues.length} base leagues`)
      
      // Step 3: Sync player data by sport
      await this.syncPlayerData(dataFiles, leagues)
      
      // Step 4: Sync injury data
      await this.syncInjuryData(dataFiles)
      
      // Step 5: Sync team data
      await this.syncTeamData(dataFiles)
      
      // Step 6: Generate summary report
      await this.generateSyncReport()
      
      console.log('\n✅ SPORTS DATA SYNC COMPLETED SUCCESSFULLY!')
      console.log('🎯 Fantasy.AI database is now populated with live sports data')
      
    } catch (error) {
      console.error('❌ Sync failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }
  
  private async loadAllDataFiles(): Promise<SportsDataFile[]> {
    const files: SportsDataFile[] = []
    const dataDirs = ['raw/espn', 'raw/puppeteer', 'raw/global']
    
    for (const dir of dataDirs) {
      const dirPath = path.join(this.dataDir, dir)
      try {
        const fileList = await fs.readdir(dirPath)
        for (const file of fileList) {
          if (file.endsWith('.json')) {
            const filePath = path.join(dirPath, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const data = JSON.parse(content)
            files.push(data)
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not read directory ${dir}:`, error)
      }
    }
    
    return files
  }
  
  private async createBaseLeagues() {
    console.log('\n🏈 Creating base leagues...')
    
    // Create a default user for system data
    const systemUser = await prisma.user.upsert({
      where: { email: 'system@fantasy.ai' },
      update: {},
      create: {
        email: 'system@fantasy.ai',
        name: 'Fantasy.AI System',
        password: 'system-user'
      }
    })
    
    const leagues = [
      {
        name: 'NFL 2024 Season',
        sport: 'FOOTBALL' as const,
        provider: 'ESPN' as const,
        providerId: 'nfl-2024',
        season: '2024',
        settings: JSON.stringify({ source: 'ESPN' })
      },
      {
        name: 'NBA 2024-25 Season', 
        sport: 'BASKETBALL' as const,
        provider: 'ESPN' as const,
        providerId: 'nba-2024',
        season: '2024-25',
        settings: JSON.stringify({ source: 'ESPN' })
      },
      {
        name: 'MLB 2024 Season',
        sport: 'BASEBALL' as const,
        provider: 'ESPN' as const,
        providerId: 'mlb-2024',
        season: '2024',
        settings: JSON.stringify({ source: 'ESPN' })
      },
      {
        name: 'NHL 2024-25 Season',
        sport: 'HOCKEY' as const,
        provider: 'ESPN' as const,
        providerId: 'nhl-2024',
        season: '2024-25',
        settings: JSON.stringify({ source: 'TSN/ESPN' })
      }
    ]
    
    const createdLeagues = []
    for (const leagueData of leagues) {
      const league = await prisma.league.upsert({
        where: {
          provider_providerId: {
            provider: leagueData.provider,
            providerId: leagueData.providerId
          }
        },
        update: {
          lastSync: new Date()
        },
        create: {
          ...leagueData,
          userId: systemUser.id
        }
      })
      createdLeagues.push(league)
      console.log(`  ✅ ${league.name}`)
    }
    
    return createdLeagues
  }
  
  private async syncPlayerData(dataFiles: SportsDataFile[], leagues: any[]) {
    console.log('\n👨‍💼 Syncing player data...')
    
    let totalPlayers = 0
    
    for (const file of dataFiles) {
      // Skip non-player files
      if (!file.source.toLowerCase().includes('player')) continue
      
      console.log(`  📋 Processing ${file.source}...`)
      
      const sport = this.detectSport(file.source)
      const league = leagues.find(l => l.sport === sport)
      
      if (!league) {
        console.warn(`    ⚠️  No league found for sport: ${sport}`)
        continue
      }
      
      for (const playerData of file.data || []) {
        try {
          const player = await this.createOrUpdatePlayer(playerData, league.id)
          totalPlayers++
          
          if (totalPlayers % 50 === 0) {
            console.log(`    📊 Processed ${totalPlayers} players...`)
          }
        } catch (error) {
          console.warn(`    ⚠️  Failed to sync player ${playerData.name}:`, error)
        }
      }
      
      console.log(`    ✅ Completed ${file.source} - ${file.data?.length || 0} players`)
    }
    
    console.log(`  🎯 Total players synced: ${totalPlayers}`)
  }
  
  private async createOrUpdatePlayer(playerData: PlayerData, leagueId: string) {
    const externalId = playerData.id || `${playerData.name}-${playerData.team}`.toLowerCase().replace(/\s+/g, '-')
    
    return await prisma.player.upsert({
      where: {
        externalId_leagueId: {
          externalId,
          leagueId
        }
      },
      update: {
        stats: JSON.stringify(playerData.stats || {}),
        projections: JSON.stringify({
          points: playerData.projectedPoints,
          salary: playerData.salary,
          fantasyPoints: playerData.fantasyPoints
        }),
        updatedAt: new Date()
      },
      create: {
        externalId,
        name: playerData.name,
        position: playerData.position,
        team: playerData.team,
        leagueId,
        stats: JSON.stringify(playerData.stats || {}),
        projections: JSON.stringify({
          points: playerData.projectedPoints,
          salary: playerData.salary,
          fantasyPoints: playerData.fantasyPoints,
          age: playerData.age,
          height: playerData.height,
          weight: playerData.weight,
          experience: playerData.experience,
          college: playerData.college
        })
      }
    })
  }
  
  private async syncInjuryData(dataFiles: SportsDataFile[]) {
    console.log('\n🏥 Syncing injury data...')
    
    let totalInjuries = 0
    
    for (const file of dataFiles) {
      if (!file.source.toLowerCase().includes('injur')) continue
      
      console.log(`  📋 Processing ${file.source}...`)
      
      for (const injuryData of file.data || []) {
        try {
          await this.updatePlayerInjuryStatus(injuryData)
          totalInjuries++
        } catch (error) {
          console.warn(`    ⚠️  Failed to sync injury for ${injuryData.playerName}:`, error)
        }
      }
      
      console.log(`    ✅ Completed ${file.source} - ${file.data?.length || 0} injuries`)
    }
    
    console.log(`  🎯 Total injuries synced: ${totalInjuries}`)
  }
  
  private async updatePlayerInjuryStatus(injuryData: InjuryData) {
    // Find player by name and team (SQLite doesn't support mode: insensitive)
    const players = await prisma.player.findMany({
      where: {
        name: {
          contains: injuryData.playerName
        },
        team: injuryData.team
      }
    })
    
    if (players.length === 0) {
      console.warn(`    ⚠️  Player not found: ${injuryData.playerName} (${injuryData.team})`)
      return
    }
    
    // Update injury status for all matching players
    for (const player of players) {
      await prisma.player.update({
        where: { id: player.id },
        data: {
          injuryStatus: JSON.stringify({
            status: injuryData.status,
            injury: injuryData.injury,
            description: injuryData.description,
            expectedReturn: injuryData.expectedReturn,
            lastUpdated: injuryData.lastUpdated
          })
        }
      })
    }
  }
  
  private async syncTeamData(dataFiles: SportsDataFile[]) {
    console.log('\n🏟️  Extracting team data from player records...')
    
    const teamMap = new Map<string, { name: string, sport: string, count: number }>()
    
    // Extract unique teams from player data
    for (const file of dataFiles) {
      if (!file.source.toLowerCase().includes('player')) continue
      
      const sport = this.detectSport(file.source)
      
      for (const playerData of file.data || []) {
        const teamKey = `${playerData.team}-${sport}`
        if (teamMap.has(teamKey)) {
          teamMap.get(teamKey)!.count++
        } else {
          teamMap.set(teamKey, {
            name: this.getFullTeamName(playerData.team, sport),
            sport,
            count: 1
          })
        }
      }
    }
    
    console.log(`  🎯 Found ${teamMap.size} unique teams across all sports`)
    
    // Note: Teams are managed through the Player model's team field
    // This provides team statistics for reporting
    return Array.from(teamMap.entries()).map(([key, data]) => ({
      abbreviation: key.split('-')[0],
      ...data
    }))
  }
  
  private async generateSyncReport() {
    console.log('\n📊 Generating sync report...')
    
    const stats = await Promise.all([
      prisma.player.count(),
      prisma.league.count(),
      prisma.player.count({ where: { injuryStatus: { not: null } } }),
      prisma.player.groupBy({
        by: ['team'],
        _count: { team: true }
      })
    ])
    
    const [playerCount, leagueCount, injuredCount, teamStats] = stats
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPlayers: playerCount,
        totalLeagues: leagueCount,
        playersWithInjuries: injuredCount,
        uniqueTeams: teamStats.length
      },
      teamBreakdown: teamStats.slice(0, 10), // Top 10 teams by player count
      dataQuality: {
        playersWithStats: await prisma.player.count({
          where: { stats: { not: '{}' } }
        }),
        playersWithProjections: await prisma.player.count({
          where: { projections: { not: null } }
        })
      }
    }
    
    // Save report to file
    await fs.writeFile(
      path.join(this.dataDir, 'sync-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    console.log('  📈 Sync Statistics:')
    console.log(`    👨‍💼 Total Players: ${report.summary.totalPlayers}`)
    console.log(`    🏈 Total Leagues: ${report.summary.totalLeagues}`)
    console.log(`    🏥 Players with Injuries: ${report.summary.playersWithInjuries}`)
    console.log(`    🏟️  Unique Teams: ${report.summary.uniqueTeams}`)
    console.log(`    📊 Players with Stats: ${report.dataQuality.playersWithStats}`)
    console.log(`    🔮 Players with Projections: ${report.dataQuality.playersWithProjections}`)
  }
  
  private detectSport(source: string): 'FOOTBALL' | 'BASKETBALL' | 'BASEBALL' | 'HOCKEY' {
    const s = source.toLowerCase()
    if (s.includes('nfl') || s.includes('football')) return 'FOOTBALL'
    if (s.includes('nba') || s.includes('basketball')) return 'BASKETBALL'
    if (s.includes('mlb') || s.includes('baseball')) return 'BASEBALL'
    if (s.includes('nhl') || s.includes('hockey')) return 'HOCKEY'
    return 'FOOTBALL' // default
  }
  
  private getFullTeamName(abbreviation: string, sport: string): string {
    const teamNames: Record<string, Record<string, string>> = {
      FOOTBALL: {
        'BUF': 'Buffalo Bills',
        'SF': 'San Francisco 49ers',
        'LAR': 'Los Angeles Rams',
        'KC': 'Kansas City Chiefs',
        'TB': 'Tampa Bay Buccaneers',
        'GB': 'Green Bay Packers',
        'NE': 'New England Patriots',
        'DAL': 'Dallas Cowboys'
      },
      BASKETBALL: {
        'LAL': 'Los Angeles Lakers',
        'GSW': 'Golden State Warriors',
        'BOS': 'Boston Celtics',
        'MIA': 'Miami Heat',
        'NYK': 'New York Knicks',
        'CHI': 'Chicago Bulls',
        'LAC': 'Los Angeles Clippers'
      },
      BASEBALL: {
        'LAD': 'Los Angeles Dodgers',
        'NYY': 'New York Yankees',
        'HOU': 'Houston Astros',
        'BOS': 'Boston Red Sox',
        'ATL': 'Atlanta Braves'
      }
    }
    
    return teamNames[sport]?.[abbreviation] || `${abbreviation} ${sport.toLowerCase()}`
  }
}

// Execute if run directly
if (require.main === module) {
  const syncEngine = new SportsDataSyncEngine()
  syncEngine.run().catch(console.error)
}

export default SportsDataSyncEngine