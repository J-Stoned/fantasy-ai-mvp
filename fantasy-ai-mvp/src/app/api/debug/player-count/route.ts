import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    
    // Count total players
    const totalPlayers = await prisma.player.count()
    
    // Count by position
    const playersByPosition = await prisma.player.groupBy({
      by: ['position'],
      _count: true,
      orderBy: {
        _count: {
          position: 'desc'
        }
      }
    })
    
    // Get database URL info (without exposing sensitive info)
    const dbUrl = process.env.DATABASE_URL || 'not set'
    const dbType = dbUrl.includes('file:') ? 'SQLite' : 
                   dbUrl.includes('postgresql') ? 'PostgreSQL' :
                   dbUrl.includes('mysql') ? 'MySQL' : 'Unknown'
    
    return NextResponse.json({
      success: true,
      totalPlayers,
      playersByPosition: playersByPosition.map(p => ({
        position: p.position,
        count: p._count
      })),
      database: {
        type: dbType,
        isConfigured: !!process.env.DATABASE_URL,
        usingDirectUrl: !!process.env.DIRECT_URL
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error counting players:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        type: 'Unknown',
        isConfigured: !!process.env.DATABASE_URL,
        usingDirectUrl: !!process.env.DIRECT_URL
      }
    }, { status: 500 })
  }
}